# OmniBox MVP 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建 OmniBox MVP 版本，包含基础搜索、插件系统、时间戳插件和 Tauri 框架搭建

**Architecture:** 基于 Tauri + React 的四层架构：Core Layer (Rust) 提供后端 API，Plugin Layer (npm) 管理插件，UI Layer (React + Zustand) 实现界面，Sync Layer 负责数据同步

**Tech Stack:** Tauri 2.0 + React 18 + TypeScript + Vite + Zustand + Tailwind CSS

**设计文档:** `docs/superpowers/specs/2026-03-25-omnibox-design.md`

---

## Phase 1: 项目初始化和基础架构搭建

### Task 1.1: 创建 Tauri + React 项目

**Files:**
- Create: `package.json`
- Create: `src-tauri/Cargo.toml`
- Create: `src-tauri/tauri.conf.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`

- [ ] **Step 1: 初始化项目结构**

```bash
# 创建项目目录
mkdir -p omnibox
cd omnibox

# 初始化 npm 项目
npm init -y
```

- [ ] **Step 2: 安装前端依赖**

```bash
npm install react@^18 react-dom@^18 zustand tailwindcss postcss autoprefixer
npm install -D @types/react @types/react-dom typescript vite @vitejs/plugin-react
npm install -D eslint prettier
```

- [ ] **Step 3: 创建 package.json**

```json
{
  "name": "omnibox",
  "version": "0.1.0",
  "description": "OmniBox - 万用盒效率工具",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "@tauri-apps/cli": "^2.0.0"
  }
}
```

- [ ] **Step 4: 配置 Tailwind CSS**

```bash
npx tailwindcss init -p
```

修改 `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

创建 `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: 配置 TypeScript**

创建 `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

创建 `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 6: 配置 Vite**

创建 `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(async () => ({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
}))
```

- [ ] **Step 7: 初始化 Tauri**

```bash
npm install -D @tauri-apps/cli@^2.0.0
npx tauri init
```

配置 `src-tauri/tauri.conf.json`:

```json
{
  "productName": "OmniBox",
  "version": "0.1.0",
  "identifier": "com.omnibox.app",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:1420",
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build"
  },
  "app": {
    "windows": [
      {
        "title": "OmniBox",
        "width": 800,
        "height": 600,
        "resizable": true,
        "fullscreen": false,
        "decorations": false,
        "transparent": true,
        "alwaysOnTop": false,
        "skipTaskbar": false
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

- [ ] **Step 8: 创建入口文件**

创建 `index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>OmniBox</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 9: 测试项目启动**

```bash
npm run tauri:dev
```

**预期结果:** 应用窗口正常打开，显示空白页面

- [ ] **Step 10: 提交代码**

```bash
git add .
git commit -m "feat: initialize OmniBox project with Tauri + React"
```

---

## Phase 2: Core Layer - 基础架构

### Task 2.1: 创建后端 Command 接口

**Files:**
- Create: `src-tauri/src/commands/mod.rs`
- Create: `src-tauri/src/commands/search.rs`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/src/main.rs`

- [ ] **Step 1: 添加基础依赖**

修改 `src-tauri/Cargo.toml`:

```toml
[package]
name = "omnibox"
version = "0.1.0"
edition = "2021"

[dependencies]
tauri = { version = "2.0", features = [] }
tauri-plugin-shell = "2.0"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }
chrono = { version = "0.4", features = ["serde"] }

[features]
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]
```

- [ ] **Step 2: 创建 Command 模块**

创建 `src-tauri/src/commands/mod.rs`:

```rust
pub mod search;
pub mod plugin;
pub mod config;

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn error(msg: String) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(msg),
        }
    }
}
```

- [ ] **Step 3: 创建搜索 Command**

创建 `src-tauri/src/commands/search.rs`:

```rust
use serde::{Deserialize, Serialize};
use crate::commands::ApiResponse;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SearchResult {
    pub id: String,
    pub title: String,
    pub subtitle: String,
    pub icon: Option<String>,
    pub plugin_id: String,
    pub score: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchRequest {
    pub query: String,
    pub limit: Option<usize>,
}

#[tauri::command]
pub async fn search(request: SearchRequest) -> ApiResponse<Vec<SearchResult>> {
    // 模拟搜索结果
    let results = vec![
        SearchResult {
            id: "1".to_string(),
            title: "时间戳转换".to_string(),
            subtitle: "时间戳与日期互转".to_string(),
            icon: Some("⏱️".to_string()),
            plugin_id: "omnibox-timestamp".to_string(),
            score: 1.0,
        },
    ];
    
    ApiResponse::success(results)
}

#[tauri::command]
pub async fn get_installed_plugins() -> ApiResponse<Vec<PluginInfo>> {
    let plugins = vec![
        PluginInfo {
            id: "omnibox-timestamp".to_string(),
            name: "时间戳转换".to_string(),
            version: "1.0.0".to_string(),
            description: "时间戳与日期互转".to_string(),
            icon: Some("⏱️".to_string()),
        },
    ];
    
    ApiResponse::success(plugins)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PluginInfo {
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: String,
    pub icon: Option<String>,
}
```

- [ ] **Step 4: 更新 lib.rs**

修改 `src-tauri/src/lib.rs`:

```rust
pub mod commands;

use commands::search;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            search::search,
            search::get_installed_plugins,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 5: 更新 main.rs**

修改 `src-tauri/src/main.rs`:

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    omnibox_lib::run()
}
```

- [ ] **Step 6: 测试后端编译**

```bash
cd src-tauri
cargo check
```

**预期结果:** 编译成功，无错误

- [ ] **Step 7: 提交代码**

```bash
git add .
git commit -m "feat: add basic backend commands for search"
```

---

## Phase 3: UI Layer - 基础界面

### Task 3.1: 创建前端状态管理

**Files:**
- Create: `src/stores/searchStore.ts`
- Create: `src/stores/pluginStore.ts`
- Create: `src/stores/index.ts`
- Create: `src/types/index.ts`

- [ ] **Step 1: 定义类型**

创建 `src/types/index.ts`:

```typescript
export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  icon?: string;
  pluginId: string;
  score: number;
}

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  icon?: string;
}

