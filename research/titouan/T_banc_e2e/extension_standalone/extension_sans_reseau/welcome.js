/* Hold up - welcome page. The test-page button stays only when `testPage` (chrome.storage.local) is an http(s) URL. */
(function (global) {
  'use strict';
  function isWebUrl(u) { try { const p = new URL(String(u)).protocol; return p === 'http:' || p === 'https:'; } catch (_) { return false; } }
  global.HoldupWelcome = { isWebUrl };
  const doc = global.document;
  if (!doc || !doc.getElementById || !doc.getElementById('settings') || !global.chrome) return;
  doc.getElementById('settings').addEventListener('click', () => { try { global.chrome.runtime.openOptionsPage(); } catch (_) {} });
  const btn = doc.getElementById('try');
  const drop = () => { if (btn && btn.parentNode) btn.parentNode.removeChild(btn); };
  (async () => {
    let url = '';
    try { const g = await global.chrome.storage.local.get('testPage'); url = g.testPage; } catch (_) {}
    if (!isWebUrl(url)) return drop();
    btn.addEventListener('click', () => { try { global.chrome.tabs.create({ url }); } catch (_) {} });
  })();
})(typeof window !== 'undefined' ? window : globalThis);
