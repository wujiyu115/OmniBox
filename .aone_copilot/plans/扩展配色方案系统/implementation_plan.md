### 扩展配色方案系统 ###
将现有的明暗双主题系统重构为 8 种配色方案（默认蓝、翠绿、薰衣紫、活力橙、玫瑰红、极简灰、暗夜黑、午夜蓝），配色方案替代明暗模式。主程序通过 CSS 变量集中定义配色，组件和插件 HTML 通过 class 选择器引用配色方案，不写死颜色值。

# 扩展配色方案系统

将现有的 light/dark 双主题系统重构为 8 种配色方案，配色方案替代明暗模式。每种方案自带明暗属性（如暗夜黑、午夜蓝是深色方案，其余为浅色方案）。主程序集中定义 CSS 变量，组件和插件 HTML 通过 class 选择器 + CSS 变量引用配色，不写死颜色值。

## User Review Required

> [!IMPORTANT]
> 本次重构涉及所有前端组件和 4 个内置插件 HTML 的样式改造，改动范围较大。建议在开发分支上进行。

> [!WARNING]
> 配色方案替代了原有的明暗模式切换（toggleTheme），设置页面的主题开关将被替换为配色方案选择器。

## Proposed Changes

### 配色方案定义层

---

#### [MODIFY] [index.css](file:///D:/git/OmniBox/src/index.css)

移除原有的 `:root` / `.dark` CSS 变量定义，改为 8 种配色方案的 class 选择器，每种方案定义完整的 CSS 变量集：

```css
/* 8 种配色方案 CSS 变量 */
/* 浅色方案 */
.theme-blue { ... }      /* 默认蓝 */
.theme-green { ... }     /* 翠绿 */
.theme-purple { ... }    /* 薰衣紫 */
.theme-orange { ... }    /* 活力橙 */
.theme-rose { ... }      /* 玫瑰红 */
.theme-gray { ... }      /* 极简灰 */
/* 深色方案 */
.theme-dark { ... }      /* 暗夜黑 */
.theme-midnight { ... }  /* 午夜蓝 */
```

每种方案定义的 CSS 变量包括：
- `--bg-primary`, `--bg-secondary`, `--bg-card`, `--bg-card-hover`, `--bg-input`
- `--text-primary`, `--text-secondary`, `--text-muted`
- `--border-color`, `--border-light`
- `--accent`, `--accent-hover`, `--accent-text`（主题强调色）
- `--success`, `--error`
- `--is-dark`: `0` 或 `1`（供 Tailwind dark: 前缀判断）

同时保留 `.dark` class 的兼容：深色方案（theme-dark, theme-midnight）自动添加 `.dark` class。

html 兜底背景色改为使用 CSS 变量：`background-color: var(--bg-primary)`。

---

#### [NEW] [colorSchemes.ts](file:///D:/git/OmniBox/src/config/colorSchemes.ts)

配色方案元数据定义文件：

```typescript
export interface ColorScheme {
  id: string;           // 如 'blue', 'green', 'purple'
  name: string;         // 显示名称，如 '默认蓝'
  className: string;    // CSS class 名，如 'theme-blue'
  isDark: boolean;      // 是否为深色方案
  previewColor: string; // 预览色块颜色
}

export const COLOR_SCHEMES: ColorScheme[] = [
  { id: 'blue', name: '默认蓝', className: 'theme-blue', isDark: false, previewColor: '#3b82f6' },
  { id: 'green', name: '翠绿', className: 'theme-green', isDark: false, previewColor: '#22c55e' },
  { id: 'purple', name: '薰衣紫', className: 'theme-purple', isDark: false, previewColor: '#8b5cf6' },
  { id: 'orange', name: '活力橙', className: 'theme-orange', isDark: false, previewColor: '#f97316' },
  { id: 'rose', name: '玫瑰红', className: 'theme-rose', isDark: false, previewColor: '#ec4899' },
  { id: 'gray', name: '极简灰', className: 'theme-gray', isDark: false, previewColor: '#9ca3af' },
  { id: 'dark', name: '暗夜黑', className: 'theme-dark', isDark: true, previewColor: '#1f2937' },
  { id: 'midnight', name: '午夜蓝', className: 'theme-midnight', isDark: true, previewColor: '#0f172a' },
];
```

