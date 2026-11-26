/* 衣间小日子 — 家具数据与程序化图形 */
(function () {
  var D = window.GAME_DATA;

  /*
   * 家具目录
   * zone: floor 地面 / wall 墙面
   * w,h : 网格尺寸（1 格 = 40 逻辑像素）
   * effects: shelf 货架容量 / decor 装修分 / fitting 试衣间 / couture 高定展示位
   */
  D.FURNITURE = [
    { id: 'rack_basic', name: '简易货架', art: 'rack', zone: 'floor', price: 0, w: 2, h: 1, effects: { shelf: 8, decor: 1 } },
    { id: 'rack_wood', name: '木质货架', art: 'rack', zone: 'floor', price: 600, w: 2, h: 1, effects: { shelf: 8, decor: 3 } },
    { id: 'counter', name: '收银台', art: 'counter', zone: 'floor', price: 0, w: 2, h: 1, effects: { decor: 2 } },
    { id: 'fitting', name: '试衣间', art: 'fitting', zone: 'floor', price: 0, w: 2, h: 2, effects: { fitting: 1, decor: 2 } },
    { id: 'sofa', name: '双人沙发', art: 'sofa', zone: 'floor', price: 800, w: 2, h: 1, effects: { decor: 4 } },
    { id: 'mannequin', name: '展示模特', art: 'mannequin', zone: 'floor', price: 700, w: 1, h: 2, effects: { couture: 1, decor: 4 } },
    { id: 'plant', name: '绿植', art: 'plant', zone: 'floor', price: 200, w: 1, h: 1, effects: { decor: 2 } },
    { id: 'lamp', name: '吊灯', art: 'lamp', zone: 'wall', price: 400, w: 1, h: 1, effects: { decor: 3 } },
    { id: 'rug', name: '地毯', art: 'rug', zone: 'floor', price: 500, w: 3, h: 2, effects: { decor: 3 } },
    { id: 'sign', name: '招牌', art: 'sign', zone: 'wall', price: 300, w: 2, h: 1, effects: { decor: 2 } },
    { id: 'wallpaper', name: '花纹墙纸', art: 'wallpaper', zone: 'wall', price: 350, w: 2, h: 2, effects: { decor: 3 } },
    { id: 'curtain', name: '窗帘', art: 'curtain', zone: 'wall', price: 450, w: 2, h: 2, effects: { decor: 3 } },
    { id: 'mirror', name: '全身镜', art: 'mirror', zone: 'floor', price: 450, w: 1, h: 1, effects: { decor: 4 } },
    { id: 'bench', name: '长凳', art: 'bench', zone: 'floor', price: 350, w: 2, h: 1, effects: { decor: 3 } },
    { id: 'table', name: '小圆桌', art: 'table', zone: 'floor', price: 300, w: 1, h: 1, effects: { decor: 2 } },
    { id: 'pouf', name: '坐墩', art: 'pouf', zone: 'floor', price: 180, w: 1, h: 1, effects: { decor: 2 } },
    { id: 'coat_rack', name: '衣帽架', art: 'coat_rack', zone: 'floor', price: 250, w: 1, h: 1, effects: { decor: 2 } },
    { id: 'easel', name: '画架', art: 'easel', zone: 'floor', price: 320, w: 1, h: 1, effects: { decor: 3 } },
    { id: 'plant_big', name: '大绿植', art: 'plant_big', zone: 'floor', price: 320, w: 1, h: 1, effects: { decor: 3 } },
    { id: 'clock', name: '落地钟', art: 'clock', zone: 'floor', price: 700, w: 1, h: 1, effects: { decor: 5 } },
    { id: 'basket', name: '收纳篮', art: 'basket', zone: 'floor', price: 120, w: 1, h: 1, effects: { decor: 1 } },
    { id: 'round_rug', name: '圆地毯', art: 'round_rug', zone: 'floor', price: 420, w: 2, h: 2, effects: { decor: 3 } }
  ];

  D.FURNITURE_BY_ID = {};
  D.FURNITURE.forEach(function (f) { D.FURNITURE_BY_ID[f.id] = f; });

  /* 装修评分用的风格 / 类型标签 */
  D.FURNITURE_STYLES = {
    natural: '自然原木',
    vintage: '法式复古',
    sweet: '甜心少女',
    art: '艺术画廊',
    modern: '现代极简',
    neutral: '基础百搭'
  };

  D.FURNITURE_KINDS = {
    function: '功能',
    comfort: '舒适',
    display: '展示',
    decor: '装饰'
  };

  var FURNITURE_STYLE_MAP = {
    rack_basic: 'neutral', rack_wood: 'neutral', counter: 'neutral', fitting: 'neutral',
    plant: 'natural', plant_big: 'natural', bench: 'natural', coat_rack: 'natural', basket: 'natural',
    lamp: 'vintage', wallpaper: 'vintage', clock: 'vintage',
    sofa: 'sweet', rug: 'sweet', round_rug: 'sweet', table: 'sweet', pouf: 'sweet', curtain: 'sweet',
    mannequin: 'art', sign: 'art', easel: 'art',
    mirror: 'modern'
  };

  var FURNITURE_KIND_MAP = {
    rack_basic: 'function', rack_wood: 'function', counter: 'function', fitting: 'function',
    sofa: 'comfort', bench: 'comfort', table: 'comfort', pouf: 'comfort',
    mannequin: 'display', mirror: 'display', easel: 'display', sign: 'display'
  };

  D.FURNITURE.forEach(function (f) {
    f.style = FURNITURE_STYLE_MAP[f.id] || 'neutral';
    f.styleLabel = D.FURNITURE_STYLES[f.style] || '基础百搭';
    f.kind = FURNITURE_KIND_MAP[f.id] || 'decor';
    f.kindLabel = D.FURNITURE_KINDS[f.kind] || '装饰';
    f.cells = f.w * f.h;
  });

  D.SHOP_GRID = { cols: 14, rows: 14, grid: 'iso14' };
  D.SHOP_START = {
    owned: { rack_basic: 2, counter: 1, fitting: 1, sofa: 1, plant: 1, rug: 1, mirror: 1, bench: 1, plant_big: 1 },
    layout: [
      { uid: 'f1', id: 'rack_basic', x: 1, y: 3, rot: 0 },
      { uid: 'f2', id: 'rack_basic', x: 1, y: 6, rot: 0 },
      { uid: 'f3', id: 'fitting', x: 11, y: 1, rot: 0 },
      { uid: 'f4', id: 'counter', x: 10, y: 5, rot: 0 },
      { uid: 'f5', id: 'sofa', x: 1, y: 11, rot: 0 },
      { uid: 'f6', id: 'plant', x: 7, y: 0, rot: 0 },
      { uid: 'f7', id: 'rug', x: 5, y: 9, rot: 0 },
      { uid: 'f8', id: 'bench', x: 4, y: 1, rot: 0 },
      { uid: 'f9', id: 'mirror', x: 11, y: 8, rot: 0 },
      { uid: 'f10', id: 'plant_big', x: 12, y: 12, rot: 0 }
    ]
  };

  /* 缩放到 w×h 格的简单平涂家具图形，坐标原点在左上角 */
  D.furnitureArt = function (art, w, h) {
    var W = w * 40;
    var H = h * 40;
    var line = ' stroke="#5B4636" stroke-width="2" stroke-linejoin="round"';
    var box = function (x, y, ww, hh, fill, extra) {
      return '<rect x="' + x + '" y="' + y + '" width="' + ww + '" height="' + hh + '" rx="3" fill="' + fill + '"' + line + (extra || '') + '/>';
    };
    switch (art) {
      case 'rack':
        return box(2, 8, W - 4, H - 16, '#C9A57E') +
          '<path d="M' + (W * .15) + ' ' + (H * .25) + ' L' + (W * .15) + ' ' + (H * .5) + ' M' + (W * .35) + ' ' + (H * .25) + ' L' + (W * .35) + ' ' + (H * .5) + ' M' + (W * .55) + ' ' + (H * .25) + ' L' + (W * .55) + ' ' + (H * .5) + '" stroke="#8C674B" stroke-width="2"/>' +
          '<path d="M' + (W * .08) + ' ' + (H * .32) + ' L' + (W * .92) + ' ' + (H * .32) + '" stroke="#5B4636" stroke-width="2"/>' +
          '<circle cx="' + (W * .3) + '" cy="' + (H * .7) + '" r="4" fill="#D99A9A"/>' +
          '<circle cx="' + (W * .62) + '" cy="' + (H * .7) + '" r="4" fill="#8A9A7B"/>';
      case 'counter':
        return box(2, 10, W - 4, H - 14, '#E3C6A0') +
          '<rect x="' + (W * .1) + '" y="' + (H * .3) + '" width="' + (W * .3) + '" height="' + (H * .35) + '" rx="3" fill="#FFF9EF"' + line + '/>' +
          '<circle cx="' + (W * .65) + '" cy="' + (H * .45) + '" r="7" fill="#8A9A7B"' + line + '/>' +
          '<path d="M' + (W * .62) + ' ' + (H * .72) + ' L' + (W * .58) + ' ' + (H * .62) + ' M' + (W * .68) + ' ' + (H * .72) + ' L' + (W * .72) + ' ' + (H * .62) + '" stroke="#5F7053" stroke-width="2"/>';
      case 'fitting':
        return box(6, 2, W - 12, H - 6, '#EADCC8') +
          '<rect x="' + (W * .18) + '" y="' + (H * .15) + '" width="' + (W * .28) + '" height="' + (H * .7) + '" fill="#DCEBEF"' + line + '/>' +
          '<path d="M' + (W * .55) + ' ' + (H * .12) + ' Q' + (W * .62) + ' ' + (H * .4) + ' ' + (W * .55) + ' ' + (H * .88) + ' L' + (W * .82) + ' ' + (H * .88) + ' Q' + (W * .9) + ' ' + (H * .4) + ' ' + (W * .82) + ' ' + (H * .12) + ' Z" fill="#D99A9A" opacity=".65"' + line + '/>';
      case 'sofa':
        return box(4, 14, W - 8, H - 20, '#C97B63') +
          '<rect x="6" y="' + (H * .22) + '" width="' + (W - 12) + '" height="' + (H * .26) + '" rx="4" fill="#D99A9A"' + line + '/>' +
          '<path d="M' + (W / 2) + ' ' + (H * .5) + ' L' + (W / 2) + ' ' + (H * .78) + '" stroke="#9E5B47" stroke-width="1.6"/>';
      case 'mannequin':
        return '<circle cx="' + (W / 2) + '" cy="' + (H * .16) + '" r="7" fill="#F1E3D3"' + line + '/>' +
          '<path d="M' + (W / 2 - 12) + ' ' + (H * .28) + ' L' + (W / 2 + 12) + ' ' + (H * .28) + ' L' + (W / 2 + 16) + ' ' + (H * .62) + ' L' + (W / 2 - 16) + ' ' + (H * .62) + ' Z" fill="#B7A6C9"' + line + '/>' +
          '<path d="M' + (W / 2) + ' ' + (H * .62) + ' L' + (W / 2) + ' ' + (H * .84) + '" stroke="#5B4636" stroke-width="2.4"/>' +
          '<path d="M' + (W / 2 - 10) + ' ' + (H * .9) + ' L' + (W / 2 + 10) + ' ' + (H * .9) + '" stroke="#5B4636" stroke-width="2.4" stroke-linecap="round"/>';
      case 'plant':
        return '<path d="M' + (W / 2) + ' ' + (H * .7) + ' L' + (W / 2) + ' ' + (H * .32) + '" stroke="#5F7053" stroke-width="2.4"/>' +
          '<path d="M' + (W / 2) + ' ' + (H * .45) + ' Q' + (W * .25) + ' ' + (H * .3) + ' ' + (W * .2) + ' ' + (H * .5) + ' Q' + (W * .35) + ' ' + (H * .55) + ' ' + (W / 2) + ' ' + (H * .45) + ' Z" fill="#8A9A7B"' + line + '/>' +
          '<path d="M' + (W / 2) + ' ' + (H * .4) + ' Q' + (W * .78) + ' ' + (H * .22) + ' ' + (W * .84) + ' ' + (H * .46) + ' Q' + (W * .66) + ' ' + (H * .52) + ' ' + (W / 2) + ' ' + (H * .4) + ' Z" fill="#8A9A7B"' + line + '/>' +
          '<path d="M' + (W * .3) + ' ' + (H * .7) + ' L' + (W * .7) + ' ' + (H * .7) + ' L' + (W * .64) + ' ' + (H * .92) + ' L' + (W * .36) + ' ' + (H * .92) + ' Z" fill="#C97B63"' + line + '/>';
      case 'lamp':
        return '<path d="M' + (W / 2) + ' 0 L' + (W / 2) + ' ' + (H * .3) + '" stroke="#5B4636" stroke-width="2"/>' +
          '<path d="M' + (W * .22) + ' ' + (H * .3) + ' L' + (W * .78) + ' ' + (H * .3) + ' L' + (W * .66) + ' ' + (H * .52) + ' L' + (W * .34) + ' ' + (H * .52) + ' Z" fill="#E3B23C"' + line + '/>' +
          '<circle cx="' + (W / 2) + '" cy="' + (H * .62) + '" r="5" fill="#FFE1A3"/>';
      case 'rug':
        return '<rect x="4" y="6" width="' + (W - 8) + '" height="' + (H - 12) + '" rx="10" fill="#D99A9A" opacity=".55"' + line + '/>' +
          '<rect x="14" y="14" width="' + (W - 28) + '" height="' + (H - 28) + '" rx="8" fill="none" stroke="#FFF9EF" stroke-width="2" stroke-dasharray="6 5"/>';
      case 'sign':
        return '<rect x="4" y="6" width="' + (W - 8) + '" height="' + (H - 12) + '" rx="6" fill="#E3B23C"' + line + '/>' +
          '<path d="M' + (W * .2) + ' ' + (H * .5) + ' L' + (W * .8) + ' ' + (H * .5) + '" stroke="#6B4F3A" stroke-width="3" stroke-linecap="round"/>' +
          '<path d="M' + (W * .3) + ' ' + (H * .32) + ' L' + (W * .7) + ' ' + (H * .32) + '" stroke="#6B4F3A" stroke-width="2" stroke-linecap="round"/>';
      case 'wallpaper':
        return '<rect x="2" y="2" width="' + (W - 4) + '" height="' + (H - 4) + '" rx="4" fill="#F3E7DB"' + line + '/>' +
          '<path d="M' + (W * .25) + ' ' + (H * .2) + ' Q' + (W * .35) + ' ' + (H * .35) + ' ' + (W * .25) + ' ' + (H * .5) + ' M' + (W * .6) + ' ' + (H * .3) + ' Q' + (W * .7) + ' ' + (H * .45) + ' ' + (W * .6) + ' ' + (H * .6) + '" stroke="#D8C9B8" stroke-width="2" fill="none"/>';
      case 'curtain':
        return '<rect x="4" y="4" width="' + (W - 8) + '" height="' + (H - 8) + '" fill="#DCEBEF"' + line + '/>' +
          '<path d="M' + (W * .3) + ' 4 Q' + (W * .38) + ' ' + (H * .5) + ' ' + (W * .3) + ' ' + (H - 4) + ' M' + (W * .7) + ' 4 Q' + (W * .62) + ' ' + (H * .5) + ' ' + (W * .7) + ' ' + (H - 4) + '" stroke="#8A9A7B" stroke-width="4" fill="none"/>';
      case 'mirror':
        return '<rect x="' + (W * .22) + '" y="4" width="' + (W * .56) + '" height="' + (H * .78) + '" rx="' + (W * .28) + '" fill="#C9A57E"' + line + '/>' +
          '<rect x="' + (W * .28) + '" y="' + (H * .09) + '" width="' + (W * .44) + '" height="' + (H * .64) + '" rx="' + (W * .22) + '" fill="#DCEBEF"' + line + '/>' +
          '<path d="M' + (W * .36) + ' ' + (H * .24) + ' Q' + (W * .42) + ' ' + (H * .16) + ' ' + (W * .5) + ' ' + (H * .14) + '" stroke="#FFF9EF" stroke-width="2.5" fill="none" opacity=".8"/>' +
          '<path d="M' + (W * .2) + ' ' + (H * .84) + ' L' + (W * .32) + ' ' + (H * .94) + ' M' + (W * .8) + ' ' + (H * .84) + ' L' + (W * .68) + ' ' + (H * .94) + '" stroke="#8C674B" stroke-width="3" stroke-linecap="round"/>';
      case 'bench':
        return '<rect x="4" y="' + (H * .38) + '" width="' + (W - 8) + '" height="' + (H * .3) + '" rx="4" fill="#C9A57E"' + line + '/>' +
          '<rect x="4" y="' + (H * .22) + '" width="' + (W - 8) + '" height="' + (H * .12) + '" rx="3" fill="#B98D69"' + line + '/>' +
          '<rect x="' + (W * .1) + '" y="' + (H * .46) + '" width="' + (W * .36) + '" height="' + (H * .16) + '" rx="4" fill="#D99A9A"' + line + '/>' +
          '<rect x="' + (W * .54) + '" y="' + (H * .46) + '" width="' + (W * .36) + '" height="' + (H * .16) + '" rx="4" fill="#D99A9A"' + line + '/>' +
          '<path d="M' + (W * .18) + ' ' + (H * .68) + ' V' + (H * .92) + ' M' + (W * .82) + ' ' + (H * .68) + ' V' + (H * .92) + '" stroke="#8C674B" stroke-width="3.5" stroke-linecap="round"/>';
      case 'table':
        return '<ellipse cx="' + (W / 2) + '" cy="' + (H * .42) + '" rx="' + (W * .38) + '" ry="' + (H * .13) + '" fill="#C9A57E"' + line + '/>' +
          '<path d="M' + (W * .18) + ' ' + (H * .44) + ' V' + (H * .8) + ' M' + (W * .82) + ' ' + (H * .44) + ' V' + (H * .8) + '" stroke="#8C674B" stroke-width="3" stroke-linecap="round"/>' +
          '<path d="M' + (W * .42) + ' ' + (H * .4) + ' Q' + (W * .5) + ' ' + (H * .18) + ' ' + (W * .58) + ' ' + (H * .4) + ' Z" fill="#D99A9A"' + line + '/>' +
          '<circle cx="' + (W * .5) + '" cy="' + (H * .18) + '" r="4" fill="#8A9A7B"' + line + '/>';
      case 'pouf':
        return '<rect x="' + (W * .18) + '" y="' + (H * .32) + '" width="' + (W * .64) + '" height="' + (H * .46) + '" rx="' + (W * .18) + '" fill="#D99A9A"' + line + '/>' +
          '<ellipse cx="' + (W / 2) + '" cy="' + (H * .32) + '" rx="' + (W * .32) + '" ry="' + (H * .1) + '" fill="#E8B4B4"' + line + '/>' +
          '<path d="M' + (W * .3) + ' ' + (H * .34) + ' V' + (H * .74) + ' M' + (W * .7) + ' ' + (H * .34) + ' V' + (H * .74) + '" stroke="#B8786F" stroke-width="1.5" opacity=".4"/>';
      case 'coat_rack':
        return '<path d="M' + (W / 2) + ' ' + (H * .9) + ' V' + (H * .12) + ' M' + (W * .22) + ' ' + (H * .2) + ' H' + (W * .78) + '" stroke="#8C674B" stroke-width="3" stroke-linecap="round"/>' +
          '<path d="M' + (W * .22) + ' ' + (H * .2) + ' Q' + (W * .25) + ' ' + (H * .35) + ' ' + (W * .2) + ' ' + (H * .48) + ' L' + (W * .38) + ' ' + (H * .52) + ' L' + (W * .44) + ' ' + (H * .3) + ' Z" fill="#6B7F95"' + line + '/>' +
          '<path d="M' + (W * .72) + ' ' + (H * .2) + ' Q' + (W * .82) + ' ' + (H * .3) + ' ' + (W * .78) + ' ' + (H * .4) + ' L' + (W * .9) + ' ' + (H * .38) + ' L' + (W * .82) + ' ' + (H * .16) + ' Z" fill="#E3B23C"' + line + '/>';
      case 'easel':
        return '<path d="M' + (W * .5) + ' ' + (H * .3) + ' L' + (W * .24) + ' ' + (H * .92) + ' M' + (W * .5) + ' ' + (H * .3) + ' L' + (W * .76) + ' ' + (H * .92) + ' M' + (W * .5) + ' ' + (H * .3) + ' V' + (H * .55) + '" stroke="#8C674B" stroke-width="3" stroke-linecap="round"/>' +
          '<rect x="' + (W * .22) + '" y="' + (H * .14) + '" width="' + (W * .56) + '" height="' + (H * .42) + '" fill="#FFF9EF"' + line + '/>' +
          '<rect x="' + (W * .28) + '" y="' + (H * .2) + '" width="' + (W * .44) + '" height="' + (H * .3) + '" fill="#DCEBEF"' + line + '/>' +
          '<circle cx="' + (W * .58) + '" cy="' + (H * .3) + '" r="4" fill="#E3B23C"/>';
      case 'plant_big':
        return '<path d="M' + (W / 2) + ' ' + (H * .72) + ' L' + (W / 2) + ' ' + (H * .25) + '" stroke="#5F7053" stroke-width="3"/>' +
          '<path d="M' + (W / 2) + ' ' + (H * .42) + ' Q' + (W * .16) + ' ' + (H * .22) + ' ' + (W * .1) + ' ' + (H * .46) + ' Q' + (W * .28) + ' ' + (H * .56) + ' ' + (W / 2) + ' ' + (H * .42) + ' Z" fill="#8A9A7B"' + line + '/>' +
          '<path d="M' + (W / 2) + ' ' + (H * .32) + ' Q' + (W * .86) + ' ' + (H * .08) + ' ' + (W * .92) + ' ' + (H * .4) + ' Q' + (W * .7) + ' ' + (H * .5) + ' ' + (W / 2) + ' ' + (H * .32) + ' Z" fill="#9CAF8C"' + line + '/>' +
          '<path d="M' + (W * .28) + ' ' + (H * .72) + ' L' + (W * .72) + ' ' + (H * .72) + ' L' + (W * .64) + ' ' + (H * .94) + ' L' + (W * .36) + ' ' + (H * .94) + ' Z" fill="#C97B63"' + line + '/>';
      case 'clock':
        return '<rect x="' + (W * .28) + '" y="' + (H * .12) + '" width="' + (W * .44) + '" height="' + (H * .78) + '" rx="4" fill="#8C674B"' + line + '/>' +
          '<rect x="' + (W * .34) + '" y="' + (H * .18) + '" width="' + (W * .32) + '" height="' + (H * .34) + '" rx="2" fill="#FFF9EF"' + line + '/>' +
          '<circle cx="' + (W / 2) + '" cy="' + (H * .35) + '" r="' + (W * .13) + '" fill="#FFF9EF" stroke="#5B4636" stroke-width="2"/>' +
          '<path d="M' + (W / 2) + ' ' + (H * .35) + ' V' + (H * .28) + ' M' + (W / 2) + ' ' + (H * .35) + ' H' + (W * .57) + '" stroke="#5B4636" stroke-width="1.5" stroke-linecap="round"/>' +
          '<path d="M' + (W * .4) + ' ' + (H * .58) + ' H' + (W * .6) + ' V' + (H * .76) + ' H' + (W * .4) + ' Z" fill="#E3B23C" opacity=".7" stroke="#5B4636" stroke-width="1"/>';
      case 'basket':
        return '<path d="M' + (W * .18) + ' ' + (H * .48) + ' L' + (W * .82) + ' ' + (H * .48) + ' L' + (W * .72) + ' ' + (H * .9) + ' L' + (W * .28) + ' ' + (H * .9) + ' Z" fill="#C9A57E"' + line + '/>' +
          '<path d="M' + (W * .2) + ' ' + (H * .6) + ' H' + (W * .8) + ' M' + (W * .22) + ' ' + (H * .72) + ' H' + (W * .78) + '" stroke="#8C674B" stroke-width="1.5" opacity=".55"/>' +
          '<path d="M' + (W * .26) + ' ' + (H * .48) + ' Q' + (W * .4) + ' ' + (H * .3) + ' ' + (W * .56) + ' ' + (H * .48) + ' Z" fill="#D99A9A"' + line + '/>';
      case 'round_rug':
        return '<ellipse cx="' + (W / 2) + '" cy="' + (H / 2) + '" rx="' + (W * .46) + '" ry="' + (H * .42) + '" fill="#D99A9A" opacity=".6"' + line + '/>' +
          '<ellipse cx="' + (W / 2) + '" cy="' + (H / 2) + '" rx="' + (W * .34) + '" ry="' + (H * .3) + '" fill="none" stroke="#FFF9EF" stroke-width="2" stroke-dasharray="5 4"/>';
      default:
        return box(4, 8, W - 8, H - 16, '#D8C9B8');
    }
  };
})();
