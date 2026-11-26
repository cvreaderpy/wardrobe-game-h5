/* 衣间小日子 — 店外四季风景（背景 / 橱窗） */
(function () {
  var Iso = window.Iso;
  Iso.art = Iso.art || {};

  var LINE = '#5B4636';

  var PAL = {
    spring: {
      sky1: '#D8EDF2', sky2: '#FBF3E5',
      sun: '#F1C75B', sunSoft: '#FFF3CE',
      hill1: '#B9D3AB', hill2: '#9DBF94', ground: '#C8DEB2', ground2: '#B5D09B',
      trunk: '#8C674B', leaf: ['#F3B7C6', '#E89BB0', '#F7CBD6', '#B7D19B'],
      snow: '#FFFFFF', accent: '#F4B6C6'
    },
    summer: {
      sky1: '#BFE3F2', sky2: '#EFF9F1',
      sun: '#F2C64F', sunSoft: '#FFF4C8',
      hill1: '#9CC48A', hill2: '#7FAE78', ground: '#9FC988', ground2: '#86B573',
      trunk: '#8C674B', leaf: ['#6FA05C', '#5A8F51', '#82B46D', '#4F8248'],
      snow: '#FFFFFF', accent: '#D6E8A8'
    },
    autumn: {
      sky1: '#F2D8B6', sky2: '#FBF2E2',
      sun: '#EFA85A', sunSoft: '#FFE3B0',
      hill1: '#D9B47C', hill2: '#C49A63', ground: '#D8BD8C', ground2: '#C6A372',
      trunk: '#7B563E', leaf: ['#D2783D', '#C75A3C', '#E0A23C', '#B85E3A'],
      snow: '#FFFFFF', accent: '#D98548'
    },
    winter: {
      sky1: '#D3E3EB', sky2: '#F5FAFB',
      sun: '#DDE9F0', sunSoft: '#F4FBFF',
      hill1: '#E6EFF2', hill2: '#CDDDE5', ground: '#EDF4F7', ground2: '#D9E7ED',
      trunk: '#6F5A4D', leaf: ['#5E7C72', '#708F82'], snow: '#FFFFFF', accent: '#FFFFFF'
    }
  };

  function pal(season) { return PAL[season] || PAL.spring; }

  function blob(cx, cy, rx, ry, fill, opt) {
    opt = opt || {};
    return '<ellipse cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" rx="' + rx.toFixed(1) + '" ry="' + ry.toFixed(1) +
      '" fill="' + fill + '" stroke="' + (opt.stroke === null ? 'none' : (opt.stroke || LINE)) +
      '" stroke-width="' + (opt.sw || 1.2) + '"' + (opt.opacity == null ? '' : ' opacity="' + opt.opacity + '"') + '/>';
  }

  function leafTree(cx, baseY, size, p, season) {
    var s = '';
    var trunkW = Math.max(3, size * 0.055);
    var topY = baseY - size * 0.58;
    s += '<path d="M' + cx + ' ' + baseY + ' Q' + (cx - trunkW * 0.7) + ' ' + (baseY - size * 0.24) + ' ' + cx + ' ' + topY +
      ' Q' + (cx + trunkW * 0.7) + ' ' + (baseY - size * 0.24) + ' ' + cx + ' ' + baseY + ' Z" fill="' + p.trunk + '" stroke="' + LINE + '" stroke-width="1.2"/>';
    s += '<path d="M' + cx + ' ' + (baseY - size * 0.3) + ' L' + (cx - size * 0.2) + ' ' + (baseY - size * 0.46) +
      ' M' + cx + ' ' + (baseY - size * 0.36) + ' L' + (cx + size * 0.22) + ' ' + (baseY - size * 0.52) + '" fill="none" stroke="' + p.trunk + '" stroke-width="1.4" stroke-linecap="round"/>';
    var blobs = [
      [0, -0.06, 0.34, 0.28, 0],
      [-0.28, 0.02, 0.24, 0.22, 1],
      [0.28, 0.03, 0.25, 0.22, 2],
      [-0.12, 0.18, 0.27, 0.2, 3],
      [0.16, 0.2, 0.23, 0.18, 1]
    ];
    blobs.forEach(function (b) {
      s += blob(cx + b[0] * size, topY + b[1] * size, b[2] * size, b[3] * size, p.leaf[b[4] % p.leaf.length]);
    });
    if (season === 'spring') {
      s += blob(cx - size * 0.2, topY - size * 0.2, size * 0.16, size * 0.12, '#F9DCE4', { sw: 1 });
      s += blob(cx + size * 0.2, topY - size * 0.12, size * 0.13, size * 0.1, '#F9DCE4', { sw: 1 });
    }
    return s;
  }

  function bareTree(cx, baseY, size, p) {
    var topY = baseY - size * 0.72;
    var s = '<path d="M' + cx + ' ' + baseY + ' Q' + (cx - size * 0.04) + ' ' + (baseY - size * 0.4) + ' ' + cx + ' ' + topY +
      '" fill="none" stroke="' + p.trunk + '" stroke-width="' + Math.max(3, size * 0.06) + '" stroke-linecap="round"/>';
    var branches = [
      [0.45, -0.28, 0.62], [0.55, -0.46, 0.48], [0.35, -0.2, -0.55],
      [0.62, -0.42, -0.32], [0.28, -0.1, 0.5], [0.72, -0.56, 0.14]
    ];
    branches.forEach(function (b) {
      var x1 = cx + b[0] * size * 0.42;
      var y1 = baseY - size * (0.34 + b[1] * 0.3);
      s += '<path d="M' + (cx + size * 0.02) + ' ' + y1 + ' L' + x1 + ' ' + (y1 - size * 0.16) +
        '" stroke="' + p.trunk + '" stroke-width="1.5" stroke-linecap="round"/>';
      s += blob(x1, y1 - size * 0.16, size * 0.09, size * 0.035, p.snow, { stroke: null, opacity: 0.95 });
    });
    s += blob(cx, topY, size * 0.1, size * 0.045, p.snow, { stroke: null, opacity: 0.95 });
    return s;
  }

  function pineTree(cx, baseY, size, p, snow) {
    var s = '';
    s += '<path d="M' + cx + ' ' + baseY + ' L' + cx + ' ' + (baseY - size * 0.62) + '" stroke="' + p.trunk + '" stroke-width="' + Math.max(3, size * 0.05) + '"/>';
    var tiers = [[0.62, 0.34], [0.48, 0.27], [0.34, 0.21]];
    tiers.forEach(function (t, i) {
      var y = baseY - size * t[0];
      var w = size * t[1];
      s += '<path d="M' + cx + ' ' + (y - size * 0.2) + ' L' + (cx - w) + ' ' + (y + size * 0.1) + ' L' + (cx + w) + ' ' + (y + size * 0.1) + ' Z" fill="' + p.leaf[i % p.leaf.length] + '" stroke="' + LINE + '" stroke-width="1.2"/>';
      if (snow) {
        s += '<path d="M' + cx + ' ' + (y - size * 0.2) + ' L' + (cx - w * 0.58) + ' ' + (y + size * 0.01) + ' Q' + cx + ' ' + (y + size * 0.06) + ' ' + (cx + w * 0.58) + ' ' + (y + size * 0.01) + ' Z" fill="#FFFFFF" opacity=".92"/>';
      }
    });
    return s;
  }

  function clouds(skyW, skyH, weather, p, evening) {
    var s = '';
    var dark = weather === 'rain' || weather === 'downpour' || weather === 'thunder';
    var many = weather === 'cloudy' || weather === 'fog' || dark;
    var fill = evening ? '#F4D3B4' : (dark ? '#C4CDD0' : '#FFFFFF');
    var op = dark ? 0.62 : 0.72;
    function cloud(cx, cy, sc, o) {
      return '<g fill="' + fill + '" opacity="' + o + '">' +
        '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + (42 * sc) + '" ry="' + (12 * sc) + '"/>' +
        '<ellipse cx="' + (cx - 18 * sc) + '" cy="' + (cy - 8 * sc) + '" rx="' + (20 * sc) + '" ry="' + (11 * sc) + '"/>' +
        '<ellipse cx="' + (cx + 14 * sc) + '" cy="' + (cy - 11 * sc) + '" rx="' + (24 * sc) + '" ry="' + (13 * sc) + '"/>' +
        '</g>';
    }
    s += cloud(skyW * 0.22, skyH * 0.22, 1.0, op);
    if (many) { s += cloud(skyW * 0.76, skyH * 0.15, 1.2, op * 0.9); }
    if (dark) {
      s += cloud(skyW * 0.5, skyH * 0.08, 1.45, 0.42);
      s += cloud(skyW * 0.36, skyH * 0.12, 1.1, 0.35);
    }
    return s;
  }

  function sun(W, H, weather, p, evening) {
    if (evening) {
      return '<circle cx="' + (W * 0.74) + '" cy="' + (H * 0.15) + '" r="26" fill="#F6CF9E" opacity=".9"/>' +
        '<circle cx="' + (W * 0.74) + '" cy="' + (H * 0.15) + '" r="46" fill="#F6CF9E" opacity=".16"/>';
    }
    if (weather === 'rain' || weather === 'downpour' || weather === 'thunder' || weather === 'cloudy' || weather === 'fog' || weather === 'snow') {
      return '';
    }
    var cx = W * 0.76, cy = H * 0.14;
    var big = weather === 'hot' || weather === 'heatwave';
    var r = big ? 28 : 23;
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 2.1) + '" fill="' + p.sunSoft + '" opacity=".28"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + p.sun + '"/>' +
      (big ? '<g stroke="' + p.sun + '" stroke-width="2" stroke-linecap="round" opacity=".6">' +
        '<path d="M' + cx + ' ' + (cy - r - 9) + 'v-7M' + cx + ' ' + (cy + r + 9) + 'v7' +
        'M' + (cx - r - 9) + ' ' + cy + 'h-7M' + (cx + r + 9) + ' ' + cy + 'h7"/></g>' : '');
  }

  function hills(W, horizon, p) {
    return '<path d="M0 ' + (horizon + 18) + ' Q' + (W * 0.16) + ' ' + (horizon - 52) + ' ' + (W * 0.34) + ' ' + (horizon + 4) +
      ' Q' + (W * 0.5) + ' ' + (horizon - 30) + ' ' + (W * 0.66) + ' ' + (horizon + 8) +
      ' Q' + (W * 0.82) + ' ' + (horizon - 44) + ' ' + W + ' ' + (horizon + 10) + ' L' + W + ' ' + (horizon + 100) + ' L0 ' + (horizon + 100) + ' Z" fill="' + p.hill1 + '" opacity=".9"/>' +
      '<path d="M0 ' + (horizon + 44) + ' Q' + (W * 0.22) + ' ' + (horizon - 6) + ' ' + (W * 0.44) + ' ' + (horizon + 30) +
      ' Q' + (W * 0.66) + ' ' + (horizon - 4) + ' ' + W + ' ' + (horizon + 28) + ' L' + W + ' ' + (horizon + 120) + ' L0 ' + (horizon + 120) + ' Z" fill="' + p.hill2 + '" opacity=".75"/>';
  }

  function weatherOverlay(W, H, weather, p, scale) {
    scale = scale || 1;
    var s = '';
    if (weather === 'rain' || weather === 'downpour' || weather === 'thunder') {
      var n = weather === 'downpour' ? 34 : 22;
      s += '<g stroke="#8FB0BA" stroke-width="1.4" stroke-linecap="round" opacity=".55">';
      for (var i = 0; i < n; i++) {
        var x = ((i * 97 + 13) % W);
        var y = H * 0.18 + ((i * 53) % (H * 0.5));
        s += '<path d="M' + x + ' ' + y + 'l-6 ' + (14 * scale) + '"/>';
      }
      s += '</g>';
      if (weather === 'thunder') {
        var lx = W * 0.22, ly = H * 0.14;
        s += '<path d="M' + lx + ' ' + ly + ' L' + (lx - W * 0.05) + ' ' + (ly + H * 0.14) + ' L' + (lx + W * 0.03) + ' ' + (ly + H * 0.13) + ' L' + (lx - W * 0.02) + ' ' + (ly + H * 0.3) +
          '" fill="none" stroke="#F4D06F" stroke-width="4" stroke-linejoin="round" opacity=".9"/>';
      }
    } else if (weather === 'snow') {
      s += '<g fill="#FFFFFF" opacity=".9">';
      for (var j = 0; j < 26; j++) {
        var sx = ((j * 61 + 17) % W);
        var sy = H * 0.12 + ((j * 47) % (H * 0.5));
        s += '<circle cx="' + sx + '" cy="' + sy + '" r="' + (1.5 + (j % 3) * 0.7) + '"/>';
      }
      s += '</g>';
    } else if (weather === 'gale') {
      s += '<g fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" opacity=".55">' +
        '<path d="M' + (W * 0.12) + ' ' + (H * 0.22) + ' q44 -14 88 0 t88 0"/>' +
        '<path d="M' + (W * 0.3) + ' ' + (H * 0.15) + ' q40 -10 80 0 t80 0"/>' +
        '<path d="M' + (W * 0.56) + ' ' + (H * 0.3) + ' q36 -10 72 0 t72 0"/></g>';
    } else if (weather === 'fog') {
      s += '<ellipse cx="' + (W * 0.5) + '" cy="' + (H * 0.32) + '" rx="' + (W * 0.52) + '" ry="' + (H * 0.2) + '" fill="#FFFFFF" opacity=".3"/>' +
        '<ellipse cx="' + (W * 0.3) + '" cy="' + (H * 0.42) + '" rx="' + (W * 0.4) + '" ry="' + (H * 0.16) + '" fill="#FFFFFF" opacity=".22"/>';
    } else if (weather === 'heatwave' || weather === 'hot') {
      s += '<g fill="none" stroke="#FFE6A8" stroke-width="2" stroke-linecap="round" opacity=".5">' +
        '<path d="M' + (W * 0.12) + ' ' + (H * 0.58) + ' q16 -8 32 0 t32 0 t32 0"/>' +
        '<path d="M' + (W * 0.62) + ' ' + (H * 0.62) + ' q16 -8 32 0 t32 0 t32 0"/></g>';
    } else if (weather === 'rainbow') {
      var r = Math.min(W, H) * 0.42;
      var cx = W * 0.62, cy = H * 0.45;
      ['#E58A82', '#E3B23C', '#8A9A7B', '#7C9FB5'].forEach(function (c, k) {
        s += '<path d="M' + (cx - r - k * 5) + ' ' + cy + ' A' + (r + k * 5) + ' ' + (r + k * 5) + ' 0 0 1 ' + (cx + r + k * 5) + ' ' + cy +
          '" fill="none" stroke="' + c + '" stroke-width="4" opacity=".55"/>';
      });
    }
    return s;
  }

  function extraSeasonBits(W, H, season, p) {
    var s = '';
    if (season === 'spring') {
      s += '<g fill="' + p.accent + '" opacity=".85">';
      for (var i = 0; i < 14; i++) {
        var x = ((i * 79 + 30) % W);
        var y = 60 + ((i * 37) % (H * 0.48));
        s += '<ellipse cx="' + x + '" cy="' + y + '" rx="2" ry="1.2" transform="rotate(' + (i * 23) + ' ' + x + ' ' + y + ')"/>';
      }
      s += '</g>';
    } else if (season === 'autumn') {
      s += '<g fill="' + p.accent + '" opacity=".9">';
      for (var j = 0; j < 14; j++) {
        var ax = ((j * 83 + 24) % W);
        var ay = 70 + ((j * 41) % (H * 0.46));
        s += '<path d="M' + ax + ' ' + ay + ' q5 -4 9 0 q-4 8 -9 0Z" transform="rotate(' + (j * 31) + ' ' + ax + ' ' + ay + ')"/>';
      }
      s += '</g>';
    } else if (season === 'winter') {
      s += '<g fill="#FFFFFF" opacity=".85">';
      for (var k = 0; k < 12; k++) {
        var wx = ((k * 67 + 10) % W);
        var wy = 50 + ((k * 43) % (H * 0.4));
        s += '<circle cx="' + wx + '" cy="' + wy + '" r="' + (1.2 + (k % 3) * 0.6) + '"/>';
      }
      s += '</g>';
    }
    return s;
  }

  function lamp(x, baseY, p, snow) {
    return '<g>' +
      '<circle cx="' + x + '" cy="' + (baseY - 164) + '" r="34" fill="#FFE1A3" opacity=".18"/>' +
      '<path d="M' + x + ' ' + baseY + ' L' + x + ' ' + (baseY - 158) + '" stroke="#5B4636" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M' + x + ' ' + (baseY - 158) + ' Q' + (x - 14) + ' ' + (baseY - 150) + ' ' + (x - 18) + ' ' + (baseY - 136) + '" fill="none" stroke="#5B4636" stroke-width="3"/>' +
      '<path d="M' + (x - 28) + ' ' + (baseY - 132) + ' h20 l6 14 h-32 Z" fill="#E3B23C" stroke="#5B4636" stroke-width="1.5"/>' +
      (snow ? '<path d="M' + (x - 30) + ' ' + (baseY - 133) + ' h24" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>' : '') +
      '</g>';
  }

  /* ---------------- 店外背景 ---------------- */
  Iso.art.outdoor = function (opts) {
    opts = opts || {};
    var W = opts.w || 860;
    var H = opts.h || 580;
    var OX = opts.ox || W / 2;
    var OY = opts.oy || 160;
    var N = opts.n || 14;
    var season = opts.season || 'spring';
    var weather = opts.weather || 'sunny';
    var p = pal(season);
    var evening = !!opts.evening;
    var horizon = OY + N * 13 - 26;   // N*TH/2 - 26，墙顶线下方一点
    var s = '';

    s += '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="url(#outSky)"/>';
    s += sun(W, H, weather, p, evening);
    s += clouds(W, H, weather, p, evening);
    s += hills(W, horizon, p);

    // 远处树线：让店看起来坐落在街区/公园里
    s += '<g opacity=".55">';
    for (var i = 0; i < 9; i++) {
      var tx = 30 + i * (W - 60) / 8;
      var ts = 34 + (i % 3) * 8;
      s += '<path d="M' + tx + ' ' + (horizon + 26) + ' L' + tx + ' ' + (horizon - 10) + '" stroke="' + p.trunk + '" stroke-width="2"/>';
      s += '<circle cx="' + tx + '" cy="' + (horizon - 18) + '" r="' + ts * 0.5 + '" fill="' + p.leaf[i % p.leaf.length] + '" opacity=".8"/>';
    }
    s += '</g>';

    // 店铺后方的两棵大树：树冠从墙顶探出来，是判断季节的主视觉
    if (season === 'winter') {
      s += bareTree(OX - 250, OY + 326, 250, p);
      s += pineTree(OX + 256, OY + 330, 232, p, true);
    } else {
      s += leafTree(OX - 258, OY + 336, 286, p, season);
      s += leafTree(OX + 258, OY + 330, 258, p, season);
    }

    // 前景草地 / 店外的树和灯
    s += '<rect x="0" y="' + (horizon + 40) + '" width="' + W + '" height="' + (H - horizon - 40) + '" fill="' + p.ground + '"/>';
    s += '<path d="M0 ' + (horizon + 84) + ' Q' + (W * 0.2) + ' ' + (horizon + 64) + ' ' + (W * 0.42) + ' ' + (horizon + 88) +
      ' Q' + (W * 0.68) + ' ' + (horizon + 108) + ' ' + W + ' ' + (horizon + 76) + ' L' + W + ' ' + H + ' L0 ' + H + ' Z" fill="' + p.ground2 + '" opacity=".55"/>';

    if (season === 'winter') {
      s += bareTree(56, H - 14, 156, p);
      s += pineTree(W - 62, H - 6, 170, p, true);
    } else {
      s += leafTree(56, H - 14, 156, p, season);
      s += leafTree(W - 58, H - 10, 142, p, season);
    }
    s += lamp(W - 120, H - 18, p, season === 'winter' || weather === 'snow');

    // 低矮灌木
    s += blob(132, H - 36, 42, 20, p.leaf[1 % p.leaf.length], { sw: 1.1 });
    s += blob(W - 190, H - 32, 36, 17, p.leaf[2 % p.leaf.length], { sw: 1.1 });
    if (season === 'winter') {
      s += blob(132, H - 45, 34, 8, '#FFFFFF', { stroke: null, opacity: 0.85 });
      s += blob(W - 190, H - 40, 28, 7, '#FFFFFF', { stroke: null, opacity: 0.85 });
      s += blob(84, H - 16, 54, 12, '#FFFFFF', { stroke: null, opacity: 0.72 });
      s += blob(W - 96, H - 12, 62, 14, '#FFFFFF', { stroke: null, opacity: 0.72 });
      s += blob(W * 0.5, H - 6, 110, 10, '#FFFFFF', { stroke: null, opacity: 0.42 });
    }

    s += extraSeasonBits(W, H, season, p);
    s += weatherOverlay(W, H, weather, p, 1);

    if (evening) {
      s += '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="#C97B63" opacity=".12"/>';
    }
    return s;
  };

  /* ---------------- 橱窗里的四季取景 ---------------- */
  Iso.art.windowView = function (opts) {
    opts = opts || {};
    var quad = opts.quad || [];
    if (quad.length < 4) { return ''; }
    var xs = [], ys = [];
    quad.forEach(function (pt) { xs.push(pt[0]); ys.push(pt[1]); });
    var x0 = Math.min.apply(null, xs) - 2;
    var y0 = Math.min.apply(null, ys) - 2;
    var x1 = Math.max.apply(null, xs) + 2;
    var y1 = Math.max.apply(null, ys) + 2;
    var w = x1 - x0;
    var h = y1 - y0;
    var season = opts.season || 'spring';
    var weather = opts.weather || 'sunny';
    var p = pal(season);
    var clipId = opts.clipId || 'winClip';
    var pts = quad.map(function (pt) { return pt[0].toFixed(1) + ',' + pt[1].toFixed(1); }).join(' ');
    var horizon = y0 + h * 0.54;
    var s = '';

    s += '<clipPath id="' + clipId + '"><polygon points="' + pts + '"/></clipPath>';
    s += '<g clip-path="url(#' + clipId + ')">';
    s += '<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + h + '" fill="url(#outWinSky)"/>';
    s += '<circle cx="' + (x0 + w * 0.72) + '" cy="' + (y0 + h * 0.24) + '" r="' + (h * 0.12) + '" fill="' + p.sun + '" opacity=".9"/>';
    s += '<path d="M' + x0 + ' ' + (horizon + h * 0.12) + ' Q' + (x0 + w * 0.24) + ' ' + (horizon - h * 0.16) + ' ' + (x0 + w * 0.48) + ' ' + (horizon + h * 0.04) +
      ' Q' + (x0 + w * 0.72) + ' ' + (horizon - h * 0.13) + ' ' + x1 + ' ' + (horizon + h * 0.06) + ' L' + x1 + ' ' + y1 + ' L' + x0 + ' ' + y1 + ' Z" fill="' + p.hill1 + '"/>';
    s += '<path d="M' + x0 + ' ' + (horizon + h * 0.26) + ' Q' + (x0 + w * 0.3) + ' ' + (horizon + h * 0.06) + ' ' + (x0 + w * 0.58) + ' ' + (horizon + h * 0.22) +
      ' Q' + (x0 + w * 0.82) + ' ' + (horizon + h * 0.08) + ' ' + x1 + ' ' + (horizon + h * 0.2) + ' L' + x1 + ' ' + y1 + ' L' + x0 + ' ' + y1 + ' Z" fill="' + p.hill2 + '" opacity=".9"/>';
    s += '<rect x="' + x0 + '" y="' + (horizon + h * 0.18) + '" width="' + w + '" height="' + (y1 - horizon) + '" fill="' + p.ground + '"/>';
    if (season === 'winter') {
      s += bareTree(x0 + w * 0.24, y1 - 4, h * 0.82, p);
      s += pineTree(x0 + w * 0.76, y1 - 2, h * 0.68, p, true);
    } else {
      s += leafTree(x0 + w * 0.24, y1 - 2, h * 0.82, p, season);
      s += leafTree(x0 + w * 0.76, y1, h * 0.66, p, season);
    }
    s += extraSeasonBits(w, h, season, p);
    s += weatherOverlay(w, h, weather, p, 0.5);
    s += '<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + h + '" fill="' + p.ground + '" opacity="0"/>';
    s += '</g>';
    return s;
  };

  Iso.art.seasonPalette = PAL;
})();
