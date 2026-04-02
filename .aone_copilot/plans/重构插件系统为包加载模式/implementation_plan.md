### 重构插件系统为包加载模式 ###
参考 Rubick 的插件设计，将 OmniBox 的插件系统从 Rust 硬编码改为基于 plugin.json 描述文件的包加载模式。每个插件是一个独立目录，包含 plugin.json 元数据和前端视图文件，后端通过扫描插件目录动态发现和加载插件。


# 重构插件系统为包加载模式

参考 Rubick 的插件设计理念，将 OmniBox 的插件系统从 Rust 硬编码改为基于 `plugin.json` 描述文件的包加载模式。

## User Review Required

> [!IMPORTANT]
> 本次重构涉及后端插件管理器核心逻辑重写、插件目录结构变更、前端插件加载方式变更。现有 4 个内置插件（时间戳、计算器、笔记、翻译）将迁移为独立的插件包目录。

> [!WARNING]
> 重构后，插件的加载方式从 Rust 硬编码变为文件系统扫描 + JSON 解析。需要确保插件目录的读写权限和路径正确性。

## Proposed Changes

### 插件包规范设计

每个插件是一个独立目录，结构如下：

```
~/.config/omnibox/plugins/
├── omnibox-timestamp/
│   └── plugin.json
├── omnibox-calculator/
│   └── plugin.json
├── omnibox-notes/
│   └── plugin.json
└── omnibox-translate/
    └── plugin.json
```

`plugin.json` 规范（参考 Rubick）：

```json
{
  "pluginName": "omnibox-timestamp",
  "pluginType": "ui",
  "description": "时间戳与日期时间互转",
  "main": "index.html",
  "version": "1.0.0",
  "logo": "⏱️",
  "features": [
    {
      "code": "timestamp",
      "explain": "时间戳转换工具",
      "cmds": [
        {
          "label": "时间戳",
          "type": "text",
          "keyword": "ts"
        }
      ]
    }
  ],
  "permissions": [],
  "dependencies": [],
  "builtIn": true
}
```

字段说明：
- **pluginName**: 插件唯一标识（目录名）
- **pluginType**: 插件类型，`"ui"` 表示有界面的插件，`"system"` 表示系统插件
- **description**: 插件描述
- **main**: 插件入口文件（UI 插件为 HTML 文件路径，内置插件可为空或标识）
- **version**: 语义化版本号
- **logo**: 插件图标（emoji 或图片路径）
- **features**: 功能列表，每个 feature 包含：
  - **code**: 功能代码（用于前端路由映射）
  - **explain**: 功能说明
  - **cmds**: 触发命令列表，每个 cmd 包含 label、type、keyword
- **permissions**: 权限声明
- **dependencies**: 依赖的其他插件
- **builtIn**: 是否为内置插件（内置插件的逻辑在 Rust/React 中实现）

---

### 后端 - 插件管理器重构

#### [MODIFY] [manager.rs](file:///D:/git/OmniBox/src-tauri/src/plugins/manager.rs)

核心改动：
1. **新增 `PluginManifest` 结构体**：对应 `plugin.json` 的完整字段定义
2. **新增 `Feature` 和 `Cmd` 结构体**：对应 features 和 cmds 字段
3. **重写 `get_builtin_plugins()`**：改为扫描插件目录，读取每个子目录的 `plugin.json`
4. **新增 `scan_plugins_dir()`**：扫描 `~/.config/omnibox/plugins/` 目录
5. **新增 `load_plugin_manifest()`**：读取并解析单个 `plugin.json`
6. **新增 `install_builtin_plugins()`**：首次启动时，将内置插件的 `plugin.json` 写入插件目录
7. **保留 `Plugin` 结构体**：作为内部统一的插件数据结构，从 `PluginManifest` 转换而来
8. **保留依赖检查和版本比较逻辑**

```diff
+ pub struct PluginManifest {
+     pub plugin_name: String,
+     pub plugin_type: String,  // "ui" | "system"
+     pub description: String,
+     pub main: String,
+     pub version: String,
+     pub logo: Option<String>,
+     pub features: Vec<Feature>,
+     pub permissions: Vec<String>,
+     pub dependencies: Vec<PluginDependency>,
+     pub built_in: bool,
+ }
+
+ pub struct Feature {
+     pub code: String,
+     pub explain: String,
+     pub cmds: Vec<Cmd>,
+ }
+
+ pub struct Cmd {
+     pub label: String,
+     pub cmd_type: String,  // "text" | "img" | "files" | "regex" | "over"
+     pub keyword: String,
+ }
```

