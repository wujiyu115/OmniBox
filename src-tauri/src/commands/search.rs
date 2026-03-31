use serde::{Deserialize, Serialize};
use crate::commands::ApiResponse;
use crate::commands::config::load_config_from_file;
use crate::plugins::manager::PluginManager;
use crate::usage::UsageTracker;

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

fn fuzzy_score(text: &str, query: &str) -> f64 {
    let text_lower = text.to_lowercase();
    let query_lower = query.to_lowercase();
    if text_lower == query_lower {
        return 1.0;
    }
    if text_lower.starts_with(&query_lower) {
        return 0.9;
    }
    if text_lower.contains(&query_lower) {
        return 0.7;
    }
    // Character-level matching
    let mut score = 0.0;
    let mut last_idx = 0;
    for ch in query_lower.chars() {
        if let Some(pos) = text_lower[last_idx..].find(ch) {
            score += 1.0 / (pos as f64 + 1.0);
            last_idx += pos + ch.len_utf8();
        }
    }
    score / query_lower.len() as f64
}

/// 解析查询字符串，支持多关键词（空格分隔，AND 逻辑）和引号精确匹配
/// 例如: `时间 转换` -> ["时间", "转换"]
/// 例如: `"时间戳 转换"` -> ["时间戳 转换"]（精确匹配）
fn parse_query_keywords(query: &str) -> Vec<String> {
    let mut keywords = Vec::new();
    let mut chars = query.chars().peekable();
    let mut current = String::new();
    let mut in_quotes = false;

    while let Some(ch) = chars.next() {
        match ch {
            '"' | '\u{201C}' | '\u{201D}' => {
                if in_quotes {
                    // 结束引号，保存当前内容
                    if !current.trim().is_empty() {
                        keywords.push(current.trim().to_string());
                    }
                    current.clear();
                    in_quotes = false;
                } else {
                    // 开始引号
                    if !current.trim().is_empty() {
                        keywords.push(current.trim().to_string());
                    }
                    current.clear();
                    in_quotes = true;
                }
            }
            ' ' if !in_quotes => {
                if !current.trim().is_empty() {
                    keywords.push(current.trim().to_string());
                }
                current.clear();
            }
            _ => {
                current.push(ch);
            }
        }
    }

    if !current.trim().is_empty() {
        keywords.push(current.trim().to_string());
    }

    keywords
}

/// 多关键词组合搜索评分
/// 每个关键词独立计算 fuzzy_score，取所有关键词得分的最小值作为最终匹配度
fn multi_keyword_score(text: &str, keywords: &[String]) -> f64 {
    if keywords.is_empty() {
        return 0.0;
    }
    keywords
        .iter()
        .map(|kw| fuzzy_score(text, kw))
        .fold(f64::MAX, f64::min)
}

#[tauri::command]
pub async fn search(request: SearchRequest) -> ApiResponse<Vec<SearchResult>> {
    let manager = PluginManager::new();
    let plugins = manager.get_builtin_plugins();
    let query = request.query.trim().to_lowercase();
    let limit = request.limit.unwrap_or(20);

    // 加载使用频率追踪器
    let tracker = UsageTracker::new();

    // 加载插件启用/禁用状态配置
    let config = load_config_from_file();

    // 解析多关键词
    let keywords = parse_query_keywords(&query);

    let mut results: Vec<SearchResult> = Vec::new();

    for plugin in &plugins {
        // 跳过已禁用的插件（默认为启用）
        let is_enabled = config.plugin_states.get(&plugin.id).copied().unwrap_or(true);
        if !is_enabled {
            continue;
        }
        for (cmd_idx, cmd) in plugin.commands.iter().enumerate() {
            let match_score = if keywords.is_empty() {
                1.0
            } else {
                // 对每个搜索目标文本，计算多关键词组合得分，取最高的
                let name_score = multi_keyword_score(&plugin.name, &keywords);
                let keyword_score = multi_keyword_score(&cmd.keyword, &keywords);
                let label_score = multi_keyword_score(&cmd.label, &keywords);
                let desc_score = multi_keyword_score(&plugin.description, &keywords) * 0.5;

                name_score.max(keyword_score).max(label_score).max(desc_score)
            };

            if keywords.is_empty() || match_score > 0.1 {
                // 综合得分 = 匹配度 + 频率分×0.3 + 时效分×0.2
                let base_score = if keywords.is_empty() { 1.0 } else { match_score };
                let combined = tracker.combined_score(&plugin.id, base_score);

                results.push(SearchResult {
                    id: format!("{}-{}", plugin.id, cmd_idx),
                    title: cmd.label.clone(),
                    subtitle: cmd.explain.clone(),
                    icon: cmd.icon.clone(),
                    plugin_id: plugin.id.clone(),
                    score: combined,
                });
            }
        }
    }

    // Sort by combined score descending
    results.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));
    results.truncate(limit);

    ApiResponse::success(results)
}

/// 记录插件使用（用户选中某个搜索结果时调用）
#[tauri::command]
pub async fn record_usage(plugin_id: String) -> ApiResponse<()> {
    let mut tracker = UsageTracker::new();
    tracker.record(&plugin_id);
    ApiResponse::success(())
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

    let plugin_infos: Vec<PluginInfo> = plugins
        .into_iter()
        .map(|p| PluginInfo {
            id: p.id,
            name: p.name,
            version: p.version,
            description: p.description,
            icon: p.commands.first().and_then(|c| c.icon.clone()),
        })
        .collect();

    ApiResponse::success(plugin_infos)
}