export interface SearchRequest {
  query: string;
  limit?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

- [ ] **Step 2: 创建搜索 Store**

创建 `src/stores/searchStore.ts`:

```typescript
import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { SearchResult, SearchRequest, ApiResponse } from '../types';

interface SearchState {
  query: string;
  results: SearchResult[];
  isLoading: boolean;
  selectedIndex: number;
  
  setQuery: (query: string) => void;
  search: () => Promise<void>;
  setSelectedIndex: (index: number) => void;
  selectResult: () => SearchResult | null;
  navigateUp: () => void;
  navigateDown: () => void;
  clearSearch: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  results: [],
  isLoading: false,
  selectedIndex: -1,

  setQuery: (query) => set({ query }),

  search: async () => {
    const { query } = get();
    if (!query.trim()) {
      set({ results: [], selectedIndex: -1 });
      return;
    }

    set({ isLoading: true });
    try {
      const request: SearchRequest = { query, limit: 20 };
      const response = await invoke<ApiResponse<SearchResult[]>>('search', { request });
      
      if (response.success && response.data) {
        set({ 
          results: response.data, 
          selectedIndex: response.data.length > 0 ? 0 : -1 
        });
      } else {
        set({ results: [], selectedIndex: -1 });
      }
    } catch (error) {
      console.error('Search error:', error);
      set({ results: [], selectedIndex: -1 });
    } finally {
      set({ isLoading: false });
    }
  },

  setSelectedIndex: (index) => set({ selectedIndex: index }),

  selectResult: () => {
    const { results, selectedIndex } = get();
    if (selectedIndex >= 0 && selectedIndex < results.length) {
      return results[selectedIndex];
    }
    return null;
  },

  navigateUp: () => {
    const { selectedIndex, results } = get();
    if (results.length === 0) return;
    const newIndex = selectedIndex <= 0 ? results.length - 1 : selectedIndex - 1;
    set({ selectedIndex: newIndex });
  },

  navigateDown: () => {
    const { selectedIndex, results } = get();
    if (results.length === 0) return;
    const newIndex = selectedIndex >= results.length - 1 ? 0 : selectedIndex + 1;
    set({ selectedIndex: newIndex });
  },

  clearSearch: () => set({ query: '', results: [], selectedIndex: -1 }),
}));
```

- [ ] **Step 3: 创建插件 Store**

创建 `src/stores/pluginStore.ts`:

```typescript
import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { Plugin, ApiResponse } from '../types';

interface PluginState {
  installedPlugins: Plugin[];
  isLoading: boolean;
  
  loadInstalledPlugins: () => Promise<void>;
  getPluginById: (id: string) => Plugin | undefined;
}

export const usePluginStore = create<PluginState>((set, get) => ({
  installedPlugins: [],
  isLoading: false,

  loadInstalledPlugins: async () => {
    set({ isLoading: true });
    try {
      const response = await invoke<ApiResponse<Plugin[]>>('get_installed_plugins');
      if (response.success && response.data) {
        set({ installedPlugins: response.data });
      }
    } catch (error) {
      console.error('Load plugins error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  getPluginById: (id) => {
    return get().installedPlugins.find(p => p.id === id);
  },
}));
```

- [ ] **Step 4: 创建 Store 入口**

创建 `src/stores/index.ts`:

```typescript
export { useSearchStore } from './searchStore';
export { usePluginStore } from './pluginStore';
```

- [ ] **Step 5: 提交代码**

```bash
git add .
git commit -m "feat: add Zustand stores for search and plugin management"
```

### Task 3.2: 创建搜索界面组件

**Files:**
- Create: `src/components/SearchInput.tsx`
- Create: `src/components/SearchResults.tsx`
- Create: `src/components/SearchResultItem.tsx`
- Create: `src/views/SearchView.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: 创建 SearchInput 组件**

创建 `src/components/SearchInput.tsx`:

```typescript
import React, { useRef, useEffect } from 'react';
import { useSearchStore } from '../stores';

export const SearchInput: React.FC = () => {
  const { query, setQuery, search, clearSearch } = useSearchStore();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 自动聚焦
    inputRef.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      search();
    }
  };

  return (
    <div className="relative flex items-center w-full px-4 py-3 bg-white border-b border-gray-200">
      <span className="text-xl mr-3">🔍</span>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="输入插件名、命令或文件..."
        className="flex-1 text-lg outline-none bg-transparent"
        autoFocus
      />
      {query && (
        <button
          onClick={clearSearch}
          className="ml-2 px-3 py-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
        >
          ✕
        </button>
      )}
    </div>
  );
};
```

- [ ] **Step 2: 创建 SearchResultItem 组件**

创建 `src/components/SearchResultItem.tsx`:

```typescript
import React from 'react';
import type { SearchResult } from '../types';