---

#### [MODIFY] [search.rs](file:///D:/git/OmniBox/src-tauri/src/commands/search.rs)

适配新的插件数据结构：
1. 从 `PluginManifest` 的 `features[].cmds[]` 中提取搜索关键词
2. 使用 `logo` 字段替代原来的 `icon`
3. 搜索逻辑保持不变（模糊匹配 + 频率排序）

---

#### [MODIFY] [plugin_manage.rs](file:///D:/git/OmniBox/src-tauri/src/commands/plugin_manage.rs)

适配新的插件加载方式：
1. `enable_plugin` / `disable_plugin` 逻辑不变
2. `get_plugin_status` 从文件系统加载插件列表

---

#### [MODIFY] [lib.rs](file:///D:/git/OmniBox/src-tauri/src/lib.rs)

在 `setup` 中添加：
1. 调用 `install_builtin_plugins()` 确保内置插件的 `plugin.json` 存在

---

### 后端 - 内置插件 plugin.json 文件

#### [NEW] [plugin.json](file:///D:/git/OmniBox/src-tauri/builtin-plugins/omnibox-timestamp/plugin.json)

时间戳插件的 plugin.json 描述文件。

#### [NEW] [plugin.json](file:///D:/git/OmniBox/src-tauri/builtin-plugins/omnibox-calculator/plugin.json)

计算器插件的 plugin.json 描述文件。

#### [NEW] [plugin.json](file:///D:/git/OmniBox/src-tauri/builtin-plugins/omnibox-notes/plugin.json)

笔记插件的 plugin.json 描述文件。

#### [NEW] [plugin.json](file:///D:/git/OmniBox/src-tauri/builtin-plugins/omnibox-translate/plugin.json)

翻译插件的 plugin.json 描述文件。

---

### 前端 - 类型定义更新

#### [MODIFY] [index.ts](file:///D:/git/OmniBox/src/types/index.ts)

更新 `Plugin` 接口以匹配新的 `PluginManifest` 结构：

```diff
  export interface Plugin {
    id: string;
    name: string;
    version: string;
    description: string;
    icon?: string;
+   pluginType: string;
+   builtIn: boolean;
+   features: PluginFeature[];
  }
+
+ export interface PluginFeature {
+   code: string;
+   explain: string;
+   cmds: PluginCmd[];
+ }
+
+ export interface PluginCmd {
+   label: string;
+   type: string;
+   keyword: string;
+ }
```

---

### 前端 - 插件视图映射更新

#### [MODIFY] [SearchView.tsx](file:///D:/git/OmniBox/src/views/SearchView.tsx)

更新 `PLUGIN_VIEW_MAP`：
1. 改为从插件的 `features[0].code` 动态生成映射，而非硬编码
2. 内置插件通过 `builtIn` 标记识别，跳转到对应的 React 视图
3. 非内置插件（未来扩展）可通过 webview 加载 `main` 入口文件

---

### 前端 - 插件市场更新

#### [MODIFY] [PluginMarketView.tsx](file:///D:/git/OmniBox/src/views/PluginMarketView.tsx)

适配新的插件数据结构：
1. 使用 `logo` 字段显示图标
2. 显示 `pluginType` 标签（UI / 系统）
3. 显示 `builtIn` 标记

---

## Verification Plan

### Automated Tests
- 运行 `cargo build` 确保 Rust 后端编译通过
- 运行 `npm run build` 确保前端编译通过
- 验证 `~/.config/omnibox/plugins/` 目录下正确生成 4 个内置插件的 `plugin.json`

### Manual Verification
- 启动应用，确认搜索主页正常显示所有已启用插件图标
- 输入关键词搜索，确认搜索结果正常返回
- 点击插件图标，确认正确跳转到对应功能页面
- 打开插件市场，确认插件列表正常显示
- 禁用某个插件后，确认搜索结果中不再出现该插件
- 删除某个插件的 `plugin.json`，确认应用不崩溃且该插件不再显示


updateAtTime: 2026/3/31 17:00:28

planId: 3b1ea1fd-a82f-45a8-9e7c-2c819e070879