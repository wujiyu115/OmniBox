use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

use crate::commands::config::{load_config_from_file, WebDavConfig};
use crate::commands::ApiResponse;
use crate::sync::conflict::{
    simple_hash, ConflictStrategy, FileSyncInfo, SyncMetadata, SyncStatus,
};
use crate::sync::webdav::WebDavClient;

/// 同步结果
#[derive(Debug, Serialize, Deserialize)]
pub struct SyncResult {
    pub uploaded: Vec<String>,
    pub downloaded: Vec<String>,
    pub conflicts: Vec<FileSyncInfo>,
    pub errors: Vec<String>,
    pub last_sync_time: String,
}

/// 获取笔记存储目录
fn notes_dir() -> PathBuf {
    dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("omnibox")
        .join("notes")
}

/// 列出本地笔记文件（仅 .md 文件，排除 notes_index.json 等非笔记文件）
fn list_local_notes() -> Vec<(String, Vec<u8>)> {
    let dir = notes_dir();
    if !dir.exists() {
        return vec![];
    }

    let mut notes = Vec::new();
    if let Ok(entries) = fs::read_dir(&dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                    // 只同步 .md 笔记文件和 notes_index.json 索引文件
                    if name.ends_with(".md") || name == "notes_index.json" {
                        if let Ok(content) = fs::read(&path) {
                            notes.push((name.to_string(), content));
                        }
                    }
                }
            }
        }
    }
    notes
}

/// 测试 WebDAV 连接
#[tauri::command]
pub async fn test_webdav_connection(config: WebDavConfig) -> ApiResponse<bool> {
    let client = WebDavClient::new(&config);
    match client.test_connection().await {
        Ok(true) => ApiResponse::success(true),
        Ok(false) => ApiResponse::error("连接测试失败".to_string()),
        Err(e) => ApiResponse::error(e),
    }
}

/// 同步所有笔记
#[tauri::command]
pub async fn sync_notes() -> ApiResponse<SyncResult> {
    let config = load_config_from_file();

    if !config.webdav.enabled {
        return ApiResponse::error("WebDAV 同步未启用，请先在设置中配置".to_string());
    }

    if config.webdav.url.is_empty() {
        return ApiResponse::error("WebDAV URL 未配置".to_string());
    }

    let client = WebDavClient::new(&config.webdav);

    // 确保远程 omnibox/notes 目录存在
    if let Err(e) = client.ensure_directory("omnibox/").await {
        return ApiResponse::error(format!("创建远程目录失败: {}", e));
    }
    if let Err(e) = client.ensure_directory("omnibox/notes/").await {
        return ApiResponse::error(format!("创建远程笔记目录失败: {}", e));
    }

    let mut metadata = SyncMetadata::load();
    let local_notes = list_local_notes();

    // 获取远程文件列表
    let remote_files = match client.list_remote_files("omnibox/notes/").await {
        Ok(files) => files,
        Err(e) => return ApiResponse::error(format!("获取远程文件列表失败: {}", e)),
    };

    let remote_file_names: Vec<String> = remote_files
        .iter()
        .filter(|f| !f.is_collection)
        .filter_map(|f| {
            f.path
                .split('/')
                .filter(|s| !s.is_empty())
                .last()
                .map(|s| s.to_string())
        })
        .collect();

    let mut uploaded = Vec::new();
    let mut downloaded = Vec::new();
    let mut conflicts = Vec::new();
    let mut errors = Vec::new();

    // 处理本地笔记
    for (name, content) in &local_notes {
        let local_hash = simple_hash(content);
        let last_hash = metadata.get_hash(name).map(|s| s.as_str());
        let remote_exists = remote_file_names.contains(name);

        if !remote_exists {
            // 远程不存在，上传
            match client
                .upload_file(&format!("omnibox/notes/{}", name), content)
                .await
            {
                Ok(()) => {
                    metadata.update_hash(name, &local_hash);
                    uploaded.push(name.clone());
                }
                Err(e) => errors.push(format!("上传 {} 失败: {}", name, e)),
            }
        } else if last_hash.is_none() || last_hash == Some(local_hash.as_str()) {
            // 本地未修改或首次同步，下载远程版本
            match client
                .download_file(&format!("omnibox/notes/{}", name))
                .await
            {
                Ok(remote_content) => {
                    let remote_hash = simple_hash(&remote_content);
                    if remote_hash != local_hash {
                        // 远程有更新，保存到本地
                        let local_path = notes_dir().join(name);
                        if let Err(e) = fs::write(&local_path, &remote_content) {
                            errors.push(format!("保存 {} 失败: {}", name, e));
                        } else {
                            metadata.update_hash(name, &remote_hash);
                            downloaded.push(name.clone());
                        }
                    } else {
                        // 内容一致，更新哈希
                        metadata.update_hash(name, &local_hash);
                    }
                }
                Err(e) => errors.push(format!("下载 {} 失败: {}", name, e)),
            }
        } else {
            // 本地有修改，标记为冲突
            conflicts.push(FileSyncInfo {
                file_name: name.clone(),
                status: SyncStatus::Conflict,
                local_modified: None,
                remote_modified: None,
            });
        }
    }

    // 处理仅远程存在的文件
    for remote_name in &remote_file_names {
        if !local_notes.iter().any(|(n, _)| n == remote_name) {
            // 本地不存在，下载
            match client
                .download_file(&format!("omnibox/notes/{}", remote_name))
                .await
            {
                Ok(content) => {
                    let dir = notes_dir();
                    let _ = fs::create_dir_all(&dir);
                    let local_path = dir.join(remote_name);
                    if let Err(e) = fs::write(&local_path, &content) {
                        errors.push(format!("保存 {} 失败: {}", remote_name, e));
                    } else {
                        let hash = simple_hash(&content);
                        metadata.update_hash(remote_name, &hash);
                        downloaded.push(remote_name.clone());
                    }
                }
                Err(e) => errors.push(format!("下载 {} 失败: {}", remote_name, e)),
            }
        }
    }

    // 更新同步时间
    let now = chrono::Utc::now().to_rfc3339();
    metadata.last_sync_time = Some(now.clone());
    if let Err(e) = metadata.save() {
        errors.push(format!("保存同步元数据失败: {}", e));
    }

    ApiResponse::success(SyncResult {
        uploaded,
        downloaded,
        conflicts,
        errors,
        last_sync_time: now,
    })
}

