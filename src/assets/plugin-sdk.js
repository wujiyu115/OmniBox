(function () {
  'use strict';
  var requestId = 0;
  var pendingRequests = new Map();

  function sendRequest(type, payload) {
    return new Promise(function (resolve, reject) {
      var id = ++requestId;
      pendingRequests.set(id, { resolve: resolve, reject: reject });
      window.parent.postMessage({ source: 'omnibox-plugin', id: id, type: type, payload: payload }, '*');
      setTimeout(function () {
        if (pendingRequests.has(id)) {
          pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  window.addEventListener('message', function (event) {
    var data = event.data;
    if (!data || data.source !== 'omnibox-host') return;

    if (data.id && pendingRequests.has(data.id)) {
      var handler = pendingRequests.get(data.id);
      pendingRequests.delete(data.id);
      if (data.error) { handler.reject(new Error(data.error)); }
      else { handler.resolve(data.result); }
      return;
    }

    if (data.type === 'lifecycle') {
      var hookName = data.payload;
      if (typeof window[hookName] === 'function') {
        try { window[hookName](); } catch (e) { console.error('[OmniBox] lifecycle hook error:', e); }
      }
    }

    if (data.type === 'theme') {
      var payload = data.payload;
      // 移除所有配色方案 class
      var schemeClasses = ['theme-blue', 'theme-green', 'theme-purple', 'theme-orange', 'theme-rose', 'theme-gray', 'theme-dark', 'theme-midnight'];
      schemeClasses.forEach(function (cls) {
        document.documentElement.classList.remove(cls);
      });
      document.documentElement.classList.remove('dark');
      // 添加新的配色方案 class
      if (payload && payload.className) {
        document.documentElement.classList.add(payload.className);
        if (payload.isDark) {
          document.documentElement.classList.add('dark');
        }
      } else if (typeof payload === 'string') {
        // 兼容旧格式
        if (payload === 'dark') {
          document.documentElement.classList.add('theme-dark');
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.add('theme-blue');
        }
      }
    }
  });

  window.omnibox = {
    copyToClipboard: function (text) { return navigator.clipboard.writeText(text); },
    notify: function (message) { return sendRequest('notify', { message: message }); },
    getConfig: function () { return sendRequest('getConfig', {}); },
    setConfig: function (config) { return sendRequest('setConfig', { config: config }); },
    getTheme: function () { return sendRequest('getTheme', {}); },
    close: function () { return sendRequest('close', {}); }
  };

  window.parent.postMessage({ source: 'omnibox-plugin', type: 'ready' }, '*');
})();
