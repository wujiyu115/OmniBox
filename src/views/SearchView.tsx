import React, { useEffect } from 'react';
import { SearchInput } from '../components/SearchInput';
import { SearchResults } from '../components/SearchResults';
import { useSearchStore, usePluginStore } from '../stores';

export const SearchView: React.FC = () => {
  const { navigateUp, navigateDown, selectResult } = useSearchStore();
  const { loadInstalledPlugins } = usePluginStore();

  useEffect(() => {
    loadInstalledPlugins();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          navigateUp();
          break;
        case 'ArrowDown':
          e.preventDefault();
          navigateDown();
          break;
        case 'Enter':
          e.preventDefault();
          selectResult();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateUp, navigateDown, selectResult]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <SearchInput />
      <SearchResults />
    </div>
  );
};