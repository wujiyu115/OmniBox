import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { TimestampRow } from '../components/TimestampRow';
import { FormatTable } from '../components/FormatTable';
import type { TimestampResponse, Timezone } from '../types';

const timezones: Timezone[] = [
  { value: 'UTC', label: 'UTC' },
  { value: 'Asia/Shanghai', label: 'UTC+08:00 Asia/Shanghai - 上海' },
  { value: 'Asia/Tokyo', label: 'UTC+09:00 Asia/Tokyo - 东京' },
  { value: 'America/New_York', label: 'UTC-05:00 America/New_York - 纽约' },
  { value: 'Europe/London', label: 'UTC+00:00 Europe/London - 伦敦' },
];

export const TimestampView: React.FC = () => {
  const [input, setInput] = useState('');
  const [timezone, setTimezone] = useState('Asia/Shanghai');
  const [result, setResult] = useState<TimestampResponse | null>(null);
  const [error, setError] = useState('');

  const convert = async () => {
    if (!input.trim()) return;
    
    try {
      const response = await invoke<TimestampResponse>('convert_timestamp_command', {
        input,
        timezone,
      });
      setResult(response);
      setError('');
    } catch (e) {
      setError(String(e));
      setResult(null);
    }
  };

  // Auto-convert on input change
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (input.trim()) {
        convert();
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [input, timezone]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const loadToInput = (value: string) => {
    setInput(value);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Timezone selector */}
      <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <span className="w-12 text-gray-600 dark:text-gray-300">时区</span>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          {timezones.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>

      {/* Input area */}
      <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <span className="w-12 text-gray-600 dark:text-gray-300">输入</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="1739221200"
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:border-blue-500 font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
        <select className="ml-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:border-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
          <option>自动识别</option>
          <option>Unix时间戳(秒)</option>
          <option>Unix时间戳(毫秒)</option>
          <option>日期时间</option>
        </select>
        <button
          onClick={() => setInput('')}
          className="ml-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          清空
        </button>
      </div>

      {/* Conversion results */}
      {result && (
        <>
          <TimestampRow
            label="秒"
            value={result.conversions.seconds}
            onCopy={() => copyToClipboard(result.conversions.seconds)}
          />
          <TimestampRow
            label="毫秒"
            value={result.conversions.milliseconds}
            onCopy={() => copyToClipboard(result.conversions.milliseconds)}
          />
          <TimestampRow
            label="纳秒"
            value={result.conversions.nanoseconds}
            onCopy={() => copyToClipboard(result.conversions.nanoseconds)}
          />

          {/* Format table */}
          <FormatTable formats={result.formats} onLoad={loadToInput} />
        </>
      )}

      {/* Error display */}
      {error && (
        <div className="px-4 py-3 text-red-500 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!result && !error && (
        <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
          输入时间戳或日期开始转换
        </div>
      )}
    </div>
  );
};
