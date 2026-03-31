use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use tauri::Emitter;
use crate::commands::ApiResponse;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WebDavConfig {
    pub url: String,
    pub username: String,
    pub password: String,
    pub enabled: bool,
}

impl Default for WebDavConfig {
    fn default() -> Self {
        Self {
            url: String::new(),
            username: String::new(),
            password: String::new(),
            enabled: false,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppConfig {
    pub theme: String,
    pub language: String,
    #[serde(default)]
    pub shortcut: String,
    #[serde(default)]
    pub webdav: WebDavConfig,
    #[serde(default)]
    pub plugin_states: HashMap<String, bool>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            theme: "light".to_string(),
            language: "zh-CN".to_string(),
            shortcut: "Alt+R".to_string(),
            webdav: WebDavConfig::default(),
            plugin_states: HashMap::new(),
        }
    }
}

/// 获取配置文件路径
pub fn config_file_path() -> PathBuf {
    dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("omnibox")
        .join("config.json")
}

/// 从文件读取配置
pub fn load_config_from_file() -> AppConfig {
    let path = config_file_path();
    if path.exists() {
        match fs::read_to_string(&path) {
            Ok(content) => {
                serde_json::from_str(&content).unwrap_or_default()
            }
            Err(_) => AppConfig::default(),
        }
    } else {
        AppConfig::default()
    }
}

/// 保存配置到文件
fn save_config_to_file(config: &AppConfig) -> Result<(), String> {
    let path = config_file_path();
    // 确保目录存在
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("创建配置目录失败: {}", e))?;
    }
    let content = serde_json::to_string_pretty(config)
        .map_err(|e| format!("序列化配置失败: {}", e))?;
    fs::write(&path, content).map_err(|e| format!("写入配置文件失败: {}", e))?;
    Ok(())
}

/// 验证配置合法性
fn validate_config(config: &AppConfig) -> Result<(), String> {
    // 验证主题值
    if config.theme != "light" && config.theme != "dark" {
        return Err(format!("无效的主题值: {}，仅支持 'light' 或 'dark'", config.theme));
    }

    // 验证语言值
    let valid_languages = ["zh-CN", "en-US"];
    if !valid_languages.contains(&config.language.as_str()) {
        return Err(format!("无效的语言值: {}，仅支持 {:?}", config.language, valid_languages));
    }

    // 验证快捷键格式（简单校验非空且包含+或单个键）
    if !config.shortcut.is_empty() {
        let parts: Vec<&str> = config.shortcut.split('+').collect();
        if parts.iter().any(|p| p.trim().is_empty()) {
            return Err(format!("无效的快捷键格式: {}", config.shortcut));
        }
    }

    // 验证 WebDAV URL 格式（如果启用了 WebDAV）
    if config.webdav.enabled && config.webdav.url.is_empty() {
        return Err("WebDAV 已启用但未配置 URL".to_string());
    }

    Ok(())
}

#[tauri::command]
pub async fn get_config() -> ApiResponse<AppConfig> {
    ApiResponse::success(load_config_from_file())
}

#[tauri::command]
pub async fn update_config(config: AppConfig, app: tauri::AppHandle) -> ApiResponse<()> {
    // 先验证配置
    if let Err(msg) = validate_config(&config) {
        return ApiResponse::error(msg);
    }

    // 保存到文件
    if let Err(msg) = save_config_to_file(&config) {
        return ApiResponse::error(msg);
    }

    // 通知前端配置已变更
    let _ = app.emit("config-changed", &config);

    ApiResponse::success(())
}