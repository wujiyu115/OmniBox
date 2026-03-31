use serde::{Deserialize, Serialize};
use tauri::Emitter;
use crate::commands::ApiResponse;
use crate::commands::config::{load_config_from_file, AppConfig};
use crate::plugins::manager::{PluginManager, PluginStatus};

#[derive(Debug, Serialize, Deserialize)]
pub struct PluginStatusInfo {
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: String,
    pub status: String,
    pub missing_deps: Vec<String>,
    pub dependents: Vec<String>,
}

/// 启用插件（检查依赖是否满足）
#[tauri::command]
pub async fn enable_plugin(id: String, app: tauri::AppHandle) -> ApiResponse<()> {
    let manager = PluginManager::new();

    // 检查插件是否存在
    let plugin = match manager.load_plugin(&id) {
        Some(p) => p,
        None => return ApiResponse::error(format!("插件 {} 不存在", id)),
    };

    // 检查依赖
    let missing = manager.check_dependencies(&plugin);
    if !missing.is_empty() {
        return ApiResponse::error(format!(
            "无法启用插件 {}，缺少依赖: {}",
            id,
            missing.join(", ")
        ));
    }

    // 更新配置
    let mut config = load_config_from_file();
    config.plugin_states.insert(id.clone(), true);

    // 保存配置
    let config_to_save = config.clone();
    if let Err(msg) = save_plugin_state(&config_to_save) {
        return ApiResponse::error(msg);
    }

    // 通知前端
    let _ = app.emit("config-changed", &config);

    ApiResponse::success(())
}

/// 禁用插件（检查是否有其他插件依赖它）
#[tauri::command]
pub async fn disable_plugin(id: String, app: tauri::AppHandle) -> ApiResponse<()> {
    let manager = PluginManager::new();

    // 检查插件是否存在
    if manager.load_plugin(&id).is_none() {
        return ApiResponse::error(format!("插件 {} 不存在", id));
    }

    // 检查是否有其他启用的插件依赖此插件
    let config = load_config_from_file();
    let dependents = manager.get_dependents(&id);
    let enabled_dependents: Vec<&String> = dependents
        .iter()
        .filter(|dep_id| config.plugin_states.get(*dep_id).copied().unwrap_or(true))
        .collect();

    if !enabled_dependents.is_empty() {
        return ApiResponse::error(format!(
            "无法禁用插件 {}，以下插件依赖它: {}",
            id,
            enabled_dependents
                .iter()
                .map(|s| s.as_str())
                .collect::<Vec<_>>()
                .join(", ")
        ));
    }

    // 更新配置
    let mut config = config;
    config.plugin_states.insert(id.clone(), false);

    // 保存配置
    let config_to_save = config.clone();
    if let Err(msg) = save_plugin_state(&config_to_save) {
        return ApiResponse::error(msg);
    }

    // 通知前端
    let _ = app.emit("config-changed", &config);

    ApiResponse::success(())
}

/// 获取所有插件状态
#[tauri::command]
pub async fn get_plugin_status() -> ApiResponse<Vec<PluginStatusInfo>> {
    let manager = PluginManager::new();
    let plugins = manager.get_builtin_plugins();
    let config = load_config_from_file();

    let statuses: Vec<PluginStatusInfo> = plugins
        .iter()
        .map(|plugin| {
            let status = manager.get_plugin_status(plugin, &config.plugin_states);
            let (status_str, missing_deps) = match &status {
                PluginStatus::Enabled => ("enabled".to_string(), vec![]),
                PluginStatus::Disabled => ("disabled".to_string(), vec![]),
                PluginStatus::DependencyMissing(deps) => {
                    ("dependency_missing".to_string(), deps.clone())
                }
            };
            let dependents = manager.get_dependents(&plugin.id);

            PluginStatusInfo {
                id: plugin.id.clone(),
                name: plugin.name.clone(),
                version: plugin.version.clone(),
                description: plugin.description.clone(),
                status: status_str,
                missing_deps,
                dependents,
            }
        })
        .collect();

    ApiResponse::success(statuses)
}

/// 保存插件状态到配置文件
fn save_plugin_state(config: &AppConfig) -> Result<(), String> {
    let path = crate::commands::config::config_file_path();
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| format!("创建配置目录失败: {}", e))?;
    }
    let content =
        serde_json::to_string_pretty(config).map_err(|e| format!("序列化配置失败: {}", e))?;
    std::fs::write(&path, content).map_err(|e| format!("写入配置文件失败: {}", e))?;
    Ok(())
}
