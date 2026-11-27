/* 衣间小日子 — 比熊行为：巡店 / 看顾客 / 讨零食 / 打盹 / 蹭人 */
(function () {
  var Iso = window.Iso;
  if (!Iso) { return; }
  var dogArt = Iso.dogArt;

  var dog = Iso.dogStage = {
    rig: null,
    ready: false,
    key: '',
    parent: null,
    profile: null,
    mode: 'sit',
    modeStart: 0,
    modeUntil: 0,
    nextAt: 0,
    walk: null,
    gx: 8.0,
    gy: 7.2,
    dir: -1,
    poseName: ''
  };

  var WALK_SPEED = 40;       // 屏幕像素 / 秒
  var SCALE = 0.82;
  var Z_BIAS = 41;

  function nowMs() { return (window.performance && performance.now) ? performance.now() : Date.now(); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function reduced() { return !!Iso.reducedMotion; }

  function loadTex(key, art) {
    return new Promise(function (resolve) {
      Iso.tex.get(key, art, function (tex, vb) { resolve({ tex: tex, vb: vb }); });
    });
  }

  function posOf(gx, gy) { return Iso.P(gx, gy, 0); }

  function zOf(gx, gy) { return Iso.sortKey(gx, gy, 1, 1) * 100 + Z_BIAS; }

  dog.build = function (parent, opts) {
    opts = opts || {};
    var profile = dogArt.profile(opts.seed);
    var key = dogArt.key(profile);
    dog.opts = opts;
    dog.parent = parent;
    if (dog.rig && dog.key === key) {
      dog.place(dog.gx, dog.gy);
      return;
    }
    dog.remove();
    dog.key = key;
    dog.profile = profile;

    var home = opts.home || { gx: 8.0, gy: 7.2 };
    if (opts.isFree && !opts.isFree(home.gx, home.gy)) {
      home = findNearestFree(opts, home) || { gx: 8.0, gy: 7.2 };
    }
    dog.gx = home.gx;
    dog.gy = home.gy;
    dog.dir = Math.random() < 0.5 ? -1 : 1;

    var token = Math.random();
    dog.token = token;
    var poses = ['sit', 'walk', 'loaf', 'stretch', 'beg'];
    var heads = ['calm', 'blink', 'happy', 'sleep', 'surprised'];
    var jobs = [];
    poses.forEach(function (pose) {
      jobs.push(loadTex('dog:' + key + ':body:' + pose, dogArt.body(pose, profile)).then(function (r) {
        return { group: 'body', name: pose, r: r };
      }));
    });
    heads.forEach(function (expr) {
      jobs.push(loadTex('dog:' + key + ':head:' + expr, dogArt.head(expr, profile)).then(function (r) {
        return { group: 'head', name: expr, r: r };
      }));
    });
    jobs.push(loadTex('dog:' + key + ':tail', dogArt.tail(profile)).then(function (r) {
      return { group: 'tail', r: r };
    }));
    jobs.push(loadTex('dog:shadow', dogArt.shadow()).then(function (r) {
      return { group: 'shadow', r: r };
    }));

    Promise.all(jobs).then(function (list) {
      if (token !== dog.token) { return; }
      var texs = { body: {}, head: {} };
      list.forEach(function (o) {
        if (!o.r.tex) { return; }
        if (o.group === 'body') { texs.body[o.name] = o.r.tex; }
        else if (o.group === 'head') { texs.head[o.name] = o.r.tex; }
        else if (o.group === 'tail') { texs.tail = o.r.tex; }
        else if (o.group === 'shadow') { texs.shadow = o.r.tex; }
      });
      if (!texs.body.sit || !texs.head.calm) { return; }
      dog.texs = texs;

      var rig = new PIXI.Container();
      if (texs.shadow) {
        var sh = new PIXI.Sprite(texs.shadow);
        sh.anchor.set(0.5, 0.5);
        sh.scale.set(0.5);
        sh.y = 1;
        rig.addChild(sh);
      }
      var avatar = new PIXI.Container();
      rig.addChild(avatar);
      var tail = new PIXI.Sprite(texs.tail);
      tail.anchor.set(0.5, 1);
      tail.scale.set(0.5);
      avatar.addChild(tail);
      var body = new PIXI.Sprite(texs.body.sit);
      body.anchor.set(0.5, 1);
      body.scale.set(0.5);
      avatar.addChild(body);
      var head = new PIXI.Sprite(texs.head.calm);
      head.anchor.set(0.5, 0.5);
      head.scale.set(0.5);
      avatar.addChild(head);
      rig.scale.set(SCALE);
      rig.avatar = avatar;
      rig.body = body;
      rig.head = head;
      rig.tail = tail;
      rig.zIndex = zOf(dog.gx, dog.gy);
      rig._phase = rnd(0, 6.28);
      rig._blinkAt = nowMs() + rnd(1800, 4200);
      rig._blinkUntil = 0;

      dog.rig = rig;
      dog.ready = true;
      dog.poseName = '';
      applyPose('sit');
      dog.place(dog.gx, dog.gy);
      if (parent) { parent.addChild(rig); }

      var now = nowMs();
      dog.mode = 'sit';
      dog.modeStart = now;
      dog.modeUntil = 0;
      dog.nextAt = now + rnd(2600, 5200);
    });
  };

  dog.remove = function () {
    dog.ready = false;
    dog.token = null;
    if (dog.rig) {
      if (dog.rig.parent) { dog.rig.parent.removeChild(dog.rig); }
      dog.rig.destroy({ children: true, texture: false, baseTexture: false });
    }
    dog.rig = null;
    dog.texs = null;
    dog.walk = null;
    dog.poseName = '';
  };

  function findNearestFree(opts, center) {
    var best = null;
    for (var r = 0.6; r <= 6 && !best; r += 0.6) {
      for (var a = 0; a < 12; a++) {
        var gx = center.gx + Math.cos(a / 12 * Math.PI * 2) * r;
        var gy = center.gy + Math.sin(a / 12 * Math.PI * 2) * r;
        if (gx < 1 || gy < 1 || gx > Iso.cfg.N - 1 || gy > Iso.cfg.N - 1) { continue; }
        if (!opts.isFree || opts.isFree(gx, gy)) { best = { gx: gx, gy: gy }; break; }
      }
    }
    return best;
  }

  dog.place = function (gx, gy) {
    dog.gx = gx;
    dog.gy = gy;
    if (!dog.rig) { return; }
    var p = posOf(gx, gy);
    dog.rig.x = p.x;
    dog.rig.y = p.y;
    dog.rig.zIndex = zOf(gx, gy);
  };

  function applyPose(pose) {
    if (!dog.ready || dog.poseName === pose) { return; }
    dog.poseName = pose;
    var texs = dog.texs;
    var bodyTex = texs.body[pose] || texs.body.sit;
    if (bodyTex) { dog.rig.body.texture = bodyTex; }
    var off = dogArt.poseOffset(pose);
    dog.rig.head.x = off.head[0];
    dog.rig.head.y = off.head[1];
    dog.rig.tail.x = off.tail[0];
    dog.rig.tail.y = off.tail[1];
    dog.headBase = off.head;
    dog.tailBase = off.tail;
  }

  function setMode(mode, now, dur) {
    dog.mode = mode;
    dog.modeStart = now;
    dog.modeUntil = dur ? now + dur : 0;
    if (mode === 'sleep') { applyPose('loaf'); }
    else if (mode === 'stretch') { applyPose('stretch'); }
    else if (mode === 'beg') { applyPose('beg'); }
    else { applyPose('sit'); }
    if (mode === 'watch' && dog.opts && dog.opts.onBark && Math.random() < 0.35) {
      dog.opts.onBark();
    }
    if (mode !== 'sit') {
      dog.nextAt = (dog.modeUntil || now) + rnd(1600, 3600);
    } else {
      dog.nextAt = now + rnd(3200, 6800);
    }
  }

  dog.pet = function () {
    if (!dog.ready) { return false; }
    var now = nowMs();
    dog.walk = null;
    dog.rig._blinkUntil = now + 1600;
    setMode('pet', now, 2400);
    if (dog.opts && dog.opts.onWag) {
      dog.opts.onWag(dog.rig.x, dog.rig.y - 24);
    }
    return true;
  };

  /* 有顾客进门：狗会抬头看一眼，有时还会叫一声 */
  dog.noticeCustomer = function () {
    if (!dog.ready) { return; }
    if (dog.mode === 'pet') { return; }
    var now = nowMs();
    dog.walk = null;
    setMode('watch', now, 2800 + Math.random() * 1400);
  };

  dog.ensureFree = function (opts) {
    if (!dog.ready || !opts || !opts.isFree) { return; }
    if (opts.isFree(dog.gx, dog.gy)) { return; }
    var home = opts.home || (dog.opts && dog.opts.home) || { gx: 2.4, gy: 6.4 };
    var spot = opts.isFree(home.gx, home.gy) ? home : findNearestFree(opts, home);
    if (spot) {
      dog.walk = null;
      dog.place(spot.gx, spot.gy);
      dog.rig.alpha = 0.5;
    }
  };

  function startWalk(target, opts) {
    var from = { gx: dog.gx, gy: dog.gy };
    var route = Iso.walkPath(opts.placed || [], from, target, opts.occupied || []);
    if (!route || route.length < 2) { return false; }
    var pts = route.map(function (pt) {
      var p = Iso.P(pt.gx, pt.gy, 0);
      return { x: p.x, y: p.y, gx: pt.gx, gy: pt.gy };
    });
    var total = 0;
    for (var i = 1; i < pts.length; i++) {
      total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    }
    if (total < 10) { return false; }
    dog.walk = {
      pts: pts,
      total: total,
      start: nowMs(),
      dur: Math.max(600, total / WALK_SPEED * 1000),
      target: target
    };
    applyPose('walk');
    return true;
  }

  function chooseTarget(opts) {
    var home = { gx: dog.gx, gy: dog.gy };
    for (var i = 0; i < 7; i++) {
      var a = rnd(0, Math.PI * 2);
      var r = rnd(1.3, 3.6);
      var gx = home.gx + Math.cos(a) * r;
      var gy = home.gy + Math.sin(a) * r;
      if (gx < 1.2 || gy < 1.2 || gx > Iso.cfg.N - 1.2 || gy > Iso.cfg.N - 1.2) { continue; }
      if (opts.isFree && !opts.isFree(gx, gy)) { continue; }
      return { gx: gx, gy: gy };
    }
    return null;
  }

  function choose(now, opts) {
    var action = dogArt.nextAction(Math.random(), !!(opts.customer && opts.customer.rig));
    if (action === 'walk') {
      var target = chooseTarget(opts);
      if (target && startWalk(target, opts)) { return; }
      action = 'sit';
    }
    if (action === 'watch') {
      setMode('watch', now, rnd(2600, 4200));
      return;
    }
    if (action === 'sleep') {
      setMode('sleep', now, rnd(6000, 12000));
      return;
    }
    if (action === 'groom') {
      setMode('groom', now, rnd(2200, 3600));
      return;
    }
    if (action === 'beg') {
      setMode('beg', now, rnd(2400, 4200));
      return;
    }
    if (action === 'stretch') {
      setMode('stretch', now, rnd(1800, 2600));
      return;
    }
    setMode('sit', now);
  }

  dog.update = function (now, dt, opts) {
    if (!dog.ready || !dog.rig) { return; }
    opts = opts || {};
    var rig = dog.rig;
    var t = now / 1000;
    var phase = rig._phase || 0;

    if (rig.alpha < 1) { rig.alpha = Math.min(1, rig.alpha + dt / 260); }

    if (dog.walk) {
      var w = dog.walk;
      var p = Math.min(1, (now - w.start) / w.dur);
      var dist = p * w.total;
      var si = 0;
      for (; si < w.pts.length - 1; si++) {
        var seg = Math.hypot(w.pts[si + 1].x - w.pts[si].x, w.pts[si + 1].y - w.pts[si].y);
        if (dist <= seg) { break; }
        dist -= seg;
      }
      var pt;
      if (si >= w.pts.length - 1) {
        pt = w.pts[w.pts.length - 1];
      } else {
        var seg2 = Math.hypot(w.pts[si + 1].x - w.pts[si].x, w.pts[si + 1].y - w.pts[si].y);
        var tr = seg2 > 0 ? dist / seg2 : 0;
        pt = {
          x: w.pts[si].x + (w.pts[si + 1].x - w.pts[si].x) * tr,
          y: w.pts[si].y + (w.pts[si + 1].y - w.pts[si].y) * tr,
          gx: w.pts[si].gx + (w.pts[si + 1].gx - w.pts[si].gx) * tr,
          gy: w.pts[si].gy + (w.pts[si + 1].gy - w.pts[si].gy) * tr
        };
      }
      var dx = pt.x - rig.x;
      if (Math.abs(dx) > 0.4) { dog.dir = dx > 0 ? 1 : -1; }
      rig.x = pt.x;
      rig.y = pt.y;
      dog.gx = pt.gx;
      dog.gy = pt.gy;
      rig.zIndex = zOf(pt.gx, pt.gy);
      if (p >= 1) {
        dog.walk = null;
        dog.place(w.target.gx, w.target.gy);
        var tn = nowMs();
        setMode('sit', tn);
      }
    } else {
      if (dog.modeUntil && now >= dog.modeUntil) {
        setMode('sit', now);
      } else if (!reduced() && !dog.modeUntil && now >= dog.nextAt) {
        choose(now, opts);
      }
    }

    dog.ensureFree(opts);

    // 姿态 + 呼吸
    var pose = dog.poseName || 'sit';
    var breathe = 1 + Math.sin(t * 2.2 + phase) * (pose === 'loaf' ? 0.018 : 0.012);
    rig.avatar.scale.y = breathe;
    rig.avatar.scale.x = 1 - (breathe - 1) * 0.5;

    var bob = 0;
    if (dog.walk) {
      bob = -Math.abs(Math.sin((now - dog.walk.start) / dog.walk.dur * Math.PI * 7)) * 1.5;
    } else if (pose === 'loaf') {
      bob = Math.sin(t * 1.2 + phase) * 0.35;
    } else {
      bob = Math.sin(t * 2.2 + phase) * 0.5;
    }
    rig.avatar.y = bob;

    // 朝向
    rig.scale.x = dog.dir * SCALE;

    // 尾巴
    var tailAmp = 0.18;
    var tailSpeed = 2.2;
    if (dog.mode === 'pet') { tailAmp = 0.55; tailSpeed = 7.5; }
    else if (dog.mode === 'beg') { tailAmp = 0.5; tailSpeed = 5.2; }
    else if (dog.mode === 'sleep') { tailAmp = 0.04; tailSpeed = 0.8; }
    else if (dog.mode === 'watch') { tailAmp = 0.28; tailSpeed = 3.0; }
    else if (dog.walk) { tailAmp = 0.12; tailSpeed = 3.6; }
    var tailLift = dog.mode === 'sleep' ? 0.45 : dog.mode === 'stretch' ? 0.2 : dog.mode === 'beg' ? -0.12 : 0;
    rig.tail.rotation = tailLift + Math.sin(t * tailSpeed + phase) * tailAmp;

    // 头
    var off = dog.headBase || [7, -29];
    var headX = off[0];
    var headY = off[1];
    var headRot = Math.sin(t * 0.7 + phase) * 0.035;

    if (dog.mode === 'groom') {
      headRot = 0.5 + Math.sin(t * 5.5 + phase) * 0.18;
      headY += 3.5;
    } else if (dog.mode === 'sleep') {
      headRot = 0.14;
      headY += 2.2;
    } else if (dog.mode === 'pet') {
      headRot = -0.14 + Math.sin(t * 6 + phase) * 0.06;
      headY -= 0.8;
    } else if (dog.mode === 'beg') {
      headRot = -0.16 + Math.sin(t * 4.2 + phase) * 0.04;
      headY -= 1.2;
    } else if (dog.mode === 'watch' && opts.customer && opts.customer.rig) {
      var side = opts.customer.rig.x >= rig.x ? 1 : -1;
      dog.dir = side;
      headRot = -0.1;
      headX += 1.2;
    }
    if (dog.walk) { headY += Math.sin(t * 8 + phase) * 0.4; }
    rig.head.x = headX;
    rig.head.y = headY;
    rig.head.rotation = headRot;

    // 眨眼 / 表情
    var expr = 'calm';
    if (dog.mode === 'sleep') {
      expr = 'sleep';
    } else if (dog.mode === 'pet' || dog.mode === 'beg') {
      expr = 'happy';
    } else if (now < rig._blinkUntil) {
      expr = 'blink';
    }
    if (dog.mode !== 'sleep' && now > rig._blinkAt) {
      rig._blinkUntil = now + 130;
      rig._blinkAt = now + rnd(2600, 5200);
    }
    if (now < rig._blinkUntil && dog.mode !== 'pet' && dog.mode !== 'sleep') { expr = 'blink'; }
    if (dog.mode === 'watch' && now - dog.modeStart < 650) { expr = 'surprised'; }
    var tex = dog.texs.head[expr] || dog.texs.head.calm;
    if (tex && rig.head.texture !== tex) { rig.head.texture = tex; }

    // 打盹的小 z
    if (dog.mode === 'sleep' && now > (rig._zzzAt || 0)) {
      rig._zzzAt = now + 2600;
      if (dog.opts && dog.opts.onZzz) {
        dog.opts.onZzz(rig.x + dog.dir * 8, rig.y - 26);
      }
    }
  };
})();
