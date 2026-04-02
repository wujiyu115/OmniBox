#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub mod cache;
pub mod commands;
pub mod config_watcher;
pub mod plugins;
pub mod sync;
pub mod tray;
pub mod usage;
pub mod window;

use commands::{search, plugin, config, plugin_manage, sync as sync_commands, system};
use window::{show_window, hide_window, toggle_window, is_window_visible};
use tauri::{Manager, AppHandle};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};

fn setup_global_shortcuts(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let shortcut: Shortcut = "Alt+R".parse()?;
    
    let app_handle = app.clone();
    app.global_shortcut()
        .on_shortcut(shortcut, move |_app, _shortcut, _event| {
            if let Some(window) = app_handle.get_webview_window("main") {
                if window.is_visible().unwrap_or(false) {
                    let _ = window.hide();
                } else {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })?;
    
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            search::search,
            search::get_installed_plugins,
            search::record_usage,
            plugin::get_plugin,
            config::get_config,
            config::update_config,
            plugins::manager::get_builtin_plugins,
            plugins::manager::get_plugins_dir,
            plugins::manager::get_plugin_html,
            plugins::manager::get_all_plugin_html,
            plugin_manage::enable_plugin,
            plugin_manage::disable_plugin,
            plugin_manage::get_plugin_status,
            sync_commands::test_webdav_connection,
            sync_commands::sync_notes,
            sync_commands::get_sync_status,
            sync_commands::resolve_sync_conflict,
            system::restart_app,
            system::open_url,
            show_window,
            hide_window,
            toggle_window,
            is_window_visible,
        ])
        .setup(|app| {
            // 确保插件目录存在
            let manager = plugins::PluginManager::new();
            manager.ensure_plugins_dir();

            // 安装内置插件：从资源目录复制到用户插件目录
            let resource_dir = app.path().resource_dir()
                .unwrap_or_else(|_| std::path::PathBuf::from("."));
            manager.install_builtin_plugins(&resource_dir);

            window::setup_window_shortcuts(app)?;
            setup_global_shortcuts(&app.handle())?;
            tray::setup_tray(&app.handle())?;
            // 启动配置文件热重载监听
            config_watcher::start_config_watcher(&app.handle());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
