use serde::{Deserialize, Serialize};
use crate::commands::ApiResponse;

#[derive(Debug, Serialize, Deserialize)]
pub struct Plugin {
    pub id: String,
    pub name: String,
    pub version: String,
}

#[tauri::command]
pub async fn get_plugin(plugin_id: String) -> ApiResponse<Plugin> {
    ApiResponse::success(Plugin {
        id: plugin_id,
        name: "示例插件".to_string(),
        version: "1.0.0".to_string(),
    })
}