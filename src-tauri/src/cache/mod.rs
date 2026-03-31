use std::collections::HashMap;
use std::sync::Mutex;

use crate::commands::search::SearchResult;

/// Simple in-memory cache for search results.
/// Clears itself when it exceeds MAX_ENTRIES entries.
const MAX_ENTRIES: usize = 100;

pub struct SearchCache {
    inner: Mutex<HashMap<String, Vec<SearchResult>>>,
}

impl SearchCache {
    pub fn new() -> Self {
        Self {
            inner: Mutex::new(HashMap::new()),
        }
    }

    pub fn get(&self, key: &str) -> Option<Vec<SearchResult>> {
        let cache = self.inner.lock().unwrap();
        cache.get(key).cloned()
    }

    pub fn set(&self, key: String, value: Vec<SearchResult>) {
        let mut cache = self.inner.lock().unwrap();
        if cache.len() >= MAX_ENTRIES {
            cache.clear();
        }
        cache.insert(key, value);
    }

    pub fn clear(&self) {
        let mut cache = self.inner.lock().unwrap();
        cache.clear();
    }
}

impl Default for SearchCache {
    fn default() -> Self {
        Self::new()
    }
}