interface SearchResultItemProps {
  result: SearchResult;
  selected: boolean;
  onClick: () => void;
}

export const SearchResultItem: React.FC<SearchResultItemProps> = ({
  result,
  selected,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`flex items-center px-4 py-3 cursor-pointer transition-colors ${
        selected ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50 border-l-4 border-transparent'
      }`}
    >
      <span className="text-2xl mr-4">{result.icon || '🔧'}</span>
      <div className="flex-1">
        <div className="font-medium text-gray-900">{result.title}</div>
        <div className="text-sm text-gray-500">{result.subtitle}</div>
      </div>
      {selected && (
        <span className="text-blue-500 text-sm">↵ Enter</span>
      )}
    </div>
  );
};
```

- [ ] **Step 3: 创建 SearchResults 组件**

创建 `src/components/SearchResults.tsx`:

```typescript
import React from 'react';
import { useSearchStore } from '../stores';
import { SearchResultItem } from './SearchResultItem';

export const SearchResults: React.FC = () => {
  const { results, isLoading, selectedIndex, setSelectedIndex, selectResult } = useSearchStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500">
        搜索中...
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400">
        输入关键词开始搜索
      </div>
    );
  }

  return (
    <div className="max-h-96 overflow-y-auto">
      {results.map((result, index) => (
        <SearchResultItem
          key={result.id}
          result={result}
          selected={index === selectedIndex}
          onClick={() => {
            setSelectedIndex(index);
            selectResult();
          }}
        />
      ))}
    </div>
  );
};
```

- [ ] **Step 4: 创建 SearchView 视图**

创建 `src/views/SearchView.tsx`:

```typescript
import React, { useEffect } from 'react';
import { SearchInput } from '../components/SearchInput';
import { SearchResults } from '../components/SearchResults';
import { useSearchStore, usePluginStore } from '../stores';

export const SearchView: React.FC = () => {
  const { navigateUp, navigateDown, selectResult } = useSearchStore();
  const { loadInstalledPlugins } = usePluginStore();

  useEffect(() => {
    loadInstalledPlugins();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          navigateUp();
          break;
        case 'ArrowDown':
          e.preventDefault();
          navigateDown();
          break;
        case 'Enter':
          e.preventDefault();
          selectResult();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateUp, navigateDown, selectResult]);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      <SearchInput />
      <SearchResults />
    </div>
  );
};
```

- [ ] **Step 5: 更新 App.tsx**

修改 `src/App.tsx`:

```typescript
import { SearchView } from './views/SearchView';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        <SearchView />
      </div>
    </div>
  );
}

