use dirs;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

// ============================================================
// plugin.json 对应的 Manifest 结构体（参考 Rubick 插件规范）
// ============================================================

/// plugin.json 中的命令定义
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Cmd {
    pub label: String,
    #[serde(rename = "type")]
    pub cmd_type: String, // "text" | "img" | "files" | "regex" | "over"
    pub keyword: String,
}

/// plugin.json 中的功能定义
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Feature {
    pub code: String,
    pub explain: String,
    pub cmds: Vec<Cmd>,
}

/// plugin.json 中的依赖定义
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PluginDependency {
    #[serde(rename = "pluginId")]
    pub plugin_id: String,
    #[serde(rename = "versionReq")]
    pub version_req: String,
}

/// plugin.json 中的生命周期钩子定义
#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct Lifecycle {
    #[serde(rename = "onLoad", default)]
    pub on_load: Option<String>,
    #[serde(rename = "onActivate", default)]
    pub on_activate: Option<String>,
    #[serde(rename = "onDeactivate", default)]
    pub on_deactivate: Option<String>,
    #[serde(rename = "onUnload", default)]
    pub on_unload: Option<String>,
}

/// plugin.json 完整结构（参考 Rubick 的 plugin.json 规范）
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PluginManifest {
    #[serde(rename = "pluginName")]
    pub plugin_name: String,
    #[serde(rename = "pluginType")]
    pub plugin_type: String, // "ui" | "system"
    pub description: String,
    #[serde(default)]
    pub main: String,
    pub version: String,
    #[serde(default)]
    pub logo: Option<String>,
    #[serde(default)]
    pub features: Vec<Feature>,
    #[serde(default)]
    pub lifecycle: Option<Lifecycle>,
    #[serde(default)]
    pub permissions: Vec<String>,
    #[serde(default)]
    pub dependencies: Vec<PluginDependency>,
}

// ============================================================
// 内部统一的 Plugin 结构体（从 PluginManifest 转换而来）
// ============================================================

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum PluginStatus {
    Enabled,
    Disabled,
    DependencyMissing(Vec<String>),
}

/// 内部统一的插件数据结构（兼容旧接口）
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Plugin {
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: String,
    pub main: String,
    pub commands: Vec<Command>,
    pub permissions: Vec<String>,
    #[serde(default)]
    pub dependencies: Vec<PluginDependency>,
    /// 插件类型: "ui" | "system"
    #[serde(default)]
    pub plugin_type: String,
    /// 插件图标
    #[serde(default)]
    pub logo: Option<String>,
    /// 功能列表（来自 plugin.json 的 features）
    #[serde(default)]
    pub features: Vec<Feature>,
    /// 生命周期钩子
    #[serde(default)]
    pub lifecycle: Option<Lifecycle>,
}

/// 兼容旧接口的命令结构
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Command {
    pub label: String,
    pub keyword: String,
    pub explain: String,
    pub icon: Option<String>,
}

// ============================================================
// PluginManifest -> Plugin 转换
// ============================================================

impl From<PluginManifest> for Plugin {
    fn from(manifest: PluginManifest) -> Self {
        // 从 features 中提取 commands（兼容旧的搜索逻辑）
        let logo = manifest.logo.clone();
        let commands: Vec<Command> = manifest
            .features
            .iter()
            .flat_map(|feature| {
                let logo = logo.clone();
                feature.cmds.iter().map(move |cmd| Command {
                    label: cmd.label.clone(),
                    keyword: cmd.keyword.clone(),
                    explain: feature.explain.clone(),
                    icon: logo.clone(),
                })
            })
            .collect();

        Plugin {
            id: manifest.plugin_name.clone(),
            name: manifest
                .features
                .first()
                .and_then(|f| f.cmds.first())
                .map(|c| c.label.clone())
                .unwrap_or_else(|| manifest.plugin_name.clone()),
            version: manifest.version,
            description: manifest.description,
            main: manifest.main,
            commands,
            permissions: manifest.permissions,
            dependencies: manifest.dependencies,
            plugin_type: manifest.plugin_type,
            logo: manifest.logo,
            features: manifest.features,
            lifecycle: manifest.lifecycle,
        }
    }
}

// ============================================================
// 版本比较工具
// ============================================================

#[derive(Debug, PartialEq)]
pub enum VersionCompare {
    Greater,
    Equal,
    Less,
}

fn parse_version(version: &str) -> Option<(u32, u32, u32)> {
    let parts: Vec<&str> = version.split('.').collect();
    if parts.len() != 3 {
        return None;
    }
    let major = parts[0].parse::<u32>().ok()?;
    let minor = parts[1].parse::<u32>().ok()?;
    let patch = parts[2].parse::<u32>().ok()?;
    Some((major, minor, patch))
}

