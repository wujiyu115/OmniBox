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
        selected ? 'bg-primary/10 border-l-4 border-primary' : 'hover:bg-base-200 border-l-4 border-transparent'
      }`}
    >
      <span className="text-2xl mr-4">{result.icon || '🔧'}</span>
      <div className="flex-1">
        <div className="font-medium text-base-content">{result.title}</div>
        <div className="text-sm text-base-content/70">{result.subtitle}</div>
      </div>
      {selected && (
        <span className="text-primary text-sm">↵ Enter</span>
      )}
    </div>
  );
};