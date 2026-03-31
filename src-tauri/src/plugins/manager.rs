use dirs;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PluginDependency {
    pub plugin_id: String,
    pub version_req: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum PluginStatus {
    Enabled,
    Disabled,
    DependencyMissing(Vec<String>),
}

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
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Command {
    pub label: String,
    pub keyword: String,
    pub explain: String,
    pub icon: Option<String>,
}

/// 语义化版本比较结果
#[derive(Debug, PartialEq)]
pub enum VersionCompare {
    Greater,
    Equal,
    Less,
}

/// 解析语义化版本号 (major.minor.patch)
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

/// 比较两个语义化版本号
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

/// 检查版本是否满足要求（简单的 >= 语义）
fn version_satisfies(current: &str, required: &str) -> bool {
    let req = required.trim_start_matches(">=").trim_start_matches('^').trim();
    match compare_versions(current, req) {
        Some(VersionCompare::Greater) | Some(VersionCompare::Equal) => true,
        _ => false,
    }
}

pub struct PluginManager {
    #[allow(dead_code)]
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

    pub fn get_builtin_plugins(&self) -> Vec<Plugin> {
        vec![
            Plugin {
                id: "omnibox-timestamp".to_string(),
                name: "时间戳转换".to_string(),
                version: "1.0.0".to_string(),
                description: "时间戳与日期时间互转".to_string(),
                main: "timestamp.js".to_string(),
                commands: vec![Command {
                    label: "时间戳".to_string(),
                    keyword: "ts".to_string(),
                    explain: "时间戳转换工具".to_string(),
                    icon: Some("⏱️".to_string()),
                }],
                permissions: vec![],
                dependencies: vec![],
            },
            Plugin {
                id: "omnibox-calculator".to_string(),
                name: "计算器".to_string(),
                version: "1.0.0".to_string(),
                description: "快速计算表达式".to_string(),
                main: "calculator.js".to_string(),
                commands: vec![Command {
                    label: "计算器".to_string(),
                    keyword: "calc".to_string(),
                    explain: "输入表达式计算".to_string(),
                    icon: Some("🧮".to_string()),
                }],
                permissions: vec![],
                dependencies: vec![],
            },
            Plugin {
                id: "omnibox-notes".to_string(),
                name: "Markdown 笔记".to_string(),
                version: "1.0.0".to_string(),
                description: "创建和管理 Markdown 笔记".to_string(),
                main: "notes.js".to_string(),
                commands: vec![Command {
                    label: "笔记".to_string(),
                    keyword: "note".to_string(),
                    explain: "Markdown 笔记管理".to_string(),
                    icon: Some("📝".to_string()),
                }],
                permissions: vec!["fs:read".to_string(), "fs:write".to_string()],
                dependencies: vec![],
            },
            Plugin {
                id: "omnibox-translate".to_string(),
                name: "翻译".to_string(),
                version: "1.0.0".to_string(),
                description: "中英文互译（MyMemory API）".to_string(),
                main: "translate.js".to_string(),
                commands: vec![Command {
                    label: "翻译".to_string(),
                    keyword: "tr".to_string(),
                    explain: "中英文互译".to_string(),
                    icon: Some("🌐".to_string()),
                }],
                permissions: vec!["http".to_string()],
                dependencies: vec![],
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

#[tauri::command]
pub fn get_plugin_info(plugin_id: String) -> Option<Plugin> {
    let manager = PluginManager::new();
    manager.load_plugin(&plugin_id)
}
