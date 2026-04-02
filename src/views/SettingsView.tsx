import React from 'react';
import { useThemeStore } from '../stores';
import { COLOR_SCHEMES } from '../config/colorSchemes';

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
  const { colorScheme, setColorScheme } = useThemeStore();

  return (
    <div className="flex flex-col h-full bg-theme-card rounded-lg shadow-lg overflow-hidden">
      {/* 标题栏 */}
      <div className="px-4 py-3 border-b border-theme-border-light">
        <h2 className="text-base font-semibold text-theme-text">系统设置</h2>
        <p className="text-xs text-theme-text-muted mt-0.5">OmniBox 配置与快捷键</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* 配色方案选择器 */}
        <section>
          <h3 className="text-sm font-semibold text-theme-text mb-3 flex items-center gap-2">
            <span>🎨</span>
            <span>配色方案</span>
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {COLOR_SCHEMES.map((scheme) => (
              <button
                key={scheme.id}
                onClick={() => setColorScheme(scheme.id)}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border-2 transition-all cursor-pointer ${
                  colorScheme === scheme.id
                    ? 'border-theme-accent bg-theme-accent/10'
                    : 'border-theme-border hover:border-theme-text-muted bg-theme-card-hover'
                }`}
                title={scheme.name}
              >
                <div
                  className="w-8 h-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center"
                  style={{ backgroundColor: scheme.previewColor }}
                >
                  {colorScheme === scheme.id && (
                    <span className="text-white text-xs font-bold">✓</span>
                  )}
                </div>
                <span className={`text-xs ${colorScheme === scheme.id ? 'text-theme-accent font-medium' : 'text-theme-text-secondary'}`}>
                  {scheme.name}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* WebDAV 同步入口 */}
        <section>
          <h3 className="text-sm font-semibold text-theme-text mb-3 flex items-center gap-2">
            <span>🔄</span>
            <span>数据同步</span>
          </h3>
          <div className="px-3 py-3 rounded-lg bg-theme-bg space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-theme-text">WebDAV 同步</div>
                <div className="text-xs text-theme-text-muted mt-0.5">通过 WebDAV 同步笔记数据</div>
              </div>
              <span className="text-xs text-theme-text-muted">前往"同步"页面配置 →</span>
            </div>
          </div>
        </section>

        {/* 快捷键配置 */}
        <section>
          <h3 className="text-sm font-semibold text-theme-text mb-3 flex items-center gap-2">
            <span>⌨️</span>
            <span>快捷键</span>
          </h3>
          <div className="space-y-2">
            {SHORTCUTS.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-theme-bg hover:bg-theme-card-hover transition-colors"
              >
                <div>
                  <div className="text-sm text-theme-text">{item.label}</div>
                  <div className="text-xs text-theme-text-muted mt-0.5">{item.description}</div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {item.keys.map((key, i) => (
                    <React.Fragment key={i}>
                      <kbd className="px-2 py-1 text-xs font-mono bg-theme-card border border-theme-border rounded shadow-sm text-theme-text-secondary">
                        {key}
                      </kbd>
                      {i < item.keys.length - 1 && (
                        <span className="text-theme-text-muted text-xs">+</span>
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
          <h3 className="text-sm font-semibold text-theme-text mb-3 flex items-center gap-2">
            <span>ℹ️</span>
            <span>关于</span>
          </h3>
          <div className="px-3 py-3 rounded-lg bg-theme-bg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-theme-text-secondary">应用名称</span>
              <span className="text-xs text-theme-text font-medium">OmniBox</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-theme-text-secondary">版本</span>
              <span className="text-xs text-theme-text font-mono">0.1.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-theme-text-secondary">构建框架</span>
              <span className="text-xs text-theme-text">Tauri 2.0 + React</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-theme-text-secondary">项目地址</span>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  import('@tauri-apps/api/core').then(({ invoke }) => {
                    invoke('open_url', { url: 'https://github.com/omnibox/omnibox' });
                  });
                }}
                className="text-xs text-theme-accent hover:underline"
              >
                GitHub
              </a>
            </div>
          </div>
        </section>

        {/* 托盘设置说明 */}
        <section>
          <h3 className="text-sm font-semibold text-theme-text mb-3 flex items-center gap-2">
            <span>🖥️</span>
            <span>系统托盘</span>
          </h3>
          <div className="px-3 py-3 rounded-lg bg-theme-accent/10 text-xs text-theme-accent space-y-1">
            <p>OmniBox 运行时会在系统托盘显示图标。</p>
            <p>右键托盘图标可访问快捷菜单，左键单击可切换窗口显示/隐藏。</p>
            <p>关闭主窗口不会退出应用，请通过托盘菜单的"退出"选项完全退出。</p>
          </div>
        </section>
      </div>
    </div>
  );
};
