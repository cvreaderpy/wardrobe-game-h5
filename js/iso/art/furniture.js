/* 衣间小日子 — 等距家具（矢量） */
(function () {
  var Iso = window.Iso;
  var D = Iso.draw;
  var C = Iso.C;
  var LINE = C.line;
  var GD = window.GAME_DATA;
  Iso.art = Iso.art || {};

  function p(gx, gy, z) { return D.p(gx, gy, z); }
  function poly(list, fill, opt) { return D.poly(list, fill, opt); }
  function line(a, b, opt) { return D.line(a, b, opt); }
  function prism(x, y, w, d, h, color, z0, opt) { return D.prism(x, y, w, d, h, color, z0, opt); }

  function colorOf(name) {
    return (GD.COLOR_HEX && GD.COLOR_HEX[name]) || C[name] || '#D99A9A';
  }

  /* ---------- 货架 ---------- */
  function rack(f, def, w, d, h) {
    var x = f.x, y = f.y;
    var wood = def.id === 'rack_wood' ? '#A87D59' : '#B98D69';
    var woodDark = def.id === 'rack_wood' ? '#8C674B' : '#9C7253';
    var s = D.shadow(x, y, w, d);
    s += prism(x, y, 0.12, d * 0.9, h, wood);
    s += prism(x + w - 0.12, y, 0.12, d * 0.9, h, wood);
    s += prism(x + 0.08, y + d * 0.32, w - 0.16, 0.16, 4, woodDark, h - 4);
    var yF = y + d * 0.92;
    var cols = ['#E3B23C', '#8A9A7B', '#D99A9A', '#FFF9EF'];
    for (var i = 0; i < 4; i++) {
      var gx = x + 0.22 + i * ((w - 0.44) / 3);
      var top = h - 8, bot = 26;
      s += line(p(gx + 0.17, yF, h - 4), p(gx + 0.17, yF, top + 4), { sw: 1.2, stroke: woodDark });
      s += poly([p(gx + 0.02, yF, top + 4), p(gx + 0.17, yF, top), p(gx + 0.32, yF, top + 4)], 'none', { sw: 1.1, stroke: woodDark });
      s += poly([p(gx, yF, top + 2), p(gx + 0.34, yF, top + 2), p(gx + 0.38, yF, bot), p(gx - 0.04, yF, bot)], cols[i], { sw: 1.2 });
      s += poly([p(gx + 0.11, yF, top + 1), p(gx + 0.17, yF, top + 5), p(gx + 0.23, yF, top + 1)], 'none', { sw: 1, stroke: '#FFF9EF', opacity: 0.75 });
      s += line(p(gx - 0.02, yF, bot - 3), p(gx + 0.36, yF, bot - 3), { sw: 0.9, opacity: 0.3, stroke: LINE });
    }
    s += prism(x + 0.08, y + d * 0.22, w - 0.16, d * 0.5, 3, '#C9A57E', 20, { sw: 1.1 });
    s += prism(x + 0.2, y + d * 0.3, 0.5, d * 0.32, 5, '#D99A9A', 23, { sw: 1 });
    s += prism(x + 0.22, y + d * 0.32, 0.46, d * 0.28, 4, '#FFF9EF', 28, { sw: 1 });
    s += prism(x + w * 0.56, y + d * 0.3, 0.5, d * 0.32, 6, '#9EAFC1', 23, { sw: 1 });
    s += prism(x + w * 0.58, y + d * 0.32, 0.46, d * 0.28, 4, '#E3B23C', 29, { sw: 1 });
    return s;
  }

  /* ---------- 收银台 ---------- */
  function counter(f, def, w, d, h) {
    var x = f.x, y = f.y;
    var bodyH = 70;
    var s = D.shadow(x, y, w, d);
    s += prism(x, y, w, d, bodyH, '#E3C6A0', 0, { sw: 1.4 });
    s += prism(x - 0.05, y - 0.05, w + 0.1, d + 0.1, 6, '#D2AF89', bodyH, { sw: 1.4 });
    var yF = y + d - 0.02;
    for (var i = 1; i < 8; i++) {
      s += line(p(x + i * w / 8, yF, 4), p(x + i * w / 8, yF, bodyH - 3), { sw: 1.1, opacity: 0.45, stroke: '#C9A57E' });
    }
    s += line(p(x + 0.08, yF, 6), p(x + w - 0.08, yF, 6), { sw: 1.2, opacity: 0.35, stroke: '#B98D69' });
    // 收银机
    s += prism(x + w * 0.14, y + d * 0.25, 0.55, 0.36, 14, '#E3B23C', bodyH + 6, { sw: 1.2 });
    s += poly([p(x + w * 0.2, y + d * 0.6, bodyH + 16), p(x + w * 0.2 + 0.43, y + d * 0.6, bodyH + 16), p(x + w * 0.2 + 0.43, y + d * 0.6, bodyH + 11), p(x + w * 0.2, y + d * 0.6, bodyH + 11)], '#FFF9EF', { sw: 1 });
    s += prism(x + w * 0.66, y + d * 0.3, 0.28, 0.22, 5, '#6B4F3A', bodyH + 6, { sw: 1 });
    // 小盆栽
    s += prism(x + w * 0.76, y + d * 0.3, 0.3, 0.28, 8, '#C97B63', bodyH + 6, { sw: 1.1 });
    var c = p(x + w * 0.91, y + d * 0.44, bodyH + 14);
    s += '<path d="M' + c[0].toFixed(1) + ' ' + c[1].toFixed(1) + 'q-6 -1 -7 -7 q6 0 7 7Z" fill="#8A9A7B" stroke="' + LINE + '" stroke-width="1"/>';
    s += '<path d="M' + c[0].toFixed(1) + ' ' + c[1].toFixed(1) + 'q6 -1 7 -7 q-6 0 -7 7Z" fill="#9CAF8C" stroke="' + LINE + '" stroke-width="1"/>';
    return s;
  }

  /* ---------- 试衣间 ---------- */
  function fitting(f, def, w, d, h) {
    var x = f.x, y = f.y;
    var s = D.shadow(x, y, w, d);
    // 背板（布面竖纹）
    s += prism(x, y, w, 0.1, h, '#EADCC8');
    for (var bi = 0; bi < 6; bi++) {
      s += line(p(x + 0.18 + bi * 0.3, y + 0.11, 7), p(x + 0.18 + bi * 0.3, y + 0.11, h - 7), { sw: 1, opacity: 0.28, stroke: '#D8C3A8' });
    }
    // 左侧板
    s += prism(x, y + 0.1, 0.1, d - 0.1, h, '#EADCC8');
    // 右侧板（木）
    s += prism(x + w - 0.1, y + 0.1, 0.1, d - 0.1, h, '#D8C3A8');
    for (var wi = 0; wi < 3; wi++) {
      s += line(p(x + w - 0.1, y + 0.32 + wi * 0.62, 5), p(x + w - 0.1, y + 0.32 + wi * 0.62, h - 5), { sw: 1, opacity: 0.3, stroke: '#B99B78' });
    }
    // 顶檐
    s += prism(x - 0.03, y - 0.03, w + 0.06, d + 0.06, 5, '#D8C3A8', h, { sw: 1.2 });
    // 帘子（前脸左右两片，中间留口）
    var yF = y + d - 0.02;
    s += poly([p(x + 0.92, yF, 4), p(x + w * 0.5, yF, 4), p(x + w * 0.5, yF, h - 8), p(x + 0.92, yF, h - 8)], '#D99A9A', { sw: 1.5 });
    s += poly([p(x + w * 0.62, yF, 4), p(x + w - 0.08, yF, 4), p(x + w - 0.08, yF, h - 8), p(x + w * 0.62, yF, h - 8)], '#D99A9A', { sw: 1.5 });
    s += poly([p(x + w * 0.5, yF, 4), p(x + w * 0.62, yF, 4), p(x + w * 0.62, yF, h - 8), p(x + w * 0.5, yF, h - 8)], '#B8786F', { sw: 1.1, opacity: 0.45 });
    for (var ci = 1; ci < 6; ci++) {
      s += line(p(x + 0.92 + ci * 0.1, yF, 8), p(x + 0.92 + ci * 0.1, yF, h - 12), { sw: 1, opacity: 0.3, stroke: '#B8786F' });
      s += line(p(x + w * 0.62 + ci * 0.1, yF, 8), p(x + w * 0.62 + ci * 0.1, yF, h - 12), { sw: 1, opacity: 0.3, stroke: '#B8786F' });
    }
    // 帘杆
    s += line(p(x + 0.86, yF, h - 4), p(x + w - 0.04, yF, h - 4), { sw: 2, stroke: C.woodDark });
    return s;
  }

  /* ---------- 沙发 ---------- */
  function sofa(f, def, w, d, h) {
    var x = f.x, y = f.y;
    var s = D.shadow(x, y, w, d);
    s += prism(x, y, w, 0.22, 24, '#B86B57', 10, { sw: 1.2 });
    s += prism(x, y, w, d, 12, '#C97B63', 0, { sw: 1.3 });
    s += prism(x + 0.1, y + 0.24, w * 0.4 - 0.08, d * 0.62, 9, '#D99A9A', 12, { sw: 1.2 });
    s += prism(x + w * 0.52, y + 0.24, w * 0.4 - 0.08, d * 0.62, 9, '#D99A9A', 12, { sw: 1.2 });
    s += prism(x, y + 0.2, 0.18, d - 0.2, 18, '#B86B57', 8, { sw: 1.2 });
    s += prism(x + w - 0.18, y + 0.2, 0.18, d - 0.2, 18, '#B86B57', 8, { sw: 1.2 });
    s += prism(x + 0.15, y + d * 0.32, 0.3, 0.2, 6, '#E3B23C', 21, { sw: 1 });
    return s;
  }

  /* ---------- 模特 ---------- */
  function mannequin(f, def, w, d, h) {
    var x = f.x, y = f.y;
    var c = p(x + 0.5, y + d * 0.55, 0);
    var s = D.shadow(x, y, w, d, 0.14);
    s += '<ellipse cx="' + c[0].toFixed(1) + '" cy="' + (c[1] + 1).toFixed(1) + '" rx="14" ry="4" fill="#3F332B" opacity=".15" filter="url(#soft)"/>';
    s += line([c[0], c[1] - 4], [c[0], c[1] - 70], { sw: 3, stroke: C.woodDark, cap: 'round' });
    s += line([c[0] - 10, c[1] - 4], [c[0] + 10, c[1] - 4], { sw: 3, stroke: C.woodDark, cap: 'round' });
    // 裙子
    s += poly([[c[0] - 13, c[1] - 64], [c[0] + 13, c[1] - 64], [c[0] + 17, c[1] - 18], [c[0] - 17, c[1] - 18]], '#B7A6C9', { sw: 1.6 });
    // 上身
    s += poly([[c[0] - 11, c[1] - 84], [c[0] + 11, c[1] - 84], [c[0] + 13, c[1] - 64], [c[0] - 13, c[1] - 64]], '#C9BCD8', { sw: 1.6 });
    s += line([c[0], c[1] - 84], [c[0], c[1] - 18], { sw: 1, opacity: 0.35, stroke: '#9C8FAE' });
    s += '<circle cx="' + c[0].toFixed(1) + '" cy="' + (c[1] - 88).toFixed(1) + '" r="4.5" fill="#F1E3D3" stroke="' + LINE + '" stroke-width="1.4"/>';
    return s;
  }

  /* ---------- 绿植 ---------- */
  function plant(f, def, w, d, h) {
    var x = f.x, y = f.y;
    var s = D.shadow(x, y, w, d, 0.13);
    s += prism(x + w * 0.3, y + d * 0.3, w * 0.4, d * 0.4, 14, '#C97B63', 0, { sw: 1.3 });
    var c = p(x + w * 0.5, y + d * 0.5, 14);
    function leaf(dx1, dy1, cx1, cy1, dx2, dy2, fill) {
      return '<path d="M' + c[0].toFixed(1) + ' ' + c[1].toFixed(1) +
        'C' + (c[0] + dx1).toFixed(1) + ' ' + (c[1] + dy1).toFixed(1) + ' ' + (c[0] + cx1).toFixed(1) + ' ' + (c[1] + cy1).toFixed(1) + ' ' + (c[0] + dx2).toFixed(1) + ' ' + (c[1] + dy2).toFixed(1) +
        'C' + (c[0] + dx2 - 4).toFixed(1) + ' ' + (c[1] + dy2 + 8).toFixed(1) + ' ' + (c[0] + dx1 + 2).toFixed(1) + ' ' + (c[1] + dy1 + 6).toFixed(1) + ' ' + c[0].toFixed(1) + ' ' + c[1].toFixed(1) + 'Z" fill="' + fill + '" stroke="' + LINE + '" stroke-width="1.2"/>';
    }
    s += leaf(-8, -22, -26, -34, -30, -52, '#8A9A7B');
    s += leaf(-2, -26, -4, -50, 4, -64, '#9CAF8C');
    s += leaf(8, -22, 24, -36, 28, -54, '#8A9A7B');
    s += leaf(2, -20, 18, -24, 26, -30, '#9CAF8C');
    return s;
  }

  /* ---------- 吊灯 ---------- */
  function lamp(f, def, w, d, h) {
    var x = f.x, y = f.y;
    var top = p(x + w / 2, y + d / 2, 110);
    var bot = p(x + w / 2, y + d / 2, 84);
    var s = line(top, bot, { sw: 1.6, stroke: C.woodDark });
    s += '<path d="M' + (bot[0] - 12).toFixed(1) + ' ' + (bot[1] - 2).toFixed(1) +
      'H' + (bot[0] + 12).toFixed(1) + 'L' + (bot[0] + 8).toFixed(1) + ' ' + (bot[1] + 12).toFixed(1) +
      'H' + (bot[0] - 8).toFixed(1) + 'Z" fill="#E3B23C" stroke="' + LINE + '" stroke-width="1.5" stroke-linejoin="round"/>';
    s += '<ellipse cx="' + bot[0].toFixed(1) + '" cy="' + (bot[1] + 12).toFixed(1) + '" rx="8" ry="2.4" fill="#FFF3CE" stroke="' + LINE + '" stroke-width=".9"/>';
    s += '<circle cx="' + bot[0].toFixed(1) + '" cy="' + (bot[1] + 14).toFixed(1) + '" r="30" fill="url(#lampGlow)"/>';
    s += '<circle cx="' + bot[0].toFixed(1) + '" cy="' + (bot[1] + 10).toFixed(1) + '" r="2.4" fill="#FFF3CE"/>';
    return s;
  }

  /* ---------- 地毯 ---------- */
  function rug(f, def, w, d, h) {
    var x = f.x, y = f.y;
    var s = poly([p(x, y, 0.6), p(x + w, y, 0.6), p(x + w, y + d, 0.6), p(x, y + d, 0.6)], '#C97B63', { opacity: 0.26, sw: 1.3, stroke: '#C97B63' });
    s += poly([p(x + 0.25, y + 0.2, 0.8), p(x + w - 0.25, y + 0.2, 0.8), p(x + w - 0.25, y + d - 0.2, 0.8), p(x + 0.25, y + d - 0.2, 0.8)], 'none', { sw: 1.2, stroke: '#FFF9EF', opacity: 0.75 });
    s += poly([p(x + 0.7, y + 0.55, 1), p(x + w - 0.7, y + 0.55, 1), p(x + w - 0.7, y + d - 0.55, 1), p(x + 0.7, y + d - 0.55, 1)], 'none', { sw: 1, stroke: '#C97B63', opacity: 0.4 });
    return s;
  }

  /* ---------- 招牌 ---------- */
  function sign(f, def, w, d, h) {
    var x = f.x, y = f.y;
    var s = D.shadow(x, y, w, d, 0.13);
    // 两条腿
    s += prism(x + 0.25, y + d * 0.5, 0.1, 0.1, 44, C.woodDark);
    s += prism(x + w - 0.35, y + d * 0.5, 0.1, 0.1, 44, C.woodDark);
    // 牌子
    var yF = y + d * 0.55;
    s += poly([p(x + 0.2, yF, 40), p(x + w - 0.2, yF, 40), p(x + w - 0.2, yF, 12), p(x + 0.2, yF, 12)], '#E3B23C', { sw: 1.6 });
    s += poly([p(x + 0.28, yF - 0.01, 36), p(x + w - 0.28, yF - 0.01, 36), p(x + w - 0.28, yF - 0.01, 16), p(x + 0.28, yF - 0.01, 16)], '#FFF9EF', { sw: 1.1, opacity: 0.9 });
    var mc = p(x + w / 2, yF - 0.02, 27);
    s += '<path d="M' + mc[0].toFixed(1) + ' ' + (mc[1] + 4).toFixed(1) + 'q-6 -5 -2 -9q3 -2 2 1q1 -3 4 -1q4 4 -4 9Z" fill="#C97B63"/>';
    return s;
  }

  /* ---------- 墙纸屏风 ---------- */
  function wallpaper(f, def, w, d, h) {
    var x = f.x, y = f.y;
    var s = D.shadow(x, y, w, d, 0.13);
    for (var i = 0; i < 3; i++) {
      var px = x + i * 0.62;
      var py = y + 0.25 + i * 0.22;
      var ph = h - i * 3;
      s += prism(px, py, 0.58, 0.08, ph, '#B98D69');
      var yF = py + 0.11;
      // 布面
      s += poly([p(px + 0.05, yF, ph - 6), p(px + 0.53, yF, ph - 6), p(px + 0.53, yF, 8), p(px + 0.05, yF, 8)], '#F3E7DB', { sw: 1.1 });
      // 花纹：玫瑰 + 叶子
      var c1 = p(px + 0.28, yF - 0.01, ph * 0.55);
      s += '<circle cx="' + c1[0].toFixed(1) + '" cy="' + c1[1].toFixed(1) + '" r="5" fill="#D99A9A" stroke="' + LINE + '" stroke-width=".9"/>';
      s += '<circle cx="' + (c1[0] - 2).toFixed(1) + '" cy="' + (c1[1] - 1).toFixed(1) + '" r="2" fill="#E8B4B4"/>';
      s += '<path d="M' + (c1[0] - 6).toFixed(1) + ' ' + (c1[1] + 4).toFixed(1) + 'q-7 2 -9 8q7 0 9 -8Z" fill="#8A9A7B" stroke="' + LINE + '" stroke-width=".8"/>';
      s += '<path d="M' + (c1[0] + 6).toFixed(1) + ' ' + (c1[1] + 6).toFixed(1) + 'q7 1 10 7q-7 1 -10 -7Z" fill="#8A9A7B" stroke="' + LINE + '" stroke-width=".8"/>';
      var c2 = p(px + 0.4, yF - 0.01, ph * 0.24);
      s += '<circle cx="' + c2[0].toFixed(1) + '" cy="' + c2[1].toFixed(1) + '" r="3.2" fill="#E3B23C" stroke="' + LINE + '" stroke-width=".7"/>';
      // 木框
      s += line(p(px + 0.05, yF - 0.02, ph - 4), p(px + 0.53, yF - 0.02, ph - 4), { sw: 1.4, stroke: '#B98D69' });
      s += line(p(px + 0.05, yF - 0.02, 6), p(px + 0.53, yF - 0.02, 6), { sw: 1.4, stroke: '#B98D69' });
    }
    return s;
  }

  /* ---------- 落地窗帘 ---------- */
  function curtainItem(f, def, w, d, h) {
    var x = f.x, y = f.y;
    var s = D.shadow(x, y, w, d, 0.13);
    var yF = y + d * 0.55;
    s += prism(x + 0.12, yF, 0.09, 0.09, h - 4, C.woodDark);
    s += prism(x + w - 0.21, yF, 0.09, 0.09, h - 4, C.woodDark);
    s += line(p(x + 0.1, yF + 0.04, h - 2), p(x + w - 0.1, yF + 0.04, h - 2), { sw: 2, stroke: C.woodDark });
    // 帘头
    s += poly([p(x + 0.18, yF - 0.01, h - 4), p(x + w - 0.24, yF - 0.01, h - 4), p(x + w - 0.24, yF - 0.01, h - 12), p(x + 0.18, yF - 0.01, h - 12)], '#C98484', { sw: 1.3 });
    // 帘身
    s += poly([p(x + 0.24, yF - 0.01, h - 12), p(x + w - 0.3, yF - 0.01, h - 12), p(x + w - 0.34, yF - 0.01, 6), p(x + 0.28, yF - 0.01, 6)], '#D99A9A', { sw: 1.4 });
    // 内衬
    s += poly([p(x + 0.34, yF - 0.02, h - 16), p(x + w * 0.5, yF - 0.02, h - 16), p(x + w * 0.5, yF - 0.02, 9), p(x + 0.38, yF - 0.02, 9)], '#E8B4B4', { sw: 1, opacity: 0.65 });
    for (var i = 1; i < 7; i++) {
      s += line(p(x + 0.24 + i * 0.2, yF - 0.02, h - 14), p(x + 0.28 + i * 0.2, yF - 0.02, 8), { sw: 1, opacity: 0.32, stroke: '#B8786F' });
    }
    // 系带
    s += line(p(x + 0.22, yF - 0.03, h * 0.45), p(x + w - 0.28, yF - 0.03, h * 0.45), { sw: 3, stroke: '#E3B23C' });
    return s;
  }

  /* ---------- 全身镜 ---------- */
  function mirror(f, def, w, d, h) {
    var x = f.x, y = f.y;
    var c = p(x + w / 2, y + d / 2, 0);
    var s = D.shadow(x, y, w, d, 0.13);
    s += '<rect x="' + (c[0] - 20).toFixed(1) + '" y="' + (c[1] - 88).toFixed(1) + '" width="40" height="76" rx="19" fill="#C9A57E" stroke="' + LINE + '" stroke-width="1.8"/>';
    s += '<rect x="' + (c[0] - 15).toFixed(1) + '" y="' + (c[1] - 83).toFixed(1) + '" width="30" height="66" rx="15" fill="#DCEBEF" stroke="' + LINE + '" stroke-width="1.2"/>';
    s += '<path d="M' + (c[0] - 9).toFixed(1) + ' ' + (c[1] - 70).toFixed(1) + ' Q' + (c[0] - 4).toFixed(1) + ' ' + (c[1] - 79).toFixed(1) + ' ' + (c[0] + 2).toFixed(1) + ' ' + (c[1] - 81).toFixed(1) + '" stroke="#FFF9EF" stroke-width="2.4" fill="none" opacity=".8"/>';
    s += line([c[0] - 12, c[1] - 10], [c[0] - 19, c[1] + 1], { sw: 2.4, stroke: C.woodDark, cap: 'round' });
    s += line([c[0] + 12, c[1] - 10], [c[0] + 19, c[1] + 1], { sw: 2.4, stroke: C.woodDark, cap: 'round' });
    s += line([c[0] - 10, c[1] - 12], [c[0] + 10, c[1] - 12], { sw: 2, stroke: C.woodDark, cap: 'round' });
    return s;
  }

  /* ---------- 长凳 ---------- */
  function bench(f, def, w, d, h) {
    var x = f.x, y = f.y;
    var s = D.shadow(x, y, w, d, 0.13);
    s += prism(x + 0.12, y + 0.24, w - 0.24, 0.1, 24, '#B98D69', 24);
    s += prism(x + 0.1, y + 0.3, w - 0.2, 0.5, 13, '#C9A57E', 13);
    s += prism(x + 0.18, y + 0.36, 0.12, 0.32, 13, '#8C674B', 0);
    s += prism(x + w - 0.3, y + 0.36, 0.12, 0.32, 13, '#8C674B', 0);
    s += prism(x + 0.2, y + 0.38, (w - 0.5) / 2, 0.34, 5, '#D99A9A', 26);
    s += prism(x + w / 2 + 0.05, y + 0.38, (w - 0.5) / 2, 0.34, 5, '#D99A9A', 26);
    s += line(p(x + 0.24, y + 0.26, 36), p(x + w - 0.24, y + 0.26, 36), { sw: 1.2, opacity: 0.35, stroke: C.woodDark });
    return s;
  }

  /* ---------- 小圆桌 ---------- */
  function table(f, def, w, d, h) {
    var x = f.x, y = f.y;
    var c = p(x + w / 2, y + d / 2, 0);
    var top = c[1] - 34;
    var s = D.shadow(x, y, w, d, 0.12);
    s += line([c[0] - 14, top + 4], [c[0] - 18, c[1] - 2], { sw: 2.4, stroke: C.woodDark, cap: 'round' });
    s += line([c[0] + 14, top + 4], [c[0] + 18, c[1] - 2], { sw: 2.4, stroke: C.woodDark, cap: 'round' });
    s += line([c[0], top + 4], [c[0], c[1] - 2], { sw: 1.8, stroke: C.woodDark, cap: 'round' });
    s += '<ellipse cx="' + c[0].toFixed(1) + '" cy="' + top.toFixed(1) + '" rx="22" ry="8" fill="#D6B58D" stroke="' + LINE + '" stroke-width="1.4"/>';
    s += '<path d="M' + (c[0] - 22).toFixed(1) + ' ' + top.toFixed(1) + ' Q' + c[0].toFixed(1) + ' ' + (top + 12).toFixed(1) + ' ' + (c[0] + 22).toFixed(1) + ' ' + top.toFixed(1) + '" fill="none" stroke="' + LINE + '" stroke-width="1.2" opacity=".45"/>';
    s += '<path d="M' + (c[0] - 5).toFixed(1) + ' ' + (top - 2).toFixed(1) + ' Q' + (c[0] - 1).toFixed(1) + ' ' + (top - 18).toFixed(1) + ' ' + (c[0] + 1).toFixed(1) + ' ' + (top - 20).toFixed(1) + ' Q' + (c[0] + 8).toFixed(1) + ' ' + (top - 10).toFixed(1) + ' ' + (c[0] + 5).toFixed(1) + ' ' + (top - 2).toFixed(1) + ' Z" fill="#D99A9A" stroke="' + LINE + '" stroke-width="1.1"/>';
    s += '<circle cx="' + c[0].toFixed(1) + '" cy="' + (top - 22).toFixed(1) + '" r="4" fill="#8A9A7B" stroke="' + LINE + '" stroke-width="1"/>';
    return s;
  }

  /* ---------- 坐墩 ---------- */
  function pouf(f, def, w, d, h) {
    var x = f.x, y = f.y;
    var c = p(x + w / 2, y + d / 2, 0);
    var s = D.shadow(x, y, w, d, 0.12);
    s += '<ellipse cx="' + c[0].toFixed(1) + '" cy="' + (c[1] - 22).toFixed(1) + '" rx="18" ry="7" fill="#E8B4B4" stroke="' + LINE + '" stroke-width="1.3"/>';
    s += '<path d="M' + (c[0] - 18).toFixed(1) + ' ' + (c[1] - 22).toFixed(1) + ' Q' + (c[0] - 20).toFixed(1) + ' ' + (c[1] - 4).toFixed(1) + ' ' + (c[0] - 12).toFixed(1) + ' ' + (c[1] - 1).toFixed(1) + ' L' + (c[0] + 12).toFixed(1) + ' ' + (c[1] - 1).toFixed(1) + ' Q' + (c[0] + 20).toFixed(1) + ' ' + (c[1] - 4).toFixed(1) + ' ' + (c[0] + 18).toFixed(1) + ' ' + (c[1] - 22).toFixed(1) + ' Z" fill="#D99A9A" stroke="' + LINE + '" stroke-width="1.4"/>';
    s += '<path d="M' + (c[0] - 16).toFixed(1) + ' ' + (c[1] - 20).toFixed(1) + ' V' + (c[1] - 5).toFixed(1) + ' M' + (c[0] + 16).toFixed(1) + ' ' + (c[1] - 20).toFixed(1) + ' V' + (c[1] - 5).toFixed(1) + '" stroke="#B8786F" stroke-width="1" opacity=".4"/>';
    return s;
  }

  /* ---------- 衣帽架 ---------- */
  function coatRack(f, def, w, d, h) {
    var x = f.x, y = f.y;
    var c = p(x + w / 2, y + d / 2, 0);
    var s = D.shadow(x, y, w, d, 0.12);
    s += line([c[0], c[1] - 2], [c[0], c[1] - h + 4], { sw: 2.4, stroke: C.woodDark });
    s += line([c[0] - 22, c[1] - h + 8], [c[0] + 22, c[1] - h + 8], { sw: 2, stroke: C.woodDark, cap: 'round' });
    s += line([c[0] - 10, c[1] - 2], [c[0] - 20, c[1] - 14], { sw: 1.4, stroke: C.woodDark });
    s += line([c[0] + 10, c[1] - 2], [c[0] + 20, c[1] - 14], { sw: 1.4, stroke: C.woodDark });
    // 大衣
    s += poly([[c[0] - 18, c[1] - h + 8], [c[0] - 5, c[1] - h + 8], [c[0] - 6, c[1] - h + 34], [c[0] - 20, c[1] - h + 42], [c[0] - 22, c[1] - h + 20]], '#6B7F95', { sw: 1.2 });
    // 围巾
    s += '<path d="M' + (c[0] + 9).toFixed(1) + ' ' + (c[1] - h + 12).toFixed(1) + ' Q' + (c[0] + 18).toFixed(1) + ' ' + (c[1] - h + 26).toFixed(1) + ' ' + (c[0] + 14).toFixed(1) + ' ' + (c[1] - h + 40).toFixed(1) + '" fill="none" stroke="#E3B23C" stroke-width="4" stroke-linecap="round"/>';
    // 帽子
    s += '<ellipse cx="' + (c[0] + 10).toFixed(1) + '" cy="' + (c[1] - h + 5).toFixed(1) + '" rx="9" ry="4" fill="#C97B63" stroke="' + LINE + '" stroke-width="1.2"/>';
    return s;
  }

  /* ---------- 画架 ---------- */
  function easel(f, def, w, d, h) {
    var x = f.x, y = f.y;
    var c = p(x + w / 2, y + d / 2, 0);
    var s = D.shadow(x, y, w, d, 0.12);
    s += line([c[0], c[1] - 20], [c[0] - 20, c[1] - 2], { sw: 2.2, stroke: C.woodDark, cap: 'round' });
    s += line([c[0], c[1] - 20], [c[0] + 20, c[1] - 2], { sw: 2.2, stroke: C.woodDark, cap: 'round' });
    s += line([c[0], c[1] - 20], [c[0], c[1] - h + 8], { sw: 2.2, stroke: C.woodDark });
    s += '<rect x="' + (c[0] - 21).toFixed(1) + '" y="' + (c[1] - 86).toFixed(1) + '" width="42" height="54" fill="#FFF9EF" stroke="' + LINE + '" stroke-width="1.8"/>';
    s += '<rect x="' + (c[0] - 16).toFixed(1) + '" y="' + (c[1] - 81).toFixed(1) + '" width="32" height="42" fill="#DCEBEF" stroke="' + LINE + '" stroke-width="1"/>';
    s += '<circle cx="' + (c[0] + 6).toFixed(1) + '" cy="' + (c[1] - 62).toFixed(1) + '" r="5" fill="#E3B23C"/>';
    s += '<path d="M' + (c[0] - 13).toFixed(1) + ' ' + (c[1] - 49).toFixed(1) + ' L' + (c[0] + 1).toFixed(1) + ' ' + (c[1] - 74).toFixed(1) + ' L' + (c[0] + 12).toFixed(1) + ' ' + (c[1] - 54).toFixed(1) + ' Z" fill="#8A9A7B" opacity=".55"/>';
    return s;
  }

  /* ---------- 落地钟 ---------- */
  function clock(f, def, w, d, h) {
    var x = f.x, y = f.y;
    var c = p(x + w / 2, y + d / 2, 0);
    var s = D.shadow(x, y, w, d, 0.12);
    s += prism(x + 0.26, y + 0.26, 0.48, 0.42, h - 18, '#8C674B', 0);
    s += prism(x + 0.22, y + 0.22, 0.56, 0.5, 7, '#B98D69', h - 18);
    var fc = [c[0], c[1] - h + 18];
    s += '<circle cx="' + fc[0].toFixed(1) + '" cy="' + fc[1].toFixed(1) + '" r="11" fill="#FFF9EF" stroke="' + LINE + '" stroke-width="1.6"/>';
    s += '<circle cx="' + fc[0].toFixed(1) + '" cy="' + fc[1].toFixed(1) + '" r="8.5" fill="none" stroke="#D8C3A8" stroke-width=".9"/>';
    s += '<path d="M' + fc[0].toFixed(1) + ' ' + fc[1].toFixed(1) + 'v-6M' + fc[0].toFixed(1) + ' ' + fc[1].toFixed(1) + 'h4.5" stroke="#5B4636" stroke-width="1.5" stroke-linecap="round"/>';
    s += '<rect x="' + (c[0] - 10).toFixed(1) + '" y="' + (c[1] - 48).toFixed(1) + '" width="20" height="24" fill="#E3B23C" opacity=".55" stroke="' + LINE + '" stroke-width="1"/>';
    s += '<line x1="' + c[0].toFixed(1) + '" y1="' + (c[1] - 48).toFixed(1) + '" x2="' + c[0].toFixed(1) + '" y2="' + (c[1] - 24).toFixed(1) + '" stroke="' + LINE + '" stroke-width="1.2"/>';
    return s;
  }

  /* ---------- 收纳篮 ---------- */
  function basket(f, def, w, d, h) {
    var x = f.x, y = f.y;
    var c = p(x + w / 2, y + d / 2, 0);
    var s = D.shadow(x, y, w, d, 0.1);
    s += poly([[c[0] - 16, c[1] - 26], [c[0] + 16, c[1] - 26], [c[0] + 12, c[1] - 2], [c[0] - 12, c[1] - 2]], '#C9A57E', { sw: 1.3 });
    for (var i = 1; i < 4; i++) {
      s += line([c[0] - 15 + i * 2, c[1] - 26 + i * 6], [c[0] + 15 - i * 2, c[1] - 26 + i * 6], { sw: 1, opacity: 0.4, stroke: '#8C674B' });
    }
    s += '<path d="M' + (c[0] - 15).toFixed(1) + ' ' + (c[1] - 26).toFixed(1) + ' Q' + (c[0] - 4).toFixed(1) + ' ' + (c[1] - 42).toFixed(1) + ' ' + (c[0] + 8).toFixed(1) + ' ' + (c[1] - 27).toFixed(1) + ' Z" fill="#D99A9A" stroke="' + LINE + '" stroke-width="1.1"/>';
    s += '<path d="M' + (c[0] + 2).toFixed(1) + ' ' + (c[1] - 28).toFixed(1) + ' Q' + (c[0] + 12).toFixed(1) + ' ' + (c[1] - 36).toFixed(1) + ' ' + (c[0] + 14).toFixed(1) + ' ' + (c[1] - 24).toFixed(1) + ' Z" fill="#8A9A7B" stroke="' + LINE + '" stroke-width="1"/>';
    return s;
  }

  /* ---------- 圆地毯 ---------- */
  function roundRug(f, def, w, d, h) {
    var x = f.x, y = f.y;
    var c = p(x + w / 2, y + d / 2, 0);
    var s = '<ellipse cx="' + c[0].toFixed(1) + '" cy="' + c[1].toFixed(1) + '" rx="' + (w * 26).toFixed(1) + '" ry="' + (w * 13).toFixed(1) + '" fill="#C97B63" opacity=".28" stroke="#C97B63" stroke-width="1.4"/>';
    s += '<ellipse cx="' + c[0].toFixed(1) + '" cy="' + c[1].toFixed(1) + '" rx="' + (w * 19).toFixed(1) + '" ry="' + (w * 9.5).toFixed(1) + '" fill="none" stroke="#FFF9EF" stroke-width="1.4" opacity=".75"/>';
    return s;
  }

  /* ---------- 大绿植 ---------- */
  function plantBig(f, def, w, d, h) {
    var x = f.x, y = f.y;
    var s = D.shadow(x, y, w, d, 0.13);
    s += prism(x + w * 0.24, y + d * 0.24, w * 0.52, d * 0.52, 18, '#C97B63', 0, { sw: 1.3 });
    var c = p(x + w * 0.5, y + d * 0.5, 18);
    function leaf(dx1, dy1, cx1, cy1, dx2, dy2, fill) {
      return '<path d="M' + c[0].toFixed(1) + ' ' + c[1].toFixed(1) +
        'C' + (c[0] + dx1).toFixed(1) + ' ' + (c[1] + dy1).toFixed(1) + ' ' + (c[0] + cx1).toFixed(1) + ' ' + (c[1] + cy1).toFixed(1) + ' ' + (c[0] + dx2).toFixed(1) + ' ' + (c[1] + dy2).toFixed(1) +
        'C' + (c[0] + dx2 - 5).toFixed(1) + ' ' + (c[1] + dy2 + 9).toFixed(1) + ' ' + (c[0] + dx1 + 2).toFixed(1) + ' ' + (c[1] + dy1 + 7).toFixed(1) + ' ' + c[0].toFixed(1) + ' ' + c[1].toFixed(1) + 'Z" fill="' + fill + '" stroke="' + LINE + '" stroke-width="1.2"/>';
    }
    s += leaf(-10, -30, -34, -46, -40, -70, '#8A9A7B');
    s += leaf(-2, -34, -6, -66, 4, -84, '#9CAF8C');
    s += leaf(10, -30, 32, -48, 38, -72, '#8A9A7B');
    s += leaf(2, -26, 24, -34, 34, -42, '#9CAF8C');
    return s;
  }

  /* ---------- 入口 ---------- */
  Iso.art.furniture = function (f, def) {
    var rot = f.rot ? 1 : 0;
    var cw = def.w, cd = def.h;
    var w = rot ? cd : cw;
    var d = rot ? cw : cd;
    var h = Iso.furnitureHeight(def);
    var pad = 8;
    var left = Iso.P(f.x, f.y + d, 0).x - pad;
    var top = Iso.P(f.x, f.y, h).y - pad;
    var right = Iso.P(f.x + w, f.y, 0).x + pad;
    var bottom = Iso.P(f.x + w, f.y + d, 0).y + pad;
    var vb = { x: left, y: top, w: right - left, h: bottom - top };

    var body = '';
    switch (def.art) {
      case 'rack': body = rack(f, def, cw, cd, Iso.furnitureHeight(def)); break;
      case 'counter': body = counter(f, def, cw, cd, h); break;
      case 'fitting': body = fitting(f, def, cw, cd, h); break;
      case 'sofa': body = sofa(f, def, cw, cd, h); break;
      case 'mannequin': body = mannequin(f, def, cw, cd, h); break;
      case 'plant': body = plant(f, def, cw, cd, h); break;
      case 'mirror': body = mirror(f, def, cw, cd, h); break;
      case 'bench': body = bench(f, def, cw, cd, h); break;
      case 'table': body = table(f, def, cw, cd, h); break;
      case 'pouf': body = pouf(f, def, cw, cd, h); break;
      case 'coat_rack': body = coatRack(f, def, cw, cd, h); break;
      case 'easel': body = easel(f, def, cw, cd, h); break;
      case 'clock': body = clock(f, def, cw, cd, h); break;
      case 'basket': body = basket(f, def, cw, cd, h); break;
      case 'round_rug': body = roundRug(f, def, cw, cd, h); break;
      case 'plant_big': body = plantBig(f, def, cw, cd, h); break;
      case 'lamp': body = lamp(f, def, cw, cd, h); break;
      case 'rug': body = rug(f, def, cw, cd, h); break;
      case 'sign': body = sign(f, def, cw, cd, h); break;
      case 'wallpaper': body = wallpaper(f, def, cw, cd, h); break;
      case 'curtain': body = curtainItem(f, def, cw, cd, h); break;
      default: body = prism(f.x, f.y, cw, cd, h, '#D8C9B8');
    }

    if (rot) {
      // 等距视角下 90° 旋转 = 以 (canonX + rotX) / 2 为轴做水平镜像。
      // 之前把镜像轴算错，旋转后的家具会整体偏移半个瓦片，被纹理裁掉。
      var canonX = Iso.P(f.x + cw / 2, f.y + cd / 2, 0).x;
      var rotX = Iso.P(f.x + w / 2, f.y + d / 2, 0).x;
      body = '<g transform="translate(' + (canonX + rotX).toFixed(1) + ',0) scale(-1,1)">' + body + '</g>';
    }

    var defs = D.defs + '<radialGradient id="lampGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFE1A3" stop-opacity=".5"/><stop offset="1" stop-color="#FFE1A3" stop-opacity="0"/></radialGradient>';

    return { vb: vb, body: defs + body, layer: (def.art === 'rug' || def.art === 'round_rug') ? 'floor' : 'world' };
  };
})();
