import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface WebDavConfig {
  url: string;
  username: string;
  password: string;
  enabled: boolean;
}

interface SyncStatusInfo {
  enabled: boolean;
  configured: boolean;
  last_sync_time: string | null;
  synced_files_count: number;
}

interface SyncResult {
  uploaded: string[];
  downloaded: string[];
  conflicts: FileSyncInfo[];
  errors: string[];
  last_sync_time: string;
}

interface FileSyncInfo {
  file_name: string;
  status: string;
  local_modified: string | null;
  remote_modified: string | null;
}

export const SyncSettingsView: React.FC = () => {
  const [webdavConfig, setWebdavConfig] = useState<WebDavConfig>({
    url: '',
    username: '',
    password: '',
    enabled: false,
  });
  const [syncStatus, setSyncStatus] = useState<SyncStatusInfo | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
    loadSyncStatus();
  }, []);

  const loadConfig = async () => {
    try {
      const result = await invoke<{ success: boolean; data: { webdav: WebDavConfig } }>('get_config');
      if (result.success && result.data?.webdav) {
        setWebdavConfig(result.data.webdav);
      }
    } catch (err) {
      console.error('加载配置失败:', err);
    }
  };

  const loadSyncStatus = async () => {
    try {
      const result = await invoke<{ success: boolean; data: SyncStatusInfo }>('get_sync_status');
      if (result.success && result.data) {
        setSyncStatus(result.data);
      }
    } catch (err) {
      console.error('加载同步状态失败:', err);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    setError('');
    try {
      // 先获取完整配置，再更新 webdav 部分
      const configResult = await invoke<{ success: boolean; data: Record<string, unknown> }>('get_config');
      if (configResult.success && configResult.data) {
        const fullConfig = { ...configResult.data, webdav: webdavConfig };
        const result = await invoke<{ success: boolean; error?: string }>('update_config', { config: fullConfig });
        if (!result.success && result.error) {
          setError(result.error);
        }
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setError('');
    try {
      const result = await invoke<{ success: boolean; data?: boolean; error?: string }>('test_webdav_connection', {
        config: webdavConfig,
      });
      if (result.success) {
        setTestResult({ success: true, message: '连接成功' });
      } else {
        setTestResult({ success: false, message: result.error || '连接失败' });
      }
    } catch (err) {
      setTestResult({ success: false, message: String(err) });
    } finally {
      setTesting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    setError('');
    try {
      const result = await invoke<{ success: boolean; data?: SyncResult; error?: string }>('sync_notes');
      if (result.success && result.data) {
        setSyncResult(result.data);
        await loadSyncStatus();
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setSyncing(false);
    }
  };

  const resolveConflict = async (fileName: string, strategy: string) => {
    setError('');
    try {
      const result = await invoke<{ success: boolean; error?: string }>('resolve_sync_conflict', {
        noteId: fileName,
        strategy,
      });
      if (result.success) {
        // 移除已解决的冲突
        setSyncResult((prev) =>
          prev
            ? { ...prev, conflicts: prev.conflicts.filter((c) => c.file_name !== fileName) }
            : null
        );
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError(String(err));
    }
  };

  return (
    <div className="flex flex-col h-full bg-theme-card rounded-lg shadow-lg overflow-hidden">
      {/* 标题栏 */}
      <div className="px-4 py-3 border-b border-theme-border-light">
        <h2 className="text-base font-semibold text-theme-text">数据同步</h2>
        <p className="text-xs text-theme-text-muted mt-0.5">通过 WebDAV 同步笔记数据</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* WebDAV 连接配置 */}
        <section>
          <h3 className="text-sm font-semibold text-theme-text mb-3 flex items-center gap-2">
            <span>🔗</span>
            <span>WebDAV 连接配置</span>
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-theme-text-secondary mb-1">服务器地址</label>
              <input
                type="text"
                value={webdavConfig.url}
                onChange={(e) => setWebdavConfig({ ...webdavConfig, url: e.target.value })}
                placeholder="https://dav.example.com/remote.php/webdav/"
                className="w-full px-3 py-2 text-sm border border-theme-border rounded-md bg-theme-input text-theme-text outline-none focus:border-theme-accent"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-theme-text-secondary mb-1">用户名</label>
                <input
                  type="text"
                  value={webdavConfig.username}
                  onChange={(e) => setWebdavConfig({ ...webdavConfig, username: e.target.value })}
                  placeholder="用户名"
                  className="w-full px-3 py-2 text-sm border border-theme-border rounded-md bg-theme-input text-theme-text outline-none focus:border-theme-accent"
                />
              </div>
              <div>
                <label className="block text-xs text-theme-text-secondary mb-1">密码</label>
                <input
                  type="password"
                  value={webdavConfig.password}
                  onChange={(e) => setWebdavConfig({ ...webdavConfig, password: e.target.value })}
                  placeholder="密码"
                  className="w-full px-3 py-2 text-sm border border-theme-border rounded-md bg-theme-input text-theme-text outline-none focus:border-theme-accent"
                />
              </div>
            </div>

            {/* 启用开关 */}
            <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-theme-bg">
              <div>
                <div className="text-sm text-theme-text">启用同步</div>
                <div className="text-xs text-theme-text-muted mt-0.5">开启后可手动同步笔记</div>
              </div>
              <button
                onClick={() => setWebdavConfig({ ...webdavConfig, enabled: !webdavConfig.enabled })}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                  webdavConfig.enabled ? 'bg-theme-accent' : 'bg-theme-border'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
                    webdavConfig.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <button
                onClick={saveConfig}
                disabled={saving}
                className="px-4 py-2 bg-theme-accent text-theme-accent-text text-sm rounded-md hover:bg-theme-accent-hover disabled:opacity-50 transition-colors"
              >
                {saving ? '保存中...' : '保存配置'}
              </button>
              <button
                onClick={testConnection}
                disabled={testing || !webdavConfig.url}
                className="px-4 py-2 bg-theme-bg text-theme-text text-sm rounded-md hover:bg-theme-card-hover disabled:opacity-50 transition-colors"
              >
                {testing ? '测试中...' : '测试连接'}
              </button>
            </div>

            {/* 测试结果 */}
            {testResult && (
              <div
                className={`px-3 py-2 rounded-md text-sm ${
                  testResult.success
                    ? 'bg-theme-success/10 text-theme-success border border-theme-success/30'
                    : 'bg-theme-error/10 text-theme-error border border-theme-error/30'
                }`}
              >
                {testResult.success ? '✓ ' : '✕ '}
                {testResult.message}
              </div>
            )}
          </div>
        </section>

        {/* 同步操作 */}
        <section>
          <h3 className="text-sm font-semibold text-theme-text mb-3 flex items-center gap-2">
            <span>🔄</span>
            <span>同步操作</span>
          </h3>
          <div className="space-y-3">
            {/* 同步状态 */}
            {syncStatus && (
              <div className="px-3 py-3 rounded-lg bg-theme-bg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-theme-text-secondary">同步状态</span>
                  <span className={`text-xs font-medium ${syncStatus.enabled ? 'text-theme-success' : 'text-theme-text-muted'}`}>
                    {syncStatus.enabled ? '已启用' : '未启用'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-theme-text-secondary">上次同步</span>
                  <span className="text-xs text-theme-text">
                    {syncStatus.last_sync_time
                      ? new Date(syncStatus.last_sync_time).toLocaleString()
                      : '从未同步'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-theme-text-secondary">已同步文件</span>
                  <span className="text-xs text-theme-text">{syncStatus.synced_files_count} 个</span>
                </div>
              </div>
            )}

            {/* 手动同步按钮 */}
            <button
              onClick={handleSync}
              disabled={syncing || !webdavConfig.enabled}
              className="w-full px-4 py-2.5 bg-theme-success text-white text-sm rounded-md hover:opacity-90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {syncing ? (
                <>
                  <span className="animate-spin">🔄</span>
                  <span>同步中...</span>
                </>
              ) : (
                <>
                  <span>🔄</span>
                  <span>立即同步</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* 同步结果 */}
        {syncResult && (
          <section>
            <h3 className="text-sm font-semibold text-theme-text mb-3 flex items-center gap-2">
              <span>📋</span>
              <span>同步结果</span>
            </h3>
            <div className="space-y-2">
              {syncResult.uploaded.length > 0 && (
                <div className="px-3 py-2 rounded-md bg-theme-accent/10 text-sm text-theme-accent">
                  <div className="font-medium mb-1">已上传 ({syncResult.uploaded.length})</div>
                  {syncResult.uploaded.map((f) => (
                    <div key={f} className="text-xs">↑ {f}</div>
                  ))}
                </div>
              )}
              {syncResult.downloaded.length > 0 && (
                <div className="px-3 py-2 rounded-md bg-theme-success/10 text-sm text-theme-success">
                  <div className="font-medium mb-1">已下载 ({syncResult.downloaded.length})</div>
                  {syncResult.downloaded.map((f) => (
                    <div key={f} className="text-xs">↓ {f}</div>
                  ))}
                </div>
              )}
              {syncResult.errors.length > 0 && (
                <div className="px-3 py-2 rounded-md bg-theme-error/10 text-sm text-theme-error">
                  <div className="font-medium mb-1">错误 ({syncResult.errors.length})</div>
                  {syncResult.errors.map((e, i) => (
                    <div key={i} className="text-xs">✕ {e}</div>
                  ))}
                </div>
              )}
              {syncResult.uploaded.length === 0 &&
                syncResult.downloaded.length === 0 &&
                syncResult.conflicts.length === 0 &&
                syncResult.errors.length === 0 && (
                  <div className="px-3 py-2 rounded-md bg-theme-bg text-sm text-theme-text-secondary">
                    所有文件已是最新状态
                  </div>
                )}
            </div>
          </section>
        )}

        {/* 冲突解决 */}
        {syncResult && syncResult.conflicts.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-theme-text mb-3 flex items-center gap-2">
              <span>⚠️</span>
              <span>冲突文件 ({syncResult.conflicts.length})</span>
            </h3>
            <div className="space-y-2">
              {syncResult.conflicts.map((conflict) => (
                <div
                  key={conflict.file_name}
                  className="px-3 py-3 rounded-lg border border-yellow-300 bg-yellow-50/50"
                >
                  <div className="text-sm font-medium text-theme-text mb-2">
                    {conflict.file_name}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => resolveConflict(conflict.file_name, 'keep_local')}
                      className="px-3 py-1 text-xs bg-theme-accent text-theme-accent-text rounded hover:bg-theme-accent-hover transition-colors"
                    >
                      保留本地
                    </button>
                    <button
                      onClick={() => resolveConflict(conflict.file_name, 'keep_remote')}
                      className="px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                    >
                      保留远程
                    </button>
                    <button
                      onClick={() => resolveConflict(conflict.file_name, 'merge')}
                      className="px-3 py-1 text-xs bg-theme-success text-white rounded hover:opacity-90 transition-colors"
                    >
                      合并
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="px-3 py-2 rounded-md bg-theme-error/10 border border-theme-error/30 text-sm text-theme-error">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
