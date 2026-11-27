/* 衣间小日子 — SVG → Pixi 纹理缓存 */
(function () {
  var Iso = window.Iso;
  var cache = {};
  var pending = {};

  Iso.tex = {};

  // 低端机 / 手动 ?quality=low：纹理 2× 封顶，减少内存和首帧开销
  Iso.lowQuality = (function () {
    try {
      var q = null;
      var search = (window.location && window.location.search) || '';
      var m = /[?&]quality=(low|high)\b/.exec(search);
      if (m) { q = m[1]; }
      if (!q) { q = window.localStorage && window.localStorage.getItem('yijian_xiaorizi_quality'); }
      if (q === 'low' || q === 'high') {
        try { window.localStorage.setItem('yijian_xiaorizi_quality', q); } catch (e) {}
      }
      if (q === 'low') { return true; }
      if (q === 'high') { return false; }
      var nav = window.navigator || {};
      var mem = nav.deviceMemory;
      var cores = nav.hardwareConcurrency;
      return (typeof mem === 'number' && mem > 0 && mem <= 2) ||
        (typeof cores === 'number' && cores > 0 && cores <= 2);
    } catch (e) {
      return false;
    }
  })();

  Iso.setQuality = function (q) {
    if (q !== 'low' && q !== 'high') { return; }
    Iso.lowQuality = q === 'low';
    try { window.localStorage.setItem('yijian_xiaorizi_quality', q); } catch (e) {}
  };

  Iso.texScale = function () {
    if (Iso.lowQuality) { return 2; }
    var dpr = (window.devicePixelRatio || 1);
    return Math.max(2, Math.min(3, Math.ceil(dpr)));
  };

  Iso.texSpriteScale = function () {
    return 1 / Iso.texScale();
  };

  Iso.tex.get = function (key, art, done, scale) {
    if (!art || !art.vb) { done(null, null); return; }
    var s = scale || 2;
    var ck = key + '@' + s;
    var hit = cache[ck];
    if (hit) {
      hit.used = Date.now();
      if (hit.tex) { done(hit.tex, hit.vb); return; }
      hit.cbs.push(done);
      return;
    }
    pending[ck] = pending[ck] || [];
    pending[ck].push(done);
    if (pending[ck].length > 1) { return; }

    var svg = Iso.draw.svg(art.vb, art.body, s);
    var url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    var img = new Image();
    img.decoding = 'async';
    img.onload = function () {
      var tex = null;
      try { tex = PIXI.Texture.from(img); } catch (e) { tex = null; }
      cache[ck] = { key: key, tex: tex, vb: art.vb, used: Date.now(), cbs: [] };
      var cbs = pending[ck] || [];
      delete pending[ck];
      URL.revokeObjectURL(url);
      cbs.forEach(function (cb) { cb(tex, art.vb); });
    };
    img.onerror = function () {
      cache[ck] = { key: key, tex: null, vb: art.vb, used: Date.now(), cbs: [] };
      var cbs = pending[ck] || [];
      delete pending[ck];
      URL.revokeObjectURL(url);
      cbs.forEach(function (cb) { cb(null, art.vb); });
    };
    img.src = url;
  };

  Iso.tex.image = function (key, url, done) {
    var ck = key + '@img';
    var hit = cache[ck];
    if (hit) {
      hit.used = Date.now();
      if (hit.tex) { done(hit.tex); return; }
      if (hit.cbs) { hit.cbs.push(done); }
      return;
    }
    if (pending[ck]) { pending[ck].push(done); return; }
    pending[ck] = [done];
    var img = new Image();
    img.decoding = 'async';
    img.onload = function () {
      var tex = null;
      try { tex = PIXI.Texture.from(img); } catch (e) { tex = null; }
      cache[ck] = { key: key, tex: tex, used: Date.now(), cbs: [] };
      var cbs = pending[ck] || [];
      delete pending[ck];
      cbs.forEach(function (cb) { cb(tex); });
    };
    img.onerror = function () {
      cache[ck] = { key: key, tex: null, used: Date.now(), cbs: [] };
      var cbs = pending[ck] || [];
      delete pending[ck];
      cbs.forEach(function (cb) { cb(null); });
    };
    img.src = url;
  };

  Iso.tex.trimLRU = function (maxEntries) {
    var now = Date.now();
    var list = [];
    var charPrefixes = ['cb:', 'ch:', 'qb:', 'qh:', 'cback:', 'qback:', 'cshadow', 'qshadow', 'cai:', 'qai:', 'ral:'];
    for (var k in cache) {
      if (!cache[k] || !cache[k].tex) { continue; }
      var isChar = false;
      for (var ci = 0; ci < charPrefixes.length; ci++) {
        if (k.indexOf(charPrefixes[ci]) === 0) { isChar = true; break; }
      }
      if (isChar) { list.push({ k: k, used: cache[k].used }); }
    }
    if (list.length <= maxEntries) { return; }
    list.sort(function (a, b) { return a.used - b.used; });
    var extra = list.length - maxEntries;
    for (var i = 0; i < list.length && extra > 0; i++) {
      var it = list[i];
      if (now - it.used < 15000) { continue; }
      try { cache[it.k].tex.destroy(true); } catch (e) {}
      delete cache[it.k];
      extra--;
    }
  };

  Iso.tex.dropCharacter = function () {
    var charPrefixes = ['cb:', 'ch:', 'qb:', 'qh:', 'cback:', 'qback:', 'cshadow', 'qshadow', 'cai:', 'qai:', 'ral:'];
    for (var k in cache) {
      var bk = (cache[k] && cache[k].key) || k;
      var hit = false;
      for (var ci = 0; ci < charPrefixes.length; ci++) {
        if (bk.indexOf(charPrefixes[ci]) === 0) { hit = true; break; }
      }
      if (!hit) { continue; }
      if (cache[k].tex) { try { cache[k].tex.destroy(true); } catch (e) {} }
      delete cache[k];
    }
  };

  Iso.tex.stats = function () {
    var n = 0;
    for (var k in cache) { if (cache[k].tex) { n += 1; } }
    return n;
  };

  Iso.tex.dropRoomsExcept = function (keep) {
    for (var k in cache) {
      var bk = (cache[k] && cache[k].key) || k;
      if (bk.indexOf('room:') === 0 && bk !== keep) {
        if (cache[k].tex) { try { cache[k].tex.destroy(true); } catch (e) {} }
        delete cache[k];
      }
    }
  };

  Iso.tex.dropPrefixExcept = function (prefix, keys) {
    var set = {};
    keys.forEach(function (k) { set[k] = 1; });
    for (var k in cache) {
      var bk = (cache[k] && cache[k].key) || k;
      if (bk.indexOf(prefix) === 0 && !set[bk]) {
        if (cache[k].tex) { try { cache[k].tex.destroy(true); } catch (e) {} }
        delete cache[k];
      }
    }
  };
})();
