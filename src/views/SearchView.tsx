import React, { useEffect } from 'react';
import { SearchInput } from '../components/SearchInput';
import { SearchResults } from '../components/SearchResults';
import { useSearchStore, usePluginStore } from '../stores';


interface SearchViewProps {
  onNavigate: (view: string) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({ onNavigate }) => {
  const { query, navigateUp, navigateDown, selectResult } = useSearchStore();
  const { installedPlugins, loadInstalledPlugins } = usePluginStore();

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

  const hasQuery = query.trim().length > 0;

  const handlePluginClick = (pluginId: string) => {
    onNavigate(`plugin:${pluginId}`);
  };

  return (
    <div className="flex flex-col bg-white dark:bg-gray-800 overflow-hidden">
      <SearchInput onIconClick={() => onNavigate('plugins')} />

      {hasQuery ? (
        /* 搜索后：纵向结果列表 */
        <SearchResults />
      ) : (
        /* 未搜索：横向插件图标网格，高度自适应 */
        <div className="overflow-y-auto">
          <div className="flex flex-wrap gap-4 px-4 py-4">
            {installedPlugins.map((plugin) => (
              <div
                key={plugin.id}
                onClick={() => handlePluginClick(plugin.id)}
                className="flex flex-col items-center w-16 cursor-pointer group"
                title={plugin.description}
              >
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-2xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                  {plugin.icon || '🧩'}
                </div>
                <span className="mt-1.5 text-xs text-gray-600 dark:text-gray-400 text-center leading-tight line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {plugin.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};