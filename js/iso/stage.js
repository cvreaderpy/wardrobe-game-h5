/* 衣间小日子 — 等距矢量舞台 */
(function () {
  var Iso = window.Iso;
  var D = window.GAME_DATA;

  var st = Iso.stage = {
    app: null,
    root: null,
    camera: null,
    bg: null,
    floor: null,
    world: null,
    roomSprite: null,
    furniture: [],
    rig: null,
    ready: false,
    failed: false,
    initializing: false,
    pendingDone: null,
    pendingFail: null,
    last: null,
    key: 'prep',
    w: 480,
    h: 340,
    fit: 1,
    cam: { scale: 1, x: 0, y: 0 },
    camTarget: { scale: 1, x: 0, y: 0 },
    roomKey: '',
    fitKey: '',
    charKey: '',
    char: null,
    staff: null,
    staffList: [],
    staffKey: '',
    staffBaseKey: '',
    staffToken: 0,
    staffSig: '',
    staffSpots: [],
    queueRigs: [],
    queueSpots: [],
    queueKey: '',
    queueToken: 0,
    tags: null,
    pendingGreet: false,
    greetPlaced: null,
    greetedCustomerId: '',
    zoom: 1,
    zoomKey: '',
    focus: null,
    zoomBar: null,
    fitToken: 0,
    roomToken: 0,
    charToken: 0,
    hot: null,
    hint: null,
    speech: null,
    speechText: '',
    speechHold: false,
    choices: null,
    choicesHtml: '',
    catHot: null,
    catHome: null,
    placed: [],
    season: 'spring',
    weather: 'sunny',
    evening: false,
    fx: null,
    fxTex: {},
    camKick: 0,
    fxParts: [],
    burstKey: ''
  };

  var EXPRS = ['calm', 'blink', 'talk', 'happy', 'hesitant', 'surprised'];

  Iso.reducedMotion = false;
  try {
    Iso.reducedMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch (e) { Iso.reducedMotion = false; }

  function nowMs() {
    return (window.performance && performance.now) ? performance.now() : Date.now();
  }

  /* ---------------- 粒子 ---------------- */

  var FX_DEFS = {
    heart: {
      vb: { x: -9, y: -9, w: 18, h: 18 },
      body: '<path d="M0 5 C-2.2 2 -7 0 -7 -3.4 C-7 -6.4 -3 -7.4 -0.4 -4.2 C2 -7.4 7 -6.4 7 -3.4 C7 0 2.2 2 0 5 Z" fill="#E29A9A" stroke="#5B4636" stroke-width="1"/>'
    },
    spark: {
      vb: { x: -8, y: -8, w: 16, h: 16 },
      body: '<path d="M0 -7 L1.7 -1.7 L7 0 L1.7 1.7 L0 7 L-1.7 1.7 L-7 0 L-1.7 -1.7 Z" fill="#E3B23C" stroke="#5B4636" stroke-width=".7"/>'
    },
    coin: {
      vb: { x: -8, y: -8, w: 16, h: 16 },
      body: '<circle cx="0" cy="0" r="7" fill="#E9C05A" stroke="#5B4636" stroke-width="1"/>' +
        '<path d="M-2.6 -2.6H2.6M-2.6 0H2.6M-2 -2.6L0 2.6L2 -2.6" fill="none" stroke="#8C674B" stroke-width="1" stroke-linecap="round"/>'
    },
    confetti: {
      vb: { x: -4, y: -3, w: 8, h: 6 },
      body: '<rect x="-3.4" y="-2.4" width="6.8" height="4.8" rx="1" fill="#FFF9EF" stroke="#5B4636" stroke-width=".7"/>'
    },
    zzz: {
      vb: { x: -7, y: -7, w: 14, h: 14 },
      body: '<path d="M-4 -4H4L-4 4H4" fill="none" stroke="#7C8FA5" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'
    }
  };

  var FX_COLORS = [0xE3B23C, 0xC97B63, 0x8A9A7B, 0xD99A9A, 0x6B7F95, 0xB7A6C9];

  function preloadFx() {
    for (var k in FX_DEFS) {
      (function (key) {
        Iso.tex.get('fx:' + key, FX_DEFS[key], function (tex) {
          if (tex) { st.fxTex[key] = tex; }
        });
      })(k);
    }
  }

  Iso.burst = function (type, x, y, count) {
    if (!st.ready || !st.fx) { return; }
    var tex = st.fxTex[type];
    if (!tex) { return; }
    count = count || 6;
    for (var i = 0; i < count; i++) {
      var sp = new PIXI.Sprite(tex);
      sp.anchor.set(0.5, 0.5);
      sp.scale.set(type === 'confetti' ? 0.55 + Math.random() * 0.45 : 0.6 + Math.random() * 0.4);
      sp.x = x + (Math.random() - 0.5) * 20;
      sp.y = y + (Math.random() - 0.5) * 10;
      if (type === 'confetti') {
        sp.tint = FX_COLORS[(Math.random() * FX_COLORS.length) | 0];
      }
      var vx, vy, g, life, spin;
      if (type === 'heart') {
        vx = (Math.random() - 0.5) * 26; vy = -34 - Math.random() * 28; g = 16;
        life = 900 + Math.random() * 500; spin = (Math.random() - 0.5) * 2;
      } else if (type === 'spark') {
        vx = (Math.random() - 0.5) * 84; vy = -28 - Math.random() * 56; g = 70;
        life = 550 + Math.random() * 420; spin = (Math.random() - 0.5) * 8;
      } else if (type === 'coin') {
        vx = (Math.random() - 0.5) * 60; vy = -70 - Math.random() * 60; g = 180;
        life = 900 + Math.random() * 520; spin = (Math.random() - 0.5) * 6;
      } else if (type === 'confetti') {
        vx = (Math.random() - 0.5) * 120; vy = -60 - Math.random() * 80; g = 150;
        life = 1300 + Math.random() * 800; spin = (Math.random() - 0.5) * 10;
      } else {
        vx = 8 + Math.random() * 8; vy = -14 - Math.random() * 10; g = -6;
        life = 1400; spin = 0;
      }
      st.fx.addChild(sp);
      st.fxParts.push({ sp: sp, vx: vx, vy: vy, g: g, life: life, born: nowMs(), spin: spin });
    }
  };

  function updateFx(now, dt) {
    if (!st.fxParts.length) { return; }
    var k = Math.min(60, dt || 16) / 1000;
    for (var i = st.fxParts.length - 1; i >= 0; i--) {
      var p = st.fxParts[i];
      var age = now - p.born;
      if (age >= p.life) {
        if (p.sp.parent) { p.sp.parent.removeChild(p.sp); }
        p.sp.destroy();
        st.fxParts.splice(i, 1);
        continue;
      }
      p.sp.x += p.vx * k;
      p.sp.y += p.vy * k;
      p.vy += p.g * k;
      p.sp.rotation += p.spin * k;
      p.sp.alpha = Math.min(1, (1 - age / p.life) * 1.8);
    }
  }

  Iso.isAvailable = function () {
    return !st.failed && !!window.PIXI;
  };

  function loadTex(key, art, hi) {
    return new Promise(function (resolve) {
      var scale = hi && Iso.texScale ? Iso.texScale() : 2;
      Iso.tex.get(key, art, function (tex, vb) { resolve({ tex: tex, vb: vb }); }, scale);
    });
  }

  /* ---------------- 相机 ---------------- */

  Iso.resize = function () {
    if (!st.ready || !st.root) { return; }
    var w = st.root.clientWidth || Iso.cfg.W;
    var h = st.root.clientHeight || Iso.cfg.H;
    st.w = w;
    st.h = h;
    st.app.renderer.resize(w, h);
    st.fit = Math.min(w / Iso.cfg.W, h / Iso.cfg.H);
    Iso.updateCameraTarget();
    var t = st.camTarget;
    st.cam.scale = t.scale;
    st.cam.x = t.x;
    st.cam.y = t.y;
    st.camera.scale.set(t.scale);
    st.camera.x = t.x;
    st.camera.y = t.y;
    Iso.updateHotspot();
    Iso.updateStaffTags();
  };

  Iso.updateCameraTarget = function () {
    if (!st.ready) { return; }
    var W = Iso.cfg.W, H = Iso.cfg.H;
    var w = st.w, h = st.h;
    var key = st.key;
    var rig = st.char && st.char.rig;

    // 对话 / 服务 / 结果：镜头推近顾客；其他页面显示整间店
    var focusRig = rig && (key === 'chat' || key === 'service' || key === 'result' || key === 'fitting');
    var base = key === 'chat' ? 1.5 : key === 'service' ? 1.45 : key === 'result' ? 1.34 : key === 'fitting' ? 1.4 : 1;
    if (!focusRig) { base = 1; }
    var zoom = Math.max(0.8, Math.min(2.4, st.zoom)) * base;
    var scale = st.fit * zoom;

    var x, y;
    if (focusRig) {
      var fx = rig._walk ? rig._walk.dest.x : rig.x;
      var fy = rig._walk ? rig._walk.dest.y : rig.y;
      x = w / 2 - fx * scale;
      y = 0;
      // 用户放大后，保证人物还在底部选项上方
      var areaH = h;
      if (key === 'chat' && st.choices && st.choices.offsetHeight) {
        areaH = h - st.choices.offsetHeight - 8;
      }
      var feet = fy * scale;
      if (feet > areaH - 10) { y = areaH - 10 - feet; }
    } else {
      var gx = st.focus ? st.focus.x : W / 2;
      var gy = st.focus ? st.focus.y : H / 2;
      x = w / 2 - gx * scale;
      y = h / 2 - gy * scale;
    }

    if (W * scale <= w) { x = (w - W * scale) / 2; }
    else { x = Math.max(w - W * scale, Math.min(0, x)); }
    if (H * scale <= h) {
      // 对话页底部有选项时，宁可裁掉一点墙顶，也要让人物站在选项上方
      y = focusRig ? Math.min(0, y) : (h - H * scale) / 2;
    } else {
      y = Math.max(h - H * scale, Math.min(0, y));
    }

    st.camTarget = { scale: scale, x: x, y: y };
  };

  /* ---------------- 缩放 ---------------- */

  Iso.setZoom = function (v) {
    st.zoom = Math.max(0.8, Math.min(2.4, v));
    Iso.updateCameraTarget();
  };

  Iso.zoomBy = function (f) {
    Iso.setZoom(st.zoom * (f || 1));
  };

  Iso.zoomReset = function () {
    st.zoom = 1;
    st.focus = null;
    Iso.updateCameraTarget();
  };

  Iso.focusAt = function (px, py) {
    if (!st.ready || st.zoom <= 1.02) { return; }
    var wx = (px - st.cam.x) / st.cam.scale;
    var wy = (py - st.cam.y) / st.cam.scale;
    st.focus = { x: wx, y: wy };
    Iso.updateCameraTarget();
  };

  function bindZoomGestures(canvas) {
    var pinch = null;
    function dist(t) {
      var dx = t[0].clientX - t[1].clientX;
      var dy = t[0].clientY - t[1].clientY;
      return Math.sqrt(dx * dx + dy * dy) || 1;
    }
    canvas.addEventListener('touchstart', function (e) {
      if (e.touches.length === 2) { pinch = { d: dist(e.touches), z: st.zoom }; }
    }, { passive: true });
    canvas.addEventListener('touchmove', function (e) {
      if (e.touches.length === 2 && pinch) {
        e.preventDefault();
        Iso.setZoom(pinch.z * dist(e.touches) / pinch.d);
      }
    }, { passive: false });
    canvas.addEventListener('touchend', function (e) {
      if (!e.touches || e.touches.length < 2) { pinch = null; }
    }, { passive: true });

    var down = null;
    canvas.addEventListener('pointerdown', function (e) {
      down = { x: e.clientX, y: e.clientY };
    });
    canvas.addEventListener('pointerup', function (e) {
      if (!down) { return; }
      var dx = e.clientX - down.x;
      var dy = e.clientY - down.y;
      down = null;
      if (dx * dx + dy * dy > 64 || st.zoom <= 1.02) { return; }
      var r = canvas.getBoundingClientRect();
      var px = (e.clientX - r.left) * (st.w / Math.max(1, r.width));
      var py = (e.clientY - r.top) * (st.h / Math.max(1, r.height));
      Iso.focusAt(px, py);
    });
    canvas.addEventListener('pointercancel', function () { down = null; });
    canvas.addEventListener('wheel', function (e) {
      if (!e.ctrlKey) { return; }
      e.preventDefault();
      Iso.zoomBy(e.deltaY < 0 ? 1.1 : 1 / 1.1);
    }, { passive: false });
  }

  /* ---------------- 初始化 ---------------- */

  Iso.ensure = function (root, done, fail) {
    if (st.failed) { return false; }
    if (st.ready) {
      if (!st.app.canvas.parentNode) {
        root.appendChild(st.app.canvas);
        if (st.tint) { root.appendChild(st.tint); }
        if (st.tags) { root.appendChild(st.tags); }
        if (st.hot) { root.appendChild(st.hot); }
        if (st.hint) { root.appendChild(st.hint); }
        if (st.speech) { root.appendChild(st.speech); }
        if (st.choices) { root.appendChild(st.choices); }
        if (st.zoomBar) { root.appendChild(st.zoomBar); }
        if (st.catHot) { root.appendChild(st.catHot); }
      }
      if (st.root !== root) {
        if (st.app.canvas.parentNode) { st.app.canvas.parentNode.removeChild(st.app.canvas); }
        root.appendChild(st.app.canvas);
        if (st.tint) { root.appendChild(st.tint); }
        if (st.tags) { root.appendChild(st.tags); }
        if (st.hot) { root.appendChild(st.hot); }
        if (st.hint) { root.appendChild(st.hint); }
        if (st.speech) { root.appendChild(st.speech); }
        if (st.choices) { root.appendChild(st.choices); }
        if (st.zoomBar) { root.appendChild(st.zoomBar); }
        if (st.catHot) { root.appendChild(st.catHot); }
        st.root = root;
        Iso.resize();
      }
      if (done) { done(); }
      return true;
    }
    st.pendingDone = done;
    st.pendingFail = fail;
    if (st.initializing) { return true; }
    st.initializing = true;

    var app = new PIXI.Application();
    app.init({
      background: 0xEFE3D2,
      antialias: true,
      resolution: Math.min(2, window.devicePixelRatio || 1),
      autoDensity: true,
      width: root.clientWidth || Iso.cfg.W,
      height: root.clientHeight || Iso.cfg.H
    }).then(function () {
      st.app = app;
      st.root = root;
      st.ready = true;
      st.initializing = false;
      root.appendChild(app.canvas);
      app.canvas.style.width = '100%';
      app.canvas.style.height = '100%';
      app.canvas.style.display = 'block';

      st.camera = new PIXI.Container();
      app.stage.addChild(st.camera);
      st.bg = new PIXI.Container();
      st.floor = new PIXI.Container();
      st.world = new PIXI.Container();
      st.world.sortableChildren = true;
      st.fx = new PIXI.Container();
      st.camera.addChild(st.bg);
      st.camera.addChild(st.floor);
      st.camera.addChild(st.world);
      st.camera.addChild(st.fx);

      st.tint = document.createElement('div');
      st.tint.className = 'iso-tint';
      root.appendChild(st.tint);

      st.hot = document.createElement('div');
      st.hot.className = 'iso-hotspot';
      st.hot.id = 'iso-person';
      root.appendChild(st.hot);

      st.hint = document.createElement('div');
      st.hint.className = 'shop2-drop iso-drop';
      st.hint.textContent = '把她喜欢的衣服放到她身上';
      root.appendChild(st.hint);

      st.speech = document.createElement('div');
      st.speech.className = 'iso-speech';
      st.speech.innerHTML = '<span></span>';
      root.appendChild(st.speech);

      st.choices = document.createElement('div');
      st.choices.className = 'iso-choices';
      root.appendChild(st.choices);
      if (st.choicesHtml) { Iso.setChoices(st.choicesHtml); }

      st.tags = document.createElement('div');
      st.tags.className = 'iso-tags';
      root.appendChild(st.tags);

      st.zoomBar = document.createElement('div');
      st.zoomBar.className = 'iso-zoom';
      st.zoomBar.innerHTML = '<button type="button" data-zoom="out" title="缩小">−</button>' +
        '<button type="button" data-zoom="reset" title="看全店">全景</button>' +
        '<button type="button" data-zoom="in" title="放大">＋</button>' +
        '<button type="button" class="iso-sound" data-action="toggle-sound" title="声音开关">' +
        (window.Scene && Scene.isSoundOn && Scene.isSoundOn() ? '🔊' : '🔇') + '</button>';
      st.zoomBar.addEventListener('click', function (e) {
        var b = e.target;
        while (b && b !== st.zoomBar && !(b.getAttribute && b.getAttribute('data-zoom'))) { b = b.parentNode; }
        if (!b || b === st.zoomBar) { return; }
        var a = b.getAttribute('data-zoom');
        if (a === 'in') { Iso.zoomBy(1.12); }
        else if (a === 'out') { Iso.zoomBy(1 / 1.12); }
        else { Iso.zoomReset(); }
      });
      root.appendChild(st.zoomBar);
      bindZoomGestures(app.canvas);

      st.catHot = document.createElement('div');
      st.catHot.className = 'iso-cat-hot';
      st.catHot.setAttribute('data-action', 'pet-cat');
      st.catHot.setAttribute('role', 'button');
      st.catHot.setAttribute('aria-label', '摸摸店猫');
      st.catHot.innerHTML = '<span class="iso-cat-hint">摸猫</span>';
      root.appendChild(st.catHot);
      preloadFx();

      app.ticker.add(Iso.tick);
      Iso.resize();
      Iso.applySpeech();
      if (window.ResizeObserver) {
        try { new ResizeObserver(function () { Iso.resize(); }).observe(root); } catch (e) {}
      }
      var d = st.pendingDone;
      st.pendingDone = null;
      if (d) { d(); }
    }).catch(function () {
      st.initializing = false;
      st.failed = true;
      if (window.Scene) { Scene._isoOn = false; }
      var f = st.pendingFail;
      st.pendingDone = null;
      st.pendingFail = null;
      if (f) { f(); }
      if (window.UI && UI.render) {
        UI._stageSig = '';
        UI._screenSig = '';
        UI.render();
      }
    });
    return true;
  };

  Iso.mount = function (root, s, key) {
    st.last = { s: s, key: key };
    st.key = key;
    return Iso.ensure(root, function () {
      Iso.setState(st.last.s, st.last.key);
    }, function () {
      if (window.Scene && st.last) {
        root.innerHTML = window.Scene.render(st.last.s, st.last.key);
      }
    });
  };

  Iso.unmount = function () {
    if (st.tags) { st.tags.style.display = 'none'; }
    if (st.hot) { st.hot.style.display = 'none'; }
    if (st.hint) { st.hint.style.display = 'none'; }
    if (st.speech) { st.speech.style.display = 'none'; }
    if (st.choices) { st.choices.style.display = 'none'; }
    if (st.catHot) { st.catHot.style.display = 'none'; }
  };

  /* ---------------- 站位 / 进店路线 ---------------- */

  var N = Iso.cfg.N;

  function tileFree(placed, gx, gy) {
    if (gx < 0.45 || gy < 0.45 || gx > N - 0.45 || gy > N - 0.45) { return false; }
    for (var i = 0; i < placed.length; i++) {
      var f = placed[i];
      if (f.item && (f.item.art === 'rug' || f.item.art === 'round_rug')) { continue; }
      if (gx + 0.35 > f.x && gx - 0.35 < f.x + f.w && gy + 0.35 > f.y && gy - 0.35 < f.y + f.h) {
        return false;
      }
    }
    return true;
  }

  function spotFree(placed, gx, gy, occupied) {
    if (!tileFree(placed, gx, gy)) { return false; }
    for (var i = 0; occupied && i < occupied.length; i++) {
      var o = occupied[i];
      // 用屏幕距离判断，避免两个人在等距视角里前后重叠
      var sx = Math.abs((gx - o.gx) - (gy - o.gy)) * Iso.cfg.TW / 2;
      var sy = Math.abs((gx - o.gx) + (gy - o.gy)) * Iso.cfg.TH / 2;
      if (sx < 50 && sy < 90) { return false; }
    }
    return true;
  }

  function firstFree(placed, prefer, occupied) {
    for (var i = 0; i < prefer.length; i++) {
      if (spotFree(placed, prefer[i][0], prefer[i][1], occupied)) {
        return { gx: prefer[i][0], gy: prefer[i][1] };
      }
    }
    return null;
  }

  function findCounter(placed) {
    for (var i = 0; i < placed.length; i++) {
      if (placed[i].item && placed[i].item.art === 'counter') { return placed[i]; }
    }
    return null;
  }

  function findFitting(placed) {
    for (var i = 0; i < placed.length; i++) {
      if (placed[i].item && placed[i].item.art === 'fitting') { return placed[i]; }
    }
    return null;
  }

  function staffPreferences(placed) {
    var prefs = [];
    var counter = findCounter(placed);
    if (counter) {
      prefs.push([counter.x - 0.9, counter.y + counter.h * 0.5]);
    }
    prefs.push([3.4, 9.6]);
    if (counter) {
      prefs.push([counter.x + counter.w + 0.6, counter.y + counter.h * 0.5]);
    }
    prefs.push([6.8, 6.4]);
    prefs.push([2.4, 3.0]);
    prefs.push([9.0, 8.0]);
    prefs.push([7.9, 2.0]);
    prefs.push([5.0, 2.2]);
    prefs.push([2.2, 7.6]);
    prefs.push([7.6, 8.8]);
    var fitting = findFitting(placed);
    if (fitting) {
      prefs.push([fitting.x - 1.1, fitting.y + fitting.h * 0.5]);
      prefs.push([fitting.x + fitting.w + 0.6, fitting.y + fitting.h * 0.5]);
    }
    return prefs;
  }

  Iso.findStaffSpots = function (placed, count) {
    var prefs = staffPreferences(placed);
    var spots = [];
    for (var i = 0; i < count; i++) {
      var order = [];
      if (prefs[i]) { order.push(prefs[i]); }
      for (var j = 0; j < prefs.length; j++) { order.push(prefs[j]); }
      var spot = firstFree(placed, order, spots);
      if (!spot) {
        for (var gy = N - 2.2; gy >= 2.2 && !spot; gy -= 0.8) {
          for (var gx = 2.2; gx <= N - 2.2; gx += 0.8) {
            if (spotFree(placed, gx, gy, spots)) { spot = { gx: gx, gy: gy }; break; }
          }
        }
      }
      spots.push(spot || { gx: 2.2 + i * 0.6, gy: 2.2 });
    }
    return spots;
  };

  Iso.findGreetSpot = function (placed) {
    var prefs = [[2.8, 1.8], [3.4, 1.2], [2.2, 2.6], [1.6, 2.4], [3.8, 2.4], [4.4, 1.4]];
    for (var i = 0; i < prefs.length; i++) {
      if (tileFree(placed, prefs[i][0], prefs[i][1])) {
        return { gx: prefs[i][0], gy: prefs[i][1] };
      }
    }
    return null;
  };

  /* 店猫喜欢窗边和有地毯的角落，其次收银台旁边 */
  Iso.findCatSpot = function (placed, occupied) {
    var prefs = [[2.4, 6.6], [2.0, 5.2], [3.2, 7.7], [1.8, 3.4], [4.6, 9.2], [2.8, 8.8]];
    var counter = findCounter(placed);
    if (counter) {
      prefs.push([counter.x + counter.w + 0.8, counter.y + counter.h * 0.5]);
      prefs.push([counter.x - 1.2, counter.y + counter.h + 1.2]);
    }
    for (var i = 0; i < prefs.length; i++) {
      if (spotFree(placed, prefs[i][0], prefs[i][1], occupied)) {
        return { gx: prefs[i][0], gy: prefs[i][1] };
      }
    }
    for (var gy = N - 2.2; gy >= 2.2; gy -= 0.7) {
      for (var gx = 1.8; gx <= N - 1.8; gx += 0.7) {
        if (spotFree(placed, gx, gy, occupied)) { return { gx: gx, gy: gy }; }
      }
    }
    return { gx: 2.4, gy: 6.6 };
  };

  function freeCatTile(gx, gy) {
    return spotFree(st.placed || [], gx, gy, []);
  }

  function occupiedSpots() {
    var occ = [];
    for (var i = 0; i < st.staffSpots.length; i++) { occ.push(st.staffSpots[i]); }
    for (var q = 0; q < st.queueSpots.length; q++) { occ.push(st.queueSpots[q]); }
    if (st.char) { occ.push({ gx: st.char.gx, gy: st.char.gy }); }
    return occ;
  }

  function buildAmbient(placed) {
    if (!st.ready || !Iso.ambient || !Iso.ambient.build) { return; }
    Iso.ambient.build({
      camera: st.camera,
      bg: st.bg,
      placed: placed || st.placed || [],
      season: st.season,
      weather: st.weather,
      evening: st.evening
    });
    if (st.fx && st.fx.parent) {
      st.camera.setChildIndex(st.fx, st.camera.children.length - 1);
    }
  }

  function ensureCat(placed) {
    if (!window.Iso || !Iso.catStage || !Iso.catStage.build) { return; }
    var home = Iso.findCatSpot(placed, occupiedSpots());
    st.catHome = home;
    var last = st.last && st.last.s;
    Iso.catStage.build(st.world, {
      seed: (last && last.shopName) || 'yijian',
      home: home,
      isFree: freeCatTile,
      onPet: function (x, y) { Iso.burst('heart', x, y, 7); },
      onMeow: function () { if (window.Scene && Scene.play) { Scene.play('meow'); } },
      onZzz: function (x, y) { Iso.burst('zzz', x, y, 1); }
    });
    if (st.catHot && Iso.catStage.profile) {
      st.catHot.title = '摸摸' + Iso.catStage.profile.name;
    }
    Iso.catStage.ensureFree({ placed: placed, isFree: freeCatTile, home: home });
  }

  Iso.findSpot = function (placed, occupied) {
    var prefer = [
      [5.5, 8.5], [4.8, 8.2], [6.2, 8.0], [5.2, 7.4], [4.4, 9.2],
      [5.8, 9.4], [6.6, 7.4], [3.8, 8.8], [6.0, 6.6], [4.6, 6.6]
    ];
    var spot = firstFree(placed, prefer, occupied);
    if (spot) { return spot; }
    for (var gy = N - 2.2; gy >= 2.2; gy -= 0.8) {
      for (var gx = 2.2; gx <= N - 2.2; gx += 0.8) {
        if (spotFree(placed, gx, gy, occupied)) { return { gx: gx, gy: gy }; }
      }
    }
    return { gx: 5.5, gy: 8.5 };
  };

  /* 进店路线：0.5 格 BFS，绕开家具；找不到就直走 */
  Iso.walkPath = function (placed, from, to, occupied) {
    var step = 0.5;
    var min = 0.5;
    var max = N - 0.5;

    function blocked(gx, gy) {
      if (gx < min || gy < min || gx > max || gy > max) { return true; }
      for (var i = 0; i < placed.length; i++) {
        var f = placed[i];
        if (f.item && (f.item.art === 'rug' || f.item.art === 'round_rug')) { continue; }
        if (gx > f.x - 0.28 && gx < f.x + f.w + 0.28 && gy > f.y - 0.28 && gy < f.y + f.h + 0.28) {
          return true;
        }
      }
      for (var j = 0; occupied && j < occupied.length; j++) {
        var o = occupied[j];
        if (Math.abs(gx - o.gx) < 0.55 && Math.abs(gy - o.gy) < 0.55) { return true; }
      }
      return false;
    }

    var cols = Math.round((max - min) / step) + 1;
    function ix(gx) { return Math.max(0, Math.min(cols - 1, Math.round((gx - min) / step))); }
    function gxOf(i) { return min + i * step; }
    function key(i, j) { return i + ',' + j; }
    var si = ix(from.gx), sj = ix(from.gy);
    var ti = ix(to.gx), tj = ix(to.gy);
    var startKey = key(si, sj);
    var goalKey = key(ti, tj);
    var queue = [[si, sj]];
    var prev = {};
    prev[startKey] = null;
    var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    var found = startKey === goalKey;
    while (queue.length && !found) {
      var cur = queue.shift();
      for (var d = 0; d < dirs.length; d++) {
        var ni = cur[0] + dirs[d][0];
        var nj = cur[1] + dirs[d][1];
        if (ni < 0 || nj < 0 || ni >= cols || nj >= cols) { continue; }
        var k = key(ni, nj);
        if (prev[k] !== undefined) { continue; }
        if (blocked(gxOf(ni), gxOf(nj))) { continue; }
        prev[k] = cur;
        if (k === goalKey) { found = true; break; }
        queue.push([ni, nj]);
      }
    }

    if (!found) { return [from, to]; }

    var raw = [];
    var walk = [ti, tj];
    while (walk) {
      raw.push({ gx: gxOf(walk[0]), gy: gxOf(walk[1]) });
      walk = prev[key(walk[0], walk[1])];
    }
    raw.reverse();
    raw[0] = { gx: from.gx, gy: from.gy };
    raw[raw.length - 1] = { gx: to.gx, gy: to.gy };

    function lineFree(a, b) {
      var n = Math.max(2, Math.ceil(Math.hypot(b.gx - a.gx, b.gy - a.gy) / 0.3));
      for (var i = 1; i < n; i++) {
        var t = i / n;
        if (blocked(a.gx + (b.gx - a.gx) * t, a.gy + (b.gy - a.gy) * t)) { return false; }
      }
      return true;
    }

    var out = [raw[0]];
    var i = 0;
    while (i < raw.length - 1) {
      var j = raw.length - 1;
      for (; j > i + 1; j--) {
        if (lineFree(raw[i], raw[j])) { break; }
      }
      out.push(raw[j]);
      i = j;
    }
    return out;
  };

  /* ---------------- 状态 ---------------- */

  Iso.expressionFor = function (s, key) {
    if (key === 'result' && s && s.pendingResult && s.pendingResult.result) {
      var sc = s.pendingResult.result.score;
      return sc >= 85 ? 'happy' : sc >= 55 ? 'calm' : 'hesitant';
    }
    if (s && s.expression) {
      if (s.expression === 'happy' || s.expression === 'hesitant' || s.expression === 'surprised') { return s.expression; }
    }
    return 'calm';
  };

  function customerState(s, key, customer) {
    var app = Iso.character.appearance(customer);
    var outfit = Iso.character.outfit(s, customer);
    var acc = outfit.acc || {};
    var a2 = {};
    for (var k in app) { a2[k] = app[k]; }
    a2.accEyes = acc.eyes || null;
    a2.accEar = acc.ear || null;
    a2.hat = acc.hair && acc.hair.shape === 'beret' ? acc.hair : null;
    a2.hairClip = acc.hair && acc.hair.shape !== 'beret' ? acc.hair : null;
    var expr = Iso.expressionFor(s, key);
    var pose = s.previewPose || 'stand';
    if (key === 'result' && pose === 'stand') { pose = 'mirror'; }
    return { app: a2, outfit: outfit, expr: expr, pose: pose };
  }

  function headKeyOf(a) {
    return Iso.character.appearanceKey(a) + '|' +
      (a.accEyes ? a.accEyes.id : '') + '|' +
      (a.accEar ? a.accEar.id : '') + '|' +
      (a.hat ? a.hat.id : '') + '|' +
      (a.hairClip ? a.hairClip.id : '');
  }

  function addAvatarParts(rig, texs, expr) {
    var R = (Iso.character && Iso.character.RIG) || { bodyStretch: 1, headScale: 1 };
    var S = R.bodyStretch;
    var hs = R.headScale;
    var base = (Iso.texSpriteScale ? Iso.texSpriteScale() : 0.5);
    if (texs.shadow) {
      var shp = new PIXI.Sprite(texs.shadow);
      shp.anchor.set(0.5, 0.5);
      shp.scale.set(base);
      shp.y = 1;
      shp._baseScale = base;
      rig._shadow = shp;
      rig.addChild(shp);
    }
    var avatar = new PIXI.Container();
    rig.addChild(avatar);
    if (texs.back) {
      var bh = new PIXI.Sprite(texs.back);
      bh.anchor.set(0.5, 1);
      bh.scale.set(base * hs);
      bh.y = -88 * S + 34 * hs;
      avatar.addChild(bh);
    }
    var body = new PIXI.Sprite(texs.body);
    body.anchor.set(0.5, 1);
    body.scale.set(base, base * S);
    body.y = 2 * S;
    avatar.addChild(body);
    var head = new PIXI.Sprite(texs.heads[expr] || texs.heads.calm);
    head.anchor.set(0.5, 1);
    head.scale.set(base * hs);
    head.y = -88 * S;
    avatar.addChild(head);
    return { avatar: avatar, body: body, head: head };
  }

  function updateShadow(rig) {
    var sh = rig && rig._shadow;
    if (!sh) { return; }
    var dir = 1;
    sh.x = 2.4 * dir;
    sh.y = 1.2;
    sh.rotation = 0.035 * dir;
    var base = sh._baseScale || 0.5;
    sh.scale.x = base * (st.evening ? 1.2 : 1.1);
    sh.scale.y = base * 0.96;
  }

  Iso.setState = function (s, key) {
    if (!st.ready || !s) { return; }
    if (st.zoomKey !== key) {
      st.zoomKey = key;
      st.zoom = 1;
      st.focus = null;
    }
    st.key = key;
    Iso.updateStaffTags();
    st.last = { s: s, key: key };

    // 房间
    var cfg = (window.Engine && Engine.getDayConfig) ? Engine.getDayConfig(s.day) : (D.DAYS[0] || {});
    var season = (window.Engine && Engine.getSeason) ? Engine.getSeason(s.day).id : 'spring';
    var weather = cfg.weather || 'sunny';
    var evening = key === 'settle';
    var items = [];
    (s.windowItems || []).forEach(function (id) {
      var it = D.ITEMS_BY_ID[id];
      if (it) { items.push(it); }
    });
    var marketing = s.pendingMarketing || s.marketing || 'none';
    st.season = season;
    st.weather = weather;
    st.evening = evening;
    if (st.root) {
      st.root.dataset.season = season;
      st.root.dataset.weather = weather;
      st.root.dataset.evening = evening ? '1' : '0';
    }
    var rk = [season, weather, evening ? 1 : 0, items.map(function (i) { return i.id; }).join(','), marketing].join('|');
    if (rk !== st.roomKey) {
      st.roomKey = rk;
      st.roomToken += 1;
      var rt = st.roomToken;
      var art = Iso.art.room({ season: season, weather: weather, evening: evening, windowItems: items, marketing: marketing });
      Iso.tex.get('room:' + rk, art, function (tex, vb) {
        if (rt !== st.roomToken || !tex) { return; }
        if (st.roomSprite) {
          st.bg.removeChild(st.roomSprite);
          st.roomSprite.destroy({ texture: false, baseTexture: false });
        }
        var sp = new PIXI.Sprite(tex);
        sp.width = vb.w;
        sp.height = vb.h;
        sp.x = vb.x;
        sp.y = vb.y;
        st.bg.addChild(sp);
        st.roomSprite = sp;
        Iso.tex.dropRoomsExcept('room:' + rk);
        buildAmbient();
      });
    }

    // 家具
    var placed = (window.Engine && Engine.getPlacedFurniture) ? Engine.getPlacedFurniture() : [];
    st.placed = placed;
    var fk = placed.map(function (f) { return f.id + ':' + f.x + ',' + f.y + ',' + (f.rot ? 1 : 0); }).join(';');
    if (fk !== st.fitKey) {
      st.fitKey = fk;
      st.fitToken += 1;
      var ft = st.fitToken;
      var jobs = placed.map(function (f) {
        var art = Iso.art.furniture(f, f.item);
        var k = 'f:' + f.id + ':' + f.x + ',' + f.y + ',' + (f.rot ? 1 : 0);
        return loadTex(k, art).then(function (r) { return { f: f, r: r, k: k }; });
      });
      Promise.all(jobs).then(function (list) {
        if (ft !== st.fitToken) { return; }
        removeFurniture();
        list.forEach(function (o) {
          if (!o.r.tex) { return; }
          var f = o.f, vb = o.r.vb;
          var sp = new PIXI.Sprite(o.r.tex);
          sp.width = vb.w;
          sp.height = vb.h;
          sp.x = vb.x;
          sp.y = vb.y;
          var art = f.item && f.item.art;
          if (!f.rot && (art === 'plant' || art === 'plant_big')) {
            var tw = sp.texture.width;
            var th = sp.texture.height;
            var pvx = tw / 2;
            var pvy = th - 16;
            sp.pivot.set(pvx, pvy);
            sp.x = vb.x + pvx * 0.5;
            sp.y = vb.y + pvy * 0.5;
            sp._sway = { phase: Math.random() * 6.28, amp: 0.012 + Math.random() * 0.009 };
          }
          if (o.r.layer === 'floor' || f.item.art === 'rug') {
            st.floor.addChild(sp);
            st.furniture.push(sp);
          } else {
            sp.zIndex = Iso.sortKey(f.x, f.y, f.w, f.h) * 100;
            st.world.addChild(sp);
            st.furniture.push(sp);
          }
        });
        Iso.tex.dropPrefixExcept('f:', list.map(function (o) { return o.k; }));
        Iso.updateCameraTarget();
        buildAmbient(placed);
      });
    }

    buildStaff(placed);
    buildQueue(placed);
    ensureCat(placed);
    buildAmbient(placed);

    if (key === 'settle') {
      var coinKey = 'settle:' + s.day;
      if (st.burstKey !== coinKey) {
        st.burstKey = coinKey;
        (function (cf) {
          setTimeout(function () {
            if (st.key !== 'settle') { return; }
            var cp = cf ? Iso.P(cf.x + cf.w / 2, cf.y + cf.h / 2, 30) : Iso.P(5.5, 5.5, 24);
            Iso.burst('coin', cp.x, cp.y, 10);
          }, 600);
        })(findCounter(placed));
      }
    }

    // 人物
    var customer = (window.Engine && Engine.currentCustomer) ? Engine.currentCustomer() : null;
    var show = customer && (key === 'chat' || key === 'service' || key === 'result' || key === 'fitting');
    if (!show) {
      removeRig();
      removeQueueRigs();
      st.speechHold = false;
      if (st.hot) { st.hot.style.display = 'none'; }
      if (st.hint) { st.hint.style.display = 'none'; }
      Iso.updateCameraTarget();
      return;
    }
    var cs = customerState(s, key, customer);
    var isNewCustomer = customer.id !== st.lastCustomerId;
    st.speechHold = !!(key === 'chat' && isNewCustomer);
    var bodyKey = Iso.character.appearanceKey(cs.app) + '|' + Iso.character.outfitKey(cs.outfit) + '|' + cs.pose;
    var headKey = headKeyOf(cs.app);
    var baseKey = customer.id + '|' + bodyKey + '|' + headKey;
    var ck = baseKey + '|' + cs.expr;
    if (baseKey === st.charBaseKey && st.char && st.char.rig) {
      st.charKey = ck;
      st.char.expr = cs.expr;
      st.char.rig.baseExpr = cs.expr;
      st.char.rig.head.texture = st.char.rig.heads[cs.expr] || st.char.rig.heads.calm;
      Iso.updateCameraTarget();
      return;
    }

    st.charBaseKey = baseKey;
    st.charKey = ck;
    st.charToken += 1;
    var ct = st.charToken;
    var occupiedForCustomer = (st.staffSpots || []).concat(st.queueSpots || []);
    var spot = null;
    if (key === 'fitting') {
      var fit = findFitting(placed);
      if (fit) {
        var fitPrefs = [
          [fit.x - 1.1, fit.y + fit.h * 0.55],
          [fit.x + fit.w + 0.7, fit.y + fit.h * 0.55],
          [fit.x + fit.w / 2, fit.y + fit.h + 1.1]
        ];
        spot = firstFree(placed, fitPrefs, occupiedForCustomer);
      }
    }
    if (!spot) { spot = Iso.findSpot(placed, occupiedForCustomer); }
    var pos = Iso.P(spot.gx, spot.gy, 0);
    var jobs2 = [];
    var bodyArt = Iso.character.body(cs.app, cs.outfit, cs.pose);
    jobs2.push(loadTex('cb:' + bodyKey, bodyArt, true).then(function (r) { return { k: 'body', r: r }; }));
    EXPRS.forEach(function (e) {
      var ha = Iso.character.head(cs.app, e);
      jobs2.push(loadTex('ch:' + headKey + ':' + e, ha, true).then(function (r) { return { k: e, r: r }; }));
    });
    var back = Iso.character.backHair(cs.app);
    if (back) {
      jobs2.push(loadTex('cback:' + Iso.character.appearanceKey(cs.app), back, true).then(function (r) { return { k: 'back', r: r }; }));
    }
    var sh = Iso.character.shadow();
    jobs2.push(loadTex('cshadow', sh, true).then(function (r) { return { k: 'shadow', r: r }; }));

    Promise.all(jobs2).then(function (list) {
      if (ct !== st.charToken) { return; }
      var texs = { heads: {} };
      list.forEach(function (o) {
        if (!o.r.tex) { return; }
        if (o.k === 'body') { texs.body = o.r.tex; }
        else if (o.k === 'back') { texs.back = o.r.tex; }
        else if (o.k === 'shadow') { texs.shadow = o.r.tex; }
        else { texs.heads[o.k] = o.r.tex; }
      });
      if (!texs.body || !texs.heads.calm) { return; }
      removeRig();
      var rig = new PIXI.Container();
      rig.x = pos.x;
      rig.y = pos.y;
      rig.zIndex = Iso.sortKey(spot.gx, spot.gy, 1, 1) * 100 + 50;
      var parts = addAvatarParts(rig, texs, cs.expr);
      var avatar = parts.avatar, body = parts.body, head = parts.head;
      var scale = 0.72 * (cs.app.height || 1);
      rig.scale.set(scale);
      rig.avatar = avatar;
      rig.head = head;
      rig.body = body;
      rig.heads = texs.heads;
      rig.baseExpr = cs.expr;
      rig._phase = (Math.abs(spot.gx * 7 + spot.gy * 13) % 10) * 0.6;
      rig._nextBlink = 2500 + Math.random() * 2600;
      rig._blinkUntil = 0;
      rig._talkUntil = 0;
      rig._reachUntil = 0;
      rig._gesture = '';
      rig._gestureUntil = 0;
      var targetZ = Iso.sortKey(spot.gx, spot.gy, 1, 1) * 100 + 50;
      if (key === 'chat' && isNewCustomer) {
        var route = Iso.walkPath(placed, { gx: 1.7, gy: 0.6 }, spot, st.staffSpots);
        var pts = route.map(function (pt) { return Iso.P(pt.gx, pt.gy, 0); });
        var total = 0;
        for (var wi = 1; wi < pts.length; wi++) {
          total += Math.hypot(pts[wi].x - pts[wi - 1].x, pts[wi].y - pts[wi - 1].y);
        }
        var now0 = (window.performance && performance.now) ? performance.now() : Date.now();
        rig.x = pts[0].x;
        rig.y = pts[0].y;
        rig.zIndex = 99999;
        rig.alpha = 0;
        rig._walk = {
          pts: pts,
          total: total,
          start: now0,
          dur: Math.max(1300, Math.min(2600, total * 7)),
          z: targetZ,
          dest: pos
        };
        if (window.Scene && Scene.play) { Scene.play('footstep'); }
        if (st.greetedCustomerId !== customer.id) {
          st.greetedCustomerId = customer.id;
          st.greetPlaced = placed;
          st.pendingGreet = true;
          Iso.greetStaff(placed);
        }
        if (Iso.catStage && Iso.catStage.noticeCustomer) { Iso.catStage.noticeCustomer(); }
      }
      st.world.addChild(rig);
      st.lastCustomerId = customer.id;
      st.char = { rig: rig, gx: spot.gx, gy: spot.gy, app: cs.app, outfit: cs.outfit, expr: cs.expr, pose: cs.pose, bodyKey: bodyKey, headKey: headKey };
      if (key === 'result' && s.pendingResult && s.pendingResult.result) {
        var score = s.pendingResult.result.score;
        var bkey = s.day + '|' + customer.id + '|' + score + '|' + (s.pendingResult.itemIds || []).join(',');
        if (score >= 85 && st.burstKey !== bkey) {
          st.burstKey = bkey;
          (function (rr) {
            setTimeout(function () {
              if (st.char && st.char.rig === rr) {
                Iso.burst('confetti', rr.x, rr.y - 118, 22);
                Iso.burst('spark', rr.x, rr.y - 96, 6);
                Iso.camPulse(0.03);
              }
            }, 460);
          })(rig);
        }
      }
      if (st.speechText) { Iso.applySpeech(); }
      if (st.hot) { st.hot.style.display = 'block'; }
      if (st.hint) { st.hint.style.display = 'block'; }
      Iso.updateCameraTarget();
      Iso.updateHotspot();
    });
  };

  function removeFurniture() {
    st.furniture.forEach(function (sp) {
      if (sp.parent) { sp.parent.removeChild(sp); }
      sp.destroy({ texture: false, baseTexture: false });
    });
    st.furniture = [];
  }

  function removeStaffRecord(rec) {
    if (!rec) { return; }
    if (rec.rig) {
      var r = rec.rig;
      if (r.parent) { r.parent.removeChild(r); }
      r.destroy({ children: true, texture: false, baseTexture: false });
      rec.rig = null;
    }
    if (rec.tag && rec.tag.parentNode) { rec.tag.parentNode.removeChild(rec.tag); }
    rec.tag = null;
  }

  function removeAllStaff() {
    for (var i = 0; i < st.staffList.length; i++) { removeStaffRecord(st.staffList[i]); }
    st.staffList = [];
    st.staff = null;
    st.staffSig = '';
    st.staffSpots = [];
  }

  /* ---------------- 多位顾客 / 排队小人 ---------------- */

  function removeQueueRigs() {
    st.queueToken += 1;
    for (var i = 0; i < st.queueRigs.length; i++) {
      var rec = st.queueRigs[i];
      if (!rec || !rec.rig) { continue; }
      if (rec.rig.parent) { rec.rig.parent.removeChild(rec.rig); }
      rec.rig.destroy({ children: true, texture: false, baseTexture: false });
    }
    st.queueRigs = [];
    st.queueSpots = [];
    st.queueKey = '';
  }

  function queuePrefs(placed, status) {
    var prefs = [];
    var fitting = findFitting(placed);
    var counter = findCounter(placed);
    if ((status === 'staffFitting' || status === 'fittingWait') && fitting) {
      prefs.push([fitting.x - 1.2, fitting.y + fitting.h * 0.6]);
      prefs.push([fitting.x + fitting.w + 0.8, fitting.y + fitting.h * 0.6]);
      prefs.push([fitting.x + fitting.w / 2, fitting.y + fitting.h + 1.2]);
    }
    if (status === 'staff' && counter) {
      prefs.push([counter.x - 1.1, counter.y + counter.h * 0.55]);
      prefs.push([counter.x + counter.w + 0.8, counter.y + counter.h * 0.55]);
    }
    prefs.push([2.8, 1.6], [3.7, 2.0], [1.8, 3.2], [4.8, 1.8],
      [2.4, 7.8], [7.4, 8.4], [5.4, 10.4], [8.6, 9.2], [6.2, 3.0]);
    if (fitting) {
      prefs.push([fitting.x - 1.0, fitting.y + fitting.h * 0.5]);
      prefs.push([fitting.x + fitting.w + 0.7, fitting.y + fitting.h * 0.5]);
    }
    return prefs;
  }

  function buildQueue(placed) {
    if (!st.ready || !window.Engine || !Engine.getQueue) { return; }
    var servingId = (Engine.state && Engine.state.servingCustomerId) || '';
    var list = Engine.getQueue().filter(function (r) {
      if (r.id === servingId) { return false; }
      return r.status === 'waiting' || r.status === 'staff' || r.status === 'staffFitting' || r.status === 'fittingWait';
    });
    var sig = list.map(function (r) {
      return r.id + ':' + r.status + ':' + (r.itemIds || []).join(',');
    }).join(';');
    if (sig === st.queueKey) { return; }
    removeQueueRigs();
    st.queueKey = sig;
    if (!list.length) { return; }
    st.queueToken += 1;
    var token = st.queueToken;

    var activeSpot = Iso.findSpot(placed, st.staffSpots || []);
    var occ = (st.staffSpots || []).slice();
    occ.push(activeSpot);

    list.forEach(function (r, index) {
      var customer = (window.GAME_DATA && GAME_DATA.CUSTOMERS_BY_ID && GAME_DATA.CUSTOMERS_BY_ID[r.id]) || null;
      if (!customer) { return; }
      var app = Iso.character.appearance(customer);
      var outfit = Iso.character.outfit({ selectedItems: r.itemIds || [] }, customer);
      var qPose = (r.status === 'staffFitting' || r.status === 'fittingWait') ? 'mirror' : (index % 2 ? 'hip' : 'stand');
      var bodyKey = 'q|' + r.id + '|' + Iso.character.appearanceKey(app) + '|' + Iso.character.outfitKey(outfit) + '|' + qPose;
      var headBase = headKeyOf(app);
      var prefs = queuePrefs(placed, r.status);
      var spot = firstFree(placed, prefs, occ);
      if (!spot) { spot = Iso.findSpot(placed, occ); }
      occ.push(spot);
      st.queueSpots.push(spot);
      var pos = Iso.P(spot.gx, spot.gy, 0);
      var jobs = [];
      jobs.push(loadTex('qb:' + bodyKey, Iso.character.body(app, outfit, qPose), true).then(function (res) { return { k: 'body', r: res }; }));
      ['calm', 'blink', 'hesitant'].forEach(function (e) {
        jobs.push(loadTex('qh:' + headBase + ':' + e, Iso.character.head(app, e), true).then(function (res) { return { k: e, r: res }; }));
      });
      var back = Iso.character.backHair(app);
      if (back) { jobs.push(loadTex('qback:' + Iso.character.appearanceKey(app), back, true).then(function (res) { return { k: 'back', r: res }; })); }
      jobs.push(loadTex('qshadow', Iso.character.shadow(), true).then(function (res) { return { k: 'shadow', r: res }; }));

      Promise.all(jobs).then(function (res) {
        if (token !== st.queueToken) { return; }
        var texs = { heads: {} };
        res.forEach(function (o) {
          if (!o.r || !o.r.tex) { return; }
          if (o.k === 'body') { texs.body = o.r.tex; }
          else if (o.k === 'back') { texs.back = o.r.tex; }
          else if (o.k === 'shadow') { texs.shadow = o.r.tex; }
          else { texs.heads[o.k] = o.r.tex; }
        });
        if (!texs.body || !texs.heads.calm) { return; }
        var rig = new PIXI.Container();
        rig.x = pos.x;
        rig.y = pos.y;
        rig.zIndex = Iso.sortKey(spot.gx, spot.gy, 1, 1) * 100 + 30;
        var parts = addAvatarParts(rig, texs, 'calm');
        var avatar = parts.avatar, body = parts.body, head = parts.head;
        rig.scale.set(0.72 * (app.height || 1));
        rig.avatar = avatar;
        rig.head = head;
        rig.heads = texs.heads;
        rig._phase = (Math.abs(spot.gx * 9 + spot.gy * 17 + index * 7) % 10) * 0.7;
        rig._nextBlink = 1800 + Math.random() * 3200;
        rig._blinkUntil = 0;
        rig._lookAt = 0;
        rig._lookDir = 0;
        st.world.addChild(rig);
        st.queueRigs.push({ id: r.id, status: r.status, patience: r.patience, rig: rig, gx: spot.gx, gy: spot.gy });
      });
    });
  }

  function staffSignature(list, placed) {
    var pk = placed.map(function (f) {
      return f.id + ':' + f.x + ',' + f.y + ',' + (f.rot ? 1 : 0);
    }).join(';');
    return list.map(function (m) { return m.uid; }).join(',') + '|' + pk;
  }

  function buildStaff(placed) {
    var list = (window.Engine && Engine.getStaff) ? Engine.getStaff() : [];
    if (!list.length) {
      removeAllStaff();
      return;
    }
    var sig = staffSignature(list, placed);
    if (sig === st.staffSig && st.staffList.length === list.length) {
      Iso.updateStaffTags();
      return;
    }
    st.staffToken += 1;
    var token = st.staffToken;
    removeAllStaff();
    st.staffSig = sig;

    var spots = Iso.findStaffSpots(placed, list.length);
    st.staffSpots = spots;
    st.staffList = list.map(function () { return null; });

    list.forEach(function (m, index) {
      var app = Iso.character.staffAppearance(m);
      var outfit = Iso.character.staffOutfit(m);
      var bodyKey = 's|' + m.uid + '|' + Iso.character.appearanceKey(app) + '|' + Iso.character.outfitKey(outfit);
      var headKey = headKeyOf(app);
      var spot = spots[index];
      var pos = Iso.P(spot.gx, spot.gy, 0);
      var rec = { uid: m.uid, name: m.name, app: app, gx: spot.gx, gy: spot.gy, skills: m.skills || {}, rig: null, tag: null, _taskAt: 0, _taskStart: 0, _taskUntil: 0, _greet: null };

      if (st.tags) {
        var tag = document.createElement('div');
        tag.className = 'iso-staff-tag';
        tag.textContent = '店员 · ' + m.name;
        tag.style.display = 'none';
        st.tags.appendChild(tag);
        rec.tag = tag;
      }

      var jobs = [];
      jobs.push(loadTex('cb:' + bodyKey, Iso.character.body(app, outfit), true).then(function (r) { return { k: 'body', r: r }; }));
      ['calm', 'blink'].forEach(function (e) {
        jobs.push(loadTex('ch:' + headKey + ':' + e, Iso.character.head(app, e), true).then(function (r) { return { k: e, r: r }; }));
      });
      var back = Iso.character.backHair(app);
      if (back) {
        jobs.push(loadTex('cback:' + Iso.character.appearanceKey(app), back, true).then(function (r) { return { k: 'back', r: r }; }));
      }
      jobs.push(loadTex('cshadow', Iso.character.shadow(), true).then(function (r) { return { k: 'shadow', r: r }; }));

      Promise.all(jobs).then(function (res) {
        if (token !== st.staffToken) { return; }
        var texs = { heads: {} };
        res.forEach(function (o) {
          if (!o.r.tex) { return; }
          if (o.k === 'body') { texs.body = o.r.tex; }
          else if (o.k === 'back') { texs.back = o.r.tex; }
          else if (o.k === 'shadow') { texs.shadow = o.r.tex; }
          else { texs.heads[o.k] = o.r.tex; }
        });
        if (!texs.body || !texs.heads.calm) { return; }
        var rig = new PIXI.Container();
        rig.x = pos.x;
        rig.y = pos.y;
        rig.zIndex = Iso.sortKey(spot.gx, spot.gy, 1, 1) * 100 + 50;
        var parts = addAvatarParts(rig, texs, 'calm');
        var avatar = parts.avatar, body = parts.body, head = parts.head;
        rig.scale.set(0.72 * (app.height || 1));
        rig.avatar = avatar;
        rig.head = head;
        rig.body = body;
        rig.heads = texs.heads;
        rig.baseExpr = 'calm';
        rig._phase = (Math.abs(spot.gx * 11 + spot.gy * 17) % 10) * 0.7;
        rig._nextBlink = 2200 + Math.random() * 2800;
        rig._blinkUntil = 0;
        st.world.addChild(rig);
        rec.rig = rig;
        if (rec.tag) { rec.tag.style.display = 'block'; }
        st.staffList[index] = rec;
        if (index === 0) { st.staff = rec; }
        if (!rec._taskAt) {
          var taskNow = (window.performance && performance.now) ? performance.now() : Date.now();
          rec._taskAt = taskNow + 5000 + Math.random() * 5000;
        }
        if (st.pendingGreet && st.greetPlaced) {
          Iso.greetStaff(st.greetPlaced);
        }
        Iso.updateStaffTags();
      });
    });
  }

  Iso.updateStaffTags = function () {
    if (!st.tags) { return; }
    var show = st.key === 'prep' || st.key === 'brief' || st.key === 'settle';
    st.tags.style.display = show ? 'block' : 'none';
    if (!show) { return; }
    for (var i = 0; i < st.staffList.length; i++) {
      var rec = st.staffList[i];
      if (!rec || !rec.rig || !rec.tag) { continue; }
      var r = rec.rig;
      var sx = st.cam.x + r.x * st.cam.scale;
      var sy = st.cam.y + (r.y - 127 * r.scale.y) * st.cam.scale;
      rec.tag.style.left = sx.toFixed(1) + 'px';
      rec.tag.style.top = sy.toFixed(1) + 'px';
    }
  };

  Iso.greetStaff = function (placed) {
    if (!st.staffList.length) { st.pendingGreet = false; return; }
    var rec = null;
    for (var i = 0; i < st.staffList.length; i++) {
      if (st.staffList[i] && st.staffList[i].rig) { rec = st.staffList[i]; break; }
    }
    if (!rec) { return; }
    if (rec._greet) { st.pendingGreet = false; return; }
    var spot = Iso.findGreetSpot(placed);
    if (!spot) { st.pendingGreet = false; return; }
    var occ = st.staffSpots.filter(function (p) {
      return !(Math.abs(p.gx - rec.gx) < 0.01 && Math.abs(p.gy - rec.gy) < 0.01);
    });
    var route = Iso.walkPath(placed, { gx: rec.gx, gy: rec.gy }, spot, occ);
    if (!route || route.length < 2) { st.pendingGreet = false; return; }
    var pts = route.map(function (pt) {
      var sp = Iso.P(pt.gx, pt.gy, 0);
      return { x: sp.x, y: sp.y, gx: pt.gx, gy: pt.gy };
    });
    var total = 0;
    for (var j = 1; j < pts.length; j++) {
      total += Math.hypot(pts[j].x - pts[j - 1].x, pts[j].y - pts[j - 1].y);
    }
    var now = (window.performance && performance.now) ? performance.now() : Date.now();
    rec._greet = {
      pts: pts,
      total: total,
      start: now,
      dur: Math.max(650, Math.min(1600, total * 5.5)),
      phase: 'to',
      waitUntil: 0,
      waitStart: 0,
      home: { x: rec.rig.x, y: rec.rig.y, gx: rec.gx, gy: rec.gy }
    };
    rec._taskUntil = 0;
    st.pendingGreet = false;
  };

  function staffMoveAlong(rec, p, route, reverse) {
    var g = route;
    if (!g) { return; }
    var pts = reverse ? g.pts.slice().reverse() : g.pts;
    var dist = p * g.total;
    var total = 0;
    var si = 0;
    for (; si < pts.length - 1; si++) {
      var seg = Math.hypot(pts[si + 1].x - pts[si].x, pts[si + 1].y - pts[si].y);
      if (dist <= seg) { break; }
      dist -= seg;
    }
    var pt;
    if (si >= pts.length - 1) {
      pt = pts[pts.length - 1];
    } else {
      var seg2 = Math.hypot(pts[si + 1].x - pts[si].x, pts[si + 1].y - pts[si].y);
      var tr = seg2 > 0 ? dist / seg2 : 0;
      pt = {
        x: pts[si].x + (pts[si + 1].x - pts[si].x) * tr,
        y: pts[si].y + (pts[si + 1].y - pts[si].y) * tr,
        gx: pts[si].gx + (pts[si + 1].gx - pts[si].gx) * tr,
        gy: pts[si].gy + (pts[si + 1].gy - pts[si].gy) * tr
      };
    }
    rec.rig.x = pt.x;
    rec.rig.y = pt.y;
    rec.rig.zIndex = Iso.sortKey(pt.gx, pt.gy, 1, 1) * 100 + 50;
  }

  function staffOccupied(rec) {
    var occ = [];
    for (var i = 0; i < st.staffList.length; i++) {
      var o = st.staffList[i];
      if (o && o !== rec && o.rig) { occ.push({ gx: o.gx, gy: o.gy }); }
    }
    for (var q = 0; q < st.queueSpots.length; q++) { occ.push(st.queueSpots[q]); }
    if (st.char) { occ.push({ gx: st.char.gx, gy: st.char.gy }); }
    return occ;
  }

  /* 店员在岗位附近走两步，做点整理动作再回来 */
  function staffStartTrip(rec, placed, occupied) {
    if (!rec || !rec.rig || rec._greet || rec._trip) { return false; }
    placed = placed || [];
    var target = null;
    for (var i = 0; i < 7 && !target; i++) {
      var a = Math.random() * Math.PI * 2;
      var r = 1.5 + Math.random() * 1.5;
      var gx = rec.gx + Math.cos(a) * r;
      var gy = rec.gy + Math.sin(a) * r;
      if (gx < 1.4 || gy < 1.4 || gx > N - 1.4 || gy > N - 1.4) { continue; }
      if (!spotFree(placed, gx, gy, occupied || [])) { continue; }
      target = { gx: gx, gy: gy };
    }
    if (!target) { return false; }
    var route = Iso.walkPath(placed, { gx: rec.gx, gy: rec.gy }, target, occupied || []);
    if (!route || route.length < 2) { return false; }
    var pts = route.map(function (pt) {
      var sp = Iso.P(pt.gx, pt.gy, 0);
      return { x: sp.x, y: sp.y, gx: pt.gx, gy: pt.gy };
    });
    var total = 0;
    for (var j = 1; j < pts.length; j++) {
      total += Math.hypot(pts[j].x - pts[j - 1].x, pts[j].y - pts[j - 1].y);
    }
    if (total < 18) { return false; }
    var now = nowMs();
    rec._trip = {
      pts: pts,
      total: total,
      start: now,
      dur: Math.max(700, total * 8),
      phase: 'to',
      waitStart: 0,
      waitUntil: 0,
      home: { x: rec.rig.x, y: rec.rig.y, gx: rec.gx, gy: rec.gy }
    };
    rec._taskUntil = 0;
    return true;
  }

  function removeRig() {
    if (st.char && st.char.rig) {
      var r = st.char.rig;
      if (r.parent) { r.parent.removeChild(r); }
      r.destroy({ children: true, texture: false, baseTexture: false });
    }
    st.char = null;
  }

  /* ---------------- 动画 ---------------- */

  Iso.tick = function (ticker) {
    var now = nowMs();
    var t = now / 1000;
    var dt = ticker.deltaMS || 16;

    // 相机缓动
    var tg = st.camTarget;
    var k = Math.min(1, dt / 120);
    st.cam.scale += (tg.scale - st.cam.scale) * k;
    st.cam.x += (tg.x - st.cam.x) * k;
    st.cam.y += (tg.y - st.cam.y) * k;
    st.camKick = (st.camKick || 0) * 0.9;
    st.camera.scale.set(st.cam.scale + st.camKick);
    st.camera.x = st.cam.x;
    st.camera.y = st.cam.y;

    // 环境动效：浮尘 / 天气 / 挂钟 / 灯光
    if (Iso.ambient && Iso.ambient.update) { Iso.ambient.update(now, dt); }

    // 绿植随风轻摆
    for (var fi = 0; fi < st.furniture.length; fi++) {
      var fp = st.furniture[fi];
      if (fp._sway) {
        fp.rotation = Math.sin(t * 0.9 + fp._sway.phase) * fp._sway.amp * (Iso.reducedMotion ? 0.25 : 1);
      }
    }

    var r = st.char && st.char.rig;
    if (r) {
      var phase = r._phase || 0;
      var walking = !!r._walk;
      var bob = Math.sin(t * 1.7 + phase) * 0.95;
      var sway = Math.sin(t * 0.85 + phase) * 0.55;
      var breathe = 1 + Math.sin(t * 2.1 + phase) * 0.007;

      // 偶尔看看别处 / 歪头
      if (!r._lookAt) { r._lookAt = now + 2200 + Math.random() * 3000; }
      if (!walking && now > r._lookAt) {
        r._lookDir = Math.random() < 0.5 ? -1 : 1;
        r._lookUntil = now + 800 + Math.random() * 900;
        r._lookAt = now + 3400 + Math.random() * 4200;
      }
      var lookW = now < (r._lookUntil || 0) ? 1 : 0;

      if (r._walk) {
        var p = Math.min(1, (now - r._walk.start) / r._walk.dur);
        var e = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
        var dist = e * r._walk.total;
        var pts = r._walk.pts;
        var seg = 0;
        var si = 0;
        for (; si < pts.length - 1; si++) {
          seg = Math.hypot(pts[si + 1].x - pts[si].x, pts[si + 1].y - pts[si].y);
          if (dist <= seg) { break; }
          dist -= seg;
        }
        if (si >= pts.length - 1) {
          r.x = r._walk.dest.x;
          r.y = r._walk.dest.y;
        } else {
          var tr = seg > 0 ? dist / seg : 0;
          r.x = pts[si].x + (pts[si + 1].x - pts[si].x) * tr;
          r.y = pts[si].y + (pts[si + 1].y - pts[si].y) * tr;
        }
        r.alpha = Math.min(1, (now - r._walk.start) / 220);
        bob += Math.abs(Math.sin(p * Math.PI * 4)) * 2.4;
        sway += Math.sin(p * Math.PI * 8) * 0.8;
        if (p >= 1) {
          r.x = r._walk.dest.x;
          r.y = r._walk.dest.y;
          r.zIndex = r._walk.z;
          r._walk = null;
          r.alpha = 1;
          st.speechHold = false;
          Iso.applySpeech();
          if (st.speechText) { Iso.talk(1100); }
        }
      }
      var base = r.baseExpr || 'calm';
      if (base === 'happy') { bob -= Math.abs(Math.sin(t * 6 + phase)) * 3; }
      if (base === 'surprised') { bob -= 1.2; }

      var lean = 0;
      if (now < r._reachUntil) {
        r.avatar.rotation = Math.sin((r._reachUntil - now) / 90) * 0.03;
        lean = 0.9;
      } else {
        r.avatar.rotation *= 0.9;
      }
      if (now < r._gestureUntil) {
        if (r._gesture === 'lean') { lean += 1.4; }
        else if (r._gesture === 'joke') { bob -= Math.abs(Math.sin(t * 7 + phase)) * 1.4; }
      }
      r.avatar.y = bob;
      r.avatar.x = sway + lean;
      r.avatar.scale.y = breathe;
      r.avatar.scale.x = 1 - (breathe - 1) * 0.6;

      var tilt = Math.sin(t * 0.9 + phase) * 0.016 + (r._lookDir || 0) * 0.05 * lookW;
      if (base === 'hesitant') { tilt -= 0.07; }
      if (base === 'surprised') { tilt -= 0.035; }
      if (now < r._gestureUntil && r._gesture === 'point') { tilt += 0.05; }
      var headY = -88;
      if (now < r._talkUntil) {
        r.head.texture = r.heads.talk || r.heads.calm;
        tilt += Math.sin(t * 9 + phase) * 0.022;
        headY += Math.sin(t * 7.5 + phase) * 0.7;
      } else if (now < r._blinkUntil) {
        r.head.texture = r.heads.blink || r.heads.calm;
      } else {
        r.head.texture = r.heads[base] || r.heads.calm;
        if (now > r._nextBlink) {
          r._blinkUntil = now + 120;
          r._nextBlink = now + 2600 + Math.random() * 2800;
        }
      }
      r.head.rotation = tilt;
      r.head.y = headY;
      r.head.x = (r._lookDir || 0) * 1.1 * lookW;
      updateShadow(r);
    }

    for (var sri = 0; sri < st.staffList.length; sri++) {
      var rec = st.staffList[sri];
      var sr = rec && rec.rig;
      if (!sr) { continue; }

      if (rec._greet) {
        var g = rec._greet;
        var gp = Math.min(1, (now - g.start) / g.dur);
        var ge = gp < 0.5 ? 2 * gp * gp : -1 + (4 - 2 * gp) * gp;
        if (g.phase === 'to') {
          staffMoveAlong(rec, ge, g, false);
          if (gp >= 1) {
            g.phase = 'wait';
            g.waitStart = now;
            g.waitUntil = now + 900;
            g.start = now;
          }
        } else if (g.phase === 'wait') {
          if (now > g.waitUntil) {
            g.phase = 'back';
            g.start = now;
            g.dur = Math.max(650, Math.min(1600, g.total * 5.5));
          }
        } else {
          staffMoveAlong(rec, ge, g, true);
          if (gp >= 1) {
            sr.x = g.home.x;
            sr.y = g.home.y;
            sr.zIndex = Iso.sortKey(g.home.gx, g.home.gy, 1, 1) * 100 + 50;
            rec._greet = null;
          }
        }
      } else if (rec._trip) {
        var tr = rec._trip;
        var tp = Math.min(1, (now - tr.start) / tr.dur);
        if (tr.phase === 'to') {
          staffMoveAlong(rec, tp, tr, false);
          if (tp >= 1) {
            tr.phase = 'wait';
            tr.waitStart = now;
            tr.waitUntil = now + 900 + Math.random() * 700;
            rec._taskStart = now;
            rec._taskUntil = now + 1000;
          }
        } else if (tr.phase === 'wait') {
          if (now > tr.waitUntil) {
            tr.phase = 'back';
            tr.start = now;
            tr.dur = Math.max(650, tr.total * 8);
          }
        } else {
          staffMoveAlong(rec, tp, tr, true);
          if (tp >= 1) {
            sr.x = tr.home.x;
            sr.y = tr.home.y;
            sr.zIndex = Iso.sortKey(tr.home.gx, tr.home.gy, 1, 1) * 100 + 50;
            rec._trip = null;
            rec._taskAt = now + 6000 + Math.random() * 7000;
          }
        }
      } else if (now > rec._taskAt) {
        var occ = staffOccupied(rec);
        var wentOut = !Iso.reducedMotion && Math.random() < 0.45 && staffStartTrip(rec, st.placed, occ);
        if (!wentOut) {
          rec._taskStart = now;
          rec._taskUntil = now + 700 + Math.random() * 400;
          rec._taskAt = now + 6000 + Math.random() * 6000;
        }
      }
      if (rec._taskUntil && now > rec._taskUntil) { rec._taskUntil = 0; }

      var sp0 = sr._phase || 0;
      var walkBob = (rec._trip || rec._greet) ? Math.abs(Math.sin(t * 7 + sp0)) * 0.9 : 0;
      sr.avatar.y = Math.sin(t * 1.35 + sp0) * 1.0 + walkBob;
      var taskTilt = 0;
      var taskNod = 0;
      if (rec._taskUntil && now < rec._taskUntil) {
        taskTilt = Math.sin((now - rec._taskStart) / 110) * 0.035;
        taskNod = Math.sin((now - rec._taskStart) / 140) * 0.06;
      }
      if (rec._greet && rec._greet.phase === 'wait') {
        taskTilt -= Math.sin(Math.min(1, (now - rec._greet.waitStart) / 320) * Math.PI) * 0.1;
      }
      sr.avatar.rotation = taskTilt;
      if (now < sr._blinkUntil) {
        sr.head.texture = sr.heads.blink || sr.heads.calm;
      } else {
        sr.head.texture = sr.heads.calm;
        if (now > sr._nextBlink) {
          sr._blinkUntil = now + 120;
          sr._nextBlink = now + 3200 + Math.random() * 2800;
        }
      }
      var staffLook = 0;
      if (st.char && st.char.rig) { staffLook = st.char.rig.x >= sr.x ? 0.04 : -0.04; }
      sr.head.rotation = Math.sin(t * 0.6 + sp0) * 0.02 + staffLook + taskNod;
      updateShadow(sr);
    }

    // 排队中的顾客：轻微呼吸 / 眨眼 / 看当前顾客
    for (var qi = 0; qi < st.queueRigs.length; qi++) {
      var qrec = st.queueRigs[qi];
      var qr = qrec && qrec.rig;
      if (!qr) { continue; }
      var qp = qr._phase || 0;
      qr.avatar.y = Math.sin(t * 1.5 + qp) * 0.8;
      qr.avatar.x = Math.sin(t * 0.7 + qp) * 0.35;
      var qb = 1 + Math.sin(t * 2.0 + qp) * 0.006;
      qr.avatar.scale.y = qb;
      qr.avatar.scale.x = 1 - (qb - 1) * 0.5;
      if (!qr._lookAt) { qr._lookAt = now + 2100 + Math.random() * 2600; }
      if (now > qr._lookAt) {
        qr._lookDir = Math.random() < 0.6 ? 1 : -1;
        qr._lookAt = now + 2600 + Math.random() * 3200;
      }
      var qLook = 0;
      if (st.char && st.char.rig) { qLook = st.char.rig.x >= qr.x ? 0.045 : -0.045; }
      if (now < qr._blinkUntil) {
        qr.head.texture = qr.heads.blink || qr.heads.calm;
      } else {
        var qExpr = qrec.status === 'fittingWait' || qrec.status === 'waiting' && qrec.patience <= 1 ? 'hesitant' : 'calm';
        qr.head.texture = qr.heads[qExpr] || qr.heads.calm;
        if (now > qr._nextBlink) {
          qr._blinkUntil = now + 120;
          qr._nextBlink = now + 2600 + Math.random() * 3000;
        }
      }
      qr.head.rotation = Math.sin(t * 0.8 + qp) * 0.02 + qLook;
      updateShadow(qr);
    }

    // 店猫
    var catOcc = [];
    for (var ci = 0; ci < st.staffSpots.length; ci++) { catOcc.push(st.staffSpots[ci]); }
    for (var cq = 0; cq < st.queueSpots.length; cq++) { catOcc.push(st.queueSpots[cq]); }
    if (st.char) { catOcc.push({ gx: st.char.gx, gy: st.char.gy }); }
    if (Iso.catStage && Iso.catStage.update) {
      Iso.catStage.update(now, dt, {
        placed: st.placed || [],
        occupied: catOcc,
        customer: st.char,
        isFree: freeCatTile,
        home: st.catHome
      });
    }

    updateFx(now, dt);
    Iso.updateStaffTags();
    Iso.updateHotspot();
    Iso.updateCatHotspot();
  };

  /* ---------------- 热区 ---------------- */

  Iso.updateHotspot = function () {
    if (!st.ready || !st.hot) { return; }
    var r = st.char && st.char.rig;
    if (!r) {
      st.hot.style.display = 'none';
      if (st.hint) { st.hint.style.display = 'none'; }
      if (st.speech) { st.speech.style.display = 'none'; }
      Iso.updateCatHotspot();
      return;
    }
    var s = r.scale.y;
    var x = r.x - 34 * s;
    var y = r.y - 166 * s;
    var w = 68 * s;
    var h = 166 * s;
    var cx = st.cam.x + x * st.cam.scale;
    var cy = st.cam.y + y * st.cam.scale;
    var cw = w * st.cam.scale;
    var ch = h * st.cam.scale;
    st.hot.style.display = 'block';
    st.hot.style.left = cx.toFixed(1) + 'px';
    st.hot.style.top = cy.toFixed(1) + 'px';
    st.hot.style.width = cw.toFixed(1) + 'px';
    st.hot.style.height = ch.toFixed(1) + 'px';
    if (st.hint) {
      st.hint.style.display = 'block';
      st.hint.style.left = (cx + cw / 2).toFixed(1) + 'px';
      st.hint.style.top = Math.max(2, cy - 26).toFixed(1) + 'px';
    }
    if (st.speech && st.speechText) {
      st.speech.style.display = 'block';
      var bx = Math.max(84, Math.min(st.w - 84, cx + cw / 2));
      var by = Math.max(52, cy - 2);
      st.speech.style.left = bx.toFixed(1) + 'px';
      st.speech.style.top = by.toFixed(1) + 'px';
    }
    Iso.updateCatHotspot();
  };

  Iso.updateCatHotspot = function () {
    if (!st.ready || !st.catHot) { return; }
    var cr = Iso.catStage && Iso.catStage.rig;
    if (!cr || !st.catHot.parentNode) {
      st.catHot.style.display = 'none';
      return;
    }
    var sc = Math.abs(cr.scale.x) || 0.78;
    var x = cr.x - 26 * sc;
    var y = cr.y - 42 * sc;
    var w = 52 * sc;
    var h = 44 * sc;
    var cx = st.cam.x + x * st.cam.scale;
    var cy = st.cam.y + y * st.cam.scale;
    var cw = w * st.cam.scale;
    var ch = h * st.cam.scale;
    st.catHot.style.display = 'block';
    st.catHot.style.left = cx.toFixed(1) + 'px';
    st.catHot.style.top = cy.toFixed(1) + 'px';
    st.catHot.style.width = cw.toFixed(1) + 'px';
    st.catHot.style.height = ch.toFixed(1) + 'px';
  };

  /* ---------------- 对话气泡 ---------------- */

  Iso.setChoices = function (html) {
    html = html || '';
    if (!st.choices) { st.choicesHtml = html; return; }
    if (html === st.choicesHtml && st.choices.style.display === 'flex') { return; }
    st.choicesHtml = html;
    if (!html) {
      st.choices.classList.remove('show');
      st.choices.style.display = 'none';
      st.choices.innerHTML = '';
      return;
    }
    st.choices.innerHTML = html;
    st.choices.style.display = 'flex';
    st.choices.classList.remove('show');
    void st.choices.offsetWidth;
    st.choices.classList.add('show');
    Iso.updateCameraTarget();
  };

  Iso.setSpeech = function (text) {
    st.speechText = text || '';
    Iso.applySpeech();
  };

  Iso.applySpeech = function () {
    if (!st.speech) { return; }
    var span = st.speech.querySelector('span');
    var text = st.speechText;
    var rig = st.char && st.char.rig;
    if (text && (st.speechHold || (rig && rig._walk))) {
      st.speech.style.display = 'none';
      return;
    }
    if (!text) {
      st.speech.classList.remove('show');
      st.speech.style.display = 'none';
      return;
    }
    var changed = !span || span.textContent !== text;
    if (span) { span.textContent = text; }
    st.speech.style.display = 'block';
    if (changed) {
      st.speech.classList.remove('show');
      void st.speech.offsetWidth;
      st.speech.classList.add('show');
      Iso.talk(Math.min(2200, 900 + text.length * 26));
    }
    Iso.updateHotspot();
  };

  /* ---------------- 外部动作 ---------------- */

  Iso.talk = function (ms) {
    var r = st.char && st.char.rig;
    if (!r) { return; }
    var now = (window.performance && performance.now) ? performance.now() : Date.now();
    r._talkUntil = now + (ms || 1000);
  };

  Iso.snapshot = function () {
    if (!st.ready || !st.app || !st.app.renderer) { return null; }
    try {
      var canvas = st.app.renderer.extract.canvas(st.app.stage);
      return canvas.toDataURL('image/png');
    } catch (e) {
      return null;
    }
  };

  Iso.camPulse = function (amount) {
    if (Iso.reducedMotion) { return; }
    st.camKick = Math.max(st.camKick || 0, amount || 0.02);
  };

  Iso.pulse = function (name) {
    var r = st.char && st.char.rig;
    if (!r) { return; }
    var now = nowMs();
    if (name === 'happy') { Iso.camPulse(0.018); }
    if (name === 'reach') {
      r._reachUntil = now + 900;
      Iso.burst('spark', r.x, r.y - 78, 5);
    }
    if (name === 'happy') {
      r._gesture = 'happy';
      r._gestureUntil = now + 900;
      Iso.burst('heart', r.x, r.y - 108, 4);
    }
  };

  Iso.petCat = function () {
    if (!Iso.catStage || !Iso.catStage.pet) { return false; }
    return Iso.catStage.pet();
  };

  Iso.gesture = function (name) {
    var r = st.char && st.char.rig;
    if (!r) { return; }
    var now = (window.performance && performance.now) ? performance.now() : Date.now();
    r._gesture = name || '';
    r._gestureUntil = now + 1000;
  };
})();
