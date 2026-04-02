# OmniBox

一款现代化的桌面效率工具，提供快速搜索、时间戳转换、计算器、Markdown 笔记、翻译等实用功能。基于 Tauri 2.0 + React 18 构建，轻量、快速、可扩展。

## 功能特性

- **全局快捷键**: 使用 `Alt+R` 快速唤出/隐藏窗口
- **智能搜索**: 基于 PluginManager 的模糊匹配搜索系统
- **时间戳转换**: 轻松在 Unix 时间戳和日期时间格式间转换，支持秒/毫秒/纳秒
- **计算器**: 实时表达式计算，支持四则运算、幂运算、数学函数
- **Markdown 笔记**: 创建和管理本地 Markdown 笔记，支持实时预览
- **翻译**: 中英文互译，使用 MyMemory 免费 API，无需 API Key
- **多时区支持**: 支持 UTC、Asia/Shanghai 等时区切换
- **键盘导航**: 完整支持键盘操作（上下箭头选择，Enter 执行）
- **插件系统**: 可扩展的插件架构，支持自定义功能

## 项目架构

```
omnibox/
├── src/                          # 前端源代码 (React + TypeScript)
│   ├── views/                    # 页面视图
│   │   ├── SearchView.tsx        # 搜索视图
│   │   ├── TimestampView.tsx     # 时间戳转换视图
│   │   ├── CalculatorView.tsx    # 计算器视图
│   │   ├── NotesView.tsx         # Markdown 笔记视图
│   │   └── TranslateView.tsx     # 翻译视图
│   ├── components/               # 可复用 React 组件
│   ├── store/                    # Zustand 状态管理
│   ├── types/                    # TypeScript 类型定义
│   └── App.tsx                   # 根组件 + 路由
│
├── src-tauri/                    # Tauri/Rust 后端
│   ├── src/
│   │   ├── commands/             # Tauri 命令处理器
│   │   │   ├── search.rs         # 搜索命令（集成 PluginManager）
│   │   │   ├── plugin.rs         # 插件查询命令
│   │   │   └── config.rs         # 配置命令
│   │   ├── plugins/              # 插件系统
│   │   │   ├── manager.rs        # PluginManager（内置插件注册）
│   │   │   ├── calculator.rs     # 计算器插件后端
│   │   │   ├── notes.rs          # 笔记插件后端（CRUD）
│   │   │   ├── translate.rs      # 翻译插件后端（MyMemory API）
│   │   │   └── timestamp.rs      # 时间戳插件后端
│   │   ├── cache/
│   │   │   └── mod.rs            # 搜索结果缓存模块
│   │   ├── window.rs             # 窗口管理命令
│   │   └── lib.rs                # 应用入口 + 命令注册
│   ├── Cargo.toml                # Rust 依赖配置
│   └── tauri.conf.json           # Tauri 应用配置
│
├── package.json                  # 前端依赖配置
└── dist/                         # 构建输出
```

## 安装说明

### 系统要求

- Windows 10/11
- 或 macOS 10.14+
- 或 Linux (Ubuntu 18.04+)

### 从源码构建

```bash
# 克隆仓库
git clone <repository-url>
cd omnibox

# 安装前端依赖
npm install

# 开发模式运行
npm run tauri:dev

# 构建生产版本
npm run tauri:build
```

### 预编译版本

从 [Releases](../../releases) 页面下载对应平台的安装包。

## 使用指南

### 基本操作

1. **唤出窗口**: 按 `Alt+R` 快捷键
2. **切换功能**: 点击顶部导航按钮切换视图
3. **隐藏窗口**: 按 `ESC` 键或再次按 `Alt+R`

### 搜索插件

在搜索框中输入关键词，系统会对所有已安装插件进行模糊匹配：

| 关键词 | 匹配插件 |
|--------|----------|
| `ts` | 时间戳转换 |
| `calc` | 计算器 |
| `note` | Markdown 笔记 |
| `tr` | 翻译 |

### 时间戳转换器

支持的输入格式：