export default App;
```

- [ ] **Step 6: 更新 main.tsx**

修改 `src/main.tsx`:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 7: 测试界面**

```bash
npm run tauri:dev
```

**预期结果:** 界面显示搜索框和结果列表，可以输入搜索并导航

- [ ] **Step 8: 提交代码**

```bash
git add .
git commit -m "feat: implement basic search UI with keyboard navigation"
```

---

## Phase 4: 时间戳插件

### Task 4.1: 创建时间戳插件后端逻辑

**Files:**
- Create: `src-tauri/src/plugins/timestamp.rs`
- Modify: `src-tauri/src/commands/mod.rs`
- Modify: `src-tauri/src/lib.rs`

- [ ] **Step 1: 创建时间戳转换逻辑**

创建 `src-tauri/src/plugins/timestamp.rs`:

```rust
use chrono::{DateTime, Local, TimeZone, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct TimestampConversion {
    pub seconds: String,
    pub milliseconds: String,
    pub nanoseconds: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FormatEntry {
    pub format: String,
    pub value: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TimestampResponse {
    pub input: String,
    pub detected_type: String,
    pub conversions: TimestampConversion,
    pub formats: Vec<FormatEntry>,
    pub timezone: String,
}

pub fn convert_timestamp(input: &str, timezone: &str) -> Result<TimestampResponse, String> {
    // 解析输入
    let (timestamp_ms, detected_type) = parse_input(input)?;
    
    // 转换为各种格式
    let dt_utc = Utc.timestamp_millis_opt(timestamp_ms).single()
        .ok_or("Invalid timestamp")?;
    
    // 时区转换
    let dt_local = if timezone == "Asia/Shanghai" {
        dt_utc.with_timezone(&chrono::FixedOffset::east_opt(8 * 3600).unwrap())
    } else {
        dt_utc.with_timezone(&Local)
    };
    
    // 格式化输出
    let seconds = dt_local.format("%Y-%m-%d %H:%M:%S").to_string();
    let milliseconds = dt_local.format("%Y-%m-%d %H:%M:%S%.3f").to_string();
    let nanoseconds = dt_local.format("%Y-%m-%d %H:%M:%S%.9f").to_string();
    
    let conversions = TimestampConversion {
        seconds,
        milliseconds,
        nanoseconds,
    };
    
    // 生成格式对照表
    let timestamp_s = timestamp_ms / 1000;
    let formats = vec![
        FormatEntry {
            format: "标准时间(秒)".to_string(),
            value: dt_local.format("%Y-%m-%d %H:%M:%S").to_string(),
        },
        FormatEntry {
            format: "Unix时间戳(秒)".to_string(),
            value: timestamp_s.to_string(),
        },
        FormatEntry {
            format: "标准时间(毫秒)".to_string(),
            value: dt_local.format("%Y-%m-%d %H:%M:%S%.3f").to_string(),
        },
        FormatEntry {
            format: "Unix时间戳(毫秒)".to_string(),
            value: timestamp_ms.to_string(),
        },
    ];
    
    Ok(TimestampResponse {
        input: input.to_string(),
        detected_type,
        conversions,
        formats,
        timezone: timezone.to_string(),
    })
}

fn parse_input(input: &str) -> Result<(i64, String), String> {
    let trimmed = input.trim();
    
    // 尝试解析为数字（时间戳）
    if let Ok(num) = trimmed.parse::<i64>() {
        // 判断是秒还是毫秒
        if trimmed.len() == 10 {
            // 秒级时间戳
            return Ok((num * 1000, "Unix时间戳(秒)".to_string()));
        } else if trimmed.len() == 13 {
            // 毫秒级时间戳
            return Ok((num, "Unix时间戳(毫秒)".to_string()));
        } else if trimmed.len() == 19 {
            // 纳秒级时间戳
            return Ok((num / 1000000, "Unix时间戳(纳秒)".to_string()));
        }
    }
    
    // 尝试解析为日期字符串
    let formats = [
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M:%S%.3f",
        "%Y-%m-%d",
        "%Y/%m/%d %H:%M:%S",
    ];
    
    for format in &formats {
        if let Ok(dt) = DateTime::parse_from_str(trimmed, format) {
            return Ok((dt.timestamp_millis(), "标准时间".to_string()));
        }
    }
    
    Err("无法识别输入格式".to_string())
}

#[tauri::command]
pub fn convert_timestamp_command(input: String, timezone: String) -> Result<TimestampResponse, String> {
    convert_timestamp(&input, &timezone)
}
```

- [ ] **Step 2: 更新命令模块**

修改 `src-tauri/src/commands/mod.rs`:

```rust
pub mod search;
pub mod plugin;
pub mod config;

// Re-export timestamp plugin
pub use crate::plugins::timestamp;

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn error(msg: String) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(msg),
        }
    }
}
```

- [ ] **Step 3: 创建 plugins 模块**

创建 `src-tauri/src/plugins/mod.rs`:

```rust
pub mod timestamp;
```

- [ ] **Step 4: 更新 lib.rs**

修改 `src-tauri/src/lib.rs`:

```rust
pub mod commands;
pub mod plugins;

use commands::{search, timestamp};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            search::search,
            search::get_installed_plugins,
            timestamp::convert_timestamp_command,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 5: 测试后端编译**

```bash
cd src-tauri
cargo check
```

**预期结果:** 编译成功

- [ ] **Step 6: 提交代码**

```bash
git add .
git commit -m "feat: add timestamp conversion backend logic"
```

### Task 4.2: 创建时间戳插件前端界面

**Files:**
- Create: `src/views/TimestampView.tsx`
- Create: `src/components/TimestampRow.tsx`
- Create: `src/components/FormatTable.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: 更新时间戳类型**

修改 `src/types/index.ts`:

```typescript
export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  icon?: string;
  pluginId: string;
  score: number;
}

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  icon?: string;
}

