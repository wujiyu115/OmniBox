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
import { SettingsView } from './views/SettingsView';
import { SyncSettingsView } from './views/SyncSettingsView';

type ViewType = 'search' | 'timestamp' | 'calculator' | 'notes' | 'translate' | 'plugins' | 'sync' | 'settings';

interface NavItem {
  id: ViewType;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'search', label: '搜索', icon: '🔍' },
  { id: 'timestamp', label: '时间戳', icon: '⏱️' },
  { id: 'calculator', label: '计算器', icon: '🧮' },
  { id: 'notes', label: '笔记', icon: '📝' },
  { id: 'translate', label: '翻译', icon: '🌐' },
  { id: 'plugins', label: '插件市场', icon: '🧩' },
  { id: 'sync', label: '同步', icon: '🔄' },
  { id: 'settings', label: '设置', icon: '⚙️' },
];

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('search');

  useEffect(() => {
    // Listen for ESC key to hide window
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const appWindow = getCurrentWindow();
        await invoke('hide_window', { window: appWindow });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    // 监听来自 Rust 后端的 open-settings 事件，自动切换到设置页
    const unlisten = listen('open-settings', () => {
      setCurrentView('settings');
    });

    // 监听引导教学事件
    const unlistenGuide = listen('open-guide', () => {
      setCurrentView('search');
    });

    // 监听关于事件
    const unlistenAbout = listen('open-about', () => {
      setCurrentView('settings');
    });

    return () => {
      unlisten.then((fn) => fn());
      unlistenGuide.then((fn) => fn());
      unlistenAbout.then((fn) => fn());
    };
  }, []);

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 transition-colors">
        <div className="max-w-3xl mx-auto">
          {/* View switch buttons */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`px-4 py-2 rounded flex items-center gap-1.5 text-sm ${
                  currentView === item.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Current view */}
          <div className="h-[calc(100vh-100px)]">
            {currentView === 'search' && <SearchView />}
            {currentView === 'timestamp' && <TimestampView />}
            {currentView === 'calculator' && <CalculatorView />}
            {currentView === 'notes' && <NotesView />}
            {currentView === 'translate' && <TranslateView />}
            {currentView === 'plugins' && <PluginMarketView />}
            {currentView === 'sync' && <SyncSettingsView />}
            {currentView === 'settings' && <SettingsView />}
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