| 格式 | 示例 |
|------|------|
| Unix 时间戳（秒） | `1640995200` |
| Unix 时间戳（毫秒） | `1640995200000` |
| Unix 时间戳（纳秒） | `1640995200000000000` |
| 标准日期时间 | `2024-03-26 10:30:00` |
| 日期 | `2024-03-26` |

点击结果旁的复制按钮可复制转换后的值。支持时区：UTC、Asia/Shanghai、Asia/Tokyo、America/New_York、Europe/London。

### 计算器

实时计算数学表达式，支持：

| 功能 | 示例 | 结果 |
|------|------|------|
| 基础四则运算 | `1 + 2 * 3` | `7` |
| 括号 | `(1 + 2) * 3` | `9` |
| 幂运算 | `2 ^ 10` | `1024` |
| 平方根 | `sqrt(16)` | `4` |
| 三角函数 | `sin(3.14)` | `0.00159...` |
| 绝对值 | `abs(-5)` | `5` |

按 `Enter` 确认计算结果并记录到历史（最近 10 条）。

### Markdown 笔记

- **新建笔记**: 点击左侧面板的 `+` 按钮
- **编辑笔记**: 在右侧编辑器中使用 Markdown 语法编写
- **预览笔记**: 点击 `预览` 按钮切换到渲染视图
- **保存笔记**: 点击 `保存` 按钮（快捷键支持中）
- **删除笔记**: 鼠标悬停在笔记列表项上，点击 `✕`

笔记存储位置：
- Windows: `%APPDATA%\omnibox\notes\`
- macOS: `~/Library/Application Support/omnibox/notes/`
- Linux: `~/.config/omnibox/notes/`

### 翻译

支持的语言对：

| 选项 | 说明 |
|------|------|
| 自动 → 中文 | 自动检测源语言，翻译为中文 |
| 中文 → 英文 | 中文翻译为英文 |
| 英文 → 中文 | 英文翻译为中文 |
| 自动 → 英文 | 自动检测源语言，翻译为英文 |

输入文本后 500ms 自动触发翻译（防抖）。使用 [MyMemory](https://mymemory.translated.net/) 免费 API，每天 1000 次免费请求，无需注册。

## 后端 Tauri 命令 API

### 搜索命令

```typescript
// 搜索插件
invoke('search', { request: { query: string, limit?: number } })
  => ApiResponse<SearchResult[]>

// 获取已安装插件列表
invoke('get_installed_plugins')
  => ApiResponse<PluginInfo[]>
```

### 时间戳命令

```typescript
invoke('convert_timestamp_command', { input: string, timezone: string })
  => TimestampResponse
```

### 计算器命令

```typescript
invoke('calculate', { expression: string })
  => Result<string, string>
```

### 笔记命令

```typescript
invoke('list_notes')
  => Result<NoteInfo[], string>

invoke('get_note', { id: string })
  => Result<Note, string>

invoke('save_note', { id?: string, title: string, content: string })
  => Result<NoteInfo, string>

invoke('delete_note', { id: string })
  => Result<void, string>
```

### 翻译命令

```typescript
invoke('translate', { text: string, from: string, to: string })
  => Result<TranslateResult, string>
