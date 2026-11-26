/* 衣间小日子 — 2.5D 等距基础：投影、调色板 */
(function () {
  var Iso = window.Iso = window.Iso || {};

  Iso.cfg = {
    TW: 52,          // 菱形瓦片宽
    TH: 26,          // 菱形瓦片高
    N: 14,           // 14 × 14 地板（大店，能站下店员 + 顾客 + 更多家具）
    OX: 430,         // 网格原点屏幕坐标（舞台 860 × 580）
    OY: 160,
    WALL_H: 110,
    W: 860,
    H: 580,
    // 左墙橱窗：店外风景的主取景框
    WIN: { y1: 1.4, y2: 9.2, z1: 32, z2: 102 }
  };

  // 等距投影：网格 (gx, gy) + 高度 z → 舞台坐标
  Iso.P = function (gx, gy, z) {
    var c = Iso.cfg;
    z = z || 0;
    return {
      x: c.OX + (gx - gy) * c.TW / 2,
      y: c.OY + (gx + gy) * c.TH / 2 - z
    };
  };

  // 逆投影：屏幕坐标 → 网格（编辑器用）
  Iso.grid = function (x, y) {
    var c = Iso.cfg;
    var dx = x - c.OX;
    var dy = y - c.OY;
    return {
      gx: (dx / (c.TW / 2) + dy / (c.TH / 2)) / 2,
      gy: (dy / (c.TH / 2) - dx / (c.TW / 2)) / 2
    };
  };

  Iso.C = {
    line: '#5B4636',
    ink: '#3F332B',
    floorA: '#EBD6B8',
    floorB: '#E4CDA9',
    wallL: '#F8EEE0',
    wallR: '#EFE0CC',
    wood: '#B98D69',
    woodDark: '#8C674B',
    terracotta: '#C97B63',
    terracottaDark: '#9E5B47',
    sage: '#8A9A7B',
    sageDark: '#6F8063',
    mustard: '#E3B23C',
    rose: '#D99A9A',
    roseDark: '#B8786F',
    lavender: '#B7A6C9',
    cream: '#FFF9EF',
    paper: '#FFF9EF',
    glass: '#DCEBEF',
    sky: '#CFE6EC',
    denim: '#6B7F95',
    cocoa: '#6B4F3A'
  };

  Iso.shade = function (hex, f) {
    if (typeof hex !== 'string') { return hex; }
    var n = parseInt(hex.replace('#', ''), 16);
    var r = Math.min(255, Math.round(((n >> 16) & 255) * f));
    var g = Math.min(255, Math.round(((n >> 8) & 255) * f));
    var b = Math.min(255, Math.round((n & 255) * f));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  Iso.hex = function (str) {
    if (typeof str === 'number') { return str; }
    if (!str) { return 0xD8C9B8; }
    return parseInt(String(str).replace('#', ''), 16) || 0xD8C9B8;
  };

  // 家具在等距场景里的高度（逻辑像素，从地面/挂点算起）
  Iso.furnitureHeight = function (item) {
    var map = {
      rack: 70, counter: 104, fitting: 100, sofa: 42,
      mannequin: 95, plant: 84, lamp: 110, rug: 1,
      sign: 46, wallpaper: 86, curtain: 96,
      mirror: 95, bench: 40, table: 58, pouf: 30,
      coat_rack: 100, easel: 90, plant_big: 90, clock: 105,
      basket: 24, round_rug: 2
    };
    return map[item && item.art] || 30;
  };

  Iso.furnitureDepth = function (item) {
    if (!item) { return 1; }
    return item.h || 1;
  };

  // 深度排序：脚底线（footprint 前角）越大越靠前
  Iso.sortKey = function (gx, gy, w, d) {
    return gx + w / 2 + gy + d;
  };

  // 给 SVG 工具用：把 {x,y} 变成 "x,y"
  Iso.pt = function (p) {
    return p.x.toFixed(1) + ',' + p.y.toFixed(1);
  };
})();
