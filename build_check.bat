@echo off
cd /d D:\git\OmniBox\src-tauri
cargo check 2>&1 > D:\git\OmniBox\cargo_result.txt
echo EXIT_CODE:%ERRORLEVEL% >> D:\git\OmniBox\cargo_result.txt
