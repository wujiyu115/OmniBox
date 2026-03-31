import React, { useRef, useEffect } from 'react';
import { useSearchStore } from '../stores';

interface SearchInputProps {
  onIconClick?: () => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({ onIconClick }) => {
  const { query, setQuery, search, clearSearch } = useSearchStore();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setTimeout(() => search(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      search();
    }
  };

  return (
    <div className="relative flex items-center w-full px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <button
        onClick={onIconClick}
        className="text-xl mr-3 hover:scale-110 transition-transform cursor-pointer"
        title="打开插件市场"
      >
        🔍
      </button>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="输入插件名、命令或文件..."
        className="flex-1 text-lg outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
        autoFocus
      />
      {query && (
        <button
          onClick={clearSearch}
          className="ml-2 px-3 py-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          ✕
        </button>
      )}
    </div>
  );
};