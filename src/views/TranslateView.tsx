import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface TranslateResult {
  translated_text: string;
  source_lang: string;
  target_lang: string;
  match_quality: number;
}

interface LangPair {
  label: string;
  from: string;
  to: string;
}

const LANG_PAIRS: LangPair[] = [
  { label: '自动 → 中文', from: 'auto', to: 'zh' },
  { label: '中文 → 英文', from: 'zh', to: 'en' },
  { label: '英文 → 中文', from: 'en', to: 'zh' },
  { label: '自动 → 英文', from: 'auto', to: 'en' },
];

export const TranslateView: React.FC = () => {
  const [text, setText] = useState('');
  const [langPairIdx, setLangPairIdx] = useState(0);
  const [result, setResult] = useState<TranslateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedPair = LANG_PAIRS[langPairIdx];

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!text.trim()) {
      setResult(null);
      setError('');
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await invoke<TranslateResult>('translate', {
          text: text.trim(),
          from: selectedPair.from,
          to: selectedPair.to,
        });
        setResult(res);
        setError('');
      } catch (e) {
        setError(String(e));
        setResult(null);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [text, langPairIdx]);

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Language pair selector */}
      <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700 gap-3">
        <span className="text-sm text-gray-500 dark:text-gray-400 w-12">语言对</span>
        <div className="flex gap-1 flex-wrap">
          {LANG_PAIRS.map((pair, idx) => (
            <button
              key={idx}
              onClick={() => setLangPairIdx(idx)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                langPairIdx === idx
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {pair.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input area */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400 w-12 pt-2">原文</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="输入要翻译的文本，500ms 后自动翻译..."
            rows={4}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:border-blue-500 text-sm resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <button
            onClick={() => { setText(''); setResult(null); setError(''); }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
          >
            清空
          </button>
        </div>
      </div>

      {/* Result area */}
      <div className="flex-1 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">译文</span>
          {loading && (
            <span className="text-xs text-blue-500 dark:text-blue-400 animate-pulse">翻译中...</span>
          )}
        </div>

        {result && !loading && (
          <div className="relative">
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-100 leading-relaxed min-h-[80px] whitespace-pre-wrap">
              {result.translated_text}
            </div>
            <button
              onClick={() => copyToClipboard(result.translated_text)}
              className="absolute top-2 right-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
            >
              {copied ? '已复制 ✓' : '复制'}
            </button>
          </div>
        )}

        {error && !loading && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-md border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {!result && !error && !loading && (
          <div className="flex flex-col items-center justify-center h-24 text-gray-400 dark:text-gray-500 gap-2">
            <span className="text-2xl">🌐</span>
            <span className="text-sm">输入文本后自动翻译（使用 MyMemory 免费 API）</span>
          </div>
        )}
      </div>
    </div>
  );
};
