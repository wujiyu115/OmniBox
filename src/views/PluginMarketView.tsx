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
    <div className="flex flex-col h-full bg-base-100 overflow-hidden">
      {/* Tab 栏 */}
      <div className="flex border-b border-base-300 flex-shrink-0">
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
          ? 'text-primary'
          : 'text-base-content/70 hover:text-base-content'
      }`}
    >
      {label}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
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
      <div className="px-4 py-2 border-b border-base-200 flex-shrink-0">
        <input
          type="text"
          placeholder="搜索插件..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-base-300 rounded-md bg-base-100 text-base-content placeholder:text-base-content/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* 插件列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-base-content/50 text-sm">
            加载中...
          </div>
        ) : filteredPlugins.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-base-content/50 text-sm">
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
        <div className="px-4 py-2 bg-error/10 border-t border-error/30 text-xs text-error">
          {error}
        </div>
      )}

      {/* 底部统计 */}
      <div className="px-4 py-2 border-t border-base-200 text-xs text-base-content/50 flex-shrink-0">
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
          ? 'border-base-300 bg-base-100 hover:bg-base-200'
          : 'border-base-200 bg-base-200 opacity-60'
      }`}
    >
      {/* 图标 */}
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
        {plugin.icon || '🧩'}
      </div>

      {/* 信息 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-base-content truncate">{plugin.name}</span>
          <span className="text-xs text-base-content/50 flex-shrink-0">v{plugin.version}</span>
          {plugin.plugin_type === 'system' && (
            <span className="text-xs bg-base-200 text-base-content/70 px-1.5 py-0.5 rounded flex-shrink-0">系统</span>
          )}
          {isDependencyMissing && (
            <span className="text-xs text-yellow-600 flex-shrink-0">⚠ 依赖缺失</span>
          )}
        </div>
        <p className="text-xs text-base-content/70 mt-0.5 line-clamp-2">{plugin.description}</p>

        {/* 依赖缺失提示 */}
        {isDependencyMissing && plugin.missing_deps.length > 0 && (
          <div className="mt-1 text-xs text-yellow-600">
            缺少: {plugin.missing_deps.join(', ')}
          </div>
        )}

        {/* 被依赖信息 */}
        {plugin.dependents.length > 0 && (
          <div className="mt-1 text-xs text-base-content/50">
            被依赖: {plugin.dependents.join(', ')}
          </div>
        )}

        <div className="flex items-center gap-1 mt-1">
          <span className="text-xs text-base-content/30">ID: {plugin.id}</span>
        </div>
      </div>

      {/* 启用/禁用开关 */}
      <input
        type="checkbox"
        className="toggle toggle-primary toggle-sm"
        checked={plugin.enabled && !isDependencyMissing}
        onChange={onToggle}
        disabled={isDependencyMissing}
        title={
          isDependencyMissing
            ? '依赖缺失，无法启用'
            : plugin.enabled
            ? '点击禁用'
            : '点击启用'
        }
      />
    </div>
  );
};
