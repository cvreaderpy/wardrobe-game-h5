/*
 * 麦芽与酒花 — Service Worker
 *
 * 由 tools/deploy-pages.mjs 在部署时生成缓存版本，不要手改部署产物。
 *
 * 策略：
 *   - 安装时预缓存整个游戏（只有一个 HTML + 图标）
 *   - 导航请求：网络优先，失败回退缓存（离线打开）
 *   - 静态资源：缓存优先
 *   - 首次安装直接接管；更新版本保持 waiting，避免打断正在玩的这一局
 */
'use strict';

var CACHE_VERSION = 'malt-hops-d1d338e69ab4';
var CACHE_PREFIX = 'malt-hops-';
var PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];
var SCOPE_URL = new URL('./', self.location.href).href;
var INDEX_URL = new URL('index.html', SCOPE_URL).href;

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(function (cache) { return cache.addAll(PRECACHE); })
      .then(function () {
        return self.registration.active ? undefined : self.skipWaiting();
      })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        if (key !== CACHE_VERSION && key.indexOf(CACHE_PREFIX) === 0) {
          return caches.delete(key);
        }
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') { return; }

  var url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) { return; }

  // 页面导航：网络优先（拿到新版本），离线回退缓存
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE_VERSION).then(function (cache) { cache.put(req, copy); });
        }
        return res;
      }).catch(function () {
        return caches.match(req, { ignoreSearch: true }).then(function (hit) {
          return hit || caches.match(INDEX_URL);
        });
      })
    );
    return;
  }

  // 静态资源：缓存优先
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (hit) {
      if (hit) { return hit; }
      return fetch(req).then(function (res) {
        if (res && res.ok && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE_VERSION).then(function (cache) { cache.put(req, copy); });
        }
        return res;
      });
    })
  );
});
