/* 衣间小日子 — 店猫行为：打盹 / 巡店 / 看顾客 / 蹭人 */
(function () {
  var Iso = window.Iso;
  if (!Iso) { return; }
  var catArt = Iso.catArt;

  var cat = Iso.catStage = {
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
    gx: 2.4,
    gy: 6.4,
    dir: 1,
    poseName: ''
  };

  var WALK_SPEED = 34;       // 屏幕像素 / 秒
  var SCALE = 0.78;
  var Z_BIAS = 40;

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

  cat.build = function (parent, opts) {
    opts = opts || {};
    var profile = catArt.profile(opts.seed);
    var key = catArt.key(profile);
    cat.opts = opts;
    cat.parent = parent;
    if (cat.rig && cat.key === key) {
      cat.place(cat.gx, cat.gy);
      return;
    }
    cat.remove();
    cat.key = key;
    cat.profile = profile;

    var home = opts.home || { gx: 2.4, gy: 6.4 };
    if (opts.isFree && !opts.isFree(home.gx, home.gy)) {
      home = findNearestFree(opts, home) || { gx: 2.4, gy: 6.4 };
    }
    cat.gx = home.gx;
    cat.gy = home.gy;
    cat.dir = Math.random() < 0.5 ? -1 : 1;

    var token = Math.random();
    cat.token = token;
    var poses = ['sit', 'walk', 'loaf', 'stretch'];
    var heads = ['calm', 'blink', 'happy', 'sleep', 'surprised'];
    var jobs = [];
    poses.forEach(function (pose) {
      jobs.push(loadTex('cat:' + key + ':body:' + pose, catArt.body(pose, profile)).then(function (r) {
        return { group: 'body', name: pose, r: r };
      }));
    });
    heads.forEach(function (expr) {
      jobs.push(loadTex('cat:' + key + ':head:' + expr, catArt.head(expr, profile)).then(function (r) {
        return { group: 'head', name: expr, r: r };
      }));
    });
    jobs.push(loadTex('cat:' + key + ':tail', catArt.tail(profile)).then(function (r) {
      return { group: 'tail', r: r };
    }));
    jobs.push(loadTex('cat:shadow', catArt.shadow()).then(function (r) {
      return { group: 'shadow', r: r };
    }));

    Promise.all(jobs).then(function (list) {
      if (token !== cat.token) { return; }
      var texs = { body: {}, head: {} };
      list.forEach(function (o) {
        if (!o.r.tex) { return; }
        if (o.group === 'body') { texs.body[o.name] = o.r.tex; }
        else if (o.group === 'head') { texs.head[o.name] = o.r.tex; }
        else if (o.group === 'tail') { texs.tail = o.r.tex; }
        else if (o.group === 'shadow') { texs.shadow = o.r.tex; }
      });
      if (!texs.body.sit || !texs.head.calm) { return; }
      cat.texs = texs;

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
      rig.zIndex = zOf(cat.gx, cat.gy);
      rig._phase = rnd(0, 6.28);
      rig._blinkAt = nowMs() + rnd(1800, 4200);
      rig._blinkUntil = 0;

      cat.rig = rig;
      cat.ready = true;
      cat.poseName = '';
      applyPose('sit');
      cat.place(cat.gx, cat.gy);
      if (parent) { parent.addChild(rig); }

      var now = nowMs();
      cat.mode = 'sit';
      cat.modeStart = now;
      cat.modeUntil = 0;
      cat.nextAt = now + rnd(2600, 5200);
    });
  };

  cat.remove = function () {
    cat.ready = false;
    cat.token = null;
    if (cat.rig) {
      if (cat.rig.parent) { cat.rig.parent.removeChild(cat.rig); }
      cat.rig.destroy({ children: true, texture: false, baseTexture: false });
    }
    cat.rig = null;
    cat.texs = null;
    cat.walk = null;
    cat.poseName = '';
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

  cat.place = function (gx, gy) {
    cat.gx = gx;
    cat.gy = gy;
    if (!cat.rig) { return; }
    var p = posOf(gx, gy);
    cat.rig.x = p.x;
    cat.rig.y = p.y;
    cat.rig.zIndex = zOf(gx, gy);
  };

  function applyPose(pose) {
    if (!cat.ready || cat.poseName === pose) { return; }
    cat.poseName = pose;
    var texs = cat.texs;
    var bodyTex = texs.body[pose] || texs.body.sit;
    if (bodyTex) { cat.rig.body.texture = bodyTex; }
    var off = catArt.poseOffset(pose);
    cat.rig.head.x = off.head[0];
    cat.rig.head.y = off.head[1];
    cat.rig.tail.x = off.tail[0];
    cat.rig.tail.y = off.tail[1];
    cat.headBase = off.head;
    cat.tailBase = off.tail;
  }

  function setMode(mode, now, dur) {
    cat.mode = mode;
    cat.modeStart = now;
    cat.modeUntil = dur ? now + dur : 0;
    if (mode === 'sleep') { applyPose('loaf'); }
    else if (mode === 'stretch') { applyPose('stretch'); }
    else { applyPose('sit'); }
    if (mode === 'watch' && cat.opts && cat.opts.onMeow && Math.random() < 0.55) {
      cat.opts.onMeow();
    }
    if (mode !== 'sit') {
      cat.nextAt = (cat.modeUntil || now) + rnd(1600, 3600);
    } else {
      cat.nextAt = now + rnd(3200, 6800);
    }
  }

  cat.pet = function () {
    if (!cat.ready) { return false; }
    var now = nowMs();
    cat.walk = null;
    cat.rig._blinkUntil = now + 1600;
    setMode('pet', now, 2200);
    if (cat.opts && cat.opts.onPet) {
      cat.opts.onPet(cat.rig.x, cat.rig.y - 24);
    }
    return true;
  };

  /* 有顾客进门：猫会醒来看一眼 */
  cat.noticeCustomer = function () {
    if (!cat.ready) { return; }
    if (cat.mode === 'pet') { return; }
    var now = nowMs();
    cat.walk = null;
    setMode('watch', now, 2800 + Math.random() * 1400);
  };

  cat.ensureFree = function (opts) {
    if (!cat.ready || !opts || !opts.isFree) { return; }
    if (opts.isFree(cat.gx, cat.gy)) { return; }
    var home = opts.home || (cat.opts && cat.opts.home) || { gx: 2.4, gy: 6.4 };
    var spot = opts.isFree(home.gx, home.gy) ? home : findNearestFree(opts, home);
    if (spot) {
      cat.walk = null;
      cat.place(spot.gx, spot.gy);
      cat.rig.alpha = 0.5;
    }
  };

  function startWalk(target, opts) {
    var from = { gx: cat.gx, gy: cat.gy };
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
    cat.walk = {
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
    var home = { gx: cat.gx, gy: cat.gy };
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
    var action = catArt.nextAction(Math.random(), !!(opts.customer && opts.customer.rig));
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
    if (action === 'stretch') {
      setMode('stretch', now, rnd(1800, 2600));
      return;
    }
    setMode('sit', now);
  }

  cat.update = function (now, dt, opts) {
    if (!cat.ready || !cat.rig) { return; }
    opts = opts || {};
    var rig = cat.rig;
    var t = now / 1000;
    var phase = rig._phase || 0;

    if (rig.alpha < 1) { rig.alpha = Math.min(1, rig.alpha + dt / 260); }

    if (cat.walk) {
      var w = cat.walk;
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
      if (Math.abs(dx) > 0.4) { cat.dir = dx > 0 ? 1 : -1; }
      rig.x = pt.x;
      rig.y = pt.y;
      cat.gx = pt.gx;
      cat.gy = pt.gy;
      rig.zIndex = zOf(pt.gx, pt.gy);
      if (p >= 1) {
        cat.walk = null;
        cat.place(w.target.gx, w.target.gy);
        var tn = nowMs();
        setMode('sit', tn);
      }
    } else {
      if (cat.modeUntil && now >= cat.modeUntil) {
        setMode('sit', now);
      } else if (!reduced() && !cat.modeUntil && now >= cat.nextAt) {
        choose(now, opts);
      }
    }

    cat.ensureFree(opts);

    // 姿态 + 呼吸
    var pose = cat.poseName || 'sit';
    var breathe = 1 + Math.sin(t * 2.2 + phase) * (pose === 'loaf' ? 0.018 : 0.012);
    rig.avatar.scale.y = breathe;
    rig.avatar.scale.x = 1 - (breathe - 1) * 0.5;

    var bob = 0;
    if (cat.walk) {
      bob = -Math.abs(Math.sin((now - cat.walk.start) / cat.walk.dur * Math.PI * 7)) * 1.5;
    } else if (pose === 'loaf') {
      bob = Math.sin(t * 1.2 + phase) * 0.35;
    } else {
      bob = Math.sin(t * 2.2 + phase) * 0.5;
    }
    rig.avatar.y = bob;

    // 朝向
    rig.scale.x = cat.dir * SCALE;

    // 尾巴
    var tailAmp = 0.16;
    var tailSpeed = 1.7;
    if (cat.mode === 'pet') { tailAmp = 0.48; tailSpeed = 6.5; }
    else if (cat.mode === 'sleep') { tailAmp = 0.035; tailSpeed = 0.7; }
    else if (cat.mode === 'watch') { tailAmp = 0.24; tailSpeed = 2.6; }
    else if (cat.walk) { tailAmp = 0.1; tailSpeed = 3.2; }
    var tailLift = cat.mode === 'sleep' ? 0.5 : cat.mode === 'stretch' ? 0.25 : 0;
    rig.tail.rotation = tailLift + Math.sin(t * tailSpeed + phase) * tailAmp;

    // 头
    var off = cat.headBase || [7, -28];
    var headX = off[0];
    var headY = off[1];
    var headRot = Math.sin(t * 0.7 + phase) * 0.035;

    if (cat.mode === 'groom') {
      headRot = 0.5 + Math.sin(t * 5.5 + phase) * 0.18;
      headY += 3.5;
    } else if (cat.mode === 'sleep') {
      headRot = 0.14;
      headY += 2.2;
    } else if (cat.mode === 'pet') {
      headRot = -0.14 + Math.sin(t * 6 + phase) * 0.06;
      headY -= 0.8;
    } else if (cat.mode === 'watch' && opts.customer && opts.customer.rig) {
      var side = opts.customer.rig.x >= rig.x ? 1 : -1;
      cat.dir = side;
      headRot = -0.1;
      headX += 1.2;
    }
    if (cat.walk) { headY += Math.sin(t * 8 + phase) * 0.4; }
    rig.head.x = headX;
    rig.head.y = headY;
    rig.head.rotation = headRot;

    // 眨眼 / 表情
    var expr = 'calm';
    if (cat.mode === 'sleep') {
      expr = 'sleep';
    } else if (cat.mode === 'pet') {
      expr = 'happy';
    } else if (now < rig._blinkUntil) {
      expr = 'blink';
    }
    if (cat.mode !== 'sleep' && now > rig._blinkAt) {
      rig._blinkUntil = now + 130;
      rig._blinkAt = now + rnd(2600, 5200);
    }
    if (now < rig._blinkUntil && cat.mode !== 'pet' && cat.mode !== 'sleep') { expr = 'blink'; }
    if (cat.mode === 'watch' && now - cat.modeStart < 650) { expr = 'surprised'; }
    var tex = cat.texs.head[expr] || cat.texs.head.calm;
    if (tex && rig.head.texture !== tex) { rig.head.texture = tex; }

    // 打盹的小 z
    if (cat.mode === 'sleep' && now > (rig._zzzAt || 0)) {
      rig._zzzAt = now + 2600;
      if (cat.opts && cat.opts.onZzz) {
        cat.opts.onZzz(rig.x + cat.dir * 8, rig.y - 26);
      }
    }
  };
})();
