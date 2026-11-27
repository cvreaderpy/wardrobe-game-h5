/*
 * 衣间小日子 — PWA 注册（只在 dist/ 版本加载）
 *
 * 只在 HTTPS / localhost / 127.0.0.1 下注册 Service Worker。
 * file:// 不支持 Service Worker，单文件版也不会加载本文件。
 */
(function () {
  if (window.__WARDROBE_SINGLE_FILE__) { return; }
  if (!('serviceWorker' in navigator)) { return; }

  var host = location.hostname;
  var supported = location.protocol === 'https:' ||
    host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
  if (!supported) { return; }

  var refreshing = false;

  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (refreshing) { location.reload(); }
  });

  // 新版 SW 激活后会广播；旧页面也至少能弹出「刷新更新」，
  // 不用等用户下次冷启动。
  navigator.serviceWorker.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'SW_UPDATED') { showUpdate(null); }
  });

  function showUpdate(reg) {
    if (document.getElementById('sw-update')) { return; }

    var bar = document.createElement('div');
    bar.id = 'sw-update';
    bar.className = 'sw-update';
    bar.innerHTML =
      '<span>有新版本可用</span>' +
      '<button type="button" id="sw-update-now">刷新更新</button>' +
      '<button type="button" class="ghost" id="sw-update-later">稍后</button>';
    document.body.appendChild(bar);

    document.getElementById('sw-update-now').addEventListener('click', function () {
      refreshing = true;
      if (reg && reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      } else {
        location.reload();
      }
    });
    document.getElementById('sw-update-later').addEventListener('click', function () {
      if (bar.parentNode) { bar.parentNode.removeChild(bar); }
    });
  }

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').then(function (reg) {
      if (reg.waiting && navigator.serviceWorker.controller) {
        showUpdate(reg);
      }
      reg.addEventListener('updatefound', function () {
        var sw = reg.installing;
        if (!sw) { return; }
        sw.addEventListener('statechange', function () {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdate(reg);
          }
        });
      });
    }).catch(function () {
      // 注册失败不影响游戏；离线能力不可用时仍可在线玩
    });
  });
})();