```

### 窗口命令

```typescript
invoke('show_window')    // 显示窗口
invoke('hide_window')    // 隐藏窗口
invoke('toggle_window')  // 切换显示/隐藏
invoke('is_window_visible') => boolean
```

## 插件系统扩展

OmniBox 采用**纯前端插件架构**，每个插件是一个独立目录，包含 `plugin.json` 描述文件和 `index.html` 入口页面。插件通过 iframe 加载，与主窗口通过 `postMessage` 通信，SDK 由宿主自动注入，无需手动引用。

### 创建一个插件

#### 1. 创建插件目录

在插件目录下创建以你的插件 ID 命名的文件夹，包含两个文件：

```
my-plugin/
├── plugin.json      # 插件描述文件
└── index.html       # 插件入口页面
```

#### 2. 编写 plugin.json

```json
{
  "pluginName": "my-plugin",
  "pluginType": "ui",
  "description": "我的自定义插件",
  "main": "index.html",
  "version": "1.0.0",
  "logo": "🚀",
  "features": [
    {
      "code": "my-feature",
      "explain": "功能说明",
      "cmds": [
        {
          "label": "我的插件",
          "type": "text",
          "keyword": "myplugin"
        }
      ]
    }
  ],
  "lifecycle": {
    "onLoad": "onPluginLoad",
    "onActivate": "onPluginActivate",
    "onDeactivate": "onPluginDeactivate",
    "onUnload": "onPluginUnload"
  },
  "permissions": [],
  "dependencies": []
}
```

**字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pluginName` | string | 插件唯一标识符 |
| `pluginType` | string | 插件类型，目前固定为 `"ui"` |
| `description` | string | 插件描述 |
| `main` | string | 入口 HTML 文件名 |
| `version` | string | 版本号 |
| `logo` | string | 图标（支持 emoji） |
| `features` | array | 功能列表，每个功能包含 `code`、`explain` 和 `cmds`（搜索命令） |
| `lifecycle` | object | 生命周期钩子函数名映射 |
| `permissions` | array | 权限声明（预留） |
| `dependencies` | array | 依赖声明（预留） |

`features[].cmds[]` 中的 `keyword` 用于搜索匹配——用户在搜索框输入该关键词即可找到并打开你的插件。

#### 3. 编写 index.html