export interface SearchRequest {
  query: string;
  limit?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Timestamp types
export interface TimestampConversion {
  seconds: string;
  milliseconds: string;
  nanoseconds: string;
}

export interface FormatEntry {
  format: string;
  value: string;
}

export interface TimestampResponse {
  input: string;
  detectedType: string;
  conversions: TimestampConversion;
  formats: FormatEntry[];
  timezone: string;
}

export interface Timezone {
  value: string;
  label: string;
}
```

- [ ] **Step 2: 创建 TimestampRow 组件**

创建 `src/components/TimestampRow.tsx`:

```typescript
import React from 'react';

interface TimestampRowProps {
  label: string;
  value: string;
  onCopy: () => void;
}

export const TimestampRow: React.FC<TimestampRowProps> = ({ label, value, onCopy }) => {
  return (
    <div className="flex items-center px-4 py-3 border-b border-gray-100 hover:bg-gray-50">
      <span className="w-12 text-gray-500 text-sm">{label}</span>
      <span className="flex-1 font-mono text-gray-800">{value}</span>
      <button
        onClick={onCopy}
        className="px-4 py-1.5 bg-emerald-500 text-white text-sm rounded hover:bg-emerald-600 transition-colors"
      >
        复制
      </button>
    </div>
  );
};
```

- [ ] **Step 3: 创建 FormatTable 组件**

创建 `src/components/FormatTable.tsx`:

```typescript
import React from 'react';
import type { FormatEntry } from '../types';

interface FormatTableProps {
  formats: FormatEntry[];
  onLoad: (value: string) => void;
}

export const FormatTable: React.FC<FormatTableProps> = ({ formats, onLoad }) => {
  return (
    <div className="border-t border-gray-200">
      <div className="grid grid-cols-3 bg-gray-50 text-sm font-medium text-gray-600">
        <div className="px-4 py-2">格式</div>
        <div className="px-4 py-2">值</div>
        <div className="px-4 py-2 text-right">操作</div>
      </div>
      {formats.map((entry, index) => (
        <div
          key={index}
          className="grid grid-cols-3 border-t border-gray-100 hover:bg-gray-50 text-sm"
        >
          <div className="px-4 py-3 text-gray-600">{entry.format}</div>
          <div className="px-4 py-3 font-mono text-gray-800">{entry.value}</div>
          <div className="px-4 py-2 text-right">
            <button
              onClick={() => onLoad(entry.value)}
              className="px-3 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-100 transition-colors"
            >
              加载
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
```

- [ ] **Step 4: 创建 TimestampView 视图**

创建 `src/views/TimestampView.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { TimestampRow } from '../components/TimestampRow';
import { FormatTable } from '../components/FormatTable';
import type { TimestampResponse, Timezone } from '../types';

const timezones: Timezone[] = [
  { value: 'UTC', label: 'UTC' },
  { value: 'Asia/Shanghai', label: 'UTC+08:00 Asia/Shanghai - 上海' },
  { value: 'Asia/Tokyo', label: 'UTC+09:00 Asia/Tokyo - 东京' },
  { value: 'America/New_York', label: 'UTC-05:00 America/New_York - 纽约' },
  { value: 'Europe/London', label: 'UTC+00:00 Europe/London - 伦敦' },
];

export const TimestampView: React.FC = () => {
  const [input, setInput] = useState('');
  const [timezone, setTimezone] = useState('Asia/Shanghai');
  const [result, setResult] = useState<TimestampResponse | null>(null);
  const [error, setError] = useState('');

  const convert = async () => {
    if (!input.trim()) return;
    
    try {
      const response = await invoke<TimestampResponse>('convert_timestamp_command', {
        input,
        timezone,
      });
      setResult(response);
      setError('');
    } catch (e) {
      setError(String(e));
      setResult(null);
    }
  };

  // 输入变化时自动转换
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (input.trim()) {
        convert();
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [input, timezone]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const loadToInput = (value: string) => {
    setInput(value);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* 时区选择 */}
      <div className="flex items-center px-4 py-3 border-b border-gray-200">
        <span className="w-12 text-gray-600">时区</span>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md outline-none focus:border-blue-500"
        >
          {timezones.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>

      {/* 输入区域 */}
      <div className="flex items-center px-4 py-3 border-b border-gray-200">
        <span className="w-12 text-gray-600">输入</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="1739221200"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md outline-none focus:border-blue-500 font-mono"
        />
        <select className="ml-2 px-3 py-2 border border-gray-300 rounded-md outline-none focus:border-blue-500 text-sm">
          <option>自动识别</option>
          <option>Unix时间戳(秒)</option>
          <option>Unix时间戳(毫秒)</option>
          <option>日期时间</option>
        </select>
        <button
          onClick={() => setInput('')}
          className="ml-2 px-4 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100"
        >
          清空
        </button>
      </div>

      {/* 转换结果 */}
      {result && (
        <>
          <TimestampRow
            label="秒"
            value={result.conversions.seconds}
            onCopy={() => copyToClipboard(result.conversions.seconds)}
          />
          <TimestampRow
            label="毫秒"
            value={result.conversions.milliseconds}
            onCopy={() => copyToClipboard(result.conversions.milliseconds)}
          />
          <TimestampRow
            label="纳秒"
            value={result.conversions.nanoseconds}
            onCopy={() => copyToClipboard(result.conversions.nanoseconds)}
          />

          {/* 格式对照表 */}
          <FormatTable formats={result.formats} onLoad={loadToInput} />
        </>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="px-4 py-3 text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* 空状态 */}
      {!result && !error && (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          输入时间戳或日期开始转换
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 5: 更新 App.tsx 支持路由**

修改 `src/App.tsx`:

```typescript
import { useState } from 'react';
import { SearchView } from './views/SearchView';
import { TimestampView } from './views/TimestampView';

type ViewType = 'search' | 'timestamp';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('search');

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-3xl mx-auto">
        {/* 视图切换按钮 */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setCurrentView('search')}
            className={`px-4 py-2 rounded ${
              currentView === 'search'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            搜索
          </button>
          <button
            onClick={() => setCurrentView('timestamp')}
            className={`px-4 py-2 rounded ${
              currentView === 'timestamp'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            时间戳
          </button>
        </div>

        {/* 当前视图 */}
        {currentView === 'search' && <SearchView />}
        {currentView === 'timestamp' && <TimestampView />}
      </div>
    </div>
  );
}

export default App;
```

- [ ] **Step 6: 测试时间戳插件**

```bash
npm run tauri:dev
```

**预期结果:** 
- 切换到时间戳视图
- 输入时间戳（如 1739221200）
- 显示转换结果
- 可以点击复制按钮复制结果

- [ ] **Step 7: 提交代码**

```bash
git add .
git commit -m "feat: implement timestamp converter plugin with full UI"
```

---

## Phase 5: 快捷键和窗口管理

### Task 5.1: 添加全局快捷键

**Files:**
- Modify: `src-tauri/tauri.conf.json`
- Modify: `src-tauri/src/lib.rs`
- Create: `src-tauri/src/window.rs`
- Modify: `src/App.tsx`

- [ ] **Step 1: 配置快捷键**

修改 `src-tauri/tauri.conf.json`:

```json
{
  "productName": "OmniBox",
  "version": "0.1.0",
  "identifier": "com.omnibox.app",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:1420",
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build"
  },
  "app": {
    "windows": [
      {
        "title": "OmniBox",
        "width": 800,
        "height": 600,
        "resizable": true,
        "fullscreen": false,
        "decorations": false,
        "transparent": true,
        "alwaysOnTop": false,
        "skipTaskbar": false
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

- [ ] **Step 2: 创建窗口管理模块**

创建 `src-tauri/src/window.rs`:

```rust
use tauri::{Manager, AppHandle, WebviewWindow};

pub fn setup_window_shortcuts(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let window = app.get_webview_window("main").unwrap();
    
    // 注册全局快捷键 Alt+R 显示/隐藏窗口
    window.set_ignore_cursor_events(false)?;
    
    Ok(())
}

#[tauri::command]
pub fn show_window(window: WebviewWindow) {
    window.show().unwrap();
    window.set_focus().unwrap();
}

#[tauri::command]
pub fn hide_window(window: WebviewWindow) {
    window.hide().unwrap();
}

#[tauri::command]
pub fn toggle_window(window: WebviewWindow) {
    if window.is_visible().unwrap() {
        window.hide().unwrap();
    } else {
        window.show().unwrap();
        window.set_focus().unwrap();
    }
}
```

- [ ] **Step 3: 更新 lib.rs**

修改 `src-tauri/src/lib.rs`:

```rust
pub mod commands;
pub mod plugins;
pub mod window;

use commands::{search, timestamp};
use window::{show_window, hide_window, toggle_window};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            search::search,
            search::get_installed_plugins,
            timestamp::convert_timestamp_command,
            show_window,
            hide_window,
            toggle_window,
        ])
        .setup(|app| {
            window::setup_window_shortcuts(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 4: 前端添加快捷键处理**

修改 `src/App.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { SearchView } from './views/SearchView';
import { TimestampView } from './views/TimestampView';

type ViewType = 'search' | 'timestamp';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('search');

  useEffect(() => {
    // 监听 ESC 键隐藏窗口
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const window = getCurrentWindow();
        await invoke('hide_window', { window });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-3xl mx-auto">
        {/* 视图切换按钮 */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setCurrentView('search')}
            className={`px-4 py-2 rounded ${
              currentView === 'search'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            搜索
          </button>
          <button
            onClick={() => setCurrentView('timestamp')}
            className={`px-4 py-2 rounded ${
              currentView === 'timestamp'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            时间戳
          </button>
        </div>

        {/* 当前视图 */}
        {currentView === 'search' && <SearchView />}
        {currentView === 'timestamp' && <TimestampView />}
      </div>
    </div>
  );
}

export default App;
```

- [ ] **Step 5: 测试快捷键**

```bash
npm run tauri:dev
```

**预期结果:** 按 ESC 键可以隐藏窗口

- [ ] **Step 6: 提交代码**

```bash
git add .
git commit -m "feat: add window management and ESC shortcut"
```

---

## Phase 6: 插件系统集成

### Task 6.1: 创建插件管理基础

**Files:**
- Create: `src-tauri/src/plugins/mod.rs`
- Create: `src-tauri/src/plugins/manager.rs`
- Modify: `src-tauri/src/lib.rs`

- [ ] **Step 1: 创建插件管理器**

创建 `src-tauri/src/plugins/manager.rs`:

```rust
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use std::fs;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Plugin {
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: String,
    pub main: String,
    pub commands: Vec<Command>,
    pub permissions: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Command {
    pub label: String,
    pub keyword: String,
    pub explain: String,
    pub icon: Option<String>,
}

pub struct PluginManager {
    plugins_dir: PathBuf,
}

impl PluginManager {
    pub fn new() -> Self {
        let plugins_dir = dirs::config_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("omnibox")
            .join("plugins");
        
        Self { plugins_dir }
    }

    pub fn get_builtin_plugins(&self) -> Vec<Plugin> {
        vec![
            Plugin {
                id: "omnibox-timestamp".to_string(),
                name: "时间戳转换".to_string(),
                version: "1.0.0".to_string(),
                description: "时间戳与日期时间互转".to_string(),
                main: "timestamp.js".to_string(),
                commands: vec![
                    Command {
                        label: "时间戳".to_string(),
                        keyword: "ts".to_string(),
                        explain: "时间戳转换工具".to_string(),
                        icon: Some("⏱️".to_string()),
                    },
                ],
                permissions: vec![],
            },
        ]
    }

    pub fn load_plugin(&self, plugin_id: &str) -> Option<Plugin> {
        self.get_builtin_plugins()
            .into_iter()
            .find(|p| p.id == plugin_id)
    }
}

#[tauri::command]
pub fn get_builtin_plugins() -> Vec<Plugin> {
    let manager = PluginManager::new();
    manager.get_builtin_plugins()
}
```

- [ ] **Step 2: 更新 plugins 模块**

修改 `src-tauri/src/plugins/mod.rs`:

```rust
pub mod timestamp;
pub mod manager;

pub use manager::{Plugin, Command, get_builtin_plugins};
```

- [ ] **Step 3: 更新命令和 lib**

修改 `src-tauri/src/commands/search.rs`:

```rust
use serde::{Deserialize, Serialize};
use crate::commands::ApiResponse;
use crate::plugins::manager::PluginManager;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SearchResult {
    pub id: String,
    pub title: String,
    pub subtitle: String,
    pub icon: Option<String>,
    pub plugin_id: String,
    pub score: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchRequest {
    pub query: String,
    pub limit: Option<usize>,
}

#[tauri::command]
pub async fn search(request: SearchRequest) -> ApiResponse<Vec<SearchResult>> {
    let manager = PluginManager::new();
    let plugins = manager.get_builtin_plugins();
    
    // 过滤匹配的插件
    let results: Vec<SearchResult> = plugins
        .iter()
        .filter(|p| {
            p.name.to_lowercase().contains(&request.query.to_lowercase())
                || p.id.to_lowercase().contains(&request.query.to_lowercase())
        })
        .map(|p| SearchResult {
            id: p.id.clone(),
            title: p.name.clone(),
            subtitle: p.description.clone(),
            icon: p.commands.first().and_then(|c| c.icon.clone()),
            plugin_id: p.id.clone(),
            score: 1.0,
        })
        .collect();
    
    ApiResponse::success(results)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PluginInfo {
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: String,
    pub icon: Option<String>,
}

#[tauri::command]
pub async fn get_installed_plugins() -> ApiResponse<Vec<PluginInfo>> {
    let manager = PluginManager::new();
    let plugins = manager.get_builtin_plugins();
    
    let infos: Vec<PluginInfo> = plugins
        .iter()
        .map(|p| PluginInfo {
            id: p.id.clone(),
            name: p.name.clone(),
            version: p.version.clone(),
            description: p.description.clone(),
            icon: p.commands.first().and_then(|c| c.icon.clone()),
        })
        .collect();
    
    ApiResponse::success(infos)
}
```

- [ ] **Step 4: 添加 dirs 依赖**

修改 `src-tauri/Cargo.toml`:

```toml
[package]
name = "omnibox"
version = "0.1.0"
edition = "2021"

[dependencies]
tauri = { version = "2.0", features = [] }
tauri-plugin-shell = "2.0"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }
chrono = { version = "0.4", features = ["serde"] }
dirs = "5.0"

[features]
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]
```

- [ ] **Step 5: 测试插件系统**

```bash
cd src-tauri
cargo check
```

**预期结果:** 编译成功

- [ ] **Step 6: 提交代码**

```bash
git add .
git commit -m "feat: add plugin manager with builtin plugin support"
```

---

## Phase 7: 测试和优化

### Task 7.1: 编写基础测试

**Files:**
- Create: `src-tauri/src/plugins/timestamp_test.rs`
- Modify: `src-tauri/src/plugins/timestamp.rs`

- [ ] **Step 1: 添加测试模块**

在 `src-tauri/src/plugins/timestamp.rs` 末尾添加：

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_timestamp_seconds() {
        let (ms, ty) = parse_input("1739221200").unwrap();
        assert_eq!(ms, 1739221200000);
        assert_eq!(ty, "Unix时间戳(秒)");
    }

    #[test]
    fn test_parse_timestamp_milliseconds() {
        let (ms, ty) = parse_input("1739221200000").unwrap();
        assert_eq!(ms, 1739221200000);
        assert_eq!(ty, "Unix时间戳(毫秒)");
    }

    #[test]
    fn test_parse_datetime() {
        let (ms, ty) = parse_input("2025-02-11 05:00:00").unwrap();
        assert!(ms > 0);
        assert_eq!(ty, "标准时间");
    }

    #[test]
    fn test_convert_timestamp() {
        let result = convert_timestamp("1739221200", "Asia/Shanghai").unwrap();
        assert_eq!(result.input, "1739221200");
        assert_eq!(result.detected_type, "Unix时间戳(秒)");
        assert!(result.conversions.seconds.contains("2025-02-11"));
    }
}
```

- [ ] **Step 2: 运行测试**

```bash
cd src-tauri
cargo test
```

**预期结果:** 所有测试通过

- [ ] **Step 3: 提交代码**

```bash
git add .
git commit -m "test: add unit tests for timestamp conversion"
```

### Task 7.2: 性能优化

**Files:**
- Create: `src-tauri/src/cache/mod.rs`
- Modify: `src-tauri/src/commands/search.rs`

- [ ] **Step 1: 添加简单缓存**

创建 `src-tauri/src/cache/mod.rs`:

```rust
use std::collections::HashMap;
use std::sync::Mutex;
use lazy_static::lazy_static;

lazy_static! {
    static ref SEARCH_CACHE: Mutex<HashMap<String, Vec<SearchResult>>> = Mutex::new(HashMap::new());
}

pub fn get_cached_search(query: &str) -> Option<Vec<SearchResult>> {
    let cache = SEARCH_CACHE.lock().unwrap();
    cache.get(query).cloned()
}

pub fn cache_search(query: String, results: Vec<SearchResult>) {
    let mut cache = SEARCH_CACHE.lock().unwrap();
    if cache.len() > 100 {
        cache.clear();
    }
    cache.insert(query, results);
}
```

- [ ] **Step 2: 更新搜索命令使用缓存**

修改 `src-tauri/src/commands/search.rs`:

```rust
use crate::cache::{get_cached_search, cache_search};

#[tauri::command]
pub async fn search(request: SearchRequest) -> ApiResponse<Vec<SearchResult>> {
    // 检查缓存
    if let Some(cached) = get_cached_search(&request.query) {
        return ApiResponse::success(cached);
    }
    
    // ... 原有的搜索逻辑 ...
    
    // 缓存结果
    cache_search(request.query.clone(), results.clone());
    
    ApiResponse::success(results)
}
```

- [ ] **Step 3: 提交代码**

```bash
git add .
git commit -m "perf: add simple LRU cache for search results"
```

---

## Phase 8: 最终验收

### Task 8.1: 完整测试

- [ ] **Step 1: 功能验收检查清单**

```bash
# 运行完整测试
cd src-tauri
cargo test

# 启动应用
npm run tauri:dev
```

**验收项目:**
- [ ] 应用正常启动 (< 500ms)
- [ ] 搜索功能正常工作
- [ ] 时间戳插件可以转换时间戳
- [ ] 快捷键 ESC 可以隐藏窗口
- [ ] 插件列表正确显示
- [ ] 界面响应流畅 (60fps)

- [ ] **Step 2: 提交最终代码**

```bash
git add .
git commit -m "feat: complete OmniBox MVP with search and timestamp plugin"
```

- [ ] **Step 3: 打标签**

```bash
git tag -a v0.1.0 -m "OmniBox MVP Release"
```

---

## 附录

### A. 项目结构

```
omnibox/
├── src/                          # 前端代码
│   ├── components/               # React 组件
│   │   ├── SearchInput.tsx
│   │   ├── SearchResults.tsx
│   │   ├── SearchResultItem.tsx
│   │   ├── TimestampRow.tsx
│   │   └── FormatTable.tsx
│   ├── views/                    # 页面视图
│   │   ├── SearchView.tsx
│   │   └── TimestampView.tsx
│   ├── stores/                   # Zustand stores
│   │   ├── searchStore.ts
│   │   ├── pluginStore.ts
│   │   └── index.ts
│   ├── types/                    # TypeScript 类型
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── src-tauri/                    # Tauri 后端
│   ├── src/
│   │   ├── main.rs
│   │   ├── lib.rs
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   ├── search.rs
│   │   │   ├── plugin.rs
│   │   │   └── config.rs
│   │   ├── plugins/
│   │   │   ├── mod.rs
│   │   │   ├── manager.rs
│   │   │   └── timestamp.rs
│   │   ├── cache/
│   │   │   └── mod.rs
│   │   └── window.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── docs/
│   └── superpowers/
│       ├── specs/
│       │   └── 2026-03-25-omnibox-design.md
│       └── plans/
│           └── 2026-03-25-omnibox-mvp-plan.md
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── index.html
```

### B. 依赖列表

**前端依赖:**
- react ^18.2.0
- react-dom ^18.2.0
- zustand ^4.5.0
- tailwindcss ^3.4.0

**后端依赖:**
- tauri 2.0
- chrono 0.4
- tokio 1.0
- serde 1.0

### C. 命令速查

```bash
# 开发
npm run tauri:dev

# 构建
npm run tauri:build

# 测试后端
cd src-tauri && cargo test

# 检查后端代码
cd src-tauri && cargo check

# 提交代码
git add .
git commit -m "message"
```

---

**计划完成**

本计划包含 8 个 Phase，预计开发时间 2-3 周。

关键里程碑:
- Week 1: Phase 1-3 (项目初始化、基础架构、搜索界面)
- Week 2: Phase 4-5 (时间戳插件、快捷键)
- Week 3: Phase 6-8 (插件系统、测试、优化)
