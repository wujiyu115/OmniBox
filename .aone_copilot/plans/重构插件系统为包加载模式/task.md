### 重构插件系统为包加载模式 ###

# 重构插件系统为包加载模式 - 任务清单

## 阶段一：插件包规范与内置插件 plugin.json

- [x] 1. 创建 `src-tauri/builtin-plugins/omnibox-timestamp/plugin.json`
- [x] 2. 创建 `src-tauri/builtin-plugins/omnibox-calculator/plugin.json`
- [x] 3. 创建 `src-tauri/builtin-plugins/omnibox-notes/plugin.json`
- [x] 4. 创建 `src-tauri/builtin-plugins/omnibox-translate/plugin.json`

## 阶段二：后端插件管理器重构

- [x] 5. 在 `manager.rs` 中新增 `PluginManifest`、`Feature`、`Cmd` 结构体定义
- [x] 6. 在 `manager.rs` 中实现 `load_plugin_manifest()` 方法：读取并解析单个 `plugin.json`
- [x] 7. 在 `manager.rs` 中实现 `scan_plugins_dir()` 方法：扫描插件目录，返回所有 `PluginManifest`
- [x] 8. 在 `manager.rs` 中实现 `install_builtin_plugins()` 方法：将内置 plugin.json 复制到用户插件目录
- [x] 9. 在 `manager.rs` 中重写 `get_builtin_plugins()` 方法：改为调用 `scan_plugins_dir()` 动态加载
- [x] 10. 在 `manager.rs` 中实现 `PluginManifest` 到 `Plugin` 的转换逻辑（`From` trait）
- [x] 11. 更新 `manager.rs` 中的依赖检查逻辑适配新结构
- [x] 12. 更新 `manager.rs` 中的 `get_installed_plugins` 命令返回新字段（pluginType、builtIn、features）

## 阶段三：后端命令层适配

- [x] 13. 更新 `search.rs` 中的搜索逻辑：从 `features[].cmds[]` 提取关键词和标签
- [x] 14. 更新 `search.rs` 中的 `SearchResult` 结构体：使用 `logo` 字段
- [x] 15. 更新 `search.rs` 中的 `PluginInfo` 结构体：新增 pluginType、builtIn、features 字段
- [x] 16. 更新 `plugin_manage.rs` 适配新的插件加载方式
- [x] 17. 在 `lib.rs` 的 `setup` 中调用 `install_builtin_plugins()` 初始化内置插件

## 阶段四：前端类型与 Store 适配

- [x] 18. 更新 `src/types/index.ts`：新增 `PluginFeature`、`PluginCmd` 接口，更新 `Plugin` 接口
- [x] 19. 更新 `src/stores/pluginStore.ts`：适配新的 Plugin 数据结构

## 阶段五：前端视图适配

- [x] 20. 更新 `src/views/SearchView.tsx`：从 `features[0].code` 动态生成插件视图映射
- [x] 21. 更新 `src/views/PluginMarketView.tsx`：显示 pluginType、builtIn 标记，使用 logo 字段
- [x] 22. 更新 `src/components/SearchResultItem.tsx`：适配新的图标字段

## 阶段六：编译验证

- [ ] 23. 运行 `cargo build` 验证 Rust 后端编译通过（Linter 检查已通过，需手动验证）
- [ ] 24. 运行 `npm run build` 验证前端编译通过（Linter 检查已通过，需手动验证）
- [ ] 25. 手动验证：搜索、插件跳转、插件市场、启用/禁用功能正常


updateAtTime: 2026/3/31 17:00:28

planId: 3b1ea1fd-a82f-45a8-9e7c-2c819e070879