/* 衣间小日子 — 等距房间（矢量） */
(function () {
  var Iso = window.Iso;
  var D = Iso.draw;
  var C = Iso.C;
  var LINE = C.line;
  Iso.art = Iso.art || {};

  var SEASONS = {
    spring: {
      wallL: '#F8EEE0', wallR: '#EFE0CC', wainL: '#F1E3CF', wainR: '#E8D6BE',
      floor: ['#EBD6B8', '#E6CEAC', '#EFDCC2', '#E3C8A6'],
      sky1: '#CFE6EC', sky2: '#EEF5F1', city: '#A9C2C6',
      curtain: '#8A9A7B', curtainDark: '#6F8063', light: '#FFF3CE'
    },
    summer: {
      wallL: '#FBF1E2', wallR: '#F2E3CD', wainL: '#F5E9D7', wainR: '#EDDCC4',
      floor: ['#F0D8B8', '#EACFAD', '#F4DFC4', '#E6CBA8'],
      sky1: '#BFE0EA', sky2: '#EAF6F3', city: '#9FBFC4',
      curtain: '#8FA88B', curtainDark: '#748C70', light: '#FFF6D8'
    },
    autumn: {
      wallL: '#F7E9D7', wallR: '#EED9C2', wainL: '#F0E0C9', wainR: '#E6D0B5',
      floor: ['#E8CBA6', '#E1BF98', '#F0D6B3', '#DDBB94'],
      sky1: '#E6D3B4', sky2: '#F6E8D4', city: '#B9A184',
      curtain: '#B58B5E', curtainDark: '#96704A', light: '#FFE0A8'
    },
    winter: {
      wallL: '#F2EDE6', wallR: '#E7DDD1', wainL: '#EAE2D8', wainR: '#DFD3C5',
      floor: ['#E3D2BE', '#DBC8B2', '#EADBC8', '#D5C1AA'],
      sky1: '#D8E3E8', sky2: '#F2F7F7', city: '#AAB8BE',
      curtain: '#8FA3A8', curtainDark: '#73888E', light: '#EAF3FF'
    }
  };

  function poly(list, fill, opt) { return D.poly(list, fill, opt); }
  function p(gx, gy, z) { return D.p(gx, gy, z); }
  function prism(x, y, w, d, h, color, z0, opt) { return D.prism(x, y, w, d, h, color, z0, opt); }
  function line(a, b, opt) { return D.line(a, b, opt); }

  function windowItem(item, gy, idx) {
    if (!item) { return ''; }
    var GD = window.GAME_DATA;
    var color = (GD.COLOR_HEX && GD.COLOR_HEX[item.color]) || C[item.color] || '#D99A9A';
    var w = 0.28;
    var top = 62, bot = 46;
    var out = '';
    // 衣架
    out += line(p(0, gy, top + 3), p(0, gy, top + 1), { sw: 1.1, stroke: C.woodDark });
    out += poly([p(0, gy - 0.08, top + 1), p(0, gy, top - 0.4), p(0, gy + 0.08, top + 1)], 'none', { sw: 1, stroke: C.woodDark });
    // 裙子/上衣
    out += poly([
      p(0, gy - w, top), p(0, gy + w, top),
      p(0, gy + w + 0.12, top - 6), p(0, gy + w + 0.16, bot),
      p(0, gy - w - 0.16, bot), p(0, gy - w - 0.12, top - 6)
    ], color, { sw: 1.1, opacity: 0.92 });
    out += line(p(0, gy - w + 0.04, top - 1), p(0, gy + w - 0.04, top - 1), { sw: 0.9, stroke: '#FFF9EF', opacity: 0.65 });
    out += line(p(0, gy - w * 0.7, bot + 3), p(0, gy + w * 0.7, bot + 3), { sw: 0.9, stroke: C.line, opacity: 0.25 });
    return out;
  }

  Iso.art.room = function (opts) {
    opts = opts || {};
    var N = Iso.cfg.N;
    var W = Iso.cfg.W;
    var H = Iso.cfg.H;
    var OX = Iso.cfg.OX;
    var OY = Iso.cfg.OY;
    var sp = SEASONS[opts.season] || SEASONS.spring;
    var weather = opts.weather || 'sunny';
    var evening = !!opts.evening;
    var items = (opts.windowItems || []).slice(0, 3);
    var marketing = opts.marketing || 'none';

    var defs = D.defs +
      '<linearGradient id="outSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + (evening ? '#E9B98F' : sp.sky1) + '"/><stop offset="1" stop-color="' + (evening ? '#F2D3B8' : sp.sky2) + '"/></linearGradient>' +
      '<linearGradient id="outWinSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + (evening ? '#EDC3A0' : sp.sky1) + '"/><stop offset="1" stop-color="' + (evening ? '#F6DCC6' : sp.sky2) + '"/></linearGradient>' +
      '<linearGradient id="rGlass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E8F3F5"/><stop offset=".55" stop-color="#CFE4E8"/><stop offset="1" stop-color="#F7FBFA"/></linearGradient>' +
      '<linearGradient id="rCurtain" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + sp.curtainDark + '"/><stop offset=".45" stop-color="' + sp.curtain + '"/><stop offset="1" stop-color="' + sp.curtainDark + '"/></linearGradient>' +
      '<linearGradient id="rFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + sp.floor[0] + '"/><stop offset="1" stop-color="' + sp.floor[3] + '"/></linearGradient>' +
      '<linearGradient id="rAoWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5B4636" stop-opacity="0"/><stop offset=".7" stop-color="#5B4636" stop-opacity=".03"/><stop offset="1" stop-color="#5B4636" stop-opacity=".13"/></linearGradient>';

    var s = '';

    // 店外四季风景：天空 / 远山 / 树冠 / 草地 / 路灯
    s += Iso.art.outdoor({ w: W, h: H, ox: OX, oy: OY, n: N, season: opts.season, weather: weather, evening: evening });
    s += poly([p(0, N, 0), p(N, N, 0), p(N, N, -12), p(0, N, -12)], '#B98B65', { sw: 1.6 });
    s += poly([p(N, 0, 0), p(N, N, 0), p(N, N, -12), p(N, 0, -12)], '#9C7253', { sw: 1.6 });

    // 地板木板
    for (var gy = 0; gy < N; gy++) {
      s += poly([p(0, gy), p(N, gy), p(N, gy + 1), p(0, gy + 1)], sp.floor[gy % sp.floor.length], { sw: 1, opacity: 1 });
      for (var k = (gy % 2) * 2 + 1; k < N; k += 3) {
        s += line(p(k, gy), p(k, gy + 1), { sw: 1, opacity: 0.3 });
      }
      s += line(p(0.2, gy + 0.5), p(N - 0.2, gy + 0.5), { sw: 0.8, opacity: 0.14, stroke: '#A87D59' });
    }

    // 墙
    s += poly([p(0, 0, 0), p(0, N, 0), p(0, N, 110), p(0, 0, 110)], sp.wallL, { sw: 2 });
    s += poly([p(0, 0, 0), p(N, 0, 0), p(N, 0, 110), p(0, 0, 110)], sp.wallR, { sw: 2 });

    // 护墙板
    s += poly([p(0, 0, 0), p(0, N, 0), p(0, N, 30), p(0, 0, 30)], sp.wainL, { sw: 1 });
    s += poly([p(0, 0, 0), p(N, 0, 0), p(N, 0, 30), p(0, 0, 30)], sp.wainR, { sw: 1 });
    s += line(p(0, 0, 30), p(0, N, 30), { sw: 2, opacity: 0.75 });
    s += line(p(0, 0, 30), p(N, 0, 30), { sw: 2, opacity: 0.75 });
    for (var i = 1; i < N; i++) {
      if (i === 2 || i === 5 || i === 8) { continue; }
      s += line(p(0, i, 3), p(0, i, 27), { sw: 1, opacity: 0.3, stroke: '#C9A57E' });
      s += line(p(i, 0, 3), p(i, 0, 27), { sw: 1, opacity: 0.3, stroke: '#C9A57E' });
    }

    // 墙脚环境遮蔽 + 地板靠墙暗部
    s += poly([p(0, 0, 0), p(0, N, 0), p(0, N, 14), p(0, 0, 14)], 'url(#rAoWall)', { stroke: null, opacity: 0.85 });
    s += poly([p(0, 0, 0), p(N, 0, 0), p(N, 0, 14), p(0, 0, 14)], 'url(#rAoWall)', { stroke: null, opacity: 0.62 });
    s += poly([p(0, 0, 0), p(0, N, 0), p(1.1, N, 0), p(1.1, 0, 0)], '#5B4636', { stroke: null, opacity: 0.032 });
    s += poly([p(0, 0, 0), p(N, 0, 0), p(N, 1.0, 0), p(0, 1.0, 0)], '#5B4636', { stroke: null, opacity: 0.04 });

    // 顶角线 / 踢脚
    s += poly([p(0, 0, 104), p(0, N, 104), p(0, N, 110), p(0, 0, 110)], '#E7D5BE', { sw: 1.2 });
    s += poly([p(0, 0, 104), p(N, 0, 104), p(N, 0, 110), p(0, 0, 110)], '#DDC7AC', { sw: 1.2 });
    s += poly([p(0, 0, 0), p(0, N, 0), p(0, N, 7), p(0, 0, 7)], '#DCC8AC', { sw: 1 });
    s += poly([p(0, 0, 0), p(N, 0, 0), p(N, 0, 7), p(0, 0, 7)], '#D2BCA0', { sw: 1 });

    // 左墙大橱窗：直接看到店外的四季风景
    var win = Iso.cfg.WIN;
    var wy1 = win.y1, wy2 = win.y2, wz1 = win.z1, wz2 = win.z2;
    var winQuad = [p(0, wy1, wz1), p(0, wy2, wz1), p(0, wy2, wz2), p(0, wy1, wz2)];
    s += Iso.art.windowView({
      season: opts.season, weather: weather, quad: winQuad, clipId: 'rWinClip'
    });
    s += poly(winQuad, 'url(#rGlass)', { opacity: 0.06, stroke: null });

    // 窗格：两纵一横
    s += line(p(0, wy1 + (wy2 - wy1) / 3, wz1), p(0, wy1 + (wy2 - wy1) / 3, wz2), { sw: 1.6, opacity: 0.55 });
    s += line(p(0, wy1 + (wy2 - wy1) * 2 / 3, wz1), p(0, wy1 + (wy2 - wy1) * 2 / 3, wz2), { sw: 1.6, opacity: 0.55 });
    s += line(p(0, wy1, (wz1 + wz2) / 2), p(0, wy2, (wz1 + wz2) / 2), { sw: 1.6, opacity: 0.55 });
    s += poly(winQuad, 'none', { sw: 2.4 });

    // 橱窗陈列
    var itemGys = [2.95, 5.05, 7.15];
    for (var wi = 0; wi < items.length; wi++) {
      s += windowItem(items[wi], itemGys[wi], wi);
    }

    // 窗台
    s += prism(0.1, wy1, 0.45, wy2 - wy1, 4, '#C9A57E', wz1 - 5, { sw: 1.1 });
    // 窗台上的小花盆
    s += prism(0.18, wy1 + 0.35, 0.22, 0.28, 5, '#C97B63', wz1 - 1, { sw: 1 });
    s += '<path d="M' + p(0.29, wy1 + 0.49, wz1 + 4)[0].toFixed(1) + ' ' + p(0.29, wy1 + 0.49, wz1 + 4)[1].toFixed(1) + 'q-5 -2 -5 -8q5 1 5 8Z" fill="#8A9A7B" stroke="' + LINE + '" stroke-width="1"/>';
    s += prism(0.18, wy1 + 1.05, 0.22, 0.28, 4, '#D8C3A8', wz1 - 1, { sw: 1 });
    s += '<path d="M' + p(0.29, wy1 + 1.19, wz1 + 3)[0].toFixed(1) + ' ' + p(0.29, wy1 + 1.19, wz1 + 3)[1].toFixed(1) + 'q5 -2 6 -7q-6 0 -6 7Z" fill="#9CAF8C" stroke="' + LINE + '" stroke-width="1"/>';

    // 窗帘
    s += poly([p(0, wy1 - 0.5, 36), p(0, wy1 + 0.25, 36), p(0, wy1 + 0.25, 104), p(0, wy1 - 0.5, 104)], 'url(#rCurtain)', { sw: 1.4 });
    s += poly([p(0, wy2 - 0.25, 36), p(0, wy2 + 0.5, 36), p(0, wy2 + 0.5, 104), p(0, wy2 - 0.25, 104)], 'url(#rCurtain)', { sw: 1.4 });
    for (var ci = 0; ci < 3; ci++) {
      s += line(p(0, wy1 - 0.36 + ci * 0.2, 40), p(0, wy1 - 0.36 + ci * 0.2, 100), { sw: 1, opacity: 0.3, stroke: sp.curtainDark });
      s += line(p(0, wy2 + 0.36 - ci * 0.2, 40), p(0, wy2 + 0.36 - ci * 0.2, 100), { sw: 1, opacity: 0.3, stroke: sp.curtainDark });
    }
    s += line(p(0, wy1 - 0.58, 106), p(0, wy2 + 0.58, 106), { sw: 2.4, stroke: C.woodDark });

    // 右墙门
    var dx1 = 0.9, dx2 = 2.6, dz2 = 100;
    s += poly([p(dx1, 0, 0), p(dx2, 0, 0), p(dx2, 0, dz2), p(dx1, 0, dz2)], '#C9A57E', { sw: 2.2 });
    s += poly([p(dx1 + 0.12, 0, 5), p(dx2 - 0.12, 0, 5), p(dx2 - 0.12, 0, dz2 - 6), p(dx1 + 0.12, 0, dz2 - 6)], '#E3C6A0', { sw: 1.4 });
    s += '<circle cx="' + p(2.2, 0, 38)[0].toFixed(1) + '" cy="' + p(2.2, 0, 38)[1].toFixed(1) + '" r="2.2" fill="#E3B23C" stroke="' + LINE + '" stroke-width=".9"/>';
    // 门上小牌
    s += poly([p(1.2, 0, 101), p(2.1, 0, 101), p(2.1, 0, 108), p(1.2, 0, 108)], '#FFF9EF', { sw: 1.1 });
    s += '<text x="' + p(1.65, 0, 105)[0].toFixed(1) + '" y="' + p(1.65, 0, 105)[1].toFixed(1) + '" text-anchor="middle" font-family="sans-serif" font-size="5.5" font-weight="700" fill="#8A9A7B">OPEN</text>';

    // 左墙画 + 小隔板（窗户右侧）
    s += poly([p(0, 9.95, 66), p(0, 11.15, 66), p(0, 11.15, 90), p(0, 9.95, 90)], '#FFF9EF', { sw: 1.5 });
    s += poly([p(0, 10.1, 81), p(0, 11.0, 81), p(0, 11.0, 87), p(0, 10.1, 87)], '#C97B63', { opacity: 0.7, stroke: null });
    s += poly([p(0, 10.1, 72), p(0, 10.75, 72), p(0, 10.75, 76), p(0, 10.1, 76)], '#D8C9B8', { stroke: null });
    s += prism(0.05, 11.75, 0.42, 1.5, 3, C.wood, 58, { sw: 1 });
    s += prism(0.12, 11.83, 0.12, 0.34, 9, '#D99A9A', 61, { sw: 1 });
    s += prism(0.12, 12.01, 0.12, 0.34, 12, '#8A9A7B', 61, { sw: 1 });
    s += prism(0.12, 12.19, 0.12, 0.34, 7, '#E3B23C', 61, { sw: 1 });

    // 右墙隔板 + 书 + 植物 + 画
    s += prism(3.35, 0.05, 1.5, 0.4, 3, C.wood, 74, { sw: 1.1 });
    s += prism(3.48, 0.12, 0.16, 0.3, 9, '#C97B63', 77, { sw: 1 });
    s += prism(3.7, 0.12, 0.16, 0.3, 12, '#8A9A7B', 77, { sw: 1 });
    s += prism(3.92, 0.12, 0.16, 0.3, 7, '#E3B23C', 77, { sw: 1 });
    var pc = p(4.55, 0.2, 78);
    s += '<path d="M' + pc[0].toFixed(1) + ' ' + pc[1].toFixed(1) + 'q-6 -2 -7 -9q7 0 7 9Z" fill="#8A9A7B" stroke="' + LINE + '" stroke-width="1.1"/>';
    s += prism(4.42, 0.16, 0.2, 0.2, 6, '#FFF9EF', 77, { sw: 1 });

    // 右墙第二个隔板
    s += prism(6.3, 0.05, 1.5, 0.4, 3, C.wood, 74, { sw: 1.1 });
    s += prism(6.43, 0.12, 0.16, 0.3, 9, '#8A9A7B', 77, { sw: 1 });
    s += prism(6.65, 0.12, 0.16, 0.3, 12, '#D99A9A', 77, { sw: 1 });
    s += prism(6.87, 0.12, 0.16, 0.3, 7, '#E3B23C', 77, { sw: 1 });
    s += prism(7.35, 0.1, 0.3, 0.3, 7, '#C97B63', 77, { sw: 1.1 });

    // 右墙第三个隔板（大店补一段陈列）
    s += prism(8.85, 0.05, 1.5, 0.4, 3, C.wood, 74, { sw: 1.1 });
    s += prism(8.98, 0.12, 0.16, 0.3, 9, '#D99A9A', 77, { sw: 1 });
    s += prism(9.2, 0.12, 0.16, 0.3, 12, '#E3B23C', 77, { sw: 1 });
    s += prism(9.42, 0.12, 0.16, 0.3, 7, '#8A9A7B', 77, { sw: 1 });
    var pc2 = p(9.95, 0.2, 78);
    s += '<path d="M' + pc2[0].toFixed(1) + ' ' + pc2[1].toFixed(1) + 'q-6 -2 -7 -9q7 0 7 9Z" fill="#9CAF8C" stroke="' + LINE + '" stroke-width="1.1"/>';
    s += prism(9.82, 0.16, 0.2, 0.2, 6, '#C97B63', 77, { sw: 1 });

    // 右墙挂钟
    var ck = p(12.0, 0, 88);
    s += '<circle cx="' + ck[0].toFixed(1) + '" cy="' + ck[1].toFixed(1) + '" r="9.5" fill="#FFF9EF" stroke="' + LINE + '" stroke-width="1.6"/>';
    s += '<circle cx="' + ck[0].toFixed(1) + '" cy="' + ck[1].toFixed(1) + '" r="7.6" fill="none" stroke="#D8C3A8" stroke-width=".9"/>';
    s += '<path d="M' + ck[0].toFixed(1) + ' ' + ck[1].toFixed(1) + 'v-5M' + ck[0].toFixed(1) + ' ' + ck[1].toFixed(1) + 'h3.6" stroke="#5B4636" stroke-width="1.5" stroke-linecap="round"/>';
    s += '<circle cx="' + ck[0].toFixed(1) + '" cy="' + ck[1].toFixed(1) + '" r="1.2" fill="#5B4636"/>';

    // 营销海报（画框）
    s += poly([p(3.45, 0, 86), p(4.75, 0, 86), p(4.75, 0, 102), p(3.45, 0, 102)], '#FFF9EF', { sw: 1.4 });
    if (marketing === 'note') {
      s += poly([p(3.58, 0, 95), p(4.62, 0, 95), p(4.62, 0, 100), p(3.58, 0, 100)], '#C97B63', { opacity: 0.7, stroke: null });
      s += poly([p(3.58, 0, 89), p(4.3, 0, 89), p(4.3, 0, 92.5), p(3.58, 0, 92.5)], '#D8C9B8', { stroke: null });
    } else if (marketing === 'live') {
      var lc = p(4.1, 0, 95);
      s += '<circle cx="' + lc[0].toFixed(1) + '" cy="' + lc[1].toFixed(1) + '" r="4" fill="#D99A9A" stroke="' + LINE + '" stroke-width=".8"/>';
      s += '<circle cx="' + p(4.55, 0, 99)[0].toFixed(1) + '" cy="' + p(4.55, 0, 99)[1].toFixed(1) + '" r="1.4" fill="#C97B63"/>';
      s += poly([p(3.6, 0, 89), p(4.6, 0, 89), p(4.6, 0, 91), p(3.6, 0, 91)], '#E3B23C', { opacity: 0.75, stroke: null });
    } else if (marketing === 'flyer') {
      s += poly([p(3.55, 0, 89), p(4.65, 0, 89), p(4.65, 0, 100), p(3.55, 0, 100)], '#FFF9EF', { stroke: null });
      s += poly([p(3.65, 0, 95), p(4.55, 0, 95), p(4.55, 0, 98), p(3.65, 0, 98)], '#8A9A7B', { opacity: 0.7, stroke: null });
      s += line(p(3.65, 0, 92), p(4.4, 0, 92), { sw: 1.2, stroke: '#D8C9B8' });
    } else {
      s += poly([p(3.58, 0, 90), p(4.62, 0, 90), p(4.62, 0, 98), p(3.58, 0, 98)], '#D8C9B8', { stroke: null });
      s += '<circle cx="' + p(4.1, 0, 94)[0].toFixed(1) + '" cy="' + p(4.1, 0, 94)[1].toFixed(1) + '" r="2.4" fill="#E3B23C"/>';
    }

    // 窗光
    s += poly([p(0, wy1, 0), p(0, wy2, 0), p(3.4, wy2 + 1.2, 0), p(3.4, wy1 + 1.2, 0)], sp.light, { opacity: 0.22, stroke: null });
    s += poly([p(0, wy1 + 0.5, 0), p(0, wy2 - 1.0, 0), p(2.6, wy2 - 0.1, 0), p(2.6, wy1 + 0.7, 0)], sp.light, { opacity: 0.16, stroke: null });

    if (evening) {
      s += '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="#C97B63" opacity=".1"/>';
    }

    return { vb: { x: 0, y: 0, w: W, h: H }, body: defs + s };
  };
})();