---

### 状态管理层

---

#### [MODIFY] [themeStore.ts](file:///D:/git/OmniBox/src/stores/themeStore.ts)

重构为配色方案 store：

- `theme: Theme` → `colorScheme: string`（方案 ID，如 `'blue'`）
- `toggleTheme()` → `setColorScheme(schemeId: string)`
- `applyTheme()` → `applyColorScheme()`：在 `<html>` 上切换 class（移除旧的 `theme-xxx`，添加新的 `theme-xxx`；深色方案同时添加 `dark` class）
- `initTheme()` → `initColorScheme()`：从后端配置读取 `color_scheme` 字段
- 持久化：`invoke('update_config', { config: { theme: schemeId } })`

---

#### [MODIFY] [ThemeProvider.tsx](file:///D:/git/OmniBox/src/components/ThemeProvider.tsx)

- Context value 从 `{ theme, toggleTheme }` 改为 `{ colorScheme, setColorScheme, isDark }`
- 监听 `config-changed` 事件时读取 `color_scheme` 字段

---

### 主程序组件改造

---

#### [MODIFY] [App.tsx](file:///D:/git/OmniBox/src/App.tsx)

将所有 `dark:bg-gray-900`、`dark:bg-gray-800`、`dark:border-gray-700` 等硬编码 Tailwind 暗色类替换为 CSS 变量引用。例如：

```diff
- <div className="h-screen bg-white dark:bg-gray-900">
+ <div className="h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
```

或者使用 Tailwind 的 `bg-[var(--bg-primary)]` 语法。

---

#### [MODIFY] [SearchView.tsx](file:///D:/git/OmniBox/src/views/SearchView.tsx)

将硬编码的 `dark:bg-xxx`、`dark:text-xxx` 替换为 CSS 变量引用。

---

#### [MODIFY] [SearchInput.tsx](file:///D:/git/OmniBox/src/components/SearchInput.tsx)

将硬编码颜色替换为 CSS 变量引用。

---

#### [MODIFY] [SearchResults.tsx](file:///D:/git/OmniBox/src/components/SearchResults.tsx)

将硬编码颜色替换为 CSS 变量引用。

---

#### [MODIFY] [SearchResultItem.tsx](file:///D:/git/OmniBox/src/components/SearchResultItem.tsx)

将硬编码颜色替换为 CSS 变量引用。

---

#### [MODIFY] [SettingsView.tsx](file:///D:/git/OmniBox/src/views/SettingsView.tsx)

1. 将原有的主题开关（toggleTheme）替换为**配色方案选择器**：
   - 网格布局展示 8 种配色方案卡片
   - 每张卡片显示预览色块 + 方案名称
   - 当前选中方案显示勾选标记
2. 将所有 `dark:` Tailwind 类替换为 CSS 变量引用

---

#### [MODIFY] [PluginMarketView.tsx](file:///D:/git/OmniBox/src/views/PluginMarketView.tsx)

将硬编码颜色替换为 CSS 变量引用。

---

### 插件宿主改造

---

#### [MODIFY] [PluginHost.tsx](file:///D:/git/OmniBox/src/components/PluginHost.tsx)

1. `getCurrentTheme()` → `getCurrentColorSchemeClass()`：返回当前配色方案的 class 名
2. `injectSdkAndTheme()` 改造：
   - 在 `<html>` 标签上注入配色方案 class（如 `theme-purple`），深色方案同时注入 `dark` class
   - 注入**配色方案 CSS 变量定义**到 `<head>` 中（从 index.css 提取出插件用的变量子集）
