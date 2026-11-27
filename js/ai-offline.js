/* 衣间小日子 — 离线 AI 图层合成
 *
 * 运行时不请求任何服务：只把 assets/hd/offline 里的 WebP 图层
 * 按 manifest.js 的偏移叠在统一底图上。
 */
(function () {
  var A = window.AILook = window.AILook || {};

  // AI 使用范围：
  //   people（默认）：顾客 / 店员 / 店主用 AI，商品图标用人台目录图
  //   fit          ：只有试衣间 / 结果页用 AI，其余矢量
  //   off          ：全部矢量
  //   all          ：兼容旧链接，等同 people
  A.mode = (function () {
    var q = null;
    try {
      var m = /[?&]ai=(people|all|fit|off)\b/.exec((window.location && window.location.search) || '');
      q = m ? m[1] : null;
    } catch (e) {}
    return (q === 'people' || q === 'all' || q === 'fit' || q === 'off') ? q : 'people';
  })();
  A.lookEnabled = function () { return A.mode !== 'off'; };
  A.peopleEnabled = function () { return A.mode === 'people' || A.mode === 'all'; };
  A.iconsEnabled = function () { return A.mode === 'people' || A.mode === 'all'; };

  A.failed = false;
  A.ready = function () {
    return A.lookEnabled() && !!(window.AI_OFFLINE && window.AI_OFFLINE.base) && !A.failed;
  };

  // 点「试穿 / 进试衣间」时先把底图和当前搭配的图层拉下来并解码。
  // 走进试衣间的动画结束时，图通常已经在缓存里了。
  A._preloaded = {};
  A.preload = function (customerId, ids) {
    if (!A.lookEnabled()) { return; }
    var data = A.look(customerId, ids);
    if (!data) { return; }
    var prefix = window.AI_OFFLINE_BASE_PATH || '';
    var files = [data.base.file];
    data.layers.forEach(function (l) { files.push(l.file); });
    files.forEach(function (file) {
      var url = prefix + file;
      if (A._preloaded[url]) { return; }
      A._preloaded[url] = true;
      var im = new Image();
      im.decoding = 'async';
      im.src = url;
      if (im.decode) { im.decode().catch(function () {}); }
    });
  };

  function catOf(ids) {
    var out = {};
    var m = window.AI_OFFLINE || {};
    (ids || []).forEach(function (id) {
      ['tops', 'bottoms', 'shoes', 'dresses', 'outers'].forEach(function (cat) {
        if (m[cat] && m[cat][id]) { out[cat] = id; }
      });
    });
    return out;
  }

  function baseFor(customerId) {
    var m = window.AI_OFFLINE;
    if (m.customers && customerId && m.customers[customerId]) { return m.customers[customerId]; }
    return m.base;
  }

  function imgFor(layer, base, cls) {
    if (!layer) { return ''; }
    var prefix = window.AI_OFFLINE_BASE_PATH || '';
    var left = (layer.x - base.x) / base.w * 100;
    var top = (layer.y - base.y) / base.h * 100;
    var w = layer.w / base.w * 100;
    var h = layer.h / base.h * 100;
    return '<img class="' + (cls || '') + '" src="' + prefix + layer.file + '" alt="" ' +
      'style="left:' + left.toFixed(4) + '%;top:' + top.toFixed(4) + '%;width:' + w.toFixed(4) + '%;height:' + h.toFixed(4) + '%" ' +
      'onload="AILook.layerReady(this)" ' +
      'onerror="this.style.display=\'none\';AILook.layerReady(this)">';
  }

  // 一张图加载完 / 失败都计数；全部到齐后整摞淡入，矢量垫底再淡出。
  A.layerReady = function (img) {
    var stack = img && img.parentNode;
    if (!stack || !stack.getAttribute) { return; }
    var total = parseInt(stack.getAttribute('data-total'), 10) || 0;
    var loaded = (parseInt(stack.getAttribute('data-loaded'), 10) || 0) + 1;
    stack.setAttribute('data-loaded', String(loaded));
    if (loaded < total) { return; }
    stack.classList.add('is-ready');
    var frame = stack.parentNode;
    if (frame && frame.classList) { frame.classList.add('is-ready'); }
  };

  function toneFor(customerId) {
    var m = window.AI_OFFLINE || {};
    var c = m.customers && customerId && m.customers[customerId];
    return (c && c.tone) || 't3';
  }

  function pushSkin(layers, layer, tone) {
    if (!layer || !layer.skin || !layer.skin.tones) { return; }
    var file = layer.skin.tones[tone] || layer.skin.tones.t3;
    if (!file) { return; }
    layers.push({ file: file, x: layer.skin.x, y: layer.skin.y, w: layer.skin.w, h: layer.skin.h });
  }

  A.look = function (customerId, ids) {
    if (!A.ready()) { return null; }
    // 仍需要 manifest；ready 已包含 lookEnabled / failed 判断
    var m = window.AI_OFFLINE;
    var b = baseFor(customerId);
    var tone = toneFor(customerId);
    var cats = catOf(ids);
    var layers = [];
    if (cats.dresses) {
      layers.push(m.dresses[cats.dresses]);
      pushSkin(layers, m.dresses[cats.dresses], tone);
    } else {
      if (cats.bottoms) {
        layers.push(m.bottoms[cats.bottoms]);
        pushSkin(layers, m.bottoms[cats.bottoms], tone);
      }
      if (cats.tops) {
        layers.push(m.tops[cats.tops]);
        pushSkin(layers, m.tops[cats.tops], tone);
      }
    }
    if (!cats.dresses && cats.outers) {
      layers.push(m.outers[cats.outers]);
      pushSkin(layers, m.outers[cats.outers], tone);
    }
    if (cats.shoes) { layers.push(m.shoes[cats.shoes]); }
    return { base: b, tone: tone, layers: layers };
  };

  function attr(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  A.html = function (customerId, ids, opts) {
    var data = A.look(customerId, ids);
    if (!data) { return ''; }
    opts = opts || {};
    var b = data.base;
    var total = 1 + data.layers.length;
    var body = '<img class="ai-base" src="' + (window.AI_OFFLINE_BASE_PATH || '') + b.file + '" alt="" ' +
      'style="left:0;top:0;width:100%;height:100%" ' +
      'onload="AILook.layerReady(this)" ' +
      'onerror="if(window.UI&&UI.lookError)UI.lookError(this)">';
    data.layers.forEach(function (l) { body += imgFor(l, b, 'ai-layer'); });
    // 矢量全身图先垫底（data URI，零请求），AI 图层解码完再淡入。
    var placeholder = opts.fallback
      ? '<img class="ai-look-vector" src="' + attr(opts.fallback) + '" alt="">'
      : '';
    return '<div class="ai-look-frame" data-fallback="' + attr(opts.fallback || '') + '" style="aspect-ratio:' + b.w + '/' + b.h + '">' +
      placeholder +
      '<div class="ai-look-stack' + (opts.cls ? ' ' + opts.cls : '') + '" data-total="' + total + '" data-loaded="0">' + body + '</div></div>';
  };

  A.failedPortraits = {};
  A.markPortraitFailed = function (customerId) {
    if (customerId) { A.failedPortraits[customerId] = true; }
  };

  A.portraitUrl = function (customerId) {
    if (!A.peopleEnabled() || A.failedPortraits[customerId]) { return ''; }
    var m = window.AI_OFFLINE;
    var c = m.customers && customerId && m.customers[customerId];
    if (!c || !c.portrait) { return ''; }
    return (window.AI_OFFLINE_BASE_PATH || '') + c.portrait;
  };

  A.spriteUrl = function (customerId) {
    if (!A.peopleEnabled()) { return ''; }
    var m = window.AI_OFFLINE;
    var c = m.customers && customerId && m.customers[customerId];
    if (!c || !c.sprite) { return ''; }
    return (window.AI_OFFLINE_BASE_PATH || '') + c.sprite;
  };

  var STAFF_F = ['s01', 's03', 's04', 's06', 's07', 's09', 's10', 's11'];
  var STAFF_M = ['s02', 's05', 's08', 's12'];
  var STAFF_MALE = { '大熊': 1, '阿哲': 1, '老周': 1 };
  var STAFF_BY_NAME = {
    '阿 May': 's01', '小林': 's03', '大熊': 's02', '阿哲': 's05',
    '小满': 's04', '阿洛': 's06', '桃子': 's07', '安安': 's09',
    'Kiki': 's10', '老周': 's08', '阿澄': 's11', '小鹿': 's12'
  };

  A.staffAsset = function (m) {
    if (!A.peopleEnabled() || !m) { return null; }
    var staff = window.AI_OFFLINE.staff;
    if (!staff) { return null; }
    var named = STAFF_BY_NAME[m.name];
    if (named && staff[named]) { return staff[named]; }
    var pool = STAFF_MALE[m.name] ? STAFF_M : STAFF_F;
    var s = String(m.uid || m.name || 'staff');
    var h = 0;
    for (var i = 0; i < s.length; i++) { h = ((h * 31) + s.charCodeAt(i)) >>> 0; }
    return staff[pool[h % pool.length]] || null;
  };

  A.staffSpriteUrl = function (m) {
    var a = A.staffAsset(m);
    return a ? ((window.AI_OFFLINE_BASE_PATH || '') + a.file) : '';
  };

  A.failedStaffPortraits = {};
  A.markStaffPortraitFailed = function (m) {
    var a = A.staffAsset(m);
    if (a && a.file) { A.failedStaffPortraits[a.file] = true; }
  };

  A.staffPortraitUrl = function (m) {
    var a = A.staffAsset(m);
    if (!a || A.failedStaffPortraits[a.file]) { return ''; }
    return (window.AI_OFFLINE_BASE_PATH || '') + a.portrait;
  };

  A.keeperUrl = function () {
    if (!A.peopleEnabled() || !window.AI_OFFLINE.keeper) { return ''; }
    return (window.AI_OFFLINE_BASE_PATH || '') + window.AI_OFFLINE.keeper.file;
  };

  A.ownerSpriteUrl = function () {
    if (!A.peopleEnabled() || !window.AI_OFFLINE.owner) { return ''; }
    return (window.AI_OFFLINE_BASE_PATH || '') + window.AI_OFFLINE.owner.file;
  };

  A.ownerPortraitUrl = function () {
    if (!A.peopleEnabled() || !window.AI_OFFLINE.owner) { return ''; }
    return (window.AI_OFFLINE_BASE_PATH || '') + window.AI_OFFLINE.owner.portrait;
  };

  A.failedIcons = {};
  A.markIconFailed = function (id) {
    if (id) { A.failedIcons[id] = true; }
  };

  A.iconUrl = function (id) {
    if (!A.iconsEnabled() || (id && A.failedIcons[id])) { return ''; }
    var m = window.AI_OFFLINE;
    var e = m.icons && id && m.icons[id];
    if (!e) { return ''; }
    return (window.AI_OFFLINE_BASE_PATH || '') + e.file;
  };

  A.swatchUrl = function (id) {
    if (!A.iconsEnabled() || !id) { return ''; }
    var m = window.AI_OFFLINE;
    var e = m.swatches && m.swatches[id];
    return e ? (window.AI_OFFLINE_BASE_PATH || '') + e.file : '';
  };

  A.detailUrl = function (id) {
    if (!A.iconsEnabled() || !id) { return ''; }
    var m = window.AI_OFFLINE;
    var e = m.details && m.details[id];
    return e ? (window.AI_OFFLINE_BASE_PATH || '') + e.file : '';
  };

  A.idsFor = function (selected) { return (selected || []).slice(); };

  // 单文件版没有外置 assets/hd/offline，直接用矢量人物，避免先请求一轮坏图
  if (window.__WARDROBE_SINGLE_FILE__) { A.failed = true; }
})();
