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
      var theme = data.payload;
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
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
