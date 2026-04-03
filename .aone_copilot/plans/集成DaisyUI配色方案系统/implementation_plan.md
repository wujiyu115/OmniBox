### 集成DaisyUI配色方案系统 ###
修复 DaisyUI 主题切换不生效的问题：主程序和插件都缺少主题 CSS 变量定义，需要确保 themes.css 被正确引入。


# 修复 DaisyUI 主题切换不生效

## 问题描述

用户反馈"只有暗夜主题有效，其他配色主题插件和主程序都没反应"。经调查发现：

1. **`plugin-daisy.css`（40KB）只包含 `light` 主题的 CSS 变量**，缺少其他 34+ 个主题的 `[data-theme=xxx]` 选择器和对应的 CSS 变量定义
2. **主程序也缺少主题变量**：`tailwind.config.js` 中 `daisyui: { themes: true }` 配置在 Tailwind CLI 编译时未能正确注入所有主题的 CSS 变量
3. **`colorSchemes.ts` 缺少 DaisyUI v5.5.19 新增的主题**：`abyss`、`caramellatte`、`silk` 等

DaisyUI v5 的主题变量定义存储在 `node_modules/daisyui/themes.css`（38KB），格式为：
```css
:root:has(input.theme-controller[value=cupcake]:checked),[data-theme=cupcake]{
  color-scheme: light;
  --color-base-100: oklch(...);
  --color-primary: oklch(...);
  ...
}
```

## Proposed Changes

### 主程序主题修复

#### [MODIFY] [index.css](file:///D:/git/OmniBox/src/index.css)
在 `@tailwind` 指令之后，显式导入 DaisyUI 的 `themes.css`，确保所有主题的 CSS 变量定义被包含：
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
@import 'daisyui/themes.css';
```

> [!NOTE]
> DaisyUI v5 作为 Tailwind 插件时，`themes: true` 配置理论上应该自动注入所有主题。但实际测试发现主题变量未被正确注入，可能是 PostCSS 处理顺序或 Tailwind tree-shaking 导致的。显式导入 `themes.css` 是最可靠的解决方案。

---

### 插件主题修复

#### [MODIFY] [build-plugin-css.js](file:///D:/git/OmniBox/scripts/build-plugin-css.js)
修改构建脚本，在 Tailwind CLI 编译完成后，将 `node_modules/daisyui/themes.css` 的内容追加到 `plugin-daisy.css` 末尾，确保插件 CSS 包含所有主题变量定义。

```diff
+ // 追加 DaisyUI themes.css 到输出文件
+ const themesPath = resolve(rootDir, 'node_modules/daisyui/themes.css');
+ const themesCss = readFileSync(themesPath, 'utf-8');
+ appendFileSync(outputCss, '\n/* DaisyUI Themes */\n' + themesCss);
```

#### 重新生成 plugin-daisy.css
运行 `node scripts/build-plugin-css.js` 重新生成包含所有主题的 CSS 文件。

---

### 补充缺失主题

#### [MODIFY] [colorSchemes.ts](file:///D:/git/OmniBox/src/config/colorSchemes.ts)
添加 DaisyUI v5.5.19 新增的主题：`caramellatte`（浅色）、`abyss`（深色）、`silk`（浅色）。同时检查 `garden` 和 `cyberpunk` 是否在 DaisyUI v5 中仍然存在。

---

### 插件 SDK 主题同步修复

#### [MODIFY] [plugin-sdk.js](file:///D:/git/OmniBox/src/assets/plugin-sdk.js)
确认 `theme` 消息处理中正确使用 `payload.themeId` 设置 `data-theme` 属性（当前代码已正确）。

---

## Verification Plan

### Automated Tests
- 运行 `node scripts/build-plugin-css.js` 重新生成 CSS
- 检查 `plugin-daisy.css` 文件大小应 > 70KB（原 40KB + themes.css 38KB）
- 检查 `plugin-daisy.css` 中包含 `[data-theme=cupcake]`、`[data-theme=emerald]` 等选择器

### Manual Verification
- 启动应用 `npm run tauri dev`
- 在设置页面切换多个主题（light、cupcake、dark、dracula 等）
- 验证主程序背景色、文字色、按钮色随主题变化
- 打开内置插件（计算器、时间戳等），验证插件颜色也随主题变化


updateAtTime: 2026/4/3 12:26:25

planId: 5e5181b5-d95e-4b51-8ebd-7338062b6ea3