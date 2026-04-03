import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { listen } from '@tauri-apps/api/event';
import { ThemeProvider } from './components/ThemeProvider';
import { SearchView } from './views/SearchView';
import { PluginMarketView } from './views/PluginMarketView';
import { SyncSettingsView } from './views/SyncSettingsView';
import { PluginHost, preloadAllPluginHtml } from './components/PluginHost';

// 视图类型：search 是主搜索页，plugin:xxx 是插件页
type ViewType = 'search' | 'plugins' | 'settings' | 'sync' | `plugin:${string}`;

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('search');

  // 应用启动时预加载所有已启用插件的 HTML
  useEffect(() => {
    preloadAllPluginHtml();
  }, []);

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (currentView === 'search') {
          // 主界面按 Esc：隐藏窗口
          const appWindow = getCurrentWindow();
          await invoke('hide_window', { window: appWindow });
        } else {
          // 其他页面按 Esc：回到主界面
          setCurrentView('search');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView]);

  useEffect(() => {
    const unlistenSettings = listen('open-settings', () => {
      setCurrentView('settings');
    });

    const unlistenAbout = listen('open-about', () => {
      setCurrentView('settings');
    });

    return () => {
      unlistenSettings.then((fn) => fn());
      unlistenAbout.then((fn) => fn());
    };
  }, []);

  // 插件市场/设置页：全屏展示，带返回按钮
  if (currentView === 'plugins' || currentView === 'settings') {
    return (
      <ThemeProvider>
        <div className="h-screen bg-base-200 flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-base-300 bg-base-100 flex-shrink-0">
            <button
              onClick={() => setCurrentView('search')}
              className="flex items-center gap-1.5 text-sm text-base-content/70 hover:text-base-content transition-colors"
            >
              <span>←</span>
              <span>返回</span>
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <PluginMarketView initialTab={currentView === 'settings' ? 'settings' : 'plugins'} />
          </div>
        </div>
      </ThemeProvider>
    );
  }

  // 搜索主页
  if (currentView === 'search') {
    return (
      <ThemeProvider>
        <div className="h-screen bg-base-200">
          <SearchView onNavigate={setCurrentView} />
        </div>
      </ThemeProvider>
    );
  }

  // 插件功能页面：通过 PluginHost iframe 加载
  if (currentView.startsWith('plugin:')) {
    const pluginId = currentView.replace('plugin:', '');
    return (
      <ThemeProvider>
        <div className="h-screen bg-base-200 flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-2 border-b border-base-300 bg-base-100 flex-shrink-0">
            <button
              onClick={() => setCurrentView('search')}
              className="flex items-center gap-1.5 text-sm text-base-content/70 hover:text-base-content transition-colors"
            >
              <span>←</span>
              <span>返回</span>
            </button>
            <span className="text-xs text-base-content/50">{pluginId}</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <PluginHost pluginId={pluginId} onClose={() => setCurrentView('search')} />
          </div>
        </div>
      </ThemeProvider>
    );
  }

  // 其他页面（如 sync）
  return (
    <ThemeProvider>
      <div className="h-screen bg-base-200 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-hidden">
          {currentView === 'sync' && <SyncSettingsView />}
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