3. 主题同步 MutationObserver：监听 class 变化时，发送完整的配色方案信息（而非仅 dark/light）
4. `getTheme` 请求处理：返回 `{ theme: schemeId, isDark: boolean }`

---

#### [MODIFY] [plugin-sdk.js](file:///D:/git/OmniBox/src/assets/plugin-sdk.js)

1. `theme` 消息处理：从仅切换 `dark` class 改为切换配色方案 class + dark class
2. `getTheme` 返回值：从 `{ theme: 'dark'|'light' }` 改为 `{ theme: schemeId, isDark: boolean, className: string }`

---

#### [NEW] [plugin-theme.css](file:///D:/git/OmniBox/src/assets/plugin-theme.css)

插件用的配色方案 CSS 变量定义文件（与 index.css 中的变量保持一致），会被注入到每个插件 HTML 的 `<head>` 中。这样插件 HTML 中只需引用 `var(--xxx)` 即可。

---

### 内置插件 HTML 改造

每个插件 HTML 的改造原则：
- 移除所有硬编码的 hex 颜色值
- 使用 CSS 变量 `var(--bg-primary)`, `var(--text-primary)` 等
- 保留 `.dark` 选择器用于深色方案的特殊调整（如有必要）
- 使用配色方案 class 选择器适配不同方案的强调色

---

#### [MODIFY] [omnibox-calculator/index.html](file:///D:/git/OmniBox/src-tauri/builtin-plugins/omnibox-calculator/index.html)

将所有硬编码颜色替换为 CSS 变量引用。移除 `.dark` 选择器中的重复定义。

---

#### [MODIFY] [omnibox-timestamp/index.html](file:///D:/git/OmniBox/src-tauri/builtin-plugins/omnibox-timestamp/index.html)

将所有硬编码颜色替换为 CSS 变量引用。移除 `.dark` 选择器中的重复定义。

---

#### [MODIFY] [omnibox-translate/index.html](file:///D:/git/OmniBox/src-tauri/builtin-plugins/omnibox-translate/index.html)

将所有硬编码颜色替换为 CSS 变量引用。移除 `.dark` 选择器中的重复定义。

---

#### [MODIFY] [omnibox-notes/index.html](file:///D:/git/OmniBox/src-tauri/builtin-plugins/omnibox-notes/index.html)

将所有硬编码颜色替换为 CSS 变量引用。移除 `.dark` 选择器中的重复定义。

---

### Tailwind 配置

---

#### [MODIFY] [tailwind.config.js](file:///D:/git/OmniBox/tailwind.config.js)

保留 `darkMode: 'class'`（深色方案仍会添加 `dark` class），扩展 theme 配置以支持 CSS 变量引用：

```javascript
theme: {
  extend: {
    colors: {
      theme: {
        bg: 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        card: 'var(--bg-card)',
        'card-hover': 'var(--bg-card-hover)',
        input: 'var(--bg-input)',
        text: 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        border: 'var(--border-color)',
        'border-light': 'var(--border-light)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
      }
    }
  }
}
```

这样组件中可以使用 `bg-theme-bg`、`text-theme-text` 等 Tailwind 类名。

---

## Verification Plan

### Automated Tests

```bash
# 编译检查
cd src-tauri && cargo check
# 前端构建检查
npm run build
# Lint 检查
npx tsc --noEmit
```

### Manual Verification

1. 启动应用，进入设置页面，验证 8 种配色方案选择器的展示和切换
2. 切换每种配色方案，验证：
   - 搜索主页背景、文字、边框颜色正确
   - 插件图标网格区域颜色正确
   - 设置页面自身颜色正确
3. 打开每个内置插件（计算器、时间戳、翻译、笔记），验证插件页面颜色跟随配色方案
4. 切换配色方案后重启应用，验证配色方案持久化
5. 验证深色方案（暗夜黑、午夜蓝）下所有页面的可读性


updateAtTime: 2026/4/2 16:34:07

planId: 4eeeacac-0245-4c9b-b672-063335dc3d4a