/// 获取同步状态
#[tauri::command]
pub async fn get_sync_status() -> ApiResponse<SyncStatusInfo> {
    let metadata = SyncMetadata::load();
    let config = load_config_from_file();

    ApiResponse::success(SyncStatusInfo {
        enabled: config.webdav.enabled,
        configured: !config.webdav.url.is_empty(),
        last_sync_time: metadata.last_sync_time,
        synced_files_count: metadata.file_hashes.len(),
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SyncStatusInfo {
    pub enabled: bool,
    pub configured: bool,
    pub last_sync_time: Option<String>,
    pub synced_files_count: usize,
}

/// 解决同步冲突
#[tauri::command]
pub async fn resolve_sync_conflict(
    note_id: String,
    strategy: String,
) -> ApiResponse<()> {
    let config = load_config_from_file();
    if !config.webdav.enabled {
        return ApiResponse::error("WebDAV 同步未启用".to_string());
    }

    let client = WebDavClient::new(&config.webdav);
    let conflict_strategy = match strategy.as_str() {
        "keep_local" => ConflictStrategy::KeepLocal,
        "keep_remote" => ConflictStrategy::KeepRemote,
        "merge" => ConflictStrategy::Merge,
        _ => return ApiResponse::error(format!("未知的冲突解决策略: {}", strategy)),
    };

    // 读取本地内容
    let local_path = notes_dir().join(&note_id);
    let local_content = fs::read(&local_path).unwrap_or_default();

    // 下载远程内容
    let remote_content = match client
        .download_file(&format!("omnibox/notes/{}", note_id))
        .await
    {
        Ok(content) => content,
        Err(e) => return ApiResponse::error(format!("下载远程文件失败: {}", e)),
    };

    // 解决冲突
    let resolved = crate::sync::conflict::resolve_conflict(
        &local_content,
        &remote_content,
        &conflict_strategy,
    );

    // 保存到本地
    if let Err(e) = fs::write(&local_path, &resolved) {
        return ApiResponse::error(format!("保存本地文件失败: {}", e));
    }

    // 上传到远程
    if let Err(e) = client
        .upload_file(&format!("omnibox/notes/{}", note_id), &resolved)
        .await
    {
        return ApiResponse::error(format!("上传远程文件失败: {}", e));
    }

    // 更新同步元数据
    let mut metadata = SyncMetadata::load();
    let hash = simple_hash(&resolved);
    metadata.update_hash(&note_id, &hash);
    if let Err(e) = metadata.save() {
        return ApiResponse::error(format!("保存同步元数据失败: {}", e));
    }

    ApiResponse::success(())
}