pub fn compare_versions(v1: &str, v2: &str) -> Option<VersionCompare> {
    let (m1, n1, p1) = parse_version(v1)?;
    let (m2, n2, p2) = parse_version(v2)?;

    if m1 > m2 || (m1 == m2 && n1 > n2) || (m1 == m2 && n1 == n2 && p1 > p2) {
        Some(VersionCompare::Greater)
    } else if m1 == m2 && n1 == n2 && p1 == p2 {
        Some(VersionCompare::Equal)
    } else {
        Some(VersionCompare::Less)
    }
}

fn version_satisfies(current: &str, required: &str) -> bool {
    let req = required
        .trim_start_matches(">=")
        .trim_start_matches('^')
        .trim();
    match compare_versions(current, req) {
        Some(VersionCompare::Greater) | Some(VersionCompare::Equal) => true,
        _ => false,
    }
}

// ============================================================
// PluginManager
// ============================================================

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

    /// 获取插件目录路径
    pub fn plugins_dir(&self) -> &PathBuf {
        &self.plugins_dir
    }

    /// 确保插件目录存在
    pub fn ensure_plugins_dir(&self) {
        if !self.plugins_dir.exists() {
            if let Err(e) = std::fs::create_dir_all(&self.plugins_dir) {
                eprintln!("创建插件目录失败 {}: {}", self.plugins_dir.display(), e);
            }
        }
    }

    /// 安装内置插件：将资源目录中的内置插件复制到用户插件目录
    /// 仅在目标目录不存在或版本更新时覆盖
    pub fn install_builtin_plugins(&self, resource_dir: &std::path::Path) {
        let builtin_dir = resource_dir.join("builtin-plugins");
        if !builtin_dir.exists() {
            eprintln!("内置插件资源目录不存在: {}", builtin_dir.display());
            return;
        }

        let entries = match std::fs::read_dir(&builtin_dir) {
            Ok(e) => e,
            Err(e) => {
                eprintln!("读取内置插件目录失败: {}", e);
                return;
            }
        };

        for entry in entries.flatten() {
            let src_path = entry.path();
            if !src_path.is_dir() {
                continue;
            }

            let plugin_name = match src_path.file_name() {
                Some(name) => name.to_string_lossy().to_string(),
                None => continue,
            };

            let dest_path = self.plugins_dir.join(&plugin_name);

            // 检查是否需要更新：比较版本号
            let should_install = if dest_path.exists() {
                let src_manifest = Self::load_plugin_manifest(&src_path);
                let dest_manifest = Self::load_plugin_manifest(&dest_path);
                match (src_manifest, dest_manifest) {
                    (Some(src), Some(dest)) => src.version != dest.version,
                    (Some(_), None) => true,
                    _ => false,
                }
            } else {
                true
            };

            if should_install {
                if let Err(e) = Self::copy_dir_recursive(&src_path, &dest_path) {
                    eprintln!("安装内置插件 {} 失败: {}", plugin_name, e);
                } else {
                    println!("已安装内置插件: {}", plugin_name);
                }
            }
        }
    }

    /// 递归复制目录
    fn copy_dir_recursive(src: &std::path::Path, dest: &std::path::Path) -> std::io::Result<()> {
        if dest.exists() {
            std::fs::remove_dir_all(dest)?;
        }
        std::fs::create_dir_all(dest)?;

        for entry in std::fs::read_dir(src)? {
            let entry = entry?;
            let src_child = entry.path();
            let dest_child = dest.join(entry.file_name());

            if src_child.is_dir() {
                Self::copy_dir_recursive(&src_child, &dest_child)?;
            } else {
                std::fs::copy(&src_child, &dest_child)?;
            }
        }
        Ok(())
    }

    /// 读取并解析单个 plugin.json
    pub fn load_plugin_manifest(plugin_dir: &PathBuf) -> Option<PluginManifest> {
        let plugin_json_path = plugin_dir.join("plugin.json");
        if !plugin_json_path.exists() {
            return None;
        }

        let content = match std::fs::read_to_string(&plugin_json_path) {
            Ok(c) => c,
            Err(e) => {
                eprintln!(
                    "读取 plugin.json 失败 {}: {}",
                    plugin_json_path.display(),
                    e
                );
                return None;
            }
        };

        match serde_json::from_str::<PluginManifest>(&content) {
            Ok(manifest) => Some(manifest),
            Err(e) => {
                eprintln!(
                    "解析 plugin.json 失败 {}: {}",
                    plugin_json_path.display(),
                    e
                );
                None
            }
        }
    }

    /// 扫描插件目录，返回所有已安装插件的 PluginManifest
    pub fn scan_plugins_dir(&self) -> Vec<PluginManifest> {
        let mut manifests = Vec::new();

        if !self.plugins_dir.exists() {
            return manifests;
        }

        let entries = match std::fs::read_dir(&self.plugins_dir) {
            Ok(entries) => entries,
            Err(e) => {
                eprintln!("扫描插件目录失败 {}: {}", self.plugins_dir.display(), e);
                return manifests;
            }
        };

        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                if let Some(manifest) = Self::load_plugin_manifest(&path) {
                    manifests.push(manifest);
                }
            }
        }

        manifests
    }

    /// 获取所有已安装插件（动态扫描插件目录）
    pub fn get_builtin_plugins(&self) -> Vec<Plugin> {
        self.scan_plugins_dir()
            .into_iter()
            .map(Plugin::from)
            .collect()
    }

    /// 根据 ID 加载单个插件
    pub fn load_plugin(&self, plugin_id: &str) -> Option<Plugin> {
        let plugin_dir = self.plugins_dir.join(plugin_id);
        Self::load_plugin_manifest(&plugin_dir).map(Plugin::from)
    }

    /// 检查插件的依赖是否满足
    pub fn check_dependencies(&self, plugin: &Plugin) -> Vec<String> {
        let all_plugins = self.get_builtin_plugins();
        let mut missing = Vec::new();

        for dep in &plugin.dependencies {
            match all_plugins.iter().find(|p| p.id == dep.plugin_id) {
                Some(found) => {
                    if !version_satisfies(&found.version, &dep.version_req) {
                        missing.push(format!(
                            "{} (需要 {}, 当前 {})",
                            dep.plugin_id, dep.version_req, found.version
                        ));
                    }
                }
                None => {
                    missing.push(format!("{} (未安装)", dep.plugin_id));
                }
            }
        }

        missing
    }

    /// 检查是否有其他插件依赖指定插件
    pub fn get_dependents(&self, plugin_id: &str) -> Vec<String> {
        let all_plugins = self.get_builtin_plugins();
        all_plugins
            .iter()
            .filter(|p| p.dependencies.iter().any(|d| d.plugin_id == plugin_id))
            .map(|p| p.id.clone())
            .collect()
    }

    /// 获取插件状态（结合配置中的启用/禁用状态和依赖检查）
    pub fn get_plugin_status(
        &self,
        plugin: &Plugin,
        plugin_states: &HashMap<String, bool>,
    ) -> PluginStatus {
        let missing_deps = self.check_dependencies(plugin);
        if !missing_deps.is_empty() {
            return PluginStatus::DependencyMissing(missing_deps);
        }

        let enabled = plugin_states.get(&plugin.id).copied().unwrap_or(true);
        if enabled {
            PluginStatus::Enabled
        } else {
            PluginStatus::Disabled
        }
    }
}