插件页面是一个标准的 HTML 文件，运行在 iframe 沙箱中。**无需手动引用 SDK**，宿主会自动注入。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>我的插件</title>
  <style>
    /* 亮色主题样式 */
    body { background: #fff; color: #1a1a1a; }

    /* 暗色主题样式：使用 .dark 选择器 */
    .dark body { background: #1f2937; color: #f3f4f6; }
  </style>
</head>
<body>
  <div id="app">Hello OmniBox Plugin!</div>

  <script>
    // 生命周期钩子（函数名需与 plugin.json 中 lifecycle 字段一致）
    window.onPluginLoad = () => {
      console.log('插件已加载');
    };

    window.onPluginActivate = () => {
      console.log('插件已激活');
    };

    window.onPluginDeactivate = () => {
      console.log('插件已停用');
    };

    window.onPluginUnload = () => {
      console.log('插件已卸载');
    };
  </script>
</body>
</html>
```

#### 4. 主题适配

插件**必须使用 `.dark` CSS 选择器**来适配暗色主题，而非 `@media (prefers-color-scheme: dark)`。宿主会在主题切换时自动在 `<html>` 标签上添加/移除 `dark` class。

```css
/* ✅ 正确：使用 .dark 选择器 */
.dark body { background: #1f2937; color: #f3f4f6; }
.dark .my-card { background: #374151; border-color: #4b5563; }

/* ❌ 错误：不要使用 media query */
@media (prefers-color-scheme: dark) { ... }
```

#### 5. 安装插件

将插件目录复制到用户插件目录即可：

| 平台 | 路径 |
|------|------|
| Windows | `%APPDATA%\omnibox\plugins\` |
| macOS | `~/Library/Application Support/omnibox/plugins/` |
| Linux | `~/.config/omnibox/plugins/` |

重启应用后，插件会自动被发现和加载。

### SDK API

宿主自动注入的 `window.omnibox` 对象提供以下 API：

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `omnibox.copyToClipboard(text)` | `Promise<void>` | 复制文本到系统剪贴板 |
| `omnibox.notify(message)` | `Promise<void>` | 发送通知消息 |
| `omnibox.getConfig()` | `Promise<object>` | 获取插件配置 |
| `omnibox.setConfig(config)` | `Promise<void>` | 保存插件配置 |
| `omnibox.getTheme()` | `Promise<{theme: string}>` | 获取当前主题（`"dark"` 或 `"light"`） |
| `omnibox.close()` | `Promise<void>` | 关闭插件页面，返回搜索视图 |

**使用示例：**

```javascript
// 复制计算结果到剪贴板
document.getElementById('copyBtn').onclick = async () => {
  await window.omnibox.copyToClipboard('Hello from my plugin!');
};

// 关闭插件
document.getElementById('backBtn').onclick = () => {
  window.omnibox.close();
};

// 获取当前主题
const { theme } = await window.omnibox.getTheme();
console.log('当前主题:', theme);
```

### 生命周期

插件的生命周期由宿主管理，按以下顺序触发：

```
插件加载 → onLoad → onActivate → [用户交互] → onDeactivate → onUnload
```

| 钩子 | 触发时机 | 典型用途 |
|------|----------|----------|
| `onLoad` | 插件 iframe 就绪后 | 初始化数据、绑定事件 |
| `onActivate` | 插件页面显示时 | 聚焦输入框、刷新数据 |
| `onDeactivate` | 插件页面隐藏时 | 保存状态、清理定时器 |
| `onUnload` | 插件被卸载时 | 释放资源 |

### 开发注意事项

- **不要手动引用 SDK**：`omnibox-plugin-api.js` 由宿主自动注入，无需 `<script src="...">` 引用
- **使用 `.dark` 主题选择器**：宿主通过 postMessage 同步主题，自动在 `<html>` 上切换 `dark` class
- **iframe 沙箱限制**：插件运行在 `sandbox="allow-scripts allow-same-origin allow-popups allow-forms"` 的 iframe 中
- **所有逻辑纯前端实现**：插件无法直接调用 Tauri 后端命令，需通过 SDK API 与宿主通信

## 开发设置

### 环境要求

- Node.js 18+
- Rust 1.70+
- npm 或 yarn

### 开发命令

```bash
# 启动开发服务器（前端热重载）
npm run dev

# 启动 Tauri 开发模式（前端 + 后端）
npm run tauri:dev

# 检查 Rust 编译
cd src-tauri && cargo check

# 运行 Rust 测试
cd src-tauri && cargo test

# 构建前端
npm run build

# 构建 Tauri 应用
npm run tauri:build
```

## 常见问题 FAQ

**Q: 全局快捷键 `Alt+R` 不生效？**
A: 检查是否有其他应用占用了该快捷键。目前快捷键固定为 `Alt+R`，后续版本将支持自定义。

**Q: 翻译功能提示网络错误？**
A: 翻译使用 MyMemory 公共 API，需要网络连接。如果在中国大陆访问受限，可能需要代理。

**Q: 笔记保存在哪里？**
A: 笔记以 Markdown 文件形式保存在系统配置目录下的 `omnibox/notes/` 文件夹中（见上方路径说明）。

**Q: 计算器支持哪些函数？**
A: 基于 `evalexpr` crate，支持 `sqrt`、`abs`、`floor`、`ceil`、`sin`、`cos`、`tan`、`exp`、`ln` 等常用数学函数。

**Q: 如何修改窗口大小？**
A: 编辑 `src-tauri/tauri.conf.json` 中的 `app.windows[0].width` 和 `height` 字段。

## 技术栈

| 层次 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript |
| 样式 | Tailwind CSS |
| 构建工具 | Vite 5 |
| 状态管理 | Zustand |
| Markdown 渲染 | marked |
| 桌面框架 | Tauri 2.0 |
| 后端语言 | Rust |
| 表达式计算 | evalexpr |
| HTTP 客户端 | reqwest |
| 时间处理 | chrono |

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

[MIT](LICENSE)

## 版本路线图

### v0.1.0 (当前版本 - MVP)

- 基本搜索框架（PluginManager 集成）
- 时间戳转换插件（多时区、秒/毫秒/纳秒）
- 计算器插件（evalexpr 表达式引擎）
- Markdown 笔记插件（本地文件存储）
- 翻译插件（MyMemory API）
- 全局快捷键 `Alt+R`
- 搜索结果缓存模块

### v0.2.0 (计划中)

- 自定义全局快捷键
- 插件市场（从 URL 安装插件）
- 搜索历史记录
- 主题切换（深色/浅色）
- 系统托盘图标

### v0.3.0 (计划中)

- 文件搜索插件
- 剪贴板历史插件
- 自定义工作流（多步骤命令）
- 插件 SDK 文档
