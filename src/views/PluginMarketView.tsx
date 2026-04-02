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
  plugin_type: string;
  features: { code: string; explain: string; cmds: { label: string; type: string; keyword: string }[] }[];
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
    <div className="flex flex-col h-full bg-theme-card overflow-hidden">
      {/* Tab 栏 */}
      <div className="flex border-b border-theme-border flex-shrink-0">
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
          ? 'text-theme-accent'
          : 'text-theme-text-secondary hover:text-theme-text'
      }`}
    >
      {label}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-theme-accent" />
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

      const statusResult = await invoke<{ success: boolean; data: PluginStatusInfo[] }>('get_plugin_status');

      if (statusResult.success && statusResult.data) {
        // 插件市场使用 get_builtin_plugins 获取所有插件（含禁用的），确保可以重新启用
        const allPlugins = await invoke<{ id: string; name: string; version: string; description: string; logo?: string; plugin_type: string; features: PluginInfo['features'] }[]>('get_builtin_plugins');
        const statusMap = new Map(statusResult.data.map((s) => [s.id, s]));
        setPlugins(
          allPlugins.map((p) => {
            const status = statusMap.get(p.id);
            return {
              id: p.id,
              name: p.name,
              version: p.version,
              description: p.description,
              icon: p.logo || undefined,
              plugin_type: p.plugin_type,
              features: p.features,
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
      <div className="px-4 py-2 border-b border-theme-border-light flex-shrink-0">
        <input
          type="text"
          placeholder="搜索插件..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-theme-border rounded-md bg-theme-input text-theme-text placeholder-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-accent/50"
        />
      </div>

      {/* 插件列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-theme-text-muted text-sm">
            加载中...
          </div>
        ) : filteredPlugins.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-theme-text-muted text-sm">
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
        <div className="px-4 py-2 bg-theme-error/10 border-t border-theme-error/30 text-xs text-theme-error">
          {error}
        </div>
      )}

      {/* 底部统计 */}
      <div className="px-4 py-2 border-t border-theme-border-light text-xs text-theme-text-muted flex-shrink-0">
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
          ? 'border-yellow-300 bg-yellow-50/50'
          : plugin.enabled
          ? 'border-theme-border bg-theme-card hover:bg-theme-card-hover'
          : 'border-theme-border-light bg-theme-bg opacity-60'
      }`}
    >
      {/* 图标 */}
      <div className="w-10 h-10 rounded-lg bg-theme-accent/10 flex items-center justify-center text-xl flex-shrink-0">
        {plugin.icon || '🧩'}
      </div>

      {/* 信息 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-theme-text truncate">{plugin.name}</span>
          <span className="text-xs text-theme-text-muted flex-shrink-0">v{plugin.version}</span>
          {plugin.plugin_type === 'system' && (
            <span className="text-xs bg-theme-bg text-theme-text-secondary px-1.5 py-0.5 rounded flex-shrink-0">系统</span>
          )}
          {isDependencyMissing && (
            <span className="text-xs text-yellow-600 flex-shrink-0">⚠ 依赖缺失</span>
          )}
        </div>
        <p className="text-xs text-theme-text-secondary mt-0.5 line-clamp-2">{plugin.description}</p>

        {/* 依赖缺失提示 */}
        {isDependencyMissing && plugin.missing_deps.length > 0 && (
          <div className="mt-1 text-xs text-yellow-600">
            缺少: {plugin.missing_deps.join(', ')}
          </div>
        )}

        {/* 被依赖信息 */}
        {plugin.dependents.length > 0 && (
          <div className="mt-1 text-xs text-theme-text-muted">
            被依赖: {plugin.dependents.join(', ')}
          </div>
        )}

        <div className="flex items-center gap-1 mt-1">
          <span className="text-xs text-theme-text-muted/50">ID: {plugin.id}</span>
        </div>
      </div>

      {/* 启用/禁用开关 */}
      <button
        onClick={onToggle}
        disabled={isDependencyMissing}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
          isDependencyMissing
            ? 'bg-yellow-300 cursor-not-allowed'
            : plugin.enabled
            ? 'bg-theme-accent'
            : 'bg-theme-border'
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
