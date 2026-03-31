use omnibox::plugins::timestamp::convert_timestamp;

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
