use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Duration;

use crate::commands::config::WebDavConfig;

/// WebDAV 远程文件元数据
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RemoteFileInfo {
    pub path: String,
    pub last_modified: String,
    pub content_length: u64,
    pub is_collection: bool,
}

/// WebDAV 客户端
pub struct WebDavClient {
    url: String,
    username: String,
    password: String,
    client: Client,
}

impl WebDavClient {
    pub fn new(config: &WebDavConfig) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .unwrap_or_default();

        // 确保 URL 以 / 结尾
        let url = if config.url.ends_with('/') {
            config.url.clone()
        } else {
            format!("{}/", config.url)
        };

        Self {
            url,
            username: config.username.clone(),
            password: config.password.clone(),
            client,
        }
    }

    /// 构建认证头
    fn auth_headers(&self) -> HeaderMap {
        let mut headers = HeaderMap::new();
        let credentials = format!("{}:{}", self.username, self.password);
        let encoded = base64_encode(&credentials);
        if let Ok(val) = HeaderValue::from_str(&format!("Basic {}", encoded)) {
            headers.insert(AUTHORIZATION, val);
        }
        headers
    }

    /// 拼接完整 URL
    fn full_url(&self, path: &str) -> String {
        let clean_path = path.trim_start_matches('/');
        format!("{}{}", self.url, clean_path)
    }

    /// 测试连接（PROPFIND 根目录）
    pub async fn test_connection(&self) -> Result<bool, String> {
        let url = self.url.clone();
        let mut headers = self.auth_headers();
        headers.insert("Depth", HeaderValue::from_static("0"));
        if let Ok(val) = HeaderValue::from_str("application/xml") {
            headers.insert(CONTENT_TYPE, val);
        }

        let response = self
            .client
            .request(reqwest::Method::from_bytes(b"PROPFIND").unwrap(), &url)
            .headers(headers)
            .body(r#"<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:">
  <D:prop>
    <D:resourcetype/>
  </D:prop>
</D:propfind>"#)
            .send()
            .await
            .map_err(|e| format!("连接失败: {}", e))?;

        let status = response.status().as_u16();
        if status == 207 || status == 200 {
            Ok(true)
        } else if status == 401 {
            Err("认证失败，请检查用户名和密码".to_string())
        } else {
            Err(format!("服务器返回状态码: {}", status))
        }
    }

    /// 列出远程文件（PROPFIND）
    pub async fn list_remote_files(&self, path: &str) -> Result<Vec<RemoteFileInfo>, String> {
        let url = self.full_url(path);
        let mut headers = self.auth_headers();
        headers.insert("Depth", HeaderValue::from_static("1"));
        if let Ok(val) = HeaderValue::from_str("application/xml") {
            headers.insert(CONTENT_TYPE, val);
        }

        let response = self
            .client
            .request(reqwest::Method::from_bytes(b"PROPFIND").unwrap(), &url)
            .headers(headers)
            .body(r#"<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:">
  <D:prop>
    <D:getlastmodified/>
    <D:getcontentlength/>
    <D:resourcetype/>
  </D:prop>
</D:propfind>"#)
            .send()
            .await
            .map_err(|e| format!("PROPFIND 请求失败: {}", e))?;

        let body = response
            .text()
            .await
            .map_err(|e| format!("读取响应失败: {}", e))?;

        parse_propfind_response(&body)
    }

    /// 上传文件（PUT）
    pub async fn upload_file(&self, path: &str, content: &[u8]) -> Result<(), String> {
        let url = self.full_url(path);
        let headers = self.auth_headers();

        let response = self
            .client
            .put(&url)
            .headers(headers)
            .body(content.to_vec())
            .send()
            .await
            .map_err(|e| format!("上传失败: {}", e))?;

        let status = response.status().as_u16();
        if status == 200 || status == 201 || status == 204 {
            Ok(())
        } else {
            Err(format!("上传失败，状态码: {}", status))
        }
    }

    /// 下载文件（GET）
    pub async fn download_file(&self, path: &str) -> Result<Vec<u8>, String> {
        let url = self.full_url(path);
        let headers = self.auth_headers();

        let response = self
            .client
            .get(&url)
            .headers(headers)
            .send()
            .await
            .map_err(|e| format!("下载失败: {}", e))?;

        let status = response.status().as_u16();
        if status == 200 {
            response
                .bytes()
                .await
                .map(|b| b.to_vec())
                .map_err(|e| format!("读取下载内容失败: {}", e))
        } else if status == 404 {
            Err("文件不存在".to_string())
        } else {
            Err(format!("下载失败，状态码: {}", status))
        }
    }

    /// 删除远程文件（DELETE）
    pub async fn delete_remote_file(&self, path: &str) -> Result<(), String> {
        let url = self.full_url(path);
        let headers = self.auth_headers();

        let response = self
            .client
            .delete(&url)
            .headers(headers)
            .send()
            .await
            .map_err(|e| format!("删除失败: {}", e))?;

        let status = response.status().as_u16();
        if status == 200 || status == 204 {
            Ok(())
        } else {
            Err(format!("删除失败，状态码: {}", status))
        }
    }

    /// 确保远程目录存在（MKCOL）
    pub async fn ensure_directory(&self, path: &str) -> Result<(), String> {
        let url = self.full_url(path);
        let headers = self.auth_headers();

        let response = self
            .client
            .request(reqwest::Method::from_bytes(b"MKCOL").unwrap(), &url)
            .headers(headers)
            .send()
            .await
            .map_err(|e| format!("创建目录失败: {}", e))?;

        let status = response.status().as_u16();
        // 405 表示目录已存在，也算成功
        if status == 201 || status == 405 || status == 200 {
            Ok(())
        } else {
            Err(format!("创建目录失败，状态码: {}", status))
        }
    }
}

/// 简单的 Base64 编码（不依赖外部 crate）
fn base64_encode(input: &str) -> String {
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let bytes = input.as_bytes();
    let mut result = String::new();

    for chunk in bytes.chunks(3) {
        let b0 = chunk[0] as u32;
        let b1 = if chunk.len() > 1 { chunk[1] as u32 } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] as u32 } else { 0 };

        let triple = (b0 << 16) | (b1 << 8) | b2;

        result.push(CHARS[((triple >> 18) & 0x3F) as usize] as char);
        result.push(CHARS[((triple >> 12) & 0x3F) as usize] as char);

        if chunk.len() > 1 {
            result.push(CHARS[((triple >> 6) & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }

        if chunk.len() > 2 {
            result.push(CHARS[(triple & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }
    }

    result
}

/// 解析 PROPFIND XML 响应，提取文件信息
fn parse_propfind_response(xml: &str) -> Result<Vec<RemoteFileInfo>, String> {
    use quick_xml::events::Event;
    use quick_xml::Reader;

    let mut reader = Reader::from_str(xml);
    let mut files = Vec::new();

    let mut current_href = String::new();
    let mut current_last_modified = String::new();
    let mut current_content_length: u64 = 0;
    let mut current_is_collection = false;
    let mut in_response = false;
    let mut current_tag = String::new();

    loop {
        match reader.read_event() {
            Ok(Event::Start(ref e)) => {
                let local_name = String::from_utf8_lossy(e.local_name().as_ref()).to_string();
                current_tag = local_name.clone();

                if local_name == "response" {
                    in_response = true;
                    current_href.clear();
                    current_last_modified.clear();
                    current_content_length = 0;
                    current_is_collection = false;
                } else if local_name == "collection" && in_response {
                    current_is_collection = true;
                }
            }
            Ok(Event::Text(ref e)) => {
                if in_response {
                    let text = e.unescape().unwrap_or_default().to_string();
                    match current_tag.as_str() {
                        "href" => current_href = text,
                        "getlastmodified" => current_last_modified = text,
                        "getcontentlength" => {
                            current_content_length = text.parse().unwrap_or(0)
                        }
                        _ => {}
                    }
                }
            }
            Ok(Event::End(ref e)) => {
                let local_name = String::from_utf8_lossy(e.local_name().as_ref()).to_string();
                if local_name == "response" && in_response {
                    if !current_href.is_empty() {
                        files.push(RemoteFileInfo {
                            path: current_href.clone(),
                            last_modified: current_last_modified.clone(),
                            content_length: current_content_length,
                            is_collection: current_is_collection,
                        });
                    }
                    in_response = false;
                }
                current_tag.clear();
            }
            Ok(Event::Eof) => break,
            Err(e) => return Err(format!("XML 解析错误: {}", e)),
            _ => {}
        }
    }

    Ok(files)
}
