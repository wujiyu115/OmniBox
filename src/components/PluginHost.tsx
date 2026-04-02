import React, { useEffect, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import pluginSdkSource from '../assets/plugin-sdk.js?raw';
import pluginThemeCss from '../assets/plugin-theme.css?raw';
import { COLOR_SCHEMES, getColorScheme } from '../config/colorSchemes';

// 全局插件 HTML 缓存（原始 HTML，未注入 SDK）
const pluginHtmlCache = new Map<string, string>();

/** 内置 SDK 脚本：从独立文件导入，自动注入到每个插件 HTML 的 <head> 中 */
const PLUGIN_SDK_SCRIPT = `<script>${pluginSdkSource}</script>`;

/** 插件配色方案 CSS：注入到每个插件 HTML 的 <head> 中 */
const PLUGIN_THEME_STYLE = `<style>${pluginThemeCss}</style>`;

/** 获取当前配色方案的 class 名 */
function getCurrentColorSchemeClass(): string {
  for (const scheme of COLOR_SCHEMES) {
    if (document.documentElement.classList.contains(scheme.className)) {
      return scheme.className;
    }
  }
  return 'theme-blue';
}

/** 获取当前配色方案 ID */
function getCurrentColorSchemeId(): string {
  for (const scheme of COLOR_SCHEMES) {
    if (document.documentElement.classList.contains(scheme.className)) {
      return scheme.id;
    }
  }
  return 'blue';
}

/** 将 SDK 脚本、配色方案 CSS 和主题注入到插件 HTML 中 */
function injectSdkAndTheme(rawHtml: string): string {
  const schemeClass = getCurrentColorSchemeClass();
  const scheme = getColorScheme(getCurrentColorSchemeId());
  // 在 <html> 标签上添加配色方案 class（深色方案同时添加 dark class）
  let html = rawHtml;
  const extraClasses = scheme.isDark ? `${schemeClass} dark` : schemeClass;
  html = html.replace(/<html([^>]*)>/i, `<html$1 class="${extraClasses}">`);
  // 将 SDK 脚本和配色方案 CSS 注入到 <head> 的最前面
  const injection = PLUGIN_THEME_STYLE + PLUGIN_SDK_SCRIPT;
  if (html.includes('<head>')) {
    html = html.replace('<head>', '<head>' + injection);
  } else if (html.includes('<head ')) {
    html = html.replace(/<head([^>]*)>/, '<head$1>' + injection);
  } else {
    // 没有 <head> 标签，在 <html> 后插入
    html = html.replace(/<html([^>]*)>/i, '<html$1><head>' + injection + '</head>');
  }
  return html;
}

/** 预加载所有已启用插件的 HTML 到内存缓存（应用启动时调用） */
export async function preloadAllPluginHtml(): Promise<void> {
  try {
    const htmlMap = await invoke<Record<string, string>>('get_all_plugin_html');
    for (const [pluginId, html] of Object.entries(htmlMap)) {
      pluginHtmlCache.set(pluginId, html);
    }
  } catch (error) {
    console.error('[PluginHost] 预加载插件 HTML 失败:', error);
  }
}

interface PluginHostProps {
  pluginId: string;
  onClose: () => void;
}

/**
 * 插件宿主组件：通过 iframe srcdoc 加载插件 HTML，
 * 自动注入 SDK 和主题，并通过 postMessage 桥接通信。
 */
export const PluginHost: React.FC<PluginHostProps> = ({ pluginId, onClose }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [preparedHtml, setPreparedHtml] = React.useState<string | null>(() => {
    const cached = pluginHtmlCache.get(pluginId);
    return cached ? injectSdkAndTheme(cached) : null;
  });
  const [loadError, setLoadError] = React.useState<string>('');

  // 加载插件 HTML 内容（优先使用缓存），注入 SDK 和主题
  useEffect(() => {
    if (pluginHtmlCache.has(pluginId)) {
      setPreparedHtml(injectSdkAndTheme(pluginHtmlCache.get(pluginId)!));
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const html = await invoke<string>('get_plugin_html', { pluginId });
        if (!cancelled) {
          pluginHtmlCache.set(pluginId, html);
          setPreparedHtml(injectSdkAndTheme(html));
        }
      } catch (e) {
        if (!cancelled) setLoadError(String(e));
      }
    })();
    return () => { cancelled = true; };
  }, [pluginId]);

  // 处理来自插件 iframe 的 postMessage
  const handleMessage = useCallback((event: MessageEvent) => {
    const data = event.data;
    if (!data || data.source !== 'omnibox-plugin') return;

    const iframe = iframeRef.current;

    // 插件就绪 → 触发 onLoad 生命周期
    if (data.type === 'ready') {
      iframe?.contentWindow?.postMessage(
        { source: 'omnibox-host', type: 'lifecycle', payload: 'onPluginLoad' },
        '*'
      );
      iframe?.contentWindow?.postMessage(
        { source: 'omnibox-host', type: 'lifecycle', payload: 'onPluginActivate' },
        '*'
      );
      return;
    }

    // 处理插件请求
    if (data.id && data.type) {
      handlePluginRequest(data).then((result) => {
        iframe?.contentWindow?.postMessage(
          { source: 'omnibox-host', id: data.id, result },
          '*'
        );
      }).catch((error) => {
        iframe?.contentWindow?.postMessage(
          { source: 'omnibox-host', id: data.id, error: error.message || String(error) },
          '*'
        );
      });
    }
  }, [onClose]);

  // 处理插件的具体请求
  const handlePluginRequest = async (data: { type: string; payload: Record<string, unknown> }) => {
    switch (data.type) {
      case 'close':
        onClose();
        return null;
      case 'getTheme': {
        const schemeId = getCurrentColorSchemeId();
        const currentScheme = getColorScheme(schemeId);
        return { theme: schemeId, isDark: currentScheme.isDark, className: currentScheme.className };
      }
      case 'notify':
        console.log('[Plugin Notify]', data.payload?.message);
        return null;
      case 'getConfig':
        return {};
      case 'setConfig':
        return null;
      default:
        throw new Error(`Unknown request type: ${data.type}`);
    }
  };

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => {
      // 触发 onDeactivate 生命周期
      iframeRef.current?.contentWindow?.postMessage(
        { source: 'omnibox-host', type: 'lifecycle', payload: 'onPluginDeactivate' },
        '*'
      );
      window.removeEventListener('message', handleMessage);
    };
  }, [handleMessage]);

  // 监听主窗口配色方案变化，同步到插件 iframe
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const schemeId = getCurrentColorSchemeId();
      const currentScheme = getColorScheme(schemeId);
      iframeRef.current?.contentWindow?.postMessage(
        { source: 'omnibox-host', type: 'theme', payload: { schemeId, className: currentScheme.className, isDark: currentScheme.isDark } },
        '*'
      );
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-theme-text-secondary gap-3">
        <span className="text-3xl">⚠️</span>
        <span className="text-sm">插件加载失败</span>
        <span className="text-xs text-theme-error max-w-md text-center">{loadError}</span>
        <button
          onClick={onClose}
          className="mt-2 px-4 py-1.5 text-sm bg-theme-bg-secondary rounded hover:bg-theme-card-hover transition-colors"
        >
          返回
        </button>
      </div>
    );
  }

  if (!preparedHtml) {
    return (
      <div className="flex items-center justify-center h-full text-theme-text-muted text-sm">
        加载插件中...
      </div>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      srcDoc={preparedHtml}
      className="w-full h-full border-none"
      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      title={`plugin-${pluginId}`}
    />
  );
};
