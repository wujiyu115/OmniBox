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
    <div className="relative flex items-center w-full px-4 py-3 bg-base-100 border-b border-base-300">
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
        className="flex-1 text-lg outline-none bg-transparent text-base-content placeholder:text-base-content/40"
        autoFocus
      />
      {query && (
        <button
          onClick={clearSearch}
          className="ml-2 px-3 py-1 text-base-content/70 hover:text-base-content hover:bg-base-200 rounded"
        >
          ✕
        </button>
      )}
    </div>
  );
};