/* 衣间小日子 — 店猫（矢量拆件：身体 / 头 / 尾巴 / 影子） */
(function () {
  var Iso = window.Iso;
  var D = Iso.draw;
  var C = Iso.C;
  var LINE = C.line;
  Iso.catArt = {};

  var PROFILES = [
    { name: '小橘', base: '#E2A464', dark: '#BE7C3F', belly: '#F8E9D2', collar: '#C97B63' },
    { name: '煤球', base: '#908C88', dark: '#6E6A66', belly: '#EDE7DF', collar: '#8A9A7B' },
    { name: '奶糖', base: '#EEE0CB', dark: '#D2B995', belly: '#FFF9EF', collar: '#D99A9A' }
  ];

  function hash(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) | 0; }
    return Math.abs(h);
  }

  Iso.catArt.profile = function (seed) {
    var p = PROFILES[hash(String(seed == null ? 'yijian' : seed)) % PROFILES.length];
    return {
      name: p.name,
      base: p.base,
      dark: p.dark,
      belly: p.belly,
      collar: p.collar,
      eye: '#5C7A58',
      pink: '#E8A9A0'
    };
  };

  Iso.catArt.key = function (c) {
    return [c.name, c.base, c.dark, c.belly, c.collar].join('|');
  };

  function line(w) {
    return ' stroke="' + LINE + '" stroke-width="' + (w || 1.3) + '" stroke-linejoin="round" stroke-linecap="round"';
  }

  function fur(c, extra) {
    return ' fill="' + c.base + '"' + line(1.3) + (extra || '');
  }

  function leg(c, x1, y1, x2, y2) {
    return '<path d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '" stroke="' + LINE + '" stroke-width="5.2" stroke-linecap="round"/>' +
      '<path d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '" stroke="' + c.base + '" stroke-width="3.8" stroke-linecap="round"/>' +
      '<circle cx="' + x2 + '" cy="' + (y2 + 0.4) + '" r="2.1" fill="' + c.belly + '" stroke="' + LINE + '" stroke-width=".8"/>';
  }

  /* 身体：统一画布，脚底在 (0,0)，朝右 */
  Iso.catArt.body = function (pose, c) {
    var s = '';
    var base = c.base, dark = c.dark, belly = c.belly;

    if (pose === 'walk') {
      s += leg(c, -9, -11, -12, -1.5);
      s += leg(c, -3, -10, -1, -1.5);
      s += leg(c, 8, -11, 7, -1.5);
      s += leg(c, 13, -11, 17, -1.5);
      s += '<path d="M-19 -15 Q-12 -25 2 -24 Q14 -23 16 -14 L15 -8 Q4 -4 -7 -6 Q-16 -8 -19 -12 Z"' + fur(c) + '/>';
      s += '<path d="M-14 -18 Q-9 -20 -4 -19 M-3 -21 Q2 -23 7 -22 M7 -23 Q11 -23 14 -20"' +
        ' fill="none" stroke="' + dark + '" stroke-width="2.2" stroke-linecap="round" opacity=".75"/>';
      s += '<path d="M-14 -6 Q-4 -3 8 -5" fill="none" stroke="' + belly + '" stroke-width="3" stroke-linecap="round" opacity=".8"/>';
    } else if (pose === 'loaf') {
      s += '<ellipse cx="-2" cy="-8" rx="17" ry="8" fill="' + base + '"' + line(1.3) + '/>';
      s += '<ellipse cx="-1" cy="-6" rx="10" ry="4.5" fill="' + belly + '" opacity=".55" stroke="none"/>';
      s += '<path d="M-16 -7 Q-18 -12 -13 -14 M-9 -10 Q-10 -14 -6 -15 M0 -11 Q-1 -15 3 -15"' +
        ' fill="none" stroke="' + dark + '" stroke-width="2" stroke-linecap="round" opacity=".6"/>';
      s += '<ellipse cx="9" cy="-2.6" rx="5" ry="2.4" fill="' + belly + '"' + line(1) + '/>';
      s += '<ellipse cx="-13" cy="-2.6" rx="4.5" ry="2.2" fill="' + belly + '"' + line(1) + '/>';
    } else if (pose === 'stretch') {
      s += leg(c, 8, -11, 24, -1.2);
      s += leg(c, 12, -11, 27, -3.2);
      s += '<path d="M-20 -14 Q-20 -25 -10 -26 Q0 -26 6 -18 L10 -9 Q0 -4 -10 -6 Q-18 -8 -20 -14 Z"' + fur(c) + '/>';
      s += '<path d="M-16 -17 Q-11 -19 -6 -17 M-12 -22 Q-7 -24 -2 -22"' +
        ' fill="none" stroke="' + dark + '" stroke-width="2.1" stroke-linecap="round" opacity=".7"/>';
      s += '<ellipse cx="-15" cy="-2.4" rx="5" ry="2.4" fill="' + belly + '"' + line(1) + '/>';
    } else {
      // sit
      s += '<ellipse cx="-7" cy="-10" rx="12" ry="9.5" fill="' + base + '"' + line(1.3) + '/>';
      s += '<path d="M-16 -15 Q-12 -25 -2 -25 Q6 -24 8 -16 L9 -3 Q5 -1 2 -3 L1 -14 Q-5 -12 -9 -6 Q-6 -2 -13 -2 Q-17 -3 -17 -8 Z"' + fur(c) + '/>';
      s += '<path d="M2 -15 Q6 -13 6 -2 L1 -2 Q0 -10 0 -14 Z"' + fur(c) + '/>';
      s += '<ellipse cx="-13" cy="-2.2" rx="5" ry="2.5" fill="' + belly + '"' + line(1) + '/>';
      s += '<ellipse cx="4.2" cy="-1.8" rx="3.6" ry="2.2" fill="' + belly + '"' + line(1) + '/>';
      s += '<path d="M3 -19 Q8 -13 5 -7 Q2 -11 1 -17 Z" fill="' + belly + '" opacity=".85" stroke="none"/>';
      s += '<path d="M-15 -14 Q-11 -16 -7 -15 M-16 -9 Q-12 -11 -8 -10 M-14 -18 Q-10 -20 -6 -19"' +
        ' fill="none" stroke="' + dark + '" stroke-width="2.1" stroke-linecap="round" opacity=".7"/>';
    }

    return { vb: { x: -30, y: -38, w: 60, h: 38 }, body: s };
  };

  /* 头：中心在 (0,0)，朝右 */
  Iso.catArt.head = function (expr, c) {
    var base = c.base, dark = c.dark, belly = c.belly, pink = c.pink;
    var s = '';

    // 耳朵
    s += '<path d="M-8 -4 L-9 -12 L-1 -7 Z" fill="' + base + '"' + line(1.2) + '/>';
    s += '<path d="M3 -7 L8 -12.5 L10 -4 Z" fill="' + base + '"' + line(1.2) + '/>';
    s += '<path d="M-7 -6 L-7.6 -9.6 L-3.6 -7 Z" fill="' + pink + '" stroke="none"/>';
    s += '<path d="M5 -7 L7.8 -9.6 L8.4 -6 Z" fill="' + pink + '" stroke="none"/>';

    // 头
    s += '<ellipse cx="0" cy="0" rx="9" ry="8" fill="' + base + '"' + line(1.3) + '/>';
    // 额头虎斑
    s += '<path d="M-3 -7 L-2 -4 M1 -7.2 L1.2 -4.4 M-6 -5 L-5 -3"' +
      ' fill="none" stroke="' + dark + '" stroke-width="1.5" stroke-linecap="round" opacity=".75"/>';

    // 白围嘴
    s += '<ellipse cx="4" cy="3.2" rx="5.4" ry="3.8" fill="' + belly + '" stroke="none"/>';

    // 眼睛
    if (expr === 'blink' || expr === 'sleep' || expr === 'happy') {
      s += '<path d="M-4 -1 Q-2 .8 0 -1 M3 -1 Q5 .8 7 -1" fill="none" stroke="#3F332B" stroke-width="1.4" stroke-linecap="round"/>';
    } else if (expr === 'surprised') {
      s += '<ellipse cx="-2" cy="-1" rx="2.1" ry="2.7" fill="' + c.eye + '"/>';
      s += '<ellipse cx="5" cy="-1" rx="2.1" ry="2.7" fill="' + c.eye + '"/>';
      s += '<circle cx="-1.4" cy="-1.8" r=".7" fill="#FFF9EF"/><circle cx="5.6" cy="-1.8" r=".7" fill="#FFF9EF"/>';
    } else {
      s += '<ellipse cx="-2" cy="-1" rx="1.8" ry="2.4" fill="' + c.eye + '"/>';
      s += '<ellipse cx="5" cy="-1" rx="1.8" ry="2.4" fill="' + c.eye + '"/>';
      s += '<circle cx="-1.4" cy="-1.8" r=".65" fill="#FFF9EF"/><circle cx="5.6" cy="-1.8" r=".65" fill="#FFF9EF"/>';
    }

    // 鼻子 / 嘴
    s += '<path d="M3.6 2 L6.2 2 L4.9 3.6 Z" fill="' + pink + '" stroke="' + LINE + '" stroke-width=".6"/>';
    if (expr === 'happy') {
      s += '<path d="M4.9 3.6 Q3.2 5.8 1.2 4" fill="none" stroke="#8A5A4A" stroke-width="1.2" stroke-linecap="round"/>';
      s += '<path d="M4.9 3.6 Q6.4 5.8 8 4.4" fill="none" stroke="#8A5A4A" stroke-width="1.2" stroke-linecap="round"/>';
      s += '<ellipse cx="4.8" cy="5.4" rx="1.8" ry="1.2" fill="#B8786F" stroke="' + LINE + '" stroke-width=".5"/>';
    } else if (expr === 'sleep') {
      s += '<path d="M4.9 3.6 Q4 4.6 3 3.8" fill="none" stroke="#8A5A4A" stroke-width="1.1" stroke-linecap="round"/>';
    } else {
      s += '<path d="M4.9 3.6 Q3.8 5 2.6 4.2 M4.9 3.6 Q6 5 7.2 4.2" fill="none" stroke="#8A5A4A" stroke-width="1.1" stroke-linecap="round"/>';
    }

    // 胡须
    s += '<path d="M7 3.4 L12 2.4 M7.2 4.4 L12.4 5.2 M-8 2.6 L-11.5 1.8"' +
      ' fill="none" stroke="' + LINE + '" stroke-width=".7" stroke-linecap="round" opacity=".42"/>';

    // 项圈 + 铃铛
    s += '<path d="M-8 6 Q0 9.2 8 6" fill="none" stroke="' + c.collar + '" stroke-width="2.4" stroke-linecap="round"/>';
    s += '<circle cx="2" cy="8.2" r="1.7" fill="#E3B23C" stroke="' + LINE + '" stroke-width=".7"/>';
    s += '<circle cx="1.6" cy="7.8" r=".5" fill="#FFF9EF"/>';

    return { vb: { x: -13, y: -14, w: 26, h: 26 }, body: s };
  };

  /* 尾巴：根部在 (0,0)，向上升起 */
  Iso.catArt.tail = function (c) {
    var s = '';
    s += '<path d="M0 0 C-7 -5 -9 -13 -3 -19 C1 -23 2 -26 -2 -27"' +
      ' fill="none" stroke="' + LINE + '" stroke-width="5.6" stroke-linecap="round"/>';
    s += '<path d="M0 0 C-7 -5 -9 -13 -3 -19 C1 -23 2 -26 -2 -27"' +
      ' fill="none" stroke="' + c.base + '" stroke-width="4.1" stroke-linecap="round"/>';
    s += '<path d="M-5 -8 Q-7 -9 -8 -11 M-6 -14 Q-4 -16 -2 -17"' +
      ' fill="none" stroke="' + c.dark + '" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>';
    return { vb: { x: -10, y: -30, w: 20, h: 30 }, body: s };
  };

  Iso.catArt.shadow = function () {
    return {
      vb: { x: -16, y: -5, w: 32, h: 10 },
      body: D.defs + '<ellipse cx="0" cy="0" rx="14" ry="4.4" fill="#3F332B" opacity=".2" filter="url(#soft)"/>'
    };
  };

  /* 猫的行为权重：纯函数，方便测试 */
  Iso.catArt.nextAction = function (rand, hasCustomer) {
    if (hasCustomer && rand < 0.2) { return 'watch'; }
    if (rand < 0.46) { return 'walk'; }
    if (rand < 0.66) { return 'sleep'; }
    if (rand < 0.8) { return 'groom'; }
    if (rand < 0.9) { return 'stretch'; }
    return 'sit';
  };

  Iso.catArt.poseOffset = function (pose) {
    var map = {
      sit: { head: [7, -28], tail: [-16, -10] },
      walk: { head: [17, -21], tail: [-19, -15] },
      loaf: { head: [10, -14], tail: [-18, -5] },
      stretch: { head: [17, -15], tail: [-19, -15] }
    };
    return map[pose] || map.sit;
  };
})();
