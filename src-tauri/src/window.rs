use tauri::{App, WebviewWindow};

pub fn setup_window_shortcuts(_app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    // Window setup is done in tauri.conf.json
    Ok(())
}

#[tauri::command]
pub fn show_window(window: WebviewWindow) {
    let _ = window.show();
    let _ = window.set_focus();
}

#[tauri::command]
pub fn hide_window(window: WebviewWindow) {
    let _ = window.hide();
}

#[tauri::command]
pub fn toggle_window(window: WebviewWindow) {
    if window.is_visible().unwrap_or(false) {
        let _ = window.hide();
    } else {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

#[tauri::command]
pub fn is_window_visible(window: WebviewWindow) -> bool {
    window.is_visible().unwrap_or(false)
}
