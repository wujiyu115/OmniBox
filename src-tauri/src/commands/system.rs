use tauri::AppHandle;
use crate::commands::ApiResponse;

/// 重启应用
#[tauri::command]
pub async fn restart_app(app: AppHandle) {
    app.restart();
}

/// 打开外部 URL（帮助文档、意见反馈等）
#[tauri::command]
pub async fn open_url(url: String) -> ApiResponse<()> {
    let result = open_url_internal(&url);
    match result {
        Ok(_) => ApiResponse::success(()),
        Err(e) => ApiResponse::error(e.to_string()),
    }
}

fn open_url_internal(url: &str) -> Result<(), Box<dyn std::error::Error>> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/c", "start", url])
            .spawn()?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open").arg(url).spawn()?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open").arg(url).spawn()?;
    }
    Ok(())
}
