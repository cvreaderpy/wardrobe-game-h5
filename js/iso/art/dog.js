/* 衣间小日子 — 店里的比熊（矢量拆件：身体 / 头 / 尾巴 / 影子） */
(function () {
  var Iso = window.Iso;
  var D = Iso.draw;
  var C = Iso.C;
  var LINE = C.line;
  Iso.dogArt = {};

  var PROFILE = {
    name: '棉花',
    base: '#FAF4E8',
    shade: '#E4D5BF',
    ear: '#EADCC7',
    belly: '#FFFDF7',
    collar: '#C97B63',
    bow: '#C97B63',
    bowDark: '#A85F43',
    eye: '#3F332B',
    nose: '#3F332B',
    pink: '#E8A9A0'
  };

  Iso.dogArt.profile = function () {
    return {
      name: PROFILE.name,
      base: PROFILE.base,
      shade: PROFILE.shade,
      ear: PROFILE.ear,
      belly: PROFILE.belly,
      collar: PROFILE.collar,
      bow: PROFILE.bow,
      bowDark: PROFILE.bowDark,
      eye: PROFILE.eye,
      nose: PROFILE.nose,
      pink: PROFILE.pink
    };
  };

  Iso.dogArt.key = function (c) {
    return [c.name, c.base, c.shade, c.ear].join('|');
  };

  function line(w) {
    return ' stroke="' + LINE + '" stroke-width="' + (w || 1.3) + '" stroke-linejoin="round" stroke-linecap="round"';
  }

  // 蓬松云朵轮廓：沿椭圆打一圈小弧，边缘自然起伏
  function fluff(cx, cy, rx, ry, bumps, fill, opt) {
    opt = opt || {};
    var n = bumps || 9;
    var bulge = opt.bulge || 0.62;
    var pts = [];
    for (var i = 0; i < n; i++) {
      var a = (opt.rot || 0) + i * Math.PI * 2 / n;
      pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (var j = 1; j <= n; j++) {
      var p = pts[j % n];
      var q = pts[j - 1];
      var chord = Math.hypot(p[0] - q[0], p[1] - q[1]);
      var r = Math.max(1.2, chord * bulge);
      d += ' A' + r.toFixed(1) + ' ' + r.toFixed(1) + ' 0 0 1 ' + p[0].toFixed(1) + ' ' + p[1].toFixed(1);
    }
    return '<path d="' + d + ' Z" fill="' + (fill || opt.fill) + '"' + line(opt.sw == null ? 1.3 : opt.sw) + '/>';
  }

  function leg(c, x1, y1, x2, y2) {
    return '<path d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '" stroke="' + LINE + '" stroke-width="7.2" stroke-linecap="round"/>' +
      '<path d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '" stroke="' + c.base + '" stroke-width="5.2" stroke-linecap="round"/>' +
      '<ellipse cx="' + x2 + '" cy="' + (y2 + 0.6) + '" rx="3.2" ry="2.5" fill="' + c.belly + '"' + line(0.9) + '/>';
  }

  function paw(c, x, y, rot) {
    return '<ellipse cx="' + x + '" cy="' + y + '" rx="3.1" ry="2.5" fill="' + c.belly + '"' + line(0.9) +
      (rot ? ' transform="rotate(' + rot + ' ' + x + ' ' + y + ')"' : '') + '/>';
  }

  function curl(c, x, y, s) {
    return '<path d="M' + (x - 4 * s) + ' ' + (y + 1) + ' Q' + (x - 6 * s) + ' ' + (y - 4) + ' ' + x + ' ' + (y - 4) +
      ' Q' + (x + 4 * s) + ' ' + (y - 4) + ' ' + (x + 3 * s) + ' ' + y +
      '" fill="none" stroke="' + c.shade + '" stroke-width="1.5" stroke-linecap="round" opacity=".9"/>';
  }

  /* 身体：统一画布，脚底在 (0,0)，朝右 */
  Iso.dogArt.body = function (pose, c) {
    var s = '';
    var base = c.base, shade = c.shade, belly = c.belly;

    if (pose === 'walk') {
      s += leg(c, -12, -13, -15, -1.6);
      s += leg(c, -5, -12, -3, -1.6);
      s += leg(c, 7, -13, 6, -1.6);
      s += leg(c, 13, -13, 17, -1.6);
      s += fluff(0, -17, 17, 9.5, 11, base, { bulge: 0.6 });
      s += '<ellipse cx="-1" cy="-9" rx="12" ry="4.2" fill="' + belly + '" opacity=".75" stroke="none"/>';
      s += '<path d="M7 -15 Q12 -10 8 -5 Q5 -9 5 -13 Z" fill="' + base + '"' + line(1.1) + '/>';
      s += '<path d="M-14 -19 Q-9 -23 -3 -22 M-2 -24 Q3 -27 8 -24"' +
        ' fill="none" stroke="' + shade + '" stroke-width="2.1" stroke-linecap="round" opacity=".85"/>';
      s += curl(c, -6, -14, 1);
      s += curl(c, 6, -20, -1);
    } else if (pose === 'loaf') {
      s += fluff(-1, -9, 16, 8.5, 11, base, { bulge: 0.64 });
      s += '<ellipse cx="-1" cy="-5" rx="10" ry="4" fill="' + belly + '" opacity=".8" stroke="none"/>';
      s += paw(c, 12, -2.6, 0);
      s += paw(c, -11, -2.6, 0);
      s += '<path d="M-13 -11 Q-8 -15 -3 -13 M2 -14 Q7 -16 11 -12"' +
        ' fill="none" stroke="' + shade + '" stroke-width="2" stroke-linecap="round" opacity=".8"/>';
      s += curl(c, -6, -12, 1);
    } else if (pose === 'stretch') {
      s += leg(c, -10, -12, -12, -1.4);
      s += leg(c, -4, -11, -2, -1.4);
      s += leg(c, 9, -10, 25, -1.4);
      s += leg(c, 12, -9, 27, -3.2);
      s += fluff(0, -15, 16, 9.5, 11, base, { bulge: 0.6, rot: -0.18 });
      s += '<ellipse cx="-2" cy="-8" rx="11" ry="4" fill="' + belly + '" opacity=".75" stroke="none"/>';
      s += '<path d="M-13 -17 Q-8 -21 -2 -20 M-1 -22 Q4 -24 9 -21"' +
        ' fill="none" stroke="' + shade + '" stroke-width="2.1" stroke-linecap="round" opacity=".85"/>';
      s += curl(c, -5, -13, 1);
    } else if (pose === 'beg') {
      // 坐着把前爪抬起来，像在讨零食
      s += '<ellipse cx="-7" cy="-8" rx="10" ry="8.2" fill="' + base + '"' + line(1.3) + '/>';
      s += fluff(0, -18, 11.5, 12.5, 11, base, { bulge: 0.6, rot: 0.1 });
      s += '<path d="M-9 -6 Q-10 -14 -4 -17 Q2 -19 7 -14 L7 -4 Q0 -1 -9 -6 Z" fill="' + belly + '" opacity=".55" stroke="none"/>';
      s += '<path d="M7 -17 Q13 -15 12 -10 Q10 -13 7 -13 Z" fill="' + base + '"' + line(1.1) + '/>';
      s += '<path d="M9 -19 L12 -25 M5 -16 L6 -23" stroke="' + LINE + '" stroke-width="6.4" stroke-linecap="round"/>';
      s += '<path d="M9 -19 L12 -25 M5 -16 L6 -23" stroke="' + base + '" stroke-width="4.4" stroke-linecap="round"/>';
      s += paw(c, 12.5, -26, -18);
      s += paw(c, 6.2, -24, -10);
      s += paw(c, -10, -2.4, 0);
      s += paw(c, 1.5, -2.4, 0);
      s += '<path d="M-12 -14 Q-8 -18 -3 -17 M-10 -20 Q-6 -23 -2 -21"' +
        ' fill="none" stroke="' + shade + '" stroke-width="2.1" stroke-linecap="round" opacity=".85"/>';
      s += curl(c, -5, -14, 1);
    } else {
      // sit
      s += '<ellipse cx="-7" cy="-9" rx="11" ry="8.5" fill="' + base + '"' + line(1.3) + '/>';
      s += fluff(-2, -16, 13.5, 11, 11, base, { bulge: 0.6, rot: 0.12 });
      s += '<ellipse cx="-8" cy="-7" rx="8" ry="4.4" fill="' + belly + '" opacity=".8" stroke="none"/>';
      s += '<path d="M7 -18 Q13 -14 12 -7 L7 -7 Q8 -13 7 -18 Z" fill="' + base + '"' + line(1.1) + '/>';
      s += '<path d="M7 -13 L7 -2 M11 -13 L12 -2" stroke="' + LINE + '" stroke-width="6.2" stroke-linecap="round"/>';
      s += '<path d="M7 -13 L7 -2 M11 -13 L12 -2" stroke="' + base + '" stroke-width="4.2" stroke-linecap="round"/>';
      s += paw(c, 7, -1.6, 0);
      s += paw(c, 12, -1.6, 0);
      s += '<path d="M8 -17 Q13 -12 10 -7 Q7 -11 7 -15 Z" fill="' + belly + '" opacity=".9" stroke="none"/>';
      s += '<path d="M-13 -14 Q-9 -18 -4 -17 M-14 -8 Q-10 -11 -6 -10"' +
        ' fill="none" stroke="' + shade + '" stroke-width="2.1" stroke-linecap="round" opacity=".8"/>';
      s += curl(c, -6, -13, 1);
    }

    return { vb: { x: -34, y: -44, w: 68, h: 44 }, body: s };
  };

  /* 头：中心在 (0,0)，朝右 */
  Iso.dogArt.head = function (expr, c) {
    var base = c.base, shade = c.shade, belly = c.belly, ear = c.ear, pink = c.pink;
    var s = '';

    // 垂耳
    s += '<path d="M-7 -4 C-13 -7 -15 1 -12 7 C-10 12 -5 11 -4 7 Z" fill="' + ear + '"' + line(1.2) + '/>';
    s += '<path d="M7 -4 C13 -7 15 1 12 7 C10 12 5 11 4 7 Z" fill="' + ear + '"' + line(1.2) + '/>';
    s += '<path d="M-6 1 C-9 0 -10 4 -8 7 M6 1 C9 0 10 4 8 7" fill="none" stroke="' + shade +
      '" stroke-width="1.1" stroke-linecap="round" opacity=".9"/>';

    // 圆脑袋 + 云朵边
    s += fluff(0, 0, 8.6, 8.2, 9, base, { bulge: 0.58 });
    // 头顶小卷毛
    s += '<circle cx="3" cy="-8.2" r="3.1" fill="' + base + '"' + line(1.1) + '/>';
    s += '<path d="M2 -10 Q4 -12 6 -10" fill="none" stroke="' + shade + '" stroke-width="1" stroke-linecap="round" opacity=".8"/>';

    // 蝴蝶结
    s += '<path d="M5 -11 L1 -13.5 L1 -8.8 Z" fill="' + c.bow + '"' + line(0.9) + '/>';
    s += '<path d="M6.2 -11 L10.4 -13.4 L10.4 -8.8 Z" fill="' + c.bow + '"' + line(0.9) + '/>';
    s += '<circle cx="5.6" cy="-11" r="1.2" fill="' + c.bowDark + '"' + line(0.6) + '/>';

    // 眼睛
    if (expr === 'blink' || expr === 'sleep' || expr === 'happy') {
      s += '<path d="M-4 -1 Q-2 1 0 -1 M3 -1 Q5 1 7 -1" fill="none" stroke="' + c.eye +
        '" stroke-width="1.4" stroke-linecap="round"/>';
    } else if (expr === 'surprised') {
      s += '<ellipse cx="-2.2" cy="-1.2" rx="1.9" ry="2.4" fill="' + c.eye + '"/>';
      s += '<ellipse cx="4.8" cy="-1.2" rx="1.9" ry="2.4" fill="' + c.eye + '"/>';
      s += '<circle cx="-1.6" cy="-2" r=".65" fill="#FFFDF8"/><circle cx="5.4" cy="-2" r=".65" fill="#FFFDF8"/>';
    } else {
      s += '<ellipse cx="-2.2" cy="-1.2" rx="1.55" ry="1.95" fill="' + c.eye + '"/>';
      s += '<ellipse cx="4.8" cy="-1.2" rx="1.55" ry="1.95" fill="' + c.eye + '"/>';
      s += '<circle cx="-1.7" cy="-1.9" r=".55" fill="#FFFDF8"/><circle cx="5.3" cy="-1.9" r=".55" fill="#FFFDF8"/>';
    }

    // 腮红
    s += '<ellipse cx="-5" cy="3" rx="2.4" ry="1.3" fill="' + pink + '" opacity=".38" stroke="none"/>';
    s += '<ellipse cx="8" cy="3" rx="2.2" ry="1.2" fill="' + pink + '" opacity=".32" stroke="none"/>';

    // 鼻子 / 嘴
    s += '<path d="M2.2 2.1 Q3.6 1.2 5 2.1 Q5 3.5 3.6 3.9 Q2.2 3.5 2.2 2.1 Z" fill="' + c.nose +
      '" stroke="' + LINE + '" stroke-width=".55"/>';
    s += '<path d="M3.6 3.9 L3.6 5" stroke="' + LINE + '" stroke-width=".8" stroke-linecap="round"/>';
    if (expr === 'happy') {
      s += '<path d="M3.6 5 Q2 6.6 0.6 5" fill="none" stroke="#8A5A4A" stroke-width="1.1" stroke-linecap="round"/>';
      s += '<path d="M3.6 5 Q5.2 6.6 6.6 5" fill="none" stroke="#8A5A4A" stroke-width="1.1" stroke-linecap="round"/>';
      s += '<ellipse cx="3.6" cy="6.6" rx="1.8" ry="1.3" fill="' + pink + '" stroke="' + LINE + '" stroke-width=".5"/>';
    } else if (expr === 'sleep') {
      s += '<path d="M3.6 5 Q2.8 5.8 2 5.1" fill="none" stroke="#8A5A4A" stroke-width="1" stroke-linecap="round"/>';
    } else {
      s += '<path d="M3.6 5 Q2.5 6.1 1.4 5.2 M3.6 5 Q4.7 6.1 5.8 5.2" fill="none" stroke="#8A5A4A" stroke-width="1" stroke-linecap="round"/>';
    }

    // 项圈 + 小牌
    s += '<path d="M-7.4 6.2 Q0 9.6 7.4 6.2" fill="none" stroke="' + c.collar + '" stroke-width="2.5" stroke-linecap="round"/>';
    s += '<circle cx="0" cy="8.2" r="1.55" fill="#E3B23C" stroke="' + LINE + '" stroke-width=".7"/>';
    s += '<circle cx="-0.4" cy="7.8" r=".45" fill="#FFFDF8"/>';

    return { vb: { x: -16, y: -16, w: 32, h: 30 }, body: s };
  };

  /* 尾巴：根部在 (0,0)，向上卷起，蓬松 */
  Iso.dogArt.tail = function (c) {
    var s = '';
    s += '<path d="M0 0 C-4 -4 -3 -9 1 -12 C4 -14 7 -12 6 -9"' +
      ' fill="none" stroke="' + LINE + '" stroke-width="8" stroke-linecap="round"/>';
    s += '<path d="M0 0 C-4 -4 -3 -9 1 -12 C4 -14 7 -12 6 -9"' +
      ' fill="none" stroke="' + c.base + '" stroke-width="5.8" stroke-linecap="round"/>';
    s += '<circle cx="-1.2" cy="-5" r="2.8" fill="' + c.base + '"' + line(1.05) + '/>';
    s += '<circle cx="1" cy="-11" r="3" fill="' + c.base + '"' + line(1.05) + '/>';
    s += '<circle cx="6" cy="-10.5" r="2.3" fill="' + c.base + '"' + line(1.05) + '/>';
    s += '<path d="M-1 -3 Q-2 -5 -1.8 -7 M1.5 -13 Q3 -14 4.5 -13"' +
      ' fill="none" stroke="' + c.shade + '" stroke-width="1.2" stroke-linecap="round" opacity=".9"/>';
    return { vb: { x: -8, y: -18, w: 16, h: 18 }, body: s };
  };

  Iso.dogArt.shadow = function () {
    return {
      vb: { x: -18, y: -5, w: 36, h: 10 },
      body: D.defs + '<ellipse cx="0" cy="0" rx="16" ry="4.6" fill="#3F332B" opacity=".2" filter="url(#soft)"/>'
    };
  };

  /* 狗的行为权重：比猫更爱走动、看顾客和讨零食 */
  Iso.dogArt.nextAction = function (rand, hasCustomer) {
    if (hasCustomer && rand < 0.22) { return 'watch'; }
    if (rand < 0.3) { return 'beg'; }
    if (rand < 0.62) { return 'walk'; }
    if (rand < 0.74) { return 'sleep'; }
    if (rand < 0.86) { return 'groom'; }
    if (rand < 0.95) { return 'stretch'; }
    return 'sit';
  };

  Iso.dogArt.poseOffset = function (pose) {
    var map = {
      sit: { head: [7, -29], tail: [-12, -10] },
      walk: { head: [17, -22], tail: [-15, -14] },
      loaf: { head: [10, -14], tail: [-13, -6] },
      stretch: { head: [17, -15], tail: [-15, -14] },
      beg: { head: [6, -33], tail: [-11, -8] }
    };
    return map[pose] || map.sit;
  };
})();
