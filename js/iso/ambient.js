/* 衣间小日子 — 店内环境动效（浮尘 / 窗外天气 / 挂钟 / 吊灯光晕 / 钟摆） */
(function () {
  var Iso = window.Iso;
  var D = Iso.draw;
  var GD = window.GAME_DATA;

  var amb = Iso.ambient = {
    back: null,
    top: null,
    sig: ''
  };

  var state = {
    token: 0,
    weather: 'sunny',
    motes: [],
    rain: [],
    snow: [],
    petals: [],
    clock: null,
    pendulums: [],
    lamps: [],
    light: null,
    phase: 0
  };

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function nowMs() { return (window.performance && performance.now) ? performance.now() : Date.now(); }
  function reduced() { return !!Iso.reducedMotion; }

  function tex(key, art, cb) {
    Iso.tex.get(key, art, function (t, vb) { cb(t, vb); });
  }

  function beamArt() {
    var win = Iso.cfg.WIN || { y1: 2.2, y2: 7.4 };
    var y1 = win.y1, y2 = win.y2;
    var outer = [Iso.P(0, y1, 0), Iso.P(0, y2, 0), Iso.P(3.4, y2 + 1.2, 0), Iso.P(3.4, y1 + 1.2, 0)];
    var inner = [Iso.P(0, y1 + 0.5, 0), Iso.P(0, y2 - 1.0, 0), Iso.P(2.6, y2 - 0.1, 0), Iso.P(2.6, y1 + 0.7, 0)];
    var xs = [], ys = [];
    outer.concat(inner).forEach(function (p) { xs.push(p.x); ys.push(p.y); });
    var x0 = Math.min.apply(null, xs) - 6;
    var y0 = Math.min.apply(null, ys) - 6;
    var x1 = Math.max.apply(null, xs) + 6;
    var y1 = Math.max.apply(null, ys) + 6;
    function pts(list) {
      return list.map(function (p) { return p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' ');
    }
    var body = '<polygon points="' + pts(outer) + '" fill="#FFF3CE" opacity=".42"/>' +
      '<polygon points="' + pts(inner) + '" fill="#FFF9EF" opacity=".3"/>';
    return { vb: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, body: body };
  }

  function windowPoint(gy, z) {
    return Iso.P(0, gy, z);
  }

  amb.build = function (opts) {
    opts = opts || {};
    if (!opts.camera || !opts.bg) { return; }
    var placed = opts.placed || [];
    var pieces = placed.map(function (f) {
      var d = (GD && GD.FURNITURE_BY_ID && GD.FURNITURE_BY_ID[f.id]) || f.item || {};
      if (d.art !== 'lamp' && d.art !== 'clock') { return ''; }
      return d.art + ':' + f.x + ',' + f.y + ',' + (f.rot ? 1 : 0);
    }).join(';');
    var sig = [opts.season || '', opts.weather || 'sunny', opts.evening ? 1 : 0, pieces].join('|');
    if (sig === amb.sig && amb.back) { return; }

    amb.destroy();
    amb.sig = sig;
    state.token += 1;
    var token = state.token;
    state.weather = opts.weather || 'sunny';
    state.motes = [];
    state.rain = [];
    state.snow = [];
    state.petals = [];
    state.pendulums = [];
    state.lamps = [];
    state.clock = null;
    state.light = null;
    state.phase = Math.random() * 6.28;
    var win = Iso.cfg.WIN || { y1: 2.2, y2: 7.4, z1: 42, z2: 96 };

    var camera = opts.camera;
    var idx = camera.getChildIndex(opts.bg);
    var back = new PIXI.Container();
    var top = new PIXI.Container();
    camera.addChildAt(back, idx + 1);
    camera.addChild(top);
    amb.back = back;
    amb.top = top;

    // 窗光 + 呼吸
    tex('amb:light', beamArt(), function (t, vb) {
      if (token !== state.token || !t) { return; }
      var sp = new PIXI.Sprite(t);
      sp.x = vb.x;
      sp.y = vb.y;
      sp.width = vb.w;
      sp.height = vb.h;
      sp.alpha = 0.9;
      back.addChild(sp);
      state.light = sp;
    });

    // 浮尘
    tex('amb:mote', {
      vb: { x: -2, y: -2, w: 4, h: 4 },
      body: '<circle cx="0" cy="0" r="1.7" fill="#FFF6DD"/>'
    }, function (t) {
      if (token !== state.token || !t) { return; }
      for (var i = 0; i < 12; i++) {
        var sp = new PIXI.Sprite(t);
        sp.anchor.set(0.5, 0.5);
        sp.tint = 0xFFF3CE;
        sp.alpha = rnd(0.2, 0.5);
        sp.scale.set(rnd(0.35, 0.8));
        var m = {
          sp: sp,
          gx: rnd(0.4, 3.4),
          gy: rnd(win.y1 + 0.6, win.y2 - 0.3),
          z: rnd(win.z1 + 6, win.z2 + 4),
          vy: rnd(1.5, 5),
          wob: rnd(0, 6.28)
        };
        placeMote(m);
        back.addChild(sp);
        state.motes.push(m);
      }
    });

    // 窗外天气
    var rainy = state.weather === 'rain' || state.weather === 'thunder' || state.weather === 'downpour';
    var snowy = state.weather === 'cold' || state.weather === 'snow' || state.weather === 'coldwave';
    if (rainy) {
      tex('amb:rain', {
        vb: { x: -1.2, y: -6, w: 2.4, h: 12 },
        body: '<path d="M0 -5L-1 5" stroke="#9DBBC2" stroke-width="1.5" stroke-linecap="round" opacity=".85"/>'
      }, function (t) {
        if (token !== state.token || !t) { return; }
        var n = state.weather === 'downpour' ? 24 : 16;
        for (var i = 0; i < n; i++) {
          var sp = new PIXI.Sprite(t);
          sp.anchor.set(0.5, 0.5);
          var r = { sp: sp, gy: rnd(win.y1 + 0.3, win.y2 - 0.3), z: rnd(win.z1 + 8, win.z2), speed: rnd(26, 44) * (state.weather === 'downpour' ? 1.5 : 1) };
          placeWeather(r);
          back.addChild(sp);
          state.rain.push(r);
        }
      });
    } else if (snowy) {
      tex('amb:snow', {
        vb: { x: -2.5, y: -2.5, w: 5, h: 5 },
        body: '<circle cx="0" cy="0" r="1.7" fill="#FFFFFF" opacity=".92"/>'
      }, function (t) {
        if (token !== state.token || !t) { return; }
        for (var i = 0; i < 16; i++) {
          var sp = new PIXI.Sprite(t);
          sp.anchor.set(0.5, 0.5);
          sp.scale.set(rnd(0.6, 1.15));
          var r = { sp: sp, gy: rnd(win.y1 + 0.3, win.y2 - 0.3), z: rnd(win.z1 + 8, win.z2), speed: rnd(6, 13), wob: rnd(0, 6.28) };
          placeWeather(r);
          back.addChild(sp);
          state.snow.push(r);
        }
      });
    }

    // 季节粒子：春花瓣 / 秋落叶
    var season = opts.season || 'spring';
    if (season === 'spring' || season === 'autumn') {
      var isPetal = season === 'spring';
      tex(isPetal ? 'amb:petal' : 'amb:leaf', {
        vb: { x: -5, y: -4, w: 10, h: 8 },
        body: isPetal
          ? '<ellipse cx="0" cy="0" rx="3.4" ry="2" fill="#F3B7C6" stroke="#D99A9A" stroke-width=".5" opacity=".9"/>'
          : '<path d="M-4 0 Q-1 -4 4 -1 Q1 4 -4 0Z" fill="#D2783D" stroke="#A85A34" stroke-width=".5" opacity=".9"/>'
      }, function (t) {
        if (token !== state.token || !t) { return; }
        for (var i = 0; i < 10; i++) {
          var sp = new PIXI.Sprite(t);
          sp.anchor.set(0.5, 0.5);
          sp.scale.set(rnd(0.5, 0.95));
          var p = { sp: sp, gy: rnd(win.y1 + 0.4, win.y2 - 0.4), z: rnd(win.z1 + 10, win.z2), speed: rnd(3, 8), wob: rnd(0, 6.28), spin: rnd(-0.4, 0.4) };
          placeWeather(p);
          sp.rotation = rnd(0, 6.28);
          back.addChild(sp);
          state.petals.push(p);
        }
      });
    }

    // 墙上挂钟：时针固定，分针缓慢转动
    var clockArt = function (len, w, color) {
      return {
        vb: { x: -1.4, y: -len, w: 2.8, h: len },
        body: '<path d="M0 0L0 ' + (-len + 1.4) + '" stroke="' + color + '" stroke-width="' + w + '" stroke-linecap="round"/>'
      };
    };
    var clockPos = Iso.P(12.0, 0, 88);
    tex('amb:clockHour', clockArt(4.6, 1.9, '#5B4636'), function (t) {
      if (token !== state.token || !t) { return; }
      var sp = new PIXI.Sprite(t);
      sp.anchor.set(0.5, 1);
      sp.x = clockPos.x;
      sp.y = clockPos.y;
      sp.rotation = -0.95;
      back.addChild(sp);
    });
    tex('amb:clockMin', clockArt(7.2, 1.15, '#5B4636'), function (t) {
      if (token !== state.token || !t) { return; }
      var sp = new PIXI.Sprite(t);
      sp.anchor.set(0.5, 1);
      sp.x = clockPos.x;
      sp.y = clockPos.y;
      back.addChild(sp);
      state.clock = sp;
    });

    // 家具细节：吊灯光晕 + 落地钟摆
    var lampArt = {
      vb: { x: -38, y: -38, w: 76, h: 76 },
      body: '<defs><radialGradient id="ambLamp"><stop offset="0" stop-color="#FFE1A3" stop-opacity=".5"/>' +
        '<stop offset=".5" stop-color="#FFE1A3" stop-opacity=".18"/>' +
        '<stop offset="1" stop-color="#FFE1A3" stop-opacity="0"/></radialGradient></defs>' +
        '<circle cx="0" cy="0" r="37" fill="url(#ambLamp)"/>'
    };
    var pendArt = {
      vb: { x: -5, y: 0, w: 10, h: 25 },
      body: '<path d="M0 0V18" stroke="#8C674B" stroke-width="1.4"/>' +
        '<circle cx="0" cy="21" r="3.4" fill="#E3B23C" stroke="#5B4636" stroke-width=".9"/>'
    };

    placed.forEach(function (f) {
      var def = (GD && GD.FURNITURE_BY_ID && GD.FURNITURE_BY_ID[f.id]) || f.item || null;
      if (!def) { return; }
      var rot = f.rot ? 1 : 0;
      var w = rot ? def.h : def.w;
      var d = rot ? def.w : def.h;
      var center = Iso.P(f.x + w / 2, f.y + d / 2, 0);
      if (def.art === 'lamp') {
        tex('amb:lampGlow', lampArt, function (t) {
          if (token !== state.token || !t) { return; }
          var sp = new PIXI.Sprite(t);
          sp.anchor.set(0.5, 0.5);
          sp.x = center.x;
          sp.y = center.y - 70;
          sp.alpha = 0.7;
          sp.blendMode = 'add';
          top.addChild(sp);
          state.lamps.push({ sp: sp, phase: rnd(0, 6.28) });
        });
      } else if (def.art === 'clock') {
        tex('amb:pendulum', pendArt, function (t) {
          if (token !== state.token || !t) { return; }
          var sp = new PIXI.Sprite(t);
          sp.anchor.set(0.5, 0);
          sp.x = center.x;
          sp.y = center.y - 47;
          top.addChild(sp);
          state.pendulums.push({ sp: sp, phase: rnd(0, 6.28) });
        });
      }
    });
  };

  function placeMote(m) {
    var p = Iso.P(m.gx, m.gy, m.z);
    m.sp.x = p.x;
    m.sp.y = p.y;
  }

  function placeWeather(r) {
    var p = windowPoint(r.gy, r.z);
    r.sp.x = p.x;
    r.sp.y = p.y;
  }

  amb.update = function (now, dt) {
    if (!amb.back) { return; }
    dt = Math.min(60, Math.max(0, dt || 16));
    var t = now / 1000;
    var win = Iso.cfg.WIN || { y1: 2.2, y2: 7.4, z1: 42, z2: 96 };
    if (reduced()) {
      if (state.light) { state.light.alpha = 0.84; }
      return;
    }
    var slow = 1;

    // 浮尘：在窗光里慢慢上升
    for (var i = 0; i < state.motes.length; i++) {
      var m = state.motes[i];
      m.z += m.vy * dt / 1000 * slow;
      m.gy += Math.sin(t * 0.5 + m.wob) * dt / 1000 * 0.03 * slow;
      if (m.z > win.z2 + 4) {
        m.z = win.z1 + 4;
        m.gx = rnd(0.4, 3.4);
        m.gy = rnd(win.y1 + 0.6, win.y2 - 0.3);
      }
      placeMote(m);
      m.sp.alpha = 0.22 + Math.abs(Math.sin(t * 0.8 + m.wob)) * 0.28;
    }

    // 雨
    for (var ri = 0; ri < state.rain.length; ri++) {
      var r = state.rain[ri];
      r.z -= r.speed * dt / 1000 * slow;
      if (r.z < win.z1 + 6) {
        r.z = win.z2 - 1 + Math.random() * 4;
        r.gy = rnd(win.y1 + 0.3, win.y2 - 0.3);
      }
      placeWeather(r);
    }

    // 雪
    for (var si = 0; si < state.snow.length; si++) {
      var sn = state.snow[si];
      sn.z -= sn.speed * dt / 1000 * slow;
      sn.gy += Math.sin(t * 0.7 + sn.wob) * dt / 1000 * 0.06;
      if (sn.z < win.z1 + 6 || sn.gy > win.y2 - 0.2) {
        sn.z = win.z2 - 2 + Math.random() * 4;
        sn.gy = rnd(win.y1 + 0.3, win.y2 - 0.8);
      }
      placeWeather(sn);
      sn.sp.alpha = 0.5 + Math.abs(Math.sin(t + sn.wob)) * 0.45;
    }

    // 花瓣 / 落叶
    for (var pi2 = 0; pi2 < state.petals.length; pi2++) {
      var pt = state.petals[pi2];
      pt.z -= pt.speed * dt / 1000 * slow;
      pt.gy += Math.sin(t * 0.8 + pt.wob) * dt / 1000 * 0.08;
      pt.sp.rotation += pt.spin * dt / 1000;
      if (pt.z < win.z1 + 5 || pt.gy > win.y2 - 0.2) {
        pt.z = win.z2 - 2 + Math.random() * 4;
        pt.gy = rnd(win.y1 + 0.4, win.y2 - 1.0);
      }
      placeWeather(pt);
      pt.sp.alpha = 0.55 + Math.abs(Math.sin(t + pt.wob)) * 0.35;
    }

    // 挂钟分针（转一圈约 40 秒，够看出在走）
    if (state.clock) {
      state.clock.rotation = t * 0.157 * slow;
    }

    // 钟摆
    for (var pi = 0; pi < state.pendulums.length; pi++) {
      var pd = state.pendulums[pi];
      pd.sp.rotation = Math.sin(t * 1.55 + pd.phase) * 0.2 * slow;
    }

    // 吊灯光晕呼吸
    for (var li = 0; li < state.lamps.length; li++) {
      var lp = state.lamps[li];
      var k = 0.62 + Math.sin(t * 1.7 + lp.phase) * 0.12 * slow;
      lp.sp.alpha = k;
      var sc = 1 + Math.sin(t * 1.7 + lp.phase) * 0.035 * slow;
      lp.sp.scale.set(sc);
    }

    // 窗光呼吸
    if (state.light) {
      state.light.alpha = 0.78 + Math.sin(t * 0.55) * 0.14 * slow;
    }
  };

  amb.destroy = function () {
    state.token += 1;
    if (amb.back && amb.back.parent) { amb.back.parent.removeChild(amb.back); }
    if (amb.top && amb.top.parent) { amb.top.parent.removeChild(amb.top); }
    if (amb.back) { amb.back.destroy({ children: true, texture: false, baseTexture: false }); }
    if (amb.top) { amb.top.destroy({ children: true, texture: false, baseTexture: false }); }
    amb.back = null;
    amb.top = null;
    amb.sig = '';
    state.motes = [];
    state.rain = [];
    state.snow = [];
    state.petals = [];
    state.pendulums = [];
    state.lamps = [];
    state.clock = null;
    state.light = null;
  };
})();
