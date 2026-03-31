use evalexpr::*;

/// Evaluate a mathematical expression string and return the result as a string.
///
/// Supports:
/// - Basic arithmetic: `1 + 2 * 3`
/// - Parentheses: `(1 + 2) * 3`
/// - Power: `2 ^ 10`
/// - Math functions: `sqrt(16)`, `sin(3.14)`, `cos(0)`, `abs(-5)`, `floor(3.7)`, `ceil(3.2)`
#[tauri::command]
pub fn calculate(expression: String) -> Result<String, String> {
    let expr = expression.trim();
    if expr.is_empty() {
        return Err("表达式不能为空".to_string());
    }

    match eval(expr) {
        Ok(Value::Float(f)) => {
            // Format: remove trailing zeros for clean display
            if f.fract() == 0.0 && f.abs() < 1e15 {
                Ok(format!("{}", f as i64))
            } else {
                Ok(format!("{}", f))
            }
        }
        Ok(Value::Int(i)) => Ok(format!("{}", i)),
        Ok(Value::Boolean(b)) => Ok(format!("{}", b)),
        Ok(other) => Ok(format!("{}", other)),
        Err(e) => Err(format!("计算错误: {}", e)),
    }
}
