import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { SettingsView } from './SettingsView';

type TabType = 'plugins' | 'settings';

interface PluginStatusInfo {
  id: string;
  name: string;
  version: string;
  description: string;
  status: string;
  missing_deps: string[];
  dependents: string[];
}

interface PluginInfo {
  id: string;
  name: string;
  version: string;
  description: string;
  icon?: string;
}

interface PluginCardData extends PluginInfo {
  enabled: boolean;
  status: string;
  missing_deps: string[];
  dependents: string[];
}

interface PluginMarketViewProps {
  initialTab?: TabType;
}

export const PluginMarketView: React.FC<PluginMarketViewProps> = ({ initialTab = 'plugins' }) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 overflow-hidden">
      {/* Tab 栏 */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <TabButton
          label="🧩 插件市场"
          active={activeTab === 'plugins'}
          onClick={() => setActiveTab('plugins')}
        />
        <TabButton
          label="⚙️ 设置"
          active={activeTab === 'settings'}
          onClick={() => setActiveTab('settings')}
        />
      </div>

      {/* Tab 内容 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'plugins' && <PluginListPanel />}
        {activeTab === 'settings' && <SettingsView />}
      </div>
    </div>
  );
};

interface TabButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function TabButton({ label, active, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 text-sm font-medium transition-colors relative ${
        active
          ? 'text-blue-600 dark:text-blue-400'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
      }`}
    >
      {label}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
      )}
    </button>
  );
}

/** 插件列表面板（原 PluginMarketView 的核心内容） */
const PluginListPanel: React.FC = () => {
  const [plugins, setPlugins] = useState<PluginCardData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPlugins();
  }, []);

  const loadPlugins = async () => {
    try {
      setIsLoading(true);
      setError('');

      const infoResult = await invoke<{ success: boolean; data: PluginInfo[] }>('get_installed_plugins');
      const statusResult = await invoke<{ success: boolean; data: PluginStatusInfo[] }>('get_plugin_status');

      if (infoResult.success && infoResult.data && statusResult.success && statusResult.data) {
        const statusMap = new Map(statusResult.data.map((s) => [s.id, s]));
        setPlugins(
          infoResult.data.map((p) => {
            const status = statusMap.get(p.id);
            return {
              ...p,
              enabled: status ? status.status === 'enabled' : true,
              status: status?.status || 'enabled',
              missing_deps: status?.missing_deps || [],
              dependents: status?.dependents || [],
            };
          })
        );
      }
    } catch (err) {
      console.error('加载插件列表失败:', err);
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlugin = async (id: string) => {
    const plugin = plugins.find((p) => p.id === id);
    if (!plugin) return;

    try {
      setError('');
      const command = plugin.enabled ? 'disable_plugin' : 'enable_plugin';
      const result = await invoke<{ success: boolean; error?: string }>(command, { id });

      if (result.success) {
        await loadPlugins();
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError(String(err));
    }
  };

  const filteredPlugins = plugins.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 搜索框 */}
      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
        <input
          type="text"
          placeholder="搜索插件..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-500"
        />
      </div>

      {/* 插件列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-gray-400 dark:text-gray-500 text-sm">
            加载中...
          </div>
        ) : filteredPlugins.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400 dark:text-gray-500 text-sm">
            {searchQuery ? '没有找到匹配的插件' : '暂无插件'}
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredPlugins.map((plugin) => (
              <PluginCardComponent
                key={plugin.id}
                plugin={plugin}
                onToggle={() => togglePlugin(plugin.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/30 border-t border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* 底部统计 */}
      <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
        共 {plugins.length} 个插件，已启用 {plugins.filter((p) => p.enabled).length} 个
      </div>
    </div>
  );
};

interface PluginCardProps {
  plugin: PluginCardData;
  onToggle: () => void;
}

const PluginCardComponent: React.FC<PluginCardProps> = ({ plugin, onToggle }) => {
  const isDependencyMissing = plugin.status === 'dependency_missing';

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
        isDependencyMissing
          ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20'
          : plugin.enabled
          ? 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
          : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 opacity-60'
      }`}
    >
      {/* 图标 */}
      <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-xl flex-shrink-0">
        {plugin.icon || '🧩'}
      </div>

      {/* 信息 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{plugin.name}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">v{plugin.version}</span>
          {isDependencyMissing && (
            <span className="text-xs text-yellow-600 dark:text-yellow-400 flex-shrink-0">⚠ 依赖缺失</span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{plugin.description}</p>

        {/* 依赖缺失提示 */}
        {isDependencyMissing && plugin.missing_deps.length > 0 && (
          <div className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
            缺少: {plugin.missing_deps.join(', ')}
          </div>
        )}

        {/* 被依赖信息 */}
        {plugin.dependents.length > 0 && (
          <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            被依赖: {plugin.dependents.join(', ')}
          </div>
        )}

        <div className="flex items-center gap-1 mt-1">
          <span className="text-xs text-gray-300 dark:text-gray-600">ID: {plugin.id}</span>
        </div>
      </div>

      {/* 启用/禁用开关 */}
      <button
        onClick={onToggle}
        disabled={isDependencyMissing}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
          isDependencyMissing
            ? 'bg-yellow-300 dark:bg-yellow-700 cursor-not-allowed'
            : plugin.enabled
            ? 'bg-blue-500'
            : 'bg-gray-200 dark:bg-gray-600'
        }`}
        title={
          isDependencyMissing
            ? '依赖缺失，无法启用'
            : plugin.enabled
            ? '点击禁用'
            : '点击启用'
        }
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ${
            plugin.enabled && !isDependencyMissing ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};
