use notify::{Config, Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use std::sync::mpsc;
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

use crate::commands::config::load_config_from_file;

/// 启动配置文件监听器
/// 当 config.json 文件发生变化时，重新加载配置并通过事件通知前端
pub fn start_config_watcher(app: &AppHandle) {
    let config_path = crate::commands::config::config_file_path();

    // 确保配置目录存在
    if let Some(parent) = config_path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }

    let app_handle = app.clone();

    thread::spawn(move || {
        let (tx, rx) = mpsc::channel();

        let mut watcher = match RecommendedWatcher::new(
            move |result: Result<Event, notify::Error>| {
                if let Ok(event) = result {
                    let _ = tx.send(event);
                }
            },
            Config::default().with_poll_interval(Duration::from_secs(2)),
        ) {
            Ok(w) => w,
            Err(e) => {
                eprintln!("Failed to create config watcher: {}", e);
                return;
            }
        };

        // 监听配置文件所在目录（因为文件可能不存在）
        let watch_path = config_path
            .parent()
            .unwrap_or_else(|| std::path::Path::new("."));

        if let Err(e) = watcher.watch(watch_path, RecursiveMode::NonRecursive) {
            eprintln!("Failed to watch config directory: {}", e);
            return;
        }

        println!("Config watcher started, watching: {:?}", watch_path);

        // 防抖：收到事件后等待 500ms 再处理，避免频繁触发
        let mut last_event_time = std::time::Instant::now();

        loop {
            match rx.recv_timeout(Duration::from_secs(1)) {
                Ok(event) => {
                    // 只关注修改和创建事件
                    match event.kind {
                        EventKind::Modify(_) | EventKind::Create(_) => {
                            // 检查是否是 config.json 文件
                            let is_config_file = event.paths.iter().any(|p| {
                                p.file_name()
                                    .map(|n| n == "config.json")
                                    .unwrap_or(false)
                            });

                            if is_config_file {
                                let now = std::time::Instant::now();
                                // 防抖：500ms 内的重复事件忽略
                                if now.duration_since(last_event_time) > Duration::from_millis(500)
                                {
                                    last_event_time = now;

                                    // 短暂延迟确保文件写入完成
                                    thread::sleep(Duration::from_millis(100));

                                    // 重新加载配置
                                    let config = load_config_from_file();
                                    println!("Config file changed, reloading...");

                                    // 发送事件到前端
                                    let _ = app_handle.emit("config-changed", &config);
                                }
                            }
                        }
                        _ => {}
                    }
                }
                Err(mpsc::RecvTimeoutError::Timeout) => {
                    // 正常超时，继续循环
                }
                Err(mpsc::RecvTimeoutError::Disconnected) => {
                    println!("Config watcher channel disconnected, stopping.");
                    break;
                }
            }
        }
    });
}
