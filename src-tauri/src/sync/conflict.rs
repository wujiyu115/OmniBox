use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

/// 同步状态枚举
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum SyncStatus {
    /// 仅本地存在
    LocalOnly,
    /// 仅远程存在
    RemoteOnly,
    /// 已同步（一致）
    InSync,
    /// 本地更新
    LocalNewer,
    /// 远程更新
    RemoteNewer,
    /// 冲突（双方都有修改）
    Conflict,
}

/// 冲突解决策略
#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ConflictStrategy {
    /// 保留本地版本
    KeepLocal,
    /// 保留远程版本
    KeepRemote,
    /// 合并（本地内容追加到远程内容后）
    Merge,
}

/// 同步元数据（记录上次同步信息）
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SyncMetadata {
    /// 文件路径 -> 上次同步时的哈希值
    pub file_hashes: HashMap<String, String>,
    /// 上次同步时间（ISO 8601 格式）
    pub last_sync_time: Option<String>,
}

impl Default for SyncMetadata {
    fn default() -> Self {
        Self {
            file_hashes: HashMap::new(),
            last_sync_time: None,
        }
    }
}

/// 单个文件的同步状态信息
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileSyncInfo {
    pub file_name: String,
    pub status: SyncStatus,
    pub local_modified: Option<String>,
    pub remote_modified: Option<String>,
}

impl SyncMetadata {
    /// 获取同步元数据文件路径
    fn metadata_path() -> PathBuf {
        dirs::config_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("omnibox")
            .join("sync_metadata.json")
    }

    /// 从文件加载同步元数据
    pub fn load() -> Self {
        let path = Self::metadata_path();
        if path.exists() {
            match fs::read_to_string(&path) {
                Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
                Err(_) => Self::default(),
            }
        } else {
            Self::default()
        }
    }

    /// 保存同步元数据到文件
    pub fn save(&self) -> Result<(), String> {
        let path = Self::metadata_path();
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("创建目录失败: {}", e))?;
        }
        let content =
            serde_json::to_string_pretty(self).map_err(|e| format!("序列化失败: {}", e))?;
        fs::write(&path, content).map_err(|e| format!("写入失败: {}", e))?;
        Ok(())
    }

    /// 更新文件哈希
    pub fn update_hash(&mut self, file_name: &str, hash: &str) {
        self.file_hashes
            .insert(file_name.to_string(), hash.to_string());
    }

    /// 获取文件的上次同步哈希
    pub fn get_hash(&self, file_name: &str) -> Option<&String> {
        self.file_hashes.get(file_name)
    }
}

/// 计算内容的简单哈希（用于变更检测）
pub fn simple_hash(content: &[u8]) -> String {
    // 使用简单的 FNV-1a 哈希算法
    let mut hash: u64 = 0xcbf29ce484222325;
    for byte in content {
        hash ^= *byte as u64;
        hash = hash.wrapping_mul(0x100000001b3);
    }
    format!("{:016x}", hash)
}

/// 检测文件的同步状态
pub fn detect_conflict(
    local_content: Option<&[u8]>,
    remote_exists: bool,
    last_sync_hash: Option<&str>,
    local_hash: Option<&str>,
) -> SyncStatus {
    match (local_content, remote_exists) {
        (Some(_), false) => {
            // 本地有，远程没有
            if last_sync_hash.is_some() {
                // 之前同步过，说明远程被删除了 -> 冲突
                SyncStatus::Conflict
            } else {
                // 从未同步过 -> 仅本地
                SyncStatus::LocalOnly
            }
        }
        (None, true) => {
            // 本地没有，远程有
            if last_sync_hash.is_some() {
                // 之前同步过，说明本地被删除了 -> 冲突
                SyncStatus::Conflict
            } else {
                // 从未同步过 -> 仅远程
                SyncStatus::RemoteOnly
            }
        }
        (Some(_content), true) => {
            // 双方都有
            match (last_sync_hash, local_hash) {
                (Some(sync_hash), Some(curr_hash)) => {
                    if sync_hash == curr_hash {
                        // 本地未修改，可能远程有更新
                        SyncStatus::RemoteNewer
                    } else {
                        // 本地有修改，需要进一步判断
                        // 简化处理：如果本地有修改就标记为冲突（需要用户决定）
                        SyncStatus::Conflict
                    }
                }
                (None, _) => {
                    // 从未同步过，双方都有 -> 冲突
                    SyncStatus::Conflict
                }
                (Some(_), None) => SyncStatus::RemoteNewer,
            }
        }
        (None, false) => {
            // 双方都没有，已同步（空状态）
            SyncStatus::InSync
        }
    }
}

/// 解决冲突：根据策略合并内容
pub fn resolve_conflict(
    local_content: &[u8],
    remote_content: &[u8],
    strategy: &ConflictStrategy,
) -> Vec<u8> {
    match strategy {
        ConflictStrategy::KeepLocal => local_content.to_vec(),
        ConflictStrategy::KeepRemote => remote_content.to_vec(),
        ConflictStrategy::Merge => {
            // 简单合并：远程内容 + 分隔线 + 本地内容
            let local_str = String::from_utf8_lossy(local_content);
            let remote_str = String::from_utf8_lossy(remote_content);
            let merged = format!(
                "{}\n\n---\n<!-- 以下为本地版本（合并于同步时） -->\n\n{}",
                remote_str, local_str
            );
            merged.into_bytes()
        }
    }
}
