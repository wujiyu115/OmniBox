use dirs;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NoteInfo {
    pub id: String,
    pub title: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Note {
    pub id: String,
    pub title: String,
    pub content: String,
    pub created_at: String,
    pub updated_at: String,
}

fn notes_dir() -> PathBuf {
    dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("omnibox")
        .join("notes")
}

fn index_path() -> PathBuf {
    notes_dir().join("notes_index.json")
}

fn ensure_notes_dir() -> Result<(), String> {
    let dir = notes_dir();
    fs::create_dir_all(&dir).map_err(|e| format!("无法创建笔记目录: {}", e))
}

fn load_index() -> Vec<NoteInfo> {
    let path = index_path();
    if !path.exists() {
        return vec![];
    }
    let content = fs::read_to_string(&path).unwrap_or_default();
    serde_json::from_str(&content).unwrap_or_default()
}

fn save_index(index: &Vec<NoteInfo>) -> Result<(), String> {
    let path = index_path();
    let content = serde_json::to_string_pretty(index)
        .map_err(|e| format!("序列化索引失败: {}", e))?;
    fs::write(&path, content).map_err(|e| format!("写入索引失败: {}", e))
}

fn now_str() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    // Format as ISO-like string using seconds since epoch
    format!("{}", secs)
}

fn generate_id() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .subsec_nanos();
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    format!("{}{:09}", secs, nanos)
}

/// List all notes (metadata only)
#[tauri::command]
pub fn list_notes() -> Result<Vec<NoteInfo>, String> {
    ensure_notes_dir()?;
    Ok(load_index())
}

/// Get a single note with full content
#[tauri::command]
pub fn get_note(id: String) -> Result<Note, String> {
    ensure_notes_dir()?;
    let index = load_index();
    let info = index
        .iter()
        .find(|n| n.id == id)
        .ok_or_else(|| format!("笔记不存在: {}", id))?
        .clone();

    let file_path = notes_dir().join(format!("{}.md", id));
    let content = if file_path.exists() {
        fs::read_to_string(&file_path).map_err(|e| format!("读取笔记失败: {}", e))?
    } else {
        String::new()
    };

    Ok(Note {
        id: info.id,
        title: info.title,
        content,
        created_at: info.created_at,
        updated_at: info.updated_at,
    })
}

/// Create or update a note
#[tauri::command]
pub fn save_note(
    id: Option<String>,
    title: String,
    content: String,
) -> Result<NoteInfo, String> {
    ensure_notes_dir()?;
    let mut index = load_index();
    let now = now_str();

    let note_id = id.unwrap_or_else(generate_id);

    // Write content file
    let file_path = notes_dir().join(format!("{}.md", note_id));
    fs::write(&file_path, &content).map_err(|e| format!("写入笔记失败: {}", e))?;

    // Update index
    if let Some(existing) = index.iter_mut().find(|n| n.id == note_id) {
        existing.title = title.clone();
        existing.updated_at = now.clone();
        let info = existing.clone();
        save_index(&index)?;
        Ok(info)
    } else {
        let info = NoteInfo {
            id: note_id,
            title,
            created_at: now.clone(),
            updated_at: now,
        };
        index.push(info.clone());
        save_index(&index)?;
        Ok(info)
    }
}

/// Delete a note
#[tauri::command]
pub fn delete_note(id: String) -> Result<(), String> {
    ensure_notes_dir()?;
    let mut index = load_index();
    let original_len = index.len();
    index.retain(|n| n.id != id);

    if index.len() == original_len {
        return Err(format!("笔记不存在: {}", id));
    }

    // Remove content file
    let file_path = notes_dir().join(format!("{}.md", id));
    if file_path.exists() {
        fs::remove_file(&file_path).map_err(|e| format!("删除笔记文件失败: {}", e))?;
    }

    save_index(&index)
}
