import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { listen } from '@tauri-apps/api/event';
import { ThemeProvider } from './components/ThemeProvider';
import { SearchView } from './views/SearchView';
import { TimestampView } from './views/TimestampView';
import { CalculatorView } from './views/CalculatorView';
import { NotesView } from './views/NotesView';
import { TranslateView } from './views/TranslateView';
import { PluginMarketView } from './views/PluginMarketView';
import { SyncSettingsView } from './views/SyncSettingsView';

// 插件视图类型：search 是主搜索页，其余是具体功能插件页
type PluginViewType = 'search' | 'timestamp' | 'calculator' | 'notes' | 'translate' | 'sync';
// 全部视图类型（含插件市场/设置合并页）
type ViewType = PluginViewType | 'plugins' | 'settings';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('search');

  useEffect(() => {
    // ESC 键隐藏窗口，同时回到搜索主页
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const appWindow = getCurrentWindow();
        await invoke('hide_window', { window: appWindow });
        setCurrentView('search');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    // 托盘菜单：打开设置（跳转到插件市场的设置 Tab）
    const unlistenSettings = listen('open-settings', () => {
      setCurrentView('settings');
    });

    // 托盘菜单：关于（跳转设置页）
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
        <div className="h-screen bg-white dark:bg-gray-900 flex flex-col overflow-hidden">
          {/* 顶部返回栏 */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
            <button
              onClick={() => setCurrentView('search')}
              className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
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

  // 搜索主页：高度自适应内容
  if (currentView === 'search') {
    return (
      <ThemeProvider>
        <div className="bg-white dark:bg-gray-900">
          <SearchView onNavigate={setCurrentView} />
        </div>
      </ThemeProvider>
    );
  }

  // 插件功能页面：撑满全屏
  return (
    <ThemeProvider>
      <div className="h-screen bg-white dark:bg-gray-900 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-hidden">
          {currentView === 'timestamp' && <TimestampView />}
          {currentView === 'calculator' && <CalculatorView />}
          {currentView === 'notes' && <NotesView />}
          {currentView === 'translate' && <TranslateView />}
          {currentView === 'sync' && <SyncSettingsView />}
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
