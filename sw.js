/*
 * 衣间小日子 — Service Worker（由 tools/build-h5.mjs 生成，不要手改 dist/sw.js）
 *
 * 策略：
 *   - 安装时只预缓存核心运行文件；AI 大图首次用到时按需缓存
 *   - 单个资源失败不会让整次安装失败（旧 cache.addAll 会全有全无）
 *   - 导航请求：网络优先，失败回退缓存（离线打开）
 *   - 静态资源：缓存优先，命中后不再请求网络
 *   - 代码缓存和美术缓存分开：发版只清代码，试衣间图层不用重下
 *   - 新版本 skipWaiting + clients.claim，下一次导航由页面自愈脚本刷新
 *   - 只处理同源 GET 请求
 */
'use strict';

var CACHE_VERSION = 'wardrobe-game-537239a3e4cb';
var ASSET_CACHE = 'wardrobe-assets-v28';
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
  "./js/iso/art/dog.js",
  "./js/iso/ambient.js",
  "./js/iso/cat.js",
  "./js/iso/dog.js",
  "./assets/hd/offline/manifest.js",
  "./js/ai-offline.js",
  "./js/iso/stage.js",
  "./js/scene.js",
  "./js/ui.js",
  "./js/main.js",
  "./js/pwa.js",
  "./assets/favicon.svg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/qr-play.png",
  "./assets/hd/offline/manifest.js",
  "./assets/hd/offline/base/generic.webp"
];
var SCOPE_URL = new URL('./', self.location.href).href;
var INDEX_URL = new URL('index.html', SCOPE_URL).href;

// 只把图片放进长期美术缓存；manifest.js / manifest.json 必须跟着代码版本走，
// 否则发版后会读到旧的图层清单。
function isArtwork(url) {
  return url.pathname.indexOf('/assets/hd/offline/') >= 0 &&
    /\.(webp|png|jpe?g)$/i.test(url.pathname);
}

function cacheFor(url) {
  return isArtwork(url) ? ASSET_CACHE : CACHE_VERSION;
}

// 逐个缓存并吞掉单个文件的失败。cache.addAll 是全有全无：
// 300 多张 AI 图里只要一张网络失败，新 SW 就永远装不上，
// 用户会被旧缓存钉在旧版本上。
function cacheUrls(cache, urls, concurrency) {
  var index = 0;
  function next() {
    if (index >= urls.length) { return Promise.resolve(); }
    var url = urls[index++];
    return fetch(url, { cache: 'reload' }).then(function (res) {
      if (res && res.ok) { return cache.put(url, res); }
    }).catch(function () {}).then(next);
  }
  var jobs = [];
  var n = Math.min(concurrency || 4, urls.length);
  for (var i = 0; i < n; i++) { jobs.push(next()); }
  return Promise.all(jobs);
}

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(function (cache) { return cacheUrls(cache, PRECACHE, 6); })
      .then(function () {
        // 新版本直接接管。旧页面可能还在跑旧 JS，
        // 下一次导航时页面里的 build bootloader 会清缓存并刷新。
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        var codeCache = key.indexOf('wardrobe-game-') === 0 && key !== CACHE_VERSION;
        var assetCache = key.indexOf('wardrobe-assets-') === 0 && key !== ASSET_CACHE;
        if (codeCache || assetCache) {
          return caches.delete(key);
        }
      }));
    }).then(function () { return self.clients.claim(); })
      .then(function () {
        return self.clients.matchAll({ type: 'window' }).then(function (clients) {
          clients.forEach(function (client) {
            try { client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION }); } catch (e) {}
          });
        });
      })
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

  // 静态资源：缓存优先。美术图走独立缓存，发版不失效。
  var target = cacheFor(url);
  event.respondWith(
    caches.open(target)
      .then(function (cache) { return cache.match(req, { ignoreSearch: true }); })
      .then(function (hit) {
        if (hit) { return hit; }
        // 核心预缓存里可能已经有 base/generic.webp，跨缓存兜底一次
        return caches.match(req, { ignoreSearch: true });
      })
      .then(function (hit) {
        if (hit) { return hit; }
        return fetch(req).then(function (res) {
          if (res && res.ok && res.type === 'basic') {
            var copy = res.clone();
            caches.open(target).then(function (cache) { cache.put(req, copy); });
          }
          return res;
        });
      })
  );
});
