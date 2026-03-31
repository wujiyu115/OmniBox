import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface HistoryItem {
  expression: string;
  result: string;
}

export const CalculatorView: React.FC = () => {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (expression.trim()) {
        handleCalculate(expression);
      } else {
        setResult('');
        setError('');
      }
    }, 150);
    return () => clearTimeout(timeout);
  }, [expression]);

  const handleCalculate = async (expr: string) => {
    try {
      const res = await invoke<string>('calculate', { expression: expr });
      setResult(res);
      setError('');
    } catch (e) {
      setError(String(e));
      setResult('');
    }
  };

  const handleConfirm = () => {
    if (result && expression.trim()) {
      const item: HistoryItem = { expression: expression.trim(), result };
      setHistory((prev) => [item, ...prev].slice(0, 10));
      copyToClipboard(result);
      setExpression('');
      setResult('');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const loadHistory = (item: HistoryItem) => {
    setExpression(item.expression);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Input area */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 dark:text-gray-400 text-sm w-8">表达式</span>
          <input
            ref={inputRef}
            type="text"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirm();
            }}
            placeholder="例如：(1 + 2) * 3, sqrt(16), 2 ^ 10"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:border-blue-500 font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <button
            onClick={() => { setExpression(''); setResult(''); setError(''); }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
          >
            清空
          </button>
        </div>
      </div>

      {/* Result area */}
      <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700 min-h-[80px] flex items-center">
        {result && (
          <div className="flex items-center justify-between w-full">
            <span className="text-3xl font-bold text-gray-800 dark:text-gray-100 font-mono">{result}</span>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(result)}
                className="px-3 py-1.5 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
              >
                {copied ? '已复制 ✓' : '复制'}
              </button>
              <button
                onClick={handleConfirm}
                className="px-3 py-1.5 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 transition-colors"
              >
                确认并记录
              </button>
            </div>
          </div>
        )}
        {error && (
          <span className="text-red-500 dark:text-red-400 text-sm">{error}</span>
        )}
        {!result && !error && (
          <span className="text-gray-400 dark:text-gray-500 text-sm">输入表达式后自动计算</span>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-2 text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide border-b border-gray-100 dark:border-gray-700">
            历史记录（最近 10 条）
          </div>
          {history.map((item, idx) => (
            <div
              key={idx}
              onClick={() => loadHistory(item)}
              className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700"
            >
              <span className="font-mono text-sm text-gray-600 dark:text-gray-300">{item.expression}</span>
              <span className="font-mono text-sm font-semibold text-gray-800 dark:text-gray-100 ml-4">= {item.result}</span>
            </div>
          ))}
        </div>
      )}

      {/* Empty history state */}
      {history.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 gap-2">
          <span className="text-2xl">🧮</span>
          <span className="text-sm">支持：四则运算、括号、幂运算 (^)、sqrt、sin、cos 等</span>
        </div>
      )}
    </div>
  );
};
