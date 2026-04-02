### 扩展配色方案系统 ###
# 扩展配色方案系统 - 任务清单

## 基础设施

- [x] 1. 创建 `src/config/colorSchemes.ts` - 定义 8 种配色方案元数据
- [x] 2. 重构 `src/index.css` - 移除旧的 `:root`/`.dark` 变量，添加 8 种配色方案的 CSS 变量定义
- [x] 3. 修改 `tailwind.config.js` - 扩展 theme.extend.colors 支持 CSS 变量引用

## 状态管理

- [x] 4. 重构 `src/stores/themeStore.ts` - 从 light/dark 改为配色方案 ID 管理
- [x] 5. 修改 `src/components/ThemeProvider.tsx` - 适配新的配色方案 store

## 主程序组件改造

- [x] 6. 修改 `src/App.tsx` - 将 `dark:` Tailwind 类替换为 CSS 变量 / theme 类名
- [x] 7. 修改 `src/views/SearchView.tsx` - 将硬编码颜色替换为 CSS 变量引用
- [x] 8. 修改 `src/components/SearchInput.tsx` - 将硬编码颜色替换为 CSS 变量引用
- [x] 9. 修改 `src/components/SearchResults.tsx` - 将硬编码颜色替换为 CSS 变量引用
- [x] 10. 修改 `src/components/SearchResultItem.tsx` - 将硬编码颜色替换为 CSS 变量引用
- [x] 11. 修改 `src/views/SettingsView.tsx` - 替换主题开关为配色方案选择器 + 颜色变量化
- [x] 12. 修改 `src/views/PluginMarketView.tsx` - 将硬编码颜色替换为 CSS 变量引用

## 插件宿主改造

- [x] 13. 创建 `src/assets/plugin-theme.css` - 插件用的配色方案 CSS 变量定义
- [x] 14. 修改 `src/components/PluginHost.tsx` - 注入配色方案 class + CSS 变量到插件 iframe
- [x] 15. 修改 `src/assets/plugin-sdk.js` - 支持配色方案 class 切换

## 内置插件 HTML 改造

- [x] 16. 修改 `omnibox-calculator/index.html` - 将硬编码颜色替换为 CSS 变量引用
- [x] 17. 修改 `omnibox-timestamp/index.html` - 将硬编码颜色替换为 CSS 变量引用
- [x] 18. 修改 `omnibox-translate/index.html` - 将硬编码颜色替换为 CSS 变量引用
- [x] 19. 修改 `omnibox-notes/index.html` - 将硬编码颜色替换为 CSS 变量引用

## 其他组件

- [x] 20. 检查并修改 `src/views/SyncSettingsView.tsx` - 将硬编码颜色替换为 CSS 变量引用
- [x] 21. 检查并修改 `src/components/FormatTable.tsx` - 将硬编码颜色替换为 CSS 变量引用
- [x] 22. 检查并修改 `src/components/TimestampRow.tsx` - 将硬编码颜色替换为 CSS 变量引用

## 验证

- [x] 23. 运行 `npm run build` 验证前端构建无错误（注：存在一个预先存在的 ViewType 类型错误，非本次改动引入）
- [x] 24. 运行 Lint 检查验证所有修改文件无错误（tsc --noEmit 通过）
- [ ] 25. 手动验证：启动应用，切换 8 种配色方案，验证主页面和插件页面颜色正确


updateAtTime: 2026/4/2 16:34:07

planId: 4eeeacac-0245-4c9b-b672-063335dc3d4a