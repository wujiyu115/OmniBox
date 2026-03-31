import React from 'react';
import type { SearchResult } from '../types';

interface SearchResultItemProps {
  result: SearchResult;
  selected: boolean;
  onClick: () => void;
}

export const SearchResultItem: React.FC<SearchResultItemProps> = ({
  result,
  selected,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`flex items-center px-4 py-3 cursor-pointer transition-colors ${
        selected ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500' : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-l-4 border-transparent'
      }`}
    >
      <span className="text-2xl mr-4">{result.icon || '🔧'}</span>
      <div className="flex-1">
        <div className="font-medium text-gray-900 dark:text-gray-100">{result.title}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{result.subtitle}</div>
      </div>
      {selected && (
        <span className="text-blue-500 dark:text-blue-400 text-sm">↵ Enter</span>
      )}
    </div>
  );
};