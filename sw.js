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

var CACHE_VERSION = 'wardrobe-game-adc351b9d279';
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
  "./assets/hd/offline/base/generic.webp",
  "./assets/hd/offline/bottoms/b_cargo.webp",
  "./assets/hd/offline/bottoms/b_denimskirt.webp",
  "./assets/hd/offline/bottoms/b_jeans.webp",
  "./assets/hd/offline/bottoms/b_leather.webp",
  "./assets/hd/offline/bottoms/b_pleat.webp",
  "./assets/hd/offline/bottoms/b_shorts.webp",
  "./assets/hd/offline/bottoms/b_skirt.webp",
  "./assets/hd/offline/bottoms/b_tailoredshorts.webp",
  "./assets/hd/offline/bottoms/b_tier.webp",
  "./assets/hd/offline/bottoms/b_wide.webp",
  "./assets/hd/offline/bottoms/b_widejeans.webp",
  "./assets/hd/offline/customers/c01.webp",
  "./assets/hd/offline/customers/c02.webp",
  "./assets/hd/offline/customers/c03.webp",
  "./assets/hd/offline/customers/c04.webp",
  "./assets/hd/offline/customers/c05.webp",
  "./assets/hd/offline/customers/c06.webp",
  "./assets/hd/offline/customers/c07.webp",
  "./assets/hd/offline/customers/c08.webp",
  "./assets/hd/offline/customers/c09.webp",
  "./assets/hd/offline/customers/c10.webp",
  "./assets/hd/offline/customers/c11.webp",
  "./assets/hd/offline/customers/c12.webp",
  "./assets/hd/offline/customers/c13.webp",
  "./assets/hd/offline/customers/c14.webp",
  "./assets/hd/offline/customers/c15.webp",
  "./assets/hd/offline/dresses/d_black.webp",
  "./assets/hd/offline/dresses/d_cn.webp",
  "./assets/hd/offline/dresses/d_flower.webp",
  "./assets/hd/offline/dresses/d_knit.webp",
  "./assets/hd/offline/dresses/d_pinafore.webp",
  "./assets/hd/offline/dresses/d_qipao.webp",
  "./assets/hd/offline/dresses/d_shirt.webp",
  "./assets/hd/offline/dresses/d_slip.webp",
  "./assets/hd/offline/dresses/d_sundress.webp",
  "./assets/hd/offline/dresses/d_wrap.webp",
  "./assets/hd/offline/dresses/d_y2k.webp",
  "./assets/hd/offline/icons/b_cargo.webp",
  "./assets/hd/offline/icons/b_denimskirt.webp",
  "./assets/hd/offline/icons/b_jeans.webp",
  "./assets/hd/offline/icons/b_leather.webp",
  "./assets/hd/offline/icons/b_pleat.webp",
  "./assets/hd/offline/icons/b_shorts.webp",
  "./assets/hd/offline/icons/b_skirt.webp",
  "./assets/hd/offline/icons/b_tailoredshorts.webp",
  "./assets/hd/offline/icons/b_tier.webp",
  "./assets/hd/offline/icons/b_wide.webp",
  "./assets/hd/offline/icons/b_widejeans.webp",
  "./assets/hd/offline/icons/d_black.webp",
  "./assets/hd/offline/icons/d_cn.webp",
  "./assets/hd/offline/icons/d_flower.webp",
  "./assets/hd/offline/icons/d_knit.webp",
  "./assets/hd/offline/icons/d_pinafore.webp",
  "./assets/hd/offline/icons/d_qipao.webp",
  "./assets/hd/offline/icons/d_shirt.webp",
  "./assets/hd/offline/icons/d_slip.webp",
  "./assets/hd/offline/icons/d_sundress.webp",
  "./assets/hd/offline/icons/d_wrap.webp",
  "./assets/hd/offline/icons/d_y2k.webp",
  "./assets/hd/offline/icons/o_blazer.webp",
  "./assets/hd/offline/icons/o_cape.webp",
  "./assets/hd/offline/icons/o_cardigan.webp",
  "./assets/hd/offline/icons/o_denim.webp",
  "./assets/hd/offline/icons/o_denimvest.webp",
  "./assets/hd/offline/icons/o_puffer.webp",
  "./assets/hd/offline/icons/o_quilt.webp",
  "./assets/hd/offline/icons/o_tailored.webp",
  "./assets/hd/offline/icons/o_trench.webp",
  "./assets/hd/offline/icons/o_trenchshort.webp",
  "./assets/hd/offline/icons/s_ballet.webp",
  "./assets/hd/offline/icons/s_boot.webp",
  "./assets/hd/offline/icons/s_chelsea.webp",
  "./assets/hd/offline/icons/s_heel.webp",
  "./assets/hd/offline/icons/s_kitten.webp",
  "./assets/hd/offline/icons/s_loafer.webp",
  "./assets/hd/offline/icons/s_mary.webp",
  "./assets/hd/offline/icons/s_platform.webp",
  "./assets/hd/offline/icons/s_runner.webp",
  "./assets/hd/offline/icons/s_sandal.webp",
  "./assets/hd/offline/icons/s_slipper.webp",
  "./assets/hd/offline/icons/s_sneaker.webp",
  "./assets/hd/offline/icons/t_blouse.webp",
  "./assets/hd/offline/icons/t_cami.webp",
  "./assets/hd/offline/icons/t_cardigan.webp",
  "./assets/hd/offline/icons/t_corset.webp",
  "./assets/hd/offline/icons/t_crop.webp",
  "./assets/hd/offline/icons/t_hoodie.webp",
  "./assets/hd/offline/icons/t_knit.webp",
  "./assets/hd/offline/icons/t_knitvest.webp",
  "./assets/hd/offline/icons/t_oversize.webp",
  "./assets/hd/offline/icons/t_polo.webp",
  "./assets/hd/offline/icons/t_satin.webp",
  "./assets/hd/offline/icons/t_shirt.webp",
  "./assets/hd/offline/icons/t_tee.webp",
  "./assets/hd/offline/icons/t_tube.webp",
  "./assets/hd/offline/icons/t_turtle.webp",
  "./assets/hd/offline/icons/t_vest.webp",
  "./assets/hd/offline/keeper/arm.webp",
  "./assets/hd/offline/manifest.js",
  "./assets/hd/offline/manifest.json",
  "./assets/hd/offline/outers/o_blazer.webp",
  "./assets/hd/offline/outers/o_cape.webp",
  "./assets/hd/offline/outers/o_cardigan.webp",
  "./assets/hd/offline/outers/o_denim.webp",
  "./assets/hd/offline/outers/o_denimvest.webp",
  "./assets/hd/offline/outers/o_puffer.webp",
  "./assets/hd/offline/outers/o_quilt.webp",
  "./assets/hd/offline/outers/o_tailored.webp",
  "./assets/hd/offline/outers/o_trench.webp",
  "./assets/hd/offline/outers/o_trenchshort.webp",
  "./assets/hd/offline/owner/owner-portrait.webp",
  "./assets/hd/offline/owner/owner.webp",
  "./assets/hd/offline/portraits/c01.webp",
  "./assets/hd/offline/portraits/c02.webp",
  "./assets/hd/offline/portraits/c03.webp",
  "./assets/hd/offline/portraits/c04.webp",
  "./assets/hd/offline/portraits/c05.webp",
  "./assets/hd/offline/portraits/c06.webp",
  "./assets/hd/offline/portraits/c07.webp",
  "./assets/hd/offline/portraits/c08.webp",
  "./assets/hd/offline/portraits/c09.webp",
  "./assets/hd/offline/portraits/c10.webp",
  "./assets/hd/offline/portraits/c11.webp",
  "./assets/hd/offline/portraits/c12.webp",
  "./assets/hd/offline/portraits/c13.webp",
  "./assets/hd/offline/portraits/c14.webp",
  "./assets/hd/offline/portraits/c15.webp",
  "./assets/hd/offline/shoes/s_ballet.webp",
  "./assets/hd/offline/shoes/s_boot.webp",
  "./assets/hd/offline/shoes/s_chelsea.webp",
  "./assets/hd/offline/shoes/s_heel.webp",
  "./assets/hd/offline/shoes/s_kitten.webp",
  "./assets/hd/offline/shoes/s_loafer.webp",
  "./assets/hd/offline/shoes/s_mary.webp",
  "./assets/hd/offline/shoes/s_platform.webp",
  "./assets/hd/offline/shoes/s_runner.webp",
  "./assets/hd/offline/shoes/s_sandal.webp",
  "./assets/hd/offline/shoes/s_slipper.webp",
  "./assets/hd/offline/shoes/s_sneaker.webp",
  "./assets/hd/offline/skins/b_denimskirt-t1.webp",
  "./assets/hd/offline/skins/b_denimskirt-t2.webp",
  "./assets/hd/offline/skins/b_denimskirt-t3.webp",
  "./assets/hd/offline/skins/b_denimskirt-t4.webp",
  "./assets/hd/offline/skins/b_denimskirt-t5.webp",
  "./assets/hd/offline/skins/b_pleat-t1.webp",
  "./assets/hd/offline/skins/b_pleat-t2.webp",
  "./assets/hd/offline/skins/b_pleat-t3.webp",
  "./assets/hd/offline/skins/b_pleat-t4.webp",
  "./assets/hd/offline/skins/b_pleat-t5.webp",
  "./assets/hd/offline/skins/b_shorts-t1.webp",
  "./assets/hd/offline/skins/b_shorts-t2.webp",
  "./assets/hd/offline/skins/b_shorts-t3.webp",
  "./assets/hd/offline/skins/b_shorts-t4.webp",
  "./assets/hd/offline/skins/b_shorts-t5.webp",
  "./assets/hd/offline/skins/b_skirt-t1.webp",
  "./assets/hd/offline/skins/b_skirt-t2.webp",
  "./assets/hd/offline/skins/b_skirt-t3.webp",
  "./assets/hd/offline/skins/b_skirt-t4.webp",
  "./assets/hd/offline/skins/b_skirt-t5.webp",
  "./assets/hd/offline/skins/b_tailoredshorts-t1.webp",
  "./assets/hd/offline/skins/b_tailoredshorts-t2.webp",
  "./assets/hd/offline/skins/b_tailoredshorts-t3.webp",
  "./assets/hd/offline/skins/b_tailoredshorts-t4.webp",
  "./assets/hd/offline/skins/b_tailoredshorts-t5.webp",
  "./assets/hd/offline/skins/b_tier-t1.webp",
  "./assets/hd/offline/skins/b_tier-t2.webp",
  "./assets/hd/offline/skins/b_tier-t3.webp",
  "./assets/hd/offline/skins/b_tier-t4.webp",
  "./assets/hd/offline/skins/b_tier-t5.webp",
  "./assets/hd/offline/skins/d_black-t1.webp",
  "./assets/hd/offline/skins/d_black-t2.webp",
  "./assets/hd/offline/skins/d_black-t3.webp",
  "./assets/hd/offline/skins/d_black-t4.webp",
  "./assets/hd/offline/skins/d_black-t5.webp",
  "./assets/hd/offline/skins/d_cn-t1.webp",
  "./assets/hd/offline/skins/d_cn-t2.webp",
  "./assets/hd/offline/skins/d_cn-t3.webp",
  "./assets/hd/offline/skins/d_cn-t4.webp",
  "./assets/hd/offline/skins/d_cn-t5.webp",
  "./assets/hd/offline/skins/d_flower-t1.webp",
  "./assets/hd/offline/skins/d_flower-t2.webp",
  "./assets/hd/offline/skins/d_flower-t3.webp",
  "./assets/hd/offline/skins/d_flower-t4.webp",
  "./assets/hd/offline/skins/d_flower-t5.webp",
  "./assets/hd/offline/skins/d_knit-t1.webp",
  "./assets/hd/offline/skins/d_knit-t2.webp",
  "./assets/hd/offline/skins/d_knit-t3.webp",
  "./assets/hd/offline/skins/d_knit-t4.webp",
  "./assets/hd/offline/skins/d_knit-t5.webp",
  "./assets/hd/offline/skins/d_pinafore-t1.webp",
  "./assets/hd/offline/skins/d_pinafore-t2.webp",
  "./assets/hd/offline/skins/d_pinafore-t3.webp",
  "./assets/hd/offline/skins/d_pinafore-t4.webp",
  "./assets/hd/offline/skins/d_pinafore-t5.webp",
  "./assets/hd/offline/skins/d_qipao-t1.webp",
  "./assets/hd/offline/skins/d_qipao-t2.webp",
  "./assets/hd/offline/skins/d_qipao-t3.webp",
  "./assets/hd/offline/skins/d_qipao-t4.webp",
  "./assets/hd/offline/skins/d_qipao-t5.webp",
  "./assets/hd/offline/skins/d_shirt-t1.webp",
  "./assets/hd/offline/skins/d_shirt-t2.webp",
  "./assets/hd/offline/skins/d_shirt-t3.webp",
  "./assets/hd/offline/skins/d_shirt-t4.webp",
  "./assets/hd/offline/skins/d_shirt-t5.webp",
  "./assets/hd/offline/skins/d_slip-t1.webp",
  "./assets/hd/offline/skins/d_slip-t2.webp",
  "./assets/hd/offline/skins/d_slip-t3.webp",
  "./assets/hd/offline/skins/d_slip-t4.webp",
  "./assets/hd/offline/skins/d_slip-t5.webp",
  "./assets/hd/offline/skins/d_sundress-t1.webp",
  "./assets/hd/offline/skins/d_sundress-t2.webp",
  "./assets/hd/offline/skins/d_sundress-t3.webp",
  "./assets/hd/offline/skins/d_sundress-t4.webp",
  "./assets/hd/offline/skins/d_sundress-t5.webp",
  "./assets/hd/offline/skins/d_wrap-t1.webp",
  "./assets/hd/offline/skins/d_wrap-t2.webp",
  "./assets/hd/offline/skins/d_wrap-t3.webp",
  "./assets/hd/offline/skins/d_wrap-t4.webp",
  "./assets/hd/offline/skins/d_wrap-t5.webp",
  "./assets/hd/offline/skins/d_y2k-t1.webp",
  "./assets/hd/offline/skins/d_y2k-t2.webp",
  "./assets/hd/offline/skins/d_y2k-t3.webp",
  "./assets/hd/offline/skins/d_y2k-t4.webp",
  "./assets/hd/offline/skins/d_y2k-t5.webp",
  "./assets/hd/offline/sprites/c01.webp",
  "./assets/hd/offline/sprites/c02.webp",
  "./assets/hd/offline/sprites/c03.webp",
  "./assets/hd/offline/sprites/c04.webp",
  "./assets/hd/offline/sprites/c05.webp",
  "./assets/hd/offline/sprites/c06.webp",
  "./assets/hd/offline/sprites/c07.webp",
  "./assets/hd/offline/sprites/c08.webp",
  "./assets/hd/offline/sprites/c09.webp",
  "./assets/hd/offline/sprites/c10.webp",
  "./assets/hd/offline/sprites/c11.webp",
  "./assets/hd/offline/sprites/c12.webp",
  "./assets/hd/offline/sprites/c13.webp",
  "./assets/hd/offline/sprites/c14.webp",
  "./assets/hd/offline/sprites/c15.webp",
  "./assets/hd/offline/staff/s01-portrait.webp",
  "./assets/hd/offline/staff/s01.webp",
  "./assets/hd/offline/staff/s02-portrait.webp",
  "./assets/hd/offline/staff/s02.webp",
  "./assets/hd/offline/staff/s03-portrait.webp",
  "./assets/hd/offline/staff/s03.webp",
  "./assets/hd/offline/staff/s04-portrait.webp",
  "./assets/hd/offline/staff/s04.webp",
  "./assets/hd/offline/staff/s05-portrait.webp",
  "./assets/hd/offline/staff/s05.webp",
  "./assets/hd/offline/staff/s06-portrait.webp",
  "./assets/hd/offline/staff/s06.webp",
  "./assets/hd/offline/staff/s07-portrait.webp",
  "./assets/hd/offline/staff/s07.webp",
  "./assets/hd/offline/staff/s08-portrait.webp",
  "./assets/hd/offline/staff/s08.webp",
  "./assets/hd/offline/staff/s09-portrait.webp",
  "./assets/hd/offline/staff/s09.webp",
  "./assets/hd/offline/staff/s10-portrait.webp",
  "./assets/hd/offline/staff/s10.webp",
  "./assets/hd/offline/staff/s11-portrait.webp",
  "./assets/hd/offline/staff/s11.webp",
  "./assets/hd/offline/staff/s12-portrait.webp",
  "./assets/hd/offline/staff/s12.webp",
  "./assets/hd/offline/tops/t_blouse.webp",
  "./assets/hd/offline/tops/t_cami.webp",
  "./assets/hd/offline/tops/t_cardigan.webp",
  "./assets/hd/offline/tops/t_corset.webp",
  "./assets/hd/offline/tops/t_crop.webp",
  "./assets/hd/offline/tops/t_hoodie.webp",
  "./assets/hd/offline/tops/t_knit.webp",
  "./assets/hd/offline/tops/t_knitvest.webp",
  "./assets/hd/offline/tops/t_oversize.webp",
  "./assets/hd/offline/tops/t_polo.webp",
  "./assets/hd/offline/tops/t_satin.webp",
  "./assets/hd/offline/tops/t_shirt.webp",
  "./assets/hd/offline/tops/t_tee.webp",
  "./assets/hd/offline/tops/t_tube.webp",
  "./assets/hd/offline/tops/t_turtle.webp",
  "./assets/hd/offline/tops/t_vest.webp"
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
