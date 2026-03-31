fn main() {
    println!("cargo:rustc-check-cfg=cfg(mobile)");

    // Skip icon generation for testing/CI environments
    if std::env::var("TAURI_SKIP_ICON_CHECK").is_ok() {
        return;
    }

    tauri_build::build()
}
