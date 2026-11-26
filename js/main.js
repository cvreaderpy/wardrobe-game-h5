/* 衣间小日子 — 启动与事件 */
(function () {
  function boot() {
    if (!window.UI || !window.Engine) {
      return;
    }
    window.UI.render();
  }

  // 浏览器要求第一次用户手势后才能启动 WebAudio；BGM / 环境声在这里解锁
  function unlockAudio() {
    if (window.Scene && Scene.unlockAudio) { Scene.unlockAudio(); }
  }
  document.addEventListener('pointerdown', unlockAudio, { once: true, passive: true });
  document.addEventListener('keydown', unlockAudio, { once: true });
  document.addEventListener('click', unlockAudio, { once: true });

  document.addEventListener('click', function (e) {
    var el = e.target;
    while (el && el !== document) {
      if (el.getAttribute && el.getAttribute('data-action')) {
        break;
      }
      el = el.parentNode;
    }
    if (!el || el === document) { return; }
    var action = el.getAttribute('data-action');
    var id = el.getAttribute('data-id');
    if (!action || action === 'noop') { return; }
    e.preventDefault();
    if (window.UI) {
      window.UI.handle(action, id);
    }
  });

  window.addEventListener('error', function (e) {
    if (window.UI && e && e.message) {
      window.UI.toast('脚本错误：' + e.message);
    }
  });

  window.addEventListener('unhandledrejection', function (e) {
    if (window.UI) {
      window.UI.toast('出错了，刷新一下试试');
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
