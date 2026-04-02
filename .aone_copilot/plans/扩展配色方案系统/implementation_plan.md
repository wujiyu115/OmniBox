### 扩展配色方案系统 ###
修复配色方案切换不生效的问题：后端 validate_config 拒绝非 light/dark 的主题值，以及前端 update_config 调用传参不完整。

# 修复配色方案切换不生效

## 问题分析

配色方案切换后页面颜色没有变化，根本原因有两个：

### 1. 后端验证拒绝新配色方案 ID
[config.rs](file:///D:/git/OmniBox/src-tauri/src/commands/config.rs) 中 `validate_config` 函数硬编码只允许 `light` 或 `dark`：
```rust
if config.theme != "light" && config.theme != "dark" {
    return Err(format!("无效的主题值: {}，仅支持 'light' 或 'dark'", config.theme));
}
```
当前端传入 `blue`、`green` 等新配色方案 ID 时，后端返回错误，配置无法持久化。虽然前端 `applyColorScheme` 同步修改了 DOM class，但 `invoke` 的错误被 `.catch(console.error)` 静默吞掉，且 `update_config` 成功后会 `emit("config-changed")`，ThemeProvider 监听该事件会再次调用 `setColorScheme`，形成循环。

### 2. 前端 update_config 传参不完整
[themeStore.ts](file:///D:/git/OmniBox/src-tauri/src/stores/themeStore.ts) 中 `setColorScheme` 只传了 `{ theme, language }`，缺少 `shortcut`、`webdav`、`plugin_states` 等必填字段，导致后端反序列化可能失败或覆盖其他配置。

## Proposed Changes

### 后端配置验证

#### [MODIFY] [config.rs](file:///D:/git/OmniBox/src-tauri/src/commands/config.rs)
- 修改 `validate_config` 中的 theme 验证逻辑，允许 8 种配色方案 ID：`blue`、`green`、`purple`、`orange`、`rose`、`gray`、`dark`、`midnight`
- 同时保留对旧值 `light` 的兼容

### 前端配置更新方式

#### [MODIFY] [themeStore.ts](file:///D:/git/OmniBox/src/stores/themeStore.ts)
- 修改 `setColorScheme` 中的 `invoke('update_config')` 调用：先通过 `invoke('get_config')` 获取当前完整配置，再只修改 `theme` 字段后回写
- 或者改为：先读取当前配置，合并后再写入

## Verification Plan

### Automated Tests
- 运行 `cargo check` 验证 Rust 编译
- 运行 `npx tsc --noEmit` 验证 TypeScript 编译

### Manual Verification
- 启动应用，在设置页面切换 8 种配色方案，验证页面颜色实时变化
- 切换后关闭并重新打开应用，验证配色方案被正确持久化

updateAtTime: 2026/4/2 17:56:08

planId: 4eeeacac-0245-4c9b-b672-063335dc3d4a