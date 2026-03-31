import React from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useSearchStore } from '../stores';
import { SearchResultItem } from './SearchResultItem';

export const SearchResults: React.FC = () => {
  const { results, isLoading, selectedIndex, setSelectedIndex, selectResult } = useSearchStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
        搜索中...
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 dark:text-gray-500">
        输入关键词开始搜索
      </div>
    );
  }

  return (
    <div className="max-h-96 overflow-y-auto">
      {results.map((result, index) => (
        <SearchResultItem
          key={result.id}
          result={result}
          selected={index === selectedIndex}
          onClick={() => {
            setSelectedIndex(index);
            // 记录插件使用频率（后端字段名为 plugin_id，前端类型定义为 pluginId）
            invoke('record_usage', { pluginId: result.pluginId ?? (result as any).plugin_id }).catch(console.error);
            selectResult();
          }}
        />
      ))}
    </div>
  );
};