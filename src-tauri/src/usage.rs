use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UsageData {
    pub plugin_id: String,
    pub count: u32,
    pub last_used: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
struct UsageStore {
    records: HashMap<String, UsageData>,
}

pub struct UsageTracker {
    store: UsageStore,
    file_path: PathBuf,
}

impl UsageTracker {
    /// 创建 UsageTracker，自动从持久化文件加载数据
    pub fn new() -> Self {
        let file_path = get_usage_file_path();
        let store = load_store(&file_path);
        Self { store, file_path }
    }

    /// 记录一次插件使用
    pub fn record(&mut self, plugin_id: &str) {
        let entry = self.store.records.entry(plugin_id.to_string()).or_insert_with(|| UsageData {
            plugin_id: plugin_id.to_string(),
            count: 0,
            last_used: Utc::now(),
        });
        entry.count += 1;
        entry.last_used = Utc::now();
        let _ = self.save();
    }

    /// 获取某插件的使用数据
    pub fn get(&self, plugin_id: &str) -> Option<&UsageData> {
        self.store.records.get(plugin_id)
    }

    /// 计算频率分（归一化到 0~1）
    /// 使用对数缩放：score = log(count + 1) / log(max_count + 1)
    pub fn frequency_score(&self, plugin_id: &str) -> f64 {
        let count = self.store.records.get(plugin_id).map(|d| d.count).unwrap_or(0);
        let max_count = self.store.records.values().map(|d| d.count).max().unwrap_or(1);
        if max_count == 0 {
            return 0.0;
        }
        ((count + 1) as f64).ln() / ((max_count + 1) as f64).ln()
    }

    /// 计算时效分（最近使用的得分更高，衰减周期 7 天）
    /// score = exp(-days_since_last_use / 7)
    pub fn recency_score(&self, plugin_id: &str) -> f64 {
        let last_used = self.store.records.get(plugin_id).map(|d| d.last_used);
        match last_used {
            None => 0.0,
            Some(t) => {
                let days = (Utc::now() - t).num_seconds() as f64 / 86400.0;
                (-days / 7.0).exp()
            }
        }
    }

    /// 综合得分 = 匹配度 + 频率分 × 0.3 + 时效分 × 0.2
    pub fn combined_score(&self, plugin_id: &str, match_score: f64) -> f64 {
        let freq = self.frequency_score(plugin_id);
        let rec = self.recency_score(plugin_id);
        match_score + freq * 0.3 + rec * 0.2
    }

    fn save(&self) -> Result<(), Box<dyn std::error::Error>> {
        if let Some(parent) = self.file_path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        let json = serde_json::to_string_pretty(&self.store)?;
        std::fs::write(&self.file_path, json)?;
        Ok(())
    }
}

fn get_usage_file_path() -> PathBuf {
    let config_dir = dirs::config_dir().unwrap_or_else(|| PathBuf::from("."));
    config_dir.join("omnibox").join("usage.json")
}

fn load_store(path: &PathBuf) -> UsageStore {
    if path.exists() {
        if let Ok(content) = std::fs::read_to_string(path) {
            if let Ok(store) = serde_json::from_str::<UsageStore>(&content) {
                return store;
            }
        }
    }
    UsageStore::default()
}