// ============================================================
// Tauri 命令
// ============================================================

#[tauri::command]
pub fn get_builtin_plugins() -> Vec<Plugin> {
    let manager = PluginManager::new();
    manager.get_builtin_plugins()
}

#[tauri::command]
pub fn get_plugin_info(plugin_id: String) -> Option<Plugin> {
    let manager = PluginManager::new();
    manager.load_plugin(&plugin_id)
}

/// 获取插件目录的绝对路径
#[tauri::command]
pub fn get_plugins_dir() -> String {
    let manager = PluginManager::new();
    manager.plugins_dir().to_string_lossy().to_string()
}

/// 读取插件的入口文件内容（用于 iframe srcdoc 加载）
#[tauri::command]
pub fn get_plugin_html(plugin_id: String) -> Result<String, String> {
    let manager = PluginManager::new();
    let plugin_dir = manager.plugins_dir().join(&plugin_id);
    let plugin = manager.load_plugin(&plugin_id).ok_or("插件不存在")?;

    let main_file = if plugin.main.is_empty() {
        "index.html".to_string()
    } else {
        plugin.main
    };

    let html_path = plugin_dir.join(&main_file);
    std::fs::read_to_string(&html_path)
        .map_err(|e| format!("读取插件入口文件失败 {}: {}", html_path.display(), e))
}

/// 批量读取所有已启用插件的 HTML 内容（用于启动时预加载）
#[tauri::command]
pub fn get_all_plugin_html() -> HashMap<String, String> {
    let manager = PluginManager::new();
    let config = crate::commands::config::load_config_from_file();
    let plugins = manager.get_builtin_plugins();
    let mut result = HashMap::new();

    for plugin in plugins {
        let is_enabled = config.plugin_states.get(&plugin.id).copied().unwrap_or(true);
        if !is_enabled {
            continue;
        }

        let plugin_dir = manager.plugins_dir().join(&plugin.id);
        let main_file = if plugin.main.is_empty() {
            "index.html".to_string()
        } else {
            plugin.main
        };

        let html_path = plugin_dir.join(&main_file);
        if let Ok(html) = std::fs::read_to_string(&html_path) {
            result.insert(plugin.id, html);
        }
    }

    result
}
