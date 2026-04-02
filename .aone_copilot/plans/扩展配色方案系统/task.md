### 扩展配色方案系统 ###
# 修复配色方案切换不生效 - 任务清单

## 后端修复

- [x] 1. 修改 `src-tauri/src/commands/config.rs` - 更新 `validate_config` 允许 8 种配色方案 ID
- [x] 2. 运行 `cargo check` 验证 Rust 编译

## 前端修复

- [x] 3. 修改 `src/stores/themeStore.ts` - 修复 `setColorScheme` 中 `update_config` 的调用方式，先获取完整配置再合并更新
- [x] 4. 运行 `npx tsc --noEmit` 验证 TypeScript 编译

## 验证

- [ ] 5. 手动验证：启动应用切换配色方案，确认颜色变化和持久化

updateAtTime: 2026/4/2 17:56:08

planId: 4eeeacac-0245-4c9b-b672-063335dc3d4a