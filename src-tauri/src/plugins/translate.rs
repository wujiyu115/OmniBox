use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct TranslateResult {
    pub translated_text: String,
    pub source_lang: String,
    pub target_lang: String,
    pub match_quality: f64,
}

#[derive(Debug, Deserialize)]
struct MyMemoryResponse {
    #[serde(rename = "responseData")]
    response_data: MyMemoryResponseData,
    #[allow(dead_code)]
    #[serde(rename = "responseStatus")]
    response_status: serde_json::Value,
}

#[derive(Debug, Deserialize)]
struct MyMemoryResponseData {
    #[serde(rename = "translatedText")]
    translated_text: String,
    #[serde(rename = "match")]
    match_quality: f64,
}

/// Translate text using the MyMemory free translation API.
///
/// `from`: source language code, e.g. "zh", "en", "auto"
/// `to`:   target language code, e.g. "zh", "en"
///
/// Supported pairs:
/// - "auto|zh"  Auto-detect → Chinese
/// - "zh|en"    Chinese → English
/// - "en|zh"    English → Chinese
/// - "auto|en"  Auto-detect → English
#[tauri::command]
pub async fn translate(
    text: String,
    from: String,
    to: String,
) -> Result<TranslateResult, String> {
    if text.trim().is_empty() {
        return Err("翻译文本不能为空".to_string());
    }

    let langpair = format!("{}|{}", from, to);
    let url = format!(
        "https://api.mymemory.translated.net/get?q={}&langpair={}",
        urlencoding::encode(&text),
        urlencoding::encode(&langpair)
    );

    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .timeout(std::time::Duration::from_secs(10))
        .send()
        .await
        .map_err(|e| format!("网络请求失败: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("API 请求失败，状态码: {}", response.status()));
    }

    let body: MyMemoryResponse = response
        .json()
        .await
        .map_err(|e| format!("解析响应失败: {}", e))?;

    Ok(TranslateResult {
        translated_text: body.response_data.translated_text,
        source_lang: from,
        target_lang: to,
        match_quality: body.response_data.match_quality,
    })
}
