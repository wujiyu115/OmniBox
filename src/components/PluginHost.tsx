import React, { useEffect, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import pluginSdkSource from '../assets/plugin-sdk.js?raw';

// 全局插件 HTML 缓存（原始 HTML，未注入 SDK）
const pluginHtmlCache = new Map<string, string>();

/** 内置 SDK 脚本：从独立文件导入，自动注入到每个插件 HTML 的 <head> 中 */
const PLUGIN_SDK_SCRIPT = `<script>${pluginSdkSource}</script>`;

/** 获取当前主题 */
function getCurrentTheme(): 'dark' | 'light' {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

/** 将 SDK 脚本和主题注入到插件 HTML 中 */
function injectSdkAndTheme(rawHtml: string): string {
  const theme = getCurrentTheme();
  // 在 <html> 标签上添加 dark class（如果是暗色主题）
  let html = rawHtml;
  if (theme === 'dark') {
    html = html.replace(/<html([^>]*)>/i, '<html$1 class="dark">');
  }
  // 将 SDK 脚本注入到 <head> 的最前面
  if (html.includes('<head>')) {
    html = html.replace('<head>', '<head>' + PLUGIN_SDK_SCRIPT);
  } else if (html.includes('<head ')) {
    html = html.replace(/<head([^>]*)>/, '<head$1>' + PLUGIN_SDK_SCRIPT);
  } else {
    // 没有 <head> 标签，在 <html> 后插入
    html = html.replace(/<html([^>]*)>/i, '<html$1><head>' + PLUGIN_SDK_SCRIPT + '</head>');
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
        const isDark = document.documentElement.classList.contains('dark');
        return { theme: isDark ? 'dark' : 'light' };
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

  // 监听主窗口主题变化，同步到插件 iframe
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const theme = getCurrentTheme();
      iframeRef.current?.contentWindow?.postMessage(
        { source: 'omnibox-host', type: 'theme', payload: theme },
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
      <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 gap-3">
        <span className="text-3xl">⚠️</span>
        <span className="text-sm">插件加载失败</span>
        <span className="text-xs text-red-500 dark:text-red-400 max-w-md text-center">{loadError}</span>
        <button
          onClick={onClose}
          className="mt-2 px-4 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          返回
        </button>
      </div>
    );
  }

  if (!preparedHtml) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 text-sm">
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
