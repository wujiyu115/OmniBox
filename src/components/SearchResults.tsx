import React from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useSearchStore } from '../stores';
import { SearchResultItem } from './SearchResultItem';

interface SearchResultsProps {
  onNavigate: (view: 'search' | 'plugins' | 'settings' | 'sync' | `plugin:${string}`) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ onNavigate }) => {
  const { results, isLoading, selectedIndex, setSelectedIndex } = useSearchStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32 text-base-content/70">
        搜索中...
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-base-content/50">
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
            invoke('record_usage', { pluginId: result.pluginId }).catch(console.error);
            onNavigate(`plugin:${result.pluginId}`);
          }}
        />
      ))}
    </div>
  );
};