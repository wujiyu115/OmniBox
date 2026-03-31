import React from 'react';
import { useThemeStore } from '../stores';

interface ShortcutItem {
  label: string;
  keys: string[];
  description: string;
}

const SHORTCUTS: ShortcutItem[] = [
  { label: '唤起/隐藏 OmniBox', keys: ['Alt', 'R'], description: '全局快捷键，随时唤起或隐藏主窗口' },
  { label: '关闭窗口', keys: ['Esc'], description: '按下 Esc 隐藏主窗口' },
  { label: '向上导航', keys: ['↑'], description: '在搜索结果中向上移动' },
  { label: '向下导航', keys: ['↓'], description: '在搜索结果中向下移动' },
  { label: '确认选择', keys: ['Enter'], description: '执行当前选中的搜索结果' },
];

export const SettingsView: React.FC = () => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* 标题栏 */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">系统设置</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">OmniBox 配置与快捷键</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* 主题切换 */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
            <span>🎨</span>
            <span>外观</span>
          </h3>
          <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
            <div>
              <div className="text-sm text-gray-700 dark:text-gray-200">主题模式</div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">切换明亮/暗色主题</div>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                theme === 'dark' ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'
              }`}
              title={theme === 'dark' ? '切换到明亮模式' : '切换到暗色模式'}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
                  theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </section>

        {/* WebDAV 同步入口 */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
            <span>🔄</span>
            <span>数据同步</span>
          </h3>
          <div className="px-3 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-700 dark:text-gray-200">WebDAV 同步</div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">通过 WebDAV 同步笔记数据</div>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">前往"同步"页面配置 →</span>
            </div>
          </div>
        </section>

        {/* 快捷键配置 */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
            <span>⌨️</span>
            <span>快捷键</span>
          </h3>
          <div className="space-y-2">
            {SHORTCUTS.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div>
                  <div className="text-sm text-gray-700 dark:text-gray-200">{item.label}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{item.description}</div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {item.keys.map((key, i) => (
                    <React.Fragment key={i}>
                      <kbd className="px-2 py-1 text-xs font-mono bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded shadow-sm text-gray-600 dark:text-gray-200">
                        {key}
                      </kbd>
                      {i < item.keys.length - 1 && (
                        <span className="text-gray-300 dark:text-gray-500 text-xs">+</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 关于信息 */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
            <span>ℹ️</span>
            <span>关于</span>
          </h3>
          <div className="px-3 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">应用名称</span>
              <span className="text-xs text-gray-700 dark:text-gray-200 font-medium">OmniBox</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">版本</span>
              <span className="text-xs text-gray-700 dark:text-gray-200 font-mono">0.1.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">构建框架</span>
              <span className="text-xs text-gray-700 dark:text-gray-200">Tauri 2.0 + React</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">项目地址</span>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  import('@tauri-apps/api/core').then(({ invoke }) => {
                    invoke('open_url', { url: 'https://github.com/omnibox/omnibox' });
                  });
                }}
                className="text-xs text-blue-500 hover:underline"
              >
                GitHub
              </a>
            </div>
          </div>
        </section>

        {/* 托盘设置说明 */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
            <span>🖥️</span>
            <span>系统托盘</span>
          </h3>
          <div className="px-3 py-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <p>OmniBox 运行时会在系统托盘显示图标。</p>
            <p>右键托盘图标可访问快捷菜单，左键单击可切换窗口显示/隐藏。</p>
            <p>关闭主窗口不会退出应用，请通过托盘菜单的"退出"选项完全退出。</p>
          </div>
        </section>
      </div>
    </div>
  );
};
