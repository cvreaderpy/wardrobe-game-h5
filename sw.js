/*
 * 衣间小日子 — Service Worker（由 tools/build-h5.mjs 生成，不要手改 dist/sw.js）
 *
 * 策略：
 *   - 安装时预缓存整个游戏（同源、无外链）
 *   - 导航请求：网络优先，失败回退缓存（离线打开）
 *   - 静态资源：缓存优先，命中后不再请求网络
 *   - 新版本默认 waiting，由页面提示用户刷新，不强制打断游戏
 *   - 只处理同源 GET 请求
 */
'use strict';

var CACHE_VERSION = 'wardrobe-game-00d40b1b5b3d';
var PRECACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/style.css",
  "./js/data.js",
  "./js/furniture.js",
  "./js/dialogue.js",
  "./js/engine.js",
  "./js/vendor/pixi.min.js",
  "./js/iso/config.js",
  "./js/iso/art/draw.js",
  "./js/iso/textures.js",
  "./js/iso/art/outdoor.js",
  "./js/iso/art/room.js",
  "./js/iso/art/furniture.js",
  "./js/iso/art/looks.js",
  "./js/iso/art/garments.js",
  "./js/iso/art/character.js",
  "./js/iso/art/cat.js",
  "./js/iso/ambient.js",
  "./js/iso/cat.js",
  "./js/iso/stage.js",
  "./js/scene.js",
  "./js/ui.js",
  "./js/main.js",
  "./js/pwa.js",
  "./assets/favicon.svg",
  "./assets/icon-192.png",
  "./assets/icon-512.png"
];
var SCOPE_URL = new URL('./', self.location.href).href;
var INDEX_URL = new URL('index.html', SCOPE_URL).href;

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(function (cache) { return cache.addAll(PRECACHE); })
      .then(function () {
        // 首次安装直接接管；更新版本保持 waiting，等页面按钮
        return self.registration.active ? undefined : self.skipWaiting();
      })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        if (key !== CACHE_VERSION && key.indexOf('wardrobe-game-') === 0) {
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
