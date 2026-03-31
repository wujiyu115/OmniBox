use chrono::{DateTime, FixedOffset, TimeZone, Utc};
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
    let (timestamp_ms, detected_type) = parse_input(input)?;
    let dt_utc = Utc
        .timestamp_millis_opt(timestamp_ms)
        .single()
        .ok_or("Invalid timestamp")?;

    let dt_local: DateTime<FixedOffset> = if timezone == "Asia/Shanghai" {
        dt_utc.with_timezone(&FixedOffset::east_opt(8 * 3600).expect("Invalid timezone offset"))
    } else if timezone == "UTC" {
        dt_utc.with_timezone(&FixedOffset::east_opt(0).expect("Invalid timezone offset"))
    } else {
        dt_utc.with_timezone(&FixedOffset::east_opt(0).expect("Invalid timezone offset"))
    };

    let seconds = dt_local.format("%Y-%m-%d %H:%M:%S").to_string();
    let milliseconds = dt_local.format("%Y-%m-%d %H:%M:%S%.3f").to_string();
    let nanoseconds = dt_local.format("%Y-%m-%d %H:%M:%S%.9f").to_string();

    let conversions = TimestampConversion {
        seconds: seconds.clone(),
        milliseconds: milliseconds.clone(),
        nanoseconds,
    };

    let timestamp_s = timestamp_ms / 1000;
    let formats = vec![
        FormatEntry {
            format: "标准时间(秒)".to_string(),
            value: seconds.clone(),
        },
        FormatEntry {
            format: "Unix时间戳(秒)".to_string(),
            value: timestamp_s.to_string(),
        },
        FormatEntry {
            format: "标准时间(毫秒)".to_string(),
            value: milliseconds.clone(),
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

    if let Ok(num) = trimmed.parse::<i64>() {
        let len = trimmed.len();
        if len == 10 {
            return Ok((num * 1000, "Unix时间戳(秒)".to_string()));
        } else if len == 13 {
            return Ok((num, "Unix时间戳(毫秒)".to_string()));
        } else if len == 19 {
            return Ok((num / 1000000, "Unix时间戳(纳秒)".to_string()));
        }
    }

    let formats = [
        "%Y-%m-%d %H:%M:%S %:z",
        "%Y-%m-%d %H:%M:%S%.3f %:z",
        "%Y-%m-%d %:z",
        "%Y/%m/%d %H:%M:%S %:z",
    ];

    for format in &formats {
        if let Ok(dt) = DateTime::parse_from_str(trimmed, format) {
            return Ok((dt.timestamp_millis(), "标准时间".to_string()));
        }
    }

    // Try parsing as naive datetime (no timezone), then convert to UTC
    let naive_formats = [
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M:%S%.3f",
        "%Y-%m-%d",
        "%Y/%m/%d %H:%M:%S",
    ];

    for format in &naive_formats {
        if let Ok(naive) = chrono::NaiveDateTime::parse_from_str(trimmed, format) {
            let dt = DateTime::<Utc>::from_naive_utc_and_offset(naive, Utc);
            return Ok((dt.timestamp_millis(), "标准时间".to_string()));
        }
    }

    // Handle date-only naive parsing
    if let Ok(naive_date) = chrono::NaiveDate::parse_from_str(trimmed, "%Y-%m-%d") {
        let naive = naive_date.and_hms_opt(0, 0, 0).expect("Invalid time");
        let dt = DateTime::<Utc>::from_naive_utc_and_offset(naive, Utc);
        return Ok((dt.timestamp_millis(), "标准时间".to_string()));
    }

    Err("无法识别输入格式".to_string())
}

#[tauri::command]
pub fn convert_timestamp_command(
    input: String,
    timezone: String,
) -> Result<TimestampResponse, String> {
    convert_timestamp(&input, &timezone)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_unix_timestamp_seconds() {
        let result = convert_timestamp("1640995200", "UTC").unwrap();
        assert_eq!(result.detected_type, "Unix时间戳(秒)");
        assert!(result.formats[1].value.starts_with("1640995"));
    }

    #[test]
    fn test_unix_timestamp_milliseconds() {
        let result = convert_timestamp("1640995200000", "UTC").unwrap();
        assert_eq!(result.detected_type, "Unix时间戳(毫秒)");
        assert_eq!(result.formats[3].value, "1640995200000");
    }

    #[test]
    fn test_unix_timestamp_nanoseconds() {
        let result = convert_timestamp("1640995200000000000", "UTC").unwrap();
        assert_eq!(result.detected_type, "Unix时间戳(纳秒)");
        assert!(result.formats[3].value.starts_with("1640995200"));
    }

    #[test]
    fn test_standard_datetime_format() {
        let result = convert_timestamp("2024-03-26 10:30:00", "UTC").unwrap();
        assert_eq!(result.detected_type, "标准时间");
        assert!(result.formats[0].value.contains("2024-03-26 10:30:00"));
    }

    #[test]
    fn test_standard_datetime_format_with_slash() {
        let result = convert_timestamp("2024/03/26 10:30:00", "UTC").unwrap();
        assert_eq!(result.detected_type, "标准时间");
        assert!(result.formats[0].value.contains("2024-03-26 10:30:00"));
    }

    #[test]
    fn test_shanghai_timezone() {
        let result = convert_timestamp("1640995200000", "Asia/Shanghai").unwrap();
        assert_eq!(result.timezone, "Asia/Shanghai");
    }

    #[test]
    fn test_invalid_input() {
        let result = convert_timestamp("invalid", "UTC");
        assert!(result.is_err());
    }

    #[test]
    fn test_date_only_format() {
        let result = convert_timestamp("2024-03-26", "UTC").unwrap();
        assert_eq!(result.detected_type, "标准时间");
    }
}
