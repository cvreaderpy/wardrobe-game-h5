/* 衣间小日子 — 参数化服装渲染
 *
 * 目标：同一套代码，既能画 40px 的店里小人，也能画 320px 的试衣镜大图。
 * 画法参考棚拍服装图：弱描边、四阶明暗、布料图案、结构线。
 */
(function () {
  var Iso = window.Iso = window.Iso || {};
  var G = Iso.garment = Iso.garment || {};

  var SKIN_LINE = '#B98D69';
  var INK = '#3F332B';

  /* ---------------- 基础工具 ---------------- */

  function hexNum(hex) {
    return parseInt(String(hex || '#D8C9B8').replace('#', ''), 16) || 0xD8C9B8;
  }

  function lum(hex) {
    var n = hexNum(hex);
    var r = ((n >> 16) & 255) / 255;
    var g = ((n >> 8) & 255) / 255;
    var b = (n & 255) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function mix(a, b, t) {
    var na = hexNum(a), nb = hexNum(b);
    var r = Math.round(((na >> 16) & 255) * (1 - t) + ((nb >> 16) & 255) * t);
    var g = Math.round(((na >> 8) & 255) * (1 - t) + ((nb >> 8) & 255) * t);
    var bl = Math.round((na & 255) * (1 - t) + (nb & 255) * t);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
  }

  function edge(fill) {
    return lum(fill) < 0.42 ? Iso.shade(fill, 1.55) : Iso.shade(fill, 0.55);
  }

  function hi(fill, f) { return Iso.shade(fill, f == null ? 1.14 : f); }
  function lo(fill, f) { return Iso.shade(fill, f == null ? 0.78 : f); }

  function ctxNew(app, outfit, pose, opts) {
    var specs = G.armSpecs[pose] || G.armSpecs.stand;
    opts = opts || {};
    return {
      back: !!opts.back,
      app: app,
      o: outfit,
      pose: pose,
      skin: app.skin,
      top: outfit.top,
      bottom: outfit.bottom,
      dress: outfit.dress,
      outer: outfit.outer,
      shoes: outfit.shoes,
      bag: outfit.bag,
      hosiery: outfit.hosiery,
      acc: outfit.acc || {},
      topLook: outfit.top && (outfit.top.look || Iso.lookOf(outfit.top)),
      bottomLook: outfit.bottom && (outfit.bottom.look || Iso.lookOf(outfit.bottom)),
      dressLook: outfit.dress && (outfit.dress.look || Iso.lookOf(outfit.dress)),
      outerLook: outfit.outer && (outfit.outer.look || Iso.lookOf(outfit.outer)),
      shoesLook: outfit.shoes && (outfit.shoes.look || Iso.lookOf(outfit.shoes)),
      bagLook: outfit.bag && (outfit.bag.look || Iso.lookOf(outfit.bag)),
      armSpec: specs,
      defs: '',
      n: 0
    };
  }

  function uid(ctx, p) {
    ctx.n += 1;
    return (p || 'id') + ctx.n;
  }

  function addDef(ctx, s) {
    ctx.defs += s;
  }

  function grad(ctx, fill, opts) {
    opts = opts || {};
    var id = uid(ctx, 'g');
    var l = opts.light || hi(fill, 1.12);
    var d = opts.dark || lo(fill, 0.84);
    var mid = opts.mid || fill;
    var x1 = opts.x1 == null ? 0.12 : opts.x1;
    var y1 = opts.y1 == null ? 0 : opts.y1;
    var x2 = opts.x2 == null ? 0.88 : opts.x2;
    var y2 = opts.y2 == null ? 1 : opts.y2;
    addDef(ctx, '<linearGradient id="' + id + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '">' +
      '<stop offset="0" stop-color="' + l + '"/>' +
      '<stop offset=".48" stop-color="' + mid + '"/>' +
      '<stop offset="1" stop-color="' + d + '"/>' +
      '</linearGradient>');
    return 'url(#' + id + ')';
  }

  function radial(ctx, fill, opts) {
    opts = opts || {};
    var id = uid(ctx, 'r');
    addDef(ctx, '<radialGradient id="' + id + '" cx="' + (opts.cx == null ? 0.35 : opts.cx) + '" cy="' + (opts.cy == null ? 0.25 : opts.cy) + '" r="' + (opts.r == null ? 0.8 : opts.r) + '">' +
      '<stop offset="0" stop-color="' + (opts.light || hi(fill, 1.18)) + '"/>' +
      '<stop offset="1" stop-color="' + (opts.dark || lo(fill, 0.82)) + '"/>' +
      '</radialGradient>');
    return 'url(#' + id + ')';
  }

  function patInk(fill) {
    return lum(fill) < 0.4 ? Iso.shade(fill, 1.55) : Iso.shade(fill, 0.72);
  }

  function pattern(ctx, type, fill) {
    if (!type || type === 'none') { return null; }
    var id = uid(ctx, 'p');
    var ink = patInk(fill);
    var ink2 = lum(fill) < 0.4 ? Iso.shade(fill, 1.28) : Iso.shade(fill, 0.85);
    var tile = 6;
    var body = '';
    switch (type) {
      case 'stripe':
        tile = 5;
        body = '<rect x="0" y="0" width="1.5" height="5" fill="' + ink + '"/>';
        break;
      case 'rib':
        tile = 3;
        body = '<rect x="0" y="0" width=".9" height="3" fill="' + ink + '"/><rect x="1.7" y="0" width=".35" height="3" fill="' + ink2 + '" opacity=".7"/>';
        break;
      case 'gingham':
        tile = 6;
        body = '<rect x="0" y="0" width="3" height="6" fill="' + ink + '" opacity=".35"/><rect x="0" y="0" width="6" height="3" fill="' + ink + '" opacity=".35"/>';
        break;
      case 'plaid':
        tile = 8;
        body = '<rect x="0" y="0" width="2.6" height="8" fill="' + ink + '" opacity=".4"/><rect x="0" y="0" width="8" height="1.2" fill="' + ink2 + '" opacity=".5"/><rect x="0" y="4" width="8" height=".6" fill="' + ink + '" opacity=".35"/>';
        break;
      case 'twill':
        tile = 4;
        body = '<path d="M-1 4L4 -1M0 5L5 0" stroke="' + ink + '" stroke-width=".7" opacity=".55" fill="none"/>';
        break;
      case 'floral':
        tile = 11;
        body = '<g opacity=".8">' +
          '<circle cx="3" cy="3" r="1.6" fill="' + ink + '"/>' +
          '<circle cx="4.4" cy="2.2" r="1.1" fill="' + ink2 + '"/>' +
          '<circle cx="8" cy="8" r=".9" fill="' + ink2 + '"/>' +
          '<circle cx="7" cy="10" r="1.2" fill="' + ink + '" opacity=".55"/>' +
          '</g>';
        break;
      case 'polka':
        tile = 8;
        body = '<circle cx="2.2" cy="2.2" r="1.15" fill="' + ink + '"/><circle cx="6.4" cy="6.4" r=".8" fill="' + ink2 + '"/>';
        break;
      case 'lace':
        tile = 7;
        body = '<path d="M0 1Q1.75 3 3.5 1Q5.25 3 7 1" fill="none" stroke="' + ink + '" stroke-width=".7"/><circle cx="3.5" cy="5.4" r=".8" fill="' + ink + '"/>';
        break;
      case 'mesh':
        tile = 4;
        body = '<path d="M0 0H4M0 0V4" stroke="' + ink + '" stroke-width=".55" opacity=".75" fill="none"/>';
        break;
      case 'quilt':
        tile = 10;
        body = '<path d="M0 5L5 0L10 5L5 10Z" fill="none" stroke="' + ink + '" stroke-width=".7" opacity=".55"/><circle cx="5" cy="5" r=".7" fill="' + ink2 + '"/>';
        break;
      case 'straw':
        tile = 5;
        body = '<path d="M0 1L5 4M0 4L5 1" stroke="' + ink + '" stroke-width=".65" opacity=".7" fill="none"/>';
        break;
      case 'tweed':
        tile = 9;
        body = '<path d="M1 1L4 1.6M5 3L8 2.2M2 6L5 7M6 8L8 7" stroke="' + ink + '" stroke-width=".9" opacity=".55"/><path d="M2 4L2 5M7 1L7 2" stroke="' + ink2 + '" stroke-width=".8"/>';
        break;
      case 'cable':
        tile = 10;
        body = '<path d="M2 0Q6 2.5 2 5Q-2 7.5 2 10M8 0Q4 2.5 8 5Q12 7.5 8 10" fill="none" stroke="' + ink + '" stroke-width="1" opacity=".55"/>';
        break;
      default:
        return null;
    }
    addDef(ctx, '<pattern id="' + id + '" width="' + tile + '" height="' + tile + '" patternUnits="userSpaceOnUse">' + body + '</pattern>');
    return 'url(#' + id + ')';
  }

  function path(d, fill, opt) {
    opt = opt || {};
    var s = '<path d="' + d + '" fill="' + fill + '"';
    if (opt.stroke) { s += ' stroke="' + opt.stroke + '" stroke-width="' + (opt.sw == null ? 1 : opt.sw) + '" stroke-linejoin="round" stroke-linecap="round"'; }
    if (opt.opacity != null) { s += ' opacity="' + opt.opacity + '"'; }
    if (opt.fillRule) { s += ' fill-rule="' + opt.fillRule + '"'; }
    return s + '/>';
  }

  function line(d, color, w, op, cap) {
    return '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="' + w + '"' +
      (op == null ? '' : ' opacity="' + op + '"') + (cap === false ? '' : ' stroke-linecap="round"') + '/>';
  }

  function stitch(d, color, w, dash) {
    return '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="' + (w == null ? .55 : w) + '" stroke-dasharray="' + (dash || '1.2 1.4') + '" opacity=".85" stroke-linecap="round"/>';
  }

  function ellipse(cx, cy, rx, ry, fill, opt) {
    opt = opt || {};
    return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + fill + '"' +
      (opt.opacity == null ? '' : ' opacity="' + opt.opacity + '"') +
      (opt.stroke ? ' stroke="' + opt.stroke + '" stroke-width="' + (opt.sw == null ? .8 : opt.sw) + '"' : '') + '/>';
  }

  function cloth(ctx, d, color, opt) {
    opt = opt || {};
    var fill = opt.flat ? color : grad(ctx, color, opt);
    var out = path(d, fill, { stroke: opt.noEdge ? null : edge(color), sw: opt.sw == null ? .75 : opt.sw, opacity: opt.opacity });
    var pat = opt.pattern === false ? null : opt.pattern;
    if (pat) {
      out += path(d, pat, { opacity: opt.patternOpacity == null ? .55 : opt.patternOpacity });
    }
    return out;
  }

  function fold(d, color, op, w) {
    return line(d, lo(color, 0.72), w == null ? .65 : w, op == null ? .42 : op);
  }

  function gleam(d, color, op, w) {
    return line(d, hi(color, 1.3), w == null ? .7 : w, op == null ? .45 : op);
  }

  /* ---------------- 身体基础 ---------------- */

  G.armSpecs = {
    stand: [
      { x1: -20, ex: -24, ey: -72, x2: -24, hx: -22, hy: -48 },
      { x1: 20, ex: 24, ey: -72, x2: 24, hx: 22, hy: -48 }
    ],
    hip: [
      { x1: -20, ex: -22, ey: -74, x2: -27, hx: -17, hy: -62 },
      { x1: 20, ex: 24, ey: -70, x2: 24, hx: 22, hy: -50 }
    ],
    twirl: [
      { x1: -20, ex: -30, ey: -78, x2: -34, hx: -35, hy: -60 },
      { x1: 20, ex: 30, ey: -78, x2: 34, hx: 35, hy: -60 }
    ],
    mirror: [
      { x1: -20, ex: -19, ey: -78, x2: -24, hx: -11, hy: -86 },
      { x1: 20, ex: 24, ey: -72, x2: 24, hx: 22, hy: -50 }
    ]
  };

  G.legs = function (ctx) {
    var skin = ctx.skin;
    var out = '';
    [-1, 1].forEach(function (dir) {
      var x = dir * 12.5;
      var top = dir * 14;
      var bottom = dir * 12.5;
      out += line('M' + top + ' -58Q' + (top + dir * 1.5) + ' -34 ' + bottom + ' -9', SKIN_LINE, 8.8, .55);
      out += line('M' + top + ' -58Q' + (top + dir * 1.5) + ' -34 ' + bottom + ' -9', skin, 7.8, 1);
      out += line('M' + (top - dir * 2.6) + ' -52Q' + (top - dir * 2) + ' -36 ' + (bottom - dir * 2.4) + ' -16', lo(skin, 0.9), 3.4, .22);
      out += line('M' + (top - dir * 1) + ' -30Q' + (top + dir * 1.8) + ' -27 ' + (bottom - dir * .2) + ' -25', lo(skin, 0.82), .7, .35);
      out += line('M' + (bottom + dir * 2) + ' -15Q' + (bottom + dir * 3.2) + ' -12 ' + (bottom + dir * 1.8) + ' -9', hi(skin, 1.06), .8, .35);
    });
    return out;
  };

  G.torso = function (ctx) {
    var skin = ctx.skin;
    var d = 'M-21 -91Q0 -96 21 -91L19 -56Q0 -51 -19 -56Z';
    var s = path(d, grad(ctx, skin, { light: hi(skin, 1.08), dark: lo(skin, 0.9) }), { stroke: SKIN_LINE, sw: .8 });
    s += '<path d="M-5 -96H5V-87Q0 -83 -5 -87Z" fill="' + skin + '" stroke="' + SKIN_LINE + '" stroke-width=".8"/>';
    s += '<path d="M-4 -91Q0 -86 4 -91" fill="none" stroke="' + lo(skin, 0.82) + '" stroke-width=".7" opacity=".45"/>';
    s += '<path d="M-15 -88Q-8 -85 -2 -88M15 -88Q8 -85 2 -88" fill="none" stroke="' + hi(skin, 1.08) + '" stroke-width=".7" opacity=".5"/>';
    s += line('M-1 -80Q0 -76 1 -80', lo(skin, 0.86), .7, .28);
    return s;
  };

  /* ---------------- 手臂与袖子 ---------------- */

  function sleeveSpec(ctx) {
    if (ctx.outer && ctx.outerLook && ['trench', 'longcardigan', 'blazer', 'tailored', 'puffer', 'quilted', 'denimjacket', 'croppedtrench', 'denimvest'].indexOf(ctx.outerLook.s) >= 0) {
      return { color: ctx.outer.color, look: ctx.outerLook, outer: true };
    }
    if (ctx.dress) { return { color: ctx.dress.color, look: ctx.dressLook, outer: false }; }
    if (ctx.top) { return { color: ctx.top.color, look: ctx.topLook, outer: false }; }
    return null;
  }

  function sleeveEnd(spec, sp) {
    var slv = spec.look && spec.look.slv;
    if (slv === 'none') { return null; }
    if (slv === 'cap') { return -80; }
    if (slv === 'short') { return -73; }
    if (slv === 'elbow') { return -66; }
    if (slv === 'puff' || slv === 'bell') { return -77; }
    return sp.hy - 5;
  }

  function drawArm(ctx, sp, spec, bare) {
    var skin = ctx.skin;
    var s = '';
    var d = 'M' + sp.x1 + ' -86Q' + sp.ex + ' ' + sp.ey + ' ' + sp.x2 + ' ' + sp.hy;
    s += line(d, SKIN_LINE, 10.2, .55);
    s += line(d, skin, 9.0, 1);
    s += line('M' + (sp.x1 - 2) + ' -84Q' + (sp.ex - 2) + ' ' + (sp.ey - 1) + ' ' + (sp.x2 - 2) + ' ' + (sp.hy + 2), lo(skin, 0.9), 3.4, .18);
    if (spec && spec.color) {
      var end = sleeveEnd(spec, sp);
      if (end != null) {
        var sd = 'M' + sp.x1 + ' -86Q' + sp.ex + ' ' + sp.ey + ' ' + sp.x2 + ' ' + end;
        var wid = spec.look.slv === 'puff' ? 11.2 : (spec.outer ? 9.8 : 8.8);
        s += line(sd, edge(spec.color), wid + 1.1, .65);
        s += line(sd, spec.color, wid, 1);
        s += line('M' + (sp.x1 - 2.4) + ' -84Q' + (sp.ex - 3) + ' ' + (sp.ey - 1) + ' ' + (sp.x2 - 2) + ' ' + (end + 2), hi(spec.color, 1.12), 2.4, .28);
        s += line('M' + (sp.x1 + 2) + ' -82Q' + (sp.ex + 3) + ' ' + (sp.ey + 2) + ' ' + (sp.x2 + 2.2) + ' ' + (end + 3.5), lo(spec.color, 0.8), 1.6, .38);
        if (spec.look.slv === 'puff') {
          s += line('M' + (sp.x1 - 5.4) + ' -79Q' + sp.x1 + ' -76 ' + (sp.x1 + 5.4) + ' -79', lo(spec.color, 0.76), .65, .45);
          s += line('M' + (sp.x1 - 4.6) + ' -82Q' + sp.x1 + ' -79 ' + (sp.x1 + 4.6) + ' -82', hi(spec.color, 1.16), .55, .35);
          s += line('M' + (sp.x1 - 3.2) + ' -84Q' + sp.x1 + ' -81 ' + (sp.x1 + 3.2) + ' -84', lo(spec.color, 0.82), .5, .3);
        }
        if (spec.look.slv === 'bell') {
          s += '<path d="M' + (sp.x2 - 5) + ' ' + (end + 4) + 'L' + (sp.x2 + 6) + ' ' + (end + 1) + 'L' + (sp.x2 + 5) + ' ' + (end + 7) + 'L' + (sp.x2 - 6) + ' ' + (end + 8) + 'Z" fill="' + spec.color + '" stroke="' + edge(spec.color) + '" stroke-width=".7"/>';
        }
        if (spec.look.slv === 'long' || spec.look.slv === 'elbow') {
          s += line('M' + (sp.x2 - 4.2) + ' ' + (end - 1.4) + 'H' + (sp.x2 + 4.2), lo(spec.color, 0.72), .8, .6);
          s += line('M' + (sp.x2 - 4.2) + ' ' + (end + .4) + 'H' + (sp.x2 + 4.2), hi(spec.color, 1.12), .5, .4);
        }
        if (spec.outer) {
          s += line('M' + (sp.x1 + 1) + ' -70Q' + (sp.ex + 4) + ' ' + (sp.ey + 4) + ' ' + (sp.x2 + 1) + ' ' + (end + 10), lo(spec.color, 0.74), .8, .35);
        }
      }
    }
    if (bare !== false) {
      s += '<circle cx="' + sp.hx + '" cy="' + sp.hy + '" r="3.6" fill="' + skin + '" stroke="' + SKIN_LINE + '" stroke-width=".85"/>';
      s += '<path d="M' + (sp.hx - 2) + ' ' + (sp.hy - 1.6) + 'Q' + (sp.hx - .4) + ' ' + (sp.hy - 2.6) + ' ' + (sp.hx + 1.8) + ' ' + (sp.hy - 1.4) + '" fill="none" stroke="' + hi(skin, 1.08) + '" stroke-width=".7" opacity=".7"/>';
      s += '<path d="M' + (sp.hx - 1.8) + ' ' + (sp.hy - .6) + 'Q' + (sp.hx - 3.1) + ' ' + (sp.hy + 1.2) + ' ' + (sp.hx - 1.2) + ' ' + (sp.hy + 2.2) + '" fill="none" stroke="' + lo(skin, 0.84) + '" stroke-width=".55" opacity=".55"/>';
    }
    return s;
  }

  G.arms = function (ctx) {
    var spec = sleeveSpec(ctx);
    var s = '';
    s += drawArm(ctx, ctx.armSpec[0], spec && !spec.outer ? spec : null);
    s += drawArm(ctx, ctx.armSpec[1], spec && !spec.outer ? spec : null);
    return s;
  };

  G.outerSleeves = function (ctx) {
    if (!ctx.outer) { return ''; }
    var look = ctx.outerLook;
    if (!look || look.s === 'cape' || look.s === 'denimvest') { return ''; }
    var spec = { color: ctx.outer.color, look: { slv: 'long' }, outer: true };
    return drawArm(ctx, ctx.armSpec[0], spec, false) + drawArm(ctx, ctx.armSpec[1], spec, false);
  };

  /* ---------------- 领口 ---------------- */

  var NECK_SHAPE = {
    crew: 'M-8.5 -91Q0 -84 8.5 -91Z',
    v: 'M-11 -91L0 -78L11 -91Z',
    scoop: 'M-13 -91Q0 -79 13 -91Z',
    square: 'M-11 -91L-9 -81L9 -81L11 -91Z',
    sweetheart: 'M-13 -91Q-7 -83 0 -88Q7 -83 13 -91Z',
    straplow: 'M-15 -91L-12 -82L12 -82L15 -91Z',
    straight: 'M-14 -91L-14 -82L14 -82L14 -91Z',
    off: 'M-16 -91L-13 -84L13 -84L16 -91Z',
    collar: 'M-9 -91L0 -83L9 -91Z',
    cowl: 'M-12 -91Q0 -80 12 -91Z',
    mandarin: 'M-6 -92L-6 -87L6 -87L6 -92Z',
    hood: 'M-9 -91Q0 -86 9 -91Z',
    turtle: '',
    straps: 'M-14 -91L-11.5 -82L11.5 -82L14 -91Z'
  };

  function neckPatch(ctx, look) {
    if (!look) { return ''; }
    var n = look.neck || 'crew';
    if (n === 'turtle' || n === 'mandarin') { return ''; }
    var d = NECK_SHAPE[n] || NECK_SHAPE.crew;
    if (!d) { return ''; }
    var skin = ctx.skin;
    var s = path(d, skin, { stroke: SKIN_LINE, sw: .7 });
    s += '<path d="M-10 -92Q0 -88 10 -92" fill="none" stroke="' + lo(skin, 0.82) + '" stroke-width="1.1" opacity=".38"/>';
    if (n === 'cowl') {
      s += line('M-9 -89Q0 -85 9 -89M-7 -87Q0 -83 7 -87', hi(skin, 1.06), .8, .5);
    }
    return s;
  }

  function neckTrim(ctx, look, color) {
    if (!look) { return ''; }
    var n = look.neck || 'crew';
    var s = '';
    var e = edge(color);
    if (n === 'crew' || n === 'scoop' || n === 'v' || n === 'square' || n === 'sweetheart' || n === 'off' || n === 'straplow' || n === 'cowl') {
      s += line('M-8.5 -91Q0 -84 8.5 -91', lo(color, 0.7), .85, .55);
    }
    if (n === 'v') {
      s += line('M-11 -91L0 -78L11 -91', lo(color, 0.7), .8, .5);
    }
    if (n === 'shirt' || n === 'collar' || n === 'mandarin') {
      s += path('M-8 -89.8Q0 -87.3 8 -89.8L7 -87.2Q0 -85.2 -7 -87.2Z', hi(color, 1.04), { stroke: e, sw: .45 });
      s += path('M-8 -88.6L-3.4 -85.6L-6.4 -81.2L-9.6 -84.6Z', hi(color, 1.1), { stroke: e, sw: .45 });
      s += path('M8 -88.6L3.4 -85.6L6.4 -81.2L9.6 -84.6Z', hi(color, 1.1), { stroke: e, sw: .45 });
    }
    if (n === 'turtle') {
      s += '<path d="M-7 -92H7V-84Q0 -80 -7 -84Z" fill="' + color + '" stroke="' + e + '" stroke-width=".75"/>';
      s += line('M-6 -90H6M-6 -87H6', lo(color, 0.74), .55, .5);
    }
    if (n === 'mandarin') {
      s += '<path d="M-7 -90H7V-84Q0 -81 -7 -84Z" fill="' + hi(color, 1.03) + '" stroke="' + e + '" stroke-width=".75"/>';
      s += line('M0 -89V-83', lo(color, 0.7), .6, .5);
    }
    if (n === 'cowl') {
      s += path('M-11 -90Q-4 -86 0 -88Q5 -86 11 -90Q6 -84 0 -82Q-6 -84 -11 -90Z', hi(color, 1.08), { stroke: e, sw: .5, opacity: .9 });
      s += line('M-7 -88Q0 -85 7 -88', lo(color, 0.78), .55, .5);
    }
    if (n === 'straps' || n === 'straplow') {
      s += line('M-13 -91L-10 -82M13 -91L10 -82', lo(color, 0.72), 1.5, .85);
    }
    return s;
  }

  G.neckline = function (ctx, look, color) {
    return neckPatch(ctx, look) + neckTrim(ctx, look, color);
  };

  /* ---------------- 上装 ---------------- */

  var TOP_HEM = { crop: -70, waist: -62, hip: -54, long: -46 };
  var SIDE = {
    slim: [18, 13, 15],
    regular: [20, 14.5, 16.5],
    oversized: [23, 18, 21]
  };

  function topTorso(ctx, look, color, opts) {
    opts = opts || {};
    var side = SIDE[look.fit] || SIDE.regular;
    var sw = opts.sw == null ? side[0] : opts.sw;
    var ww = opts.ww == null ? side[1] : opts.ww;
    var hw = opts.hw == null ? side[2] : opts.hw;
    var hem = opts.hem == null ? (TOP_HEM[look.len] == null ? -62 : TOP_HEM[look.len]) : opts.hem;
    var d = 'M' + (-sw) + ' -90Q0 -95 ' + sw + ' -90L' + ww + ' -64Q' + (hw + 1) + ' -58 ' + hw + ' ' + hem +
      'Q0 ' + (hem + 2.6) + ' ' + (-hw) + ' ' + hem + 'L' + (-ww) + ' -64Q' + (-sw - 1) + ' -78 ' + (-sw) + ' -90Z';
    var s = cloth(ctx, d, color, { pattern: opts.pattern, patternOpacity: .48 });
    // 胸部体积
    s += path('M' + (-ww) + ' -72Q' + (-ww * .5) + ' -68 ' + (-2) + ' -71L-3 -64Q' + (-ww * .55) + ' -61 ' + (-ww) + ' -64Z', lo(color, 0.86), { opacity: .26 });
    s += path('M' + ww + ' -72Q' + (ww * .5) + ' -68 2 -71L3 -64Q' + (ww * .55) + ' -61 ' + ww + ' -64Z', lo(color, 0.86), { opacity: .26 });
    s += line('M' + (-ww + 1) + ' -90Q' + (-ww - 2) + ' -76 ' + (-ww + 1) + ' -64', hi(color, 1.16), .7, .35);
    s += line('M' + (ww - 1) + ' -90Q' + (ww + 2) + ' -76 ' + (ww - 1) + ' -64', lo(color, 0.72), .8, .4);
    s += line('M' + (-hw + 1) + ' ' + (hem - 1) + 'Q0 ' + (hem + 1) + ' ' + (hw - 1) + ' ' + (hem - 1), lo(color, 0.68), .8, .45);
    return { s: s, hem: hem, sw: sw, ww: ww, hw: hw, d: d };
  }

  function openPanels(ctx, look, color, hem, pat) {
    var e = edge(color);
    var left = 'M-22 -90Q-10 -94 -2 -90L-2 ' + hem + 'Q-12 ' + (hem + 2) + ' -21 ' + hem + 'L-19 -64Z';
    var right = 'M22 -90Q10 -94 2 -90L2 ' + hem + 'Q12 ' + (hem + 2) + ' 21 ' + hem + 'L19 -64Z';
    var s = '';
    s += cloth(ctx, left, color, { pattern: pat, patternOpacity: .45 });
    s += cloth(ctx, right, color, { pattern: pat, patternOpacity: .45 });
    // 门襟内侧阴影
    s += path('M-2 ' + (hem - 1) + 'L-2 -90L2 -90L2 ' + (hem - 1) + 'Q0 ' + (hem + 1) + ' -2 ' + (hem - 1) + 'Z', lo(color, 0.62), { opacity: .22 });
    s += line('M-2 -90L-2 ' + hem + 'M2 -90L2 ' + hem, lo(color, 0.68), .8, .7);
    s += line('M-19 -64Q-14 -62 -8 -63M19 -64Q14 -62 8 -63', lo(color, 0.72), .7, .4);
    return s;
  }

  function buttons(ctx, color, x, ys) {
    var s = '';
    ys.forEach(function (y) {
      s += '<circle cx="' + x + '" cy="' + y + '" r=".95" fill="' + lo(color, 0.62) + '" stroke="' + hi(color, 1.25) + '" stroke-width=".35"/>';
    });
    return s;
  }

  function placket(ctx, color, hem, width) {
    var w = width || 4.5;
    var s = path('M' + (-w / 2) + ' -90H' + (w / 2) + 'V' + (hem + 1) + 'H' + (-w / 2) + 'Z', hi(color, 1.06), { opacity: .55 });
    s += line('M' + (-w / 2) + ' -89V' + hem + 'M' + (w / 2) + ' -89V' + hem, lo(color, 0.76), .55, .5);
    s += buttons(ctx, color, 0, [-85, -78, -71, -65]);
    return s;
  }

  function ribbedHem(color, hem, w) {
    var s = path('M' + (-(w || 17)) + ' ' + (hem - 3.4) + 'H' + (w || 17) + 'V' + (hem + 1) + 'H' + (-(w || 17)) + 'Z', lo(color, 0.94), { opacity: .75 });
    for (var i = -3; i <= 3; i++) {
      s += line('M' + (i * 4.6) + ' ' + (hem - 3.2) + 'V' + (hem + .4), lo(color, 0.7), .55, .55);
    }
    return s;
  }

  var CUSTOM_BOX = {
    top: { x: -26, y: -92, w: 52, h: 46 },
    bottom: { x: -30, y: -64, w: 60, h: 56 },
    dress: { x: -30, y: -92, w: 60, h: 84 },
    outer: { x: -28, y: -92, w: 56, h: 60 }
  };

  function printPattern(ctx, print) {
    if (!print || !Array.isArray(print.grid) || !print.grid.length) { return null; }
    var id = uid(ctx, 'pr');
    var palette = print.palette || [];
    var rows = print.grid.map(function (r) { return Array.isArray(r) ? r.join('') : String(r); });
    var size = rows.length;
    var body = '';
    for (var y = 0; y < rows.length; y++) {
      var row = rows[y];
      for (var x = 0; x < row.length; x++) {
        var ch = row.charAt(x);
        if (ch === '.' || ch === ' ' || ch === '') { continue; }
        var idx = parseInt(ch, 10);
        var col = palette[idx];
        if (!col) { continue; }
        var x2 = x;
        while (x2 + 1 < row.length && row.charAt(x2 + 1) === ch) { x2++; }
        body += '<rect x="' + x + '" y="' + y + '" width="' + (x2 - x + 1) + '" height="1" fill="' + col + '"/>';
        x = x2;
      }
    }
    addDef(ctx, '<pattern id="' + id + '" width="' + size + '" height="' + size + '" patternUnits="userSpaceOnUse" patternTransform="scale(0.55)">' + body + '</pattern>');
    return 'url(#' + id + ')';
  }

  function fabricPattern(ctx, look, color) {
    if (look && look.print) {
      var pp = printPattern(ctx, look.print);
      if (pp) { return pp; }
    }
    return pattern(ctx, look && look.p, color);
  }

  function customCloth(ctx, look, color, cat) {
    var custom = look && look.custom;
    if (!custom) { return null; }
    var c = ctx.back ? (custom.back || custom.front) : custom.front;
    if (!c || !c.d) { return null; }
    var box = CUSTOM_BOX[cat] || CUSTOM_BOX.top;
    var fill = grad(ctx, color, { light: hi(color, 1.12), dark: lo(color, 0.84) });
    var pat = fabricPattern(ctx, look, color);
    var clipId = uid(ctx, 'cc');
    addDef(ctx, '<clipPath id="' + clipId + '"><rect x="0" y="0" width="100" height="140"/></clipPath>');
    var sx = box.w / 100;
    var sy = box.h / 140;
    var mirrored = ctx.back && !custom.back;
    var tr = mirrored
      ? 'translate(' + (box.x + box.w) + ',' + box.y + ') scale(' + (-sx) + ',' + sy + ')'
      : 'translate(' + box.x + ',' + box.y + ') scale(' + sx + ',' + sy + ')';
    var fit = (custom.fit && typeof custom.fit === 'object') ? custom.fit : {};
    var fsx = fit.sx || 1;
    var fsy = fit.sy || 1;
    var inner = 'translate(50,140) scale(' + fsx + ',' + fsy + ') translate(-50,-140)';
    var out = '<g transform="' + tr + '" clip-path="url(#' + clipId + ')">' +
      '<g transform="' + inner + '">';
    out += '<path d="' + c.d + '" fill="' + fill + '" stroke="' + edge(color) + '" stroke-width=".75" fill-rule="evenodd" stroke-linejoin="round"/>';
    if (pat) { out += '<path d="' + c.d + '" fill="' + pat + '" opacity=".8" fill-rule="evenodd"/>'; }
    out += '</g>';
    if (ctx.back) {
      out += '<g transform="' + inner + '">' + line('M50 2V138', lo(color, 0.62), .55, .45) + '</g>';
    }
    out += '</g>';
    return out;
  }

  G.top = function (ctx) {
    var item = ctx.top;
    var look = ctx.topLook;
    if (!item || !look) { return ''; }
    var color = item.color;
    var e = edge(color);
    var s = '';
    var pat = fabricPattern(ctx, look, color);
    var kind = look.s;
    var hem = TOP_HEM[look.len] == null ? -62 : TOP_HEM[look.len];

    if (ctx.back && !look.custom) {
      var backTop = topTorso(ctx, look, color, { pattern: pat });
      var backOut = backTop.s;
      backOut += line('M0 -90V' + (backTop.hem + 1), lo(color, 0.68), .8, .5);
      backOut += line('M-15 ' + (backTop.hem - 1) + 'Q0 ' + (backTop.hem + 2) + ' 15 ' + (backTop.hem - 1), lo(color, 0.7), .6, .45);
      return backOut;
    }

    if (look.custom && (look.custom.front || look.custom.back)) {
      var cc = customCloth(ctx, look, color, 'top');
      if (cc) {
        s += cc;
        if (!ctx.back) {
          s += neckPatch(ctx, look);
          s += neckTrim(ctx, look, color);
          if (look.clo === 'buttons' || look.clo === 'placket') { s += placket(ctx, color, -62); }
          else { s += line('M0 -82V-64', lo(color, 0.7), .6, .5); }
          s += line('M-15 -63Q0 -59 15 -63', lo(color, 0.7), .6, .45);
        } else {
          s += line('M0 -88V-48', lo(color, 0.68), .8, .5);
        }
        return s;
      }
    }

    if (kind === 'knit' || kind === 'cardigan') {
      // 开衫里面加一件奶油色打底，避免露出身体
      s += path('M-15 -86Q0 -89 15 -86L14 -64Q0 -60 -14 -64Z', '#FFF9EF', { stroke: '#D8C9B8', sw: .45 });
      s += line('M-9 -85Q0 -81 9 -85', '#D8C9B8', .5, .45);
      s += openPanels(ctx, look, color, hem, pat);
      s += neckPatch(ctx, look);
      s += ribbedHem(color, hem, look.fit === 'oversized' ? 22 : 18);
      s += line('M-19 -78Q-14 -74 -9 -76M19 -78Q14 -74 9 -76', lo(color, 0.74), .6, .4);
      if (look.slv === 'long') {
        s += line('M-21 -86Q-20 -82 -21 -78M21 -86Q20 -82 21 -78', lo(color, 0.72), .7, .5);
      }
      if (look.clo === 'open') {
        s += line('M-3 -89Q-1 -76 -3 -64M3 -89Q1 -76 3 -64', hi(color, 1.18), .7, .35);
      }
      if ((look.det || []).indexOf('pockets') >= 0) {
        s += path('M-18 -66H-9V-59H-18Z', lo(color, 0.94), { stroke: e, sw: .5, opacity: .85 });
        s += path('M18 -66H9V-59H18Z', lo(color, 0.94), { stroke: e, sw: .5, opacity: .85 });
      }
      return s;
    }

    if (kind === 'vest' || kind === 'knitvest') {
      var vw = kind === 'knitvest' ? 20 : 21;
      var vh = kind === 'knitvest' ? -60 : -61;
      s += path('M-21 -90L-9 -90L-7 -84L-7 ' + vh + 'Q0 ' + (vh + 2) + ' 7 ' + vh + 'L7 -84L9 -90L21 -90L19 -64L-19 -64Z', color, {});
      s += path('M-21 -90L-9 -90L-7 -84L-7 ' + vh + 'Q0 ' + (vh + 2) + ' 7 ' + vh + 'L7 -84L9 -90L21 -90L19 -64L-19 -64Z', pat || color, { opacity: pat ? .45 : 0 });
      s += line('M-9 -90L-7 -84L-7 ' + vh + 'M9 -90L7 -84L7 ' + vh, e, .7, .6);
      s += path('M-14 -91L-4 -84L-10 -80L-16 -88Z', hi(color, 1.08), { stroke: e, sw: .5 });
      s += path('M14 -91L4 -84L10 -80L16 -88Z', hi(color, 1.08), { stroke: e, sw: .5 });
      s += line('M0 -84V-64', lo(color, 0.7), .7, .5);
      s += buttons(ctx, color, 0, [-80, -73, -66]);
      if (kind === 'knitvest') {
        s += ribbedHem(color, -62, 17);
      }
      return s;
    }

    if (kind === 'cami' || kind === 'tube' || kind === 'corset') {
      if (kind === 'tube') {
        var td = 'M-17 -83H17L18 -67Q0 -62 -18 -67Z';
        s += cloth(ctx, td, color, { patternOpacity: .4 });
        s += line('M-17 -82H17', hi(color, 1.2), 1.1, .7);
        s += line('M-16 -69Q0 -65 16 -69', lo(color, 0.7), .7, .5);
        s += line('M-12 -81Q-4 -78 0 -80Q5 -78 12 -81', hi(color, 1.14), .6, .4);
        return s;
      }
      if (kind === 'cami') {
        var cd = 'M-16 -84Q0 -88 16 -84L17 -64Q0 -59 -17 -64Z';
        s += cloth(ctx, cd, color, { patternOpacity: .3 });
        s += neckPatch(ctx, { neck: 'straplow' });
        s += line('M-14 -85L-11 -93M14 -85L11 -93', lo(color, 0.72), 1.25, .95);
        s += line('M-14 -84Q0 -89 14 -84', hi(color, 1.2), .8, .55);
        s += line('M-11 -70Q0 -66 11 -70', lo(color, 0.74), .6, .4);
        return s;
      }
      // corset
      var kd = 'M-18 -84Q-8 -88 0 -86Q8 -88 18 -84L16 -67Q0 -60 -16 -67Z';
      s += cloth(ctx, kd, color, { patternOpacity: .25 });
      s += line('M-18 -84Q-8 -88 0 -86Q8 -88 18 -84', hi(color, 1.22), .9, .7);
      for (var bi = -2; bi <= 2; bi++) {
        s += line('M' + (bi * 5) + ' -84Q' + (bi * 4) + ' -76 ' + (bi * 5) + ' -68', lo(color, 0.74), .55, .4);
      }
      for (var li = 0; li < 4; li++) {
        var yy = -82 + li * 4;
        s += line('M-7 ' + yy + 'L7 ' + (yy - 2) + 'M-7 ' + (yy - 2) + 'L7 ' + yy, '#F5E8D4', .6, .55);
      }
      return s;
    }

    if (kind === 'hoodie') {
      var hd = topTorso(ctx, look, color, { pattern: pat });
      s += path('M-18 -92Q-23 -108 0 -111Q23 -108 18 -92Q8 -99 0 -96Q-8 -99 -18 -92Z', lo(color, 0.92), { stroke: e, sw: .75 });
      s += path('M-15 -95Q-17 -104 0 -106Q17 -104 15 -95Q0 -101 -15 -95Z', lo(color, 0.78), { opacity: .55 });
      s += path('M-15 -92Q-17 -85 0 -83Q17 -85 15 -92Q8 -88 0 -88Q-8 -88 -15 -92Z', lo(color, 0.9), { stroke: e, sw: .6 });
      s += line('M-13 -90Q0 -86 13 -90', hi(color, 1.12), .6, .4);
      s += hd.s;
      s += neckPatch(ctx, { neck: 'hood' });
      s += line('M-8 -94Q-6 -86 -7 -82M8 -94Q6 -86 7 -82', hi(color, 1.18), .8, .8);
      s += '<circle cx="-7" cy="-82" r=".9" fill="' + lo(color, 0.6) + '"/><circle cx="7" cy="-82" r=".9" fill="' + lo(color, 0.6) + '"/>';
      s += path('M-13 -67Q0 -63 13 -67L13 -55Q0 -51 -13 -55Z', lo(color, 0.92), { stroke: e, sw: .55, opacity: .9 });
      s += line('M-13 -66Q0 -62 13 -66', lo(color, 0.7), .65, .45);
      s += line('M-11 -56Q0 -53 11 -56', hi(color, 1.12), .5, .35);
      s += ribbedHem(color, hd.hem, 20);
      return s;
    }

    if (kind === 'polo' || kind === 'shirt' || kind === 'oversize') {
      var sw = kind === 'oversize' ? 23 : 20;
      var ww = kind === 'oversize' ? 18 : 14.5;
      var hw = kind === 'oversize' ? 21 : 16.5;
      var sh = topTorso(ctx, look, color, { sw: sw, ww: ww, hw: hw, pattern: pat });
      s += sh.s;
      s += neckPatch(ctx, { neck: kind === 'polo' ? 'collar' : 'collar' });
      s += path('M-8 -89.8Q0 -87.3 8 -89.8L7 -87.2Q0 -85.2 -7 -87.2Z', hi(color, 1.08), { stroke: e, sw: .45 });
      s += path('M-8 -88.6L-3.4 -85.6L-6.4 -81.2L-9.6 -84.6Z', hi(color, 1.12), { stroke: e, sw: .4 });
      s += path('M8 -88.6L3.4 -85.6L6.4 -81.2L9.6 -84.6Z', hi(color, 1.12), { stroke: e, sw: .4 });
      if (kind !== 'polo') {
        s += placket(ctx, color, sh.hem);
      } else {
        s += path('M-2 -85H2V-77H-2Z', lo(color, 0.8), { opacity: .5 });
        s += buttons(ctx, color, 0, [-83, -79]);
      }
      if ((look.det || []).indexOf('pocket') >= 0) {
        s += path('M12 -78H18V-72H12Z', lo(color, 0.95), { stroke: e, sw: .45, opacity: .8 });
      }
      if (kind === 'oversize') {
        s += line('M-20 -92Q-12 -88 -8 -91M20 -92Q12 -88 8 -91', lo(color, 0.75), .7, .45);
        s += line('M-22 ' + (sh.hem - 2) + 'Q0 ' + (sh.hem + 1) + ' 22 ' + (sh.hem - 2), lo(color, 0.72), .7, .45);
      }
      return s;
    }

    if (kind === 'tee' || kind === 'crop') {
      var th = topTorso(ctx, look, color, { pattern: pat });
      s += th.s;
      s += neckPatch(ctx, { neck: 'crew' });
      s += line('M-8 -90Q0 -84 8 -90', lo(color, 0.72), .8, .55);
      s += line('M-15 -86Q-10 -83 -5 -86', hi(color, 1.18), .65, .5);
      if (kind === 'crop') {
        s += line('M-17 ' + (th.hem - 1) + 'Q0 ' + (th.hem + 2) + ' 17 ' + (th.hem - 1), hi(color, 1.12), .7, .55);
      }
      return s;
    }

    if (kind === 'blouse' || kind === 'satin') {
      var bh = topTorso(ctx, look, color, { ww: 15, hw: 19, pattern: pat });
      s += bh.s;
      if (kind === 'satin') {
        s += path('M-10 -91Q-4 -87 0 -89Q5 -87 10 -91Q6 -83 0 -81Q-6 -83 -10 -91Z', hi(color, 1.14), { opacity: .75 });
        s += line('M-7 -87Q0 -84 7 -87', lo(color, 0.78), .55, .5);
        s += line('M-13 -80Q-6 -76 0 -79Q6 -76 13 -80', hi(color, 1.24), .9, .3);
        s += line('M-15 -70Q-8 -67 0 -69Q8 -67 15 -70', hi(color, 1.2), .8, .3);
      } else {
        s += neckPatch(ctx, { neck: 'v' });
        s += line('M-8 -89L-1 -82M8 -89L1 -82', lo(color, 0.72), .7, .55);
        s += buttons(ctx, color, 0, [-84, -78, -72]);
        s += line('M-16 -67Q0 -63 16 -67', lo(color, 0.74), .7, .45);
        for (var fi = -2; fi <= 2; fi++) {
          s += line('M' + (fi * 5) + ' -66V-62', lo(color, 0.78), .55, .4);
        }
        s += path('M-17 -63H17V-61H-17Z', hi(color, 1.1), { opacity: .5 });
      }
      return s;
    }

    if (kind === 'turtle') {
      var th2 = topTorso(ctx, look, color, { ww: 15, hw: 17, pattern: pat });
      s += th2.s;
      s += neckTrim(ctx, { neck: 'turtle' }, color);
      s += line('M-9 -88Q0 -84 9 -88', lo(color, 0.75), .7, .45);
      return s;
    }

    // fallback: tee
    var fb = topTorso(ctx, look, color, { pattern: pat });
    s += fb.s;
    s += neckPatch(ctx, { neck: look.neck });
    return s;
  };

  /* ---------------- 腰头（上衣塞进下装时压住） ---------------- */

  G.waistOverlay = function (ctx) {
    if (!ctx.bottom || ctx.dress) { return ''; }
    var look = ctx.bottomLook;
    var color = ctx.bottom.color;
    if (!look) { return ''; }
    var topLook = ctx.topLook;
    var tucked = topLook && topLook.len !== 'hip';
    if (!tucked) { return ''; }
    var y = -63.2;
    var s = path('M-18 ' + y + 'H18V' + (y + 3.4) + 'H-18Z', lo(color, 0.92), { stroke: edge(color), sw: .5, opacity: .95 });
    s += line('M-18 ' + (y + 1) + 'H18', hi(color, 1.12), .55, .45);
    s += '<circle cx="0" cy="' + (y + 1.7) + '" r=".9" fill="' + lo(color, 0.6) + '"/>';
    return s;
  };

  /* ---------------- 下装 ---------------- */

  var BOT_HEM = { mini: -38, knee: -28, midi: -20, maxi: -6, full: -10 };

  function waistband(ctx, color, high) {
    var y = high ? -65 : -64;
    var s = path('M-18 ' + y + 'H18V' + (y + 3.6) + 'H-18Z', lo(color, 0.94), { stroke: edge(color), sw: .55 });
    s += line('M-18 ' + (y + 1.2) + 'H18', hi(color, 1.12), .5, .45);
    s += line('M-18 ' + (y + 2.8) + 'H18', lo(color, 0.74), .45, .4);
    // 裤袢
    [-14, -6, 6, 14].forEach(function (x) {
      s += line('M' + x + ' ' + (y + .4) + 'V' + (y + 3.2), lo(color, 0.7), .5, .6);
    });
    return s;
  }

  function pants(ctx, look, color, pat) {
    var hem = look.len === 'mini' ? -40 : -10;
    var outer = look.s === 'wide' ? -23 : look.s === 'widejeans' ? -24 : look.s === 'cargo' ? -19 : -18;
    var inner = look.s === 'wide' ? -4 : look.s === 'widejeans' ? -3 : -6;
    var s = '';
    var legs = [
      { m: -1, a: -18, b: -4 },
      { m: 1, a: 18, b: 4 }
    ];
    legs.forEach(function (L) {
      var sign = L.m;
      var o = sign < 0 ? outer : -outer;
      var i = sign < 0 ? inner : -inner;
      var aa = L.a, bb = L.b;
      var d = 'M' + aa + ' -60L' + bb + ' -60L' + (bb + sign * .8) + ' -44L' + i + ' ' + hem + 'L' + o + ' ' + hem + 'L' + (aa - sign * 1) + ' -44Z';
      s += cloth(ctx, d, color, { pattern: pat, patternOpacity: .42 });
      s += line('M' + (aa - sign * 1.2) + ' -58L' + (o - sign * 1.2) + ' ' + (hem - 1), lo(color, 0.72), .7, .35);
      s += line('M' + (bb - sign * .8) + ' -58L' + (i - sign * .2) + ' ' + (hem - 1), hi(color, 1.1), .55, .35);
      s += line('M' + (o + sign * 1.5) + ' ' + (hem - 2) + 'H' + (i - sign * .5), lo(color, 0.66), .55, .45);
      if (look.s === 'cargo') {
        s += path('M' + (sign < 0 ? -17 : 9) + ' -46H' + (sign < 0 ? -9 : 17) + 'V-39H' + (sign < 0 ? -17 : 9) + 'Z', lo(color, 0.92), { stroke: edge(color), sw: .45 });
        s += line('M' + (sign < 0 ? -17 : 9) + ' -45.5H' + (sign < 0 ? -9 : 17), hi(color, 1.1), .45, .4);
      }
      if (look.s === 'wide' || look.s === 'widejeans') {
        s += line('M' + (sign < 0 ? -2 : 2) + ' -58L' + (sign < 0 ? -1 : 1) + ' -12', hi(color, 1.14), .6, .3);
      }
    });
    s += path('M-18 -62H18V-56Q0 -51 -18 -56Z', color, {});
    s += path('M-18 -62H18V-56Q0 -51 -18 -56Z', pat || color, { opacity: pat ? .4 : 0 });
    // 裆部连接，避免两条裤腿像分开的管子
    s += path('M-7 -60H7V-51H-7Z', color, { stroke: edge(color), sw: .4 });
    s += line('M-6 -58H6', lo(color, 0.78), .5, .4);
    s += waistband(ctx, color, look.rise === 'high');
    s += line('M0 -60V-53Q2 -50 4 -52', lo(color, 0.7), .65, .5);
    s += line('M-15 -60Q-11 -57 -6 -60M15 -60Q11 -57 6 -60', lo(color, 0.78), .55, .45);
    if (look.s === 'jeans' || look.s === 'widejeans' || look.s === 'shorts') {
      // 牛仔明线
      s += stitch('M-16 -59V-11M16 -59V-11', hi(color, 1.55), .45);
      s += stitch('M-16 -58Q-11 -55 -6 -58M16 -58Q11 -55 6 -58', hi(color, 1.55), .4);
      s += stitch('M-17 -13H-5M17 -13H5', hi(color, 1.55), .4);
    }
    if (look.s === 'leather') {
      s += line('M-14 -56Q-12 -36 -14 -14', hi(color, 1.6), 1.2, .35);
      s += line('M12 -56Q10 -36 12 -16', hi(color, 1.5), .9, .3);
    }
    if (look.s === 'cargo') {
      s += stitch('M-17 -41H-9M17 -41H9', hi(color, 1.4), .35);
    }
    return s;
  }

  function skirt(ctx, look, color, pat) {
    var hem = BOT_HEM[look.len] == null ? -20 : BOT_HEM[look.len];
    var wide = look.len === 'mini' ? 26 : look.len === 'knee' ? 28 : 30;
    var s = '';
    if (look.s === 'pleat') {
      wide = 27;
      var top = -64;
      var n = 8;
      for (var i = 0; i < n; i++) {
        var x1 = -18 + (i * 36 / n);
        var x2 = x1 + 36 / n;
        var bx1 = -wide + (i * wide * 2 / n);
        var bx2 = bx1 + wide * 2 / n;
        var d = 'M' + x1 + ' ' + top + 'L' + x2 + ' ' + top + 'L' + bx2 + ' ' + hem + 'L' + bx1 + ' ' + hem + 'Z';
        s += path(d, i % 2 ? lo(color, 0.9) : color, { stroke: edge(color), sw: .45 });
        s += line('M' + (bx1 + (bx2 - bx1) * .35) + ' ' + (hem - 2) + 'L' + (x1 + (x2 - x1) * .3) + ' ' + (top + 3), hi(color, 1.12), .5, .3);
      }
      s += path('M-18 ' + (top - .5) + 'H18V' + (top + 3) + 'H-18Z', lo(color, 0.9), { stroke: edge(color), sw: .5 });
      s += line('M-18 ' + (hem - 1) + 'Q0 ' + (hem + 2) + ' 18 ' + (hem - 1), lo(color, 0.68), .6, .4);
      return s;
    }
    if (look.s === 'tier') {
      var bands = [
        { y1: -64, y2: -48, w1: 18, w2: 23 },
        { y1: -48, y2: -32, w1: 23, w2: 28 },
        { y1: -32, y2: hem, w1: 28, w2: 33 }
      ];
      bands.forEach(function (b, bi) {
        var d = 'M' + (-b.w1) + ' ' + b.y1 + 'H' + b.w1 + 'L' + b.w2 + ' ' + b.y2 +
          'Q0 ' + (b.y2 + 4) + ' ' + (-b.w2) + ' ' + b.y2 + 'Z';
        s += cloth(ctx, d, color, { pattern: pat, patternOpacity: .38 });
        s += line('M' + (-b.w1) + ' ' + (b.y1 + .5) + 'H' + b.w1, lo(color, 0.72), .6, .5);
        s += line('M' + (-b.w2 + 2) + ' ' + (b.y2 - 1) + 'Q0 ' + (b.y2 + 3) + ' ' + (b.w2 - 2) + ' ' + (b.y2 - 1), hi(color, 1.16), .6, .4);
        for (var f = -2; f <= 2; f++) {
          s += line('M' + (f * 8) + ' ' + (b.y1 + 2) + 'L' + (f * 10) + ' ' + (b.y2 - 1), lo(color, 0.8), .5, .35);
        }
      });
      return s;
    }
    // A 字裙 / 牛仔裙 / 百褶中裙
    var d2 = 'M-18 -64H18L' + wide + ' ' + hem + 'Q0 ' + (hem + 4) + ' ' + (-wide) + ' ' + hem + 'Z';
    s += cloth(ctx, d2, color, { pattern: pat, patternOpacity: .42 });
    s += line('M-18 -63H18', lo(color, 0.74), .6, .45);
    for (var pf = -2; pf <= 2; pf++) {
      s += line('M' + (pf * 7) + ' -61L' + (pf * 10) + ' ' + (hem - 1), lo(color, 0.78), .55, .32);
    }
    s += line('M' + (-wide + 2) + ' ' + (hem - 1) + 'Q0 ' + (hem + 3) + ' ' + (wide - 2) + ' ' + (hem - 1), hi(color, 1.14), .6, .4);
    if (look.s === 'denimskirt') {
      s += line('M0 -62V' + (hem + 2), lo(color, 0.7), .65, .5);
      s += stitch('M-16 -60V' + (hem - 1) + 'M16 -60V' + (hem - 1), hi(color, 1.55), .4);
      s += stitch('M-12 -59Q-8 -56 -4 -59M12 -59Q8 -56 4 -59', hi(color, 1.55), .35);
      s += line('M-12 ' + (hem + 1) + 'V' + (hem - 6), lo(color, 0.66), .7, .6);
      s += line('M-18 -63H18', hi(color, 1.2), .5, .4);
    }
    if (look.s === 'skirt') {
      s += path('M-18 -64H18V-60H-18Z', lo(color, 0.9), { opacity: .6 });
    }
    return s;
  }

  G.bottom = function (ctx) {
    var item = ctx.bottom;
    var look = ctx.bottomLook;
    if (!item || !look) { return ''; }
    var color = item.color;
    var pat = fabricPattern(ctx, look, color);
    var hem = BOT_HEM[look.len] == null ? -20 : BOT_HEM[look.len];
    if (look.custom && (look.custom.front || look.custom.back)) {
      var cc = customCloth(ctx, look, color, 'bottom');
      if (cc) {
        var out = cc;
        if (!ctx.back) { out += waistband(ctx, color, look.rise === 'high'); }
        out += line('M-16 ' + (hem - 1) + 'H16', lo(color, 0.7), .6, .45);
        return out;
      }
    }
    if (['pants', 'jeans', 'wide', 'widejeans', 'cargo', 'leather', 'shorts', 'tailoredshorts'].indexOf(look.s) >= 0 || look.s === 'shorts') {
      return pants(ctx, look, color, pat);
    }
    return skirt(ctx, look, color, pat);
  };

  /* ---------------- 连衣裙 ---------------- */

  function dressHem(look) {
    return BOT_HEM[look.len] == null ? -20 : BOT_HEM[look.len];
  }

  function dressBodice(ctx, look, color, opts) {
    opts = opts || {};
    var hem = opts.hem == null ? -64 : opts.hem;
    var sw = opts.sw == null ? 21 : opts.sw;
    var ww = opts.ww == null ? 16 : opts.ww;
    var d = 'M' + (-sw) + ' -90Q0 -95 ' + sw + ' -90L' + ww + ' ' + hem + 'Q0 ' + (hem + 2) + ' ' + (-ww) + ' ' + hem + 'Z';
    var s = cloth(ctx, d, color, { pattern: opts.pattern, patternOpacity: .42 });
    s += line('M' + (-ww) + ' ' + (hem - 1) + 'Q0 ' + (hem + 2) + ' ' + ww + ' ' + (hem - 1), lo(color, 0.7), .7, .5);
    return { s: s, d: d, hem: hem };
  }

  G.dress = function (ctx) {
    var item = ctx.dress;
    var look = ctx.dressLook;
    if (!item || !look) { return ''; }
    var color = item.color;
    var pat = fabricPattern(ctx, look, color);
    var e = edge(color);
    var hem = dressHem(look);
    var s = '';
    var kind = look.s;

    if (ctx.back && !look.custom) {
      var backDress = 'M-21 -90Q0 -95 21 -90L17 -64L20 ' + hem + 'Q0 ' + (hem + 4) + ' -20 ' + hem + 'L-17 -64Z';
      s += cloth(ctx, backDress, color, { pattern: pat, patternOpacity: .42 });
      s += line('M0 -90V' + (hem + 2), lo(color, 0.68), .8, .5);
      s += line('M-17 -64H17', lo(color, 0.7), .6, .5);
      return s;
    }

    if (look.custom && (look.custom.front || look.custom.back)) {
      var cc = customCloth(ctx, look, color, 'dress');
      if (cc) {
        s += cc;
        if (!ctx.back) {
          s += neckPatch(ctx, look);
          s += neckTrim(ctx, look, color);
        } else {
          s += line('M0 -88V' + (hem + 2), lo(color, 0.68), .8, .5);
        }
        s += line('M-16 -64H16', lo(color, 0.7), .6, .5);
        s += line('M-22 ' + (hem - 1) + 'Q0 ' + (hem + 2) + ' 22 ' + (hem - 1), lo(color, 0.7), .6, .45);
        return s;
      }
    }

    if (kind === 'pinafore') {
      // 背带裙：内搭皮肤/上衣由上层决定，这里画背带 + A 字裙
      s += path('M-12 -90H12V-76H-12Z', color, { stroke: e, sw: .7 });
      s += path('M-12 -90H12V-76H-12Z', pat || color, { opacity: pat ? .42 : 0 });
      s += line('M-12 -90L-15 -96M12 -90L15 -96', lo(color, 0.72), 1.6, .95);
      s += stitch('M-10 -88H10M-10 -82H10', hi(color, 1.55), .35);
      s += path('M-13 -76H13V-73H-13Z', hi(color, 1.08), { opacity: .75 });
      var pd = 'M-18 -74H18L' + (look.len === 'mini' ? 27 : 30) + ' ' + hem + 'Q0 ' + (hem + 4) + ' ' + (-(look.len === 'mini' ? 27 : 30)) + ' ' + hem + 'Z';
      s += cloth(ctx, pd, color, { pattern: pat, patternOpacity: .38 });
      s += line('M-18 -73H18', lo(color, 0.72), .65, .5);
      for (var pf = -2; pf <= 2; pf++) {
        s += line('M' + (pf * 7) + ' -71L' + (pf * 10) + ' ' + (hem - 1), lo(color, 0.8), .5, .35);
      }
      s += line('M-26 ' + (hem - 1) + 'Q0 ' + (hem + 3) + ' 26 ' + (hem - 1), hi(color, 1.14), .6, .4);
      s += stitch('M-16 -72V' + (hem - 1) + 'M16 -72V' + (hem - 1), hi(color, 1.5), .35);
      return s;
    }

    if (kind === 'qipao') {
      var qb = dressBodice(ctx, look, color, { hem: -64, sw: 19, ww: 16, pattern: pat });
      var qd = 'M-16 -66H16L19 -48L17 ' + hem + 'Q0 ' + (hem + 4) + ' -17 ' + hem + 'L-19 -48Z';
      s += qb.s;
      s += cloth(ctx, qd, color, { pattern: pat, patternOpacity: .42 });
      s += line('M-16 -64H16', lo(color, 0.7), .7, .55);
      s += neckTrim(ctx, { neck: 'mandarin' }, color);
      s += line('M0 -88V-64', lo(color, 0.7), .65, .5);
      for (var fb = 0; fb < 3; fb++) {
        s += '<circle cx="3" cy="' + (-84 + fb * 5) + '" r=".8" fill="' + hi(color, 1.2) + '" stroke="' + lo(color, 0.7) + '" stroke-width=".25"/>';
        s += line('M3 ' + (-84 + fb * 5) + 'Q6 ' + (-83 + fb * 5) + ' 7 ' + (-85 + fb * 5), lo(color, 0.7), .45, .8);
      }
      s += line('M-16 -63Q0 -58 16 -63', lo(color, 0.72), .55, .45);
      // 开衩
      s += path('M-14 ' + (hem - 12) + 'L-16 ' + hem + 'L-8 ' + (hem + 1) + 'L-10 ' + (hem - 10) + 'Z', lo(color, 0.72), { opacity: .55 });
      s += line('M-14 ' + (hem - 12) + 'L-16 ' + hem, hi(color, 1.18), .6, .6);
      return s;
    }

    if (kind === 'slip' || kind === 'slipmini') {
      var sb = 'M-17 -86Q0 -90 17 -86L15 -64L' + (hem === -38 ? 19 : 21) + ' ' + hem + 'Q0 ' + (hem + 5) + ' -' + (hem === -38 ? 19 : 21) + ' ' + hem + 'L-15 -64Z';
      s += cloth(ctx, sb, color, { pattern: pat, patternOpacity: .3 });
      s += neckPatch(ctx, { neck: 'v' });
      s += line('M-14 -86L-10 -95M14 -86L10 -95', lo(color, 0.72), 1.1, .95);
      s += line('M-16 -83Q0 -78 16 -83', hi(color, 1.16), .7, .4);
      s += line('M-15 -70Q-8 -66 0 -69Q8 -66 15 -70', hi(color, 1.22), .8, .3);
      s += line('M-18 -46Q-9 -42 0 -45Q9 -42 18 -46', hi(color, 1.18), .8, .28);
      for (var sf = -1; sf <= 1; sf++) {
        s += line('M' + (sf * 7) + ' -62Q' + (sf * 10) + ' -42 ' + (sf * 11) + ' ' + (hem - 3), lo(color, 0.8), .55, .3);
      }
      return s;
    }

    if (kind === 'bodycon') {
      var bb = 'M-20 -90Q0 -94 20 -90L18 -64L16 ' + hem + 'Q0 ' + (hem + 4) + ' -16 ' + hem + 'L-18 -64Z';
      s += cloth(ctx, bb, color, { pattern: pat, patternOpacity: .35 });
      s += neckPatch(ctx, { neck: 'scoop' });
      s += line('M-19 -72Q-8 -68 0 -71Q8 -68 19 -72', hi(color, 1.16), .7, .35);
      s += line('M-17 -58Q-8 -54 0 -57Q8 -54 17 -58', lo(color, 0.78), .6, .4);
      s += line('M-16 -40Q-8 -36 0 -39Q8 -36 16 -40', hi(color, 1.12), .6, .3);
      return s;
    }

    if (kind === 'shirtdress') {
      var shb = dressBodice(ctx, look, color, { hem: -64, sw: 21, ww: 16, pattern: pat });
      s += shb.s;
      s += neckTrim(ctx, { neck: 'collar' }, color);
      s += placket(ctx, color, -64);
      s += path('M-18 -64H18V-60.5H-18Z', lo(color, 0.9), { stroke: e, sw: .5 });
      s += '<rect x="-2.4" y="-64" width="4.8" height="3.4" rx=".8" fill="' + hi(color, 1.22) + '" stroke="' + lo(color, 0.7) + '" stroke-width=".35"/>';
      var shd = 'M-18 -60.5H18L24 ' + hem + 'Q0 ' + (hem + 4) + ' -24 ' + hem + 'Z';
      s += cloth(ctx, shd, color, { pattern: pat, patternOpacity: .35 });
      s += line('M-18 -60H18', lo(color, 0.72), .6, .5);
      for (var sf2 = -2; sf2 <= 2; sf2++) {
        s += line('M' + (sf2 * 8) + ' -58L' + (sf2 * 10) + ' ' + (hem - 1), lo(color, 0.8), .55, .32);
      }
      s += line('M-23 ' + (hem - 1) + 'Q0 ' + (hem + 3) + ' 23 ' + (hem - 1), hi(color, 1.12), .6, .4);
      return s;
    }

    if (kind === 'knitdress') {
      var kb = 'M-21 -90Q0 -95 21 -90L17 -64L16 ' + hem + 'Q0 ' + (hem + 4) + ' -16 ' + hem + 'L-17 -64Z';
      s += cloth(ctx, kb, color, { pattern: pat, patternOpacity: .5 });
      s += neckPatch(ctx, { neck: 'crew' });
      s += line('M-18 -70Q-8 -66 0 -69Q8 -66 18 -70', hi(color, 1.12), .6, .35);
      s += line('M-18 -52Q-8 -48 0 -51Q8 -48 18 -52', lo(color, 0.8), .55, .35);
      s += line('M-17 -34Q-8 -30 0 -33Q8 -30 17 -34', hi(color, 1.1), .55, .3);
      return s;
    }

    if (kind === 'wrap') {
      var wb = 'M-21 -90Q0 -95 21 -90L17 -64L' + (hem === -28 ? 20 : 23) + ' ' + hem + 'Q0 ' + (hem + 4) + ' -' + (hem === -28 ? 20 : 23) + ' ' + hem + 'L-17 -64Z';
      s += cloth(ctx, wb, color, { pattern: pat, patternOpacity: .3 });
      s += neckPatch(ctx, { neck: 'v' });
      s += line('M-11 -89L16 -66M11 -89L-16 -66', lo(color, 0.72), .9, .55);
      s += line('M-18 -64Q0 -59 18 -64', lo(color, 0.68), .7, .6);
      s += path('M-6 -65H6V-61H-6Z', hi(color, 1.1), { opacity: .8 });
      s += line('M-7 -62Q-2 -56 2 -62', lo(color, 0.7), .8, .6);
      for (var wf = -1; wf <= 1; wf++) {
        s += line('M' + (wf * 9) + ' -58Q' + (wf * 12) + ' -42 ' + (wf * 13) + ' ' + (hem - 2), lo(color, 0.8), .55, .3);
      }
      return s;
    }

    if (kind === 'sundress') {
      var sb2 = dressBodice(ctx, look, color, { hem: -64, sw: 18, ww: 15, pattern: pat });
      s += sb2.s;
      s += neckPatch(ctx, { neck: 'straps' });
      s += line('M-13 -89L-9 -97M13 -89L9 -97', lo(color, 0.7), .9, .95);
      s += line('M-16 -63Q0 -59 16 -63', lo(color, 0.72), .55, .45);
      var tiers = [
        { y1: -64, y2: -48, w1: 16, w2: 22 },
        { y1: -48, y2: -32, w1: 22, w2: 27 },
        { y1: -32, y2: hem, w1: 27, w2: 31 }
      ];
      tiers.forEach(function (b) {
        var d3 = 'M' + (-b.w1) + ' ' + b.y1 + 'H' + b.w1 + 'L' + b.w2 + ' ' + b.y2 +
          'Q0 ' + (b.y2 + 4) + ' ' + (-b.w2) + ' ' + b.y2 + 'Z';
        s += cloth(ctx, d3, color, { pattern: pat, patternOpacity: .4 });
        s += line('M' + (-b.w2 + 2) + ' ' + (b.y2 - 1) + 'Q0 ' + (b.y2 + 3) + ' ' + (b.w2 - 2) + ' ' + (b.y2 - 1), hi(color, 1.14), .55, .4);
      });
      return s;
    }

    // tea dress（默认）
    var tb = dressBodice(ctx, look, color, { hem: -64, sw: 21, ww: 16, pattern: pat });
    s += tb.s;
    s += neckPatch(ctx, { neck: 'v' });
    s += line('M-11 -89L0 -79L11 -89', lo(color, 0.72), .7, .5);
    s += buttons(ctx, color, 0, [-86, -80]);
    s += line('M-17 -64Q0 -59 17 -64', lo(color, 0.68), .7, .6);
    var tw = look.len === 'mini' ? 26 : 30;
    var td = 'M-17 -64H17L' + tw + ' ' + hem + 'Q0 ' + (hem + 5) + ' -' + tw + ' ' + hem + 'Z';
    s += cloth(ctx, td, color, { pattern: pat, patternOpacity: .38 });
    for (var tf = -2; tf <= 2; tf++) {
      s += line('M' + (tf * 7) + ' -62L' + (tf * 11) + ' ' + (hem - 3), lo(color, 0.8), .55, .3);
    }
    // 裙摆荷叶边
    var ruf = '';
    for (var ri = 0; ri < 7; ri++) {
      var rx = -tw + 4 + ri * (tw * 2 - 8) / 6;
      ruf += 'Q' + (rx + 3.5) + ' ' + (hem + 5.5) + ' ' + (rx + 7) + ' ' + (hem + 1.2);
    }
    s += line('M' + (-tw + 4) + ' ' + (hem + 1.2) + ruf, hi(color, 1.16), .8, .5);
    s += line('M-16 -63Q-8 -59 0 -62Q8 -59 16 -63', hi(color, 1.12), .55, .35);
    return s;
  };

  /* ---------------- 外套 ---------------- */

  var OUT_HEM = { crop: -54, hip: -48, long: -32 };

  function lapel(ctx, color, side) {
    var sign = side;
    return path('M' + (sign * 4) + ' -90L' + (sign * 18) + ' -88L' + (sign * 12) + ' -76L' + (sign * 4) + ' -84Z', hi(color, 1.08), { stroke: edge(color), sw: .55 });
  }

  G.outer = function (ctx) {
    var item = ctx.outer;
    var look = ctx.outerLook;
    if (!item || !look) { return ''; }
    var color = item.color;
    var pat = fabricPattern(ctx, look, color);
    var e = edge(color);
    var hem = OUT_HEM[look.len] == null ? -48 : OUT_HEM[look.len];
    var s = '';
    var kind = look.s;

    if (ctx.back && !look.custom) {
      var backOuter = 'M-22 -90Q0 -95 22 -90L20 ' + hem + 'Q0 ' + (hem + 2) + ' -20 ' + hem + 'Z';
      s += cloth(ctx, backOuter, color, { pattern: pat, patternOpacity: .4 });
      s += line('M0 -90V' + (hem + 1), lo(color, 0.68), .8, .5);
      return s;
    }

    if (look.custom && (look.custom.front || look.custom.back)) {
      var cc = customCloth(ctx, look, color, 'outer');
      if (cc) {
        s += cc;
        if (!ctx.back) { s += lapel(ctx, color, -1); s += lapel(ctx, color, 1); }
        s += line('M0 -90V' + (hem + 1), lo(color, 0.68), .8, .5);
        return s;
      }
    }

    if (kind === 'cape') {
      var cd = 'M-26 -92Q0 -100 26 -92L38 -36Q0 -28 -38 -36Z';
      s += cloth(ctx, cd, color, { pattern: pat, patternOpacity: .35 });
      s += line('M-3 -92L-3 -30M3 -92L3 -30', lo(color, 0.68), .9, .6);
      s += line('M-26 -92Q-16 -86 -6 -90M26 -92Q16 -86 6 -90', hi(color, 1.14), .8, .4);
      for (var cf = -2; cf <= 2; cf++) {
        s += line('M' + (cf * 9) + ' -88L' + (cf * 12) + ' -34', lo(color, 0.78), .6, .3);
      }
      return s;
    }

    if (kind === 'denimvest' || kind === 'vest') {
      var l = 'M-22 -90L-9 -90L-7 -82L-7 ' + hem + 'Q-14 ' + (hem + 2) + ' -21 ' + hem + 'L-19 -64Z';
      var r = 'M22 -90L9 -90L7 -82L7 ' + hem + 'Q14 ' + (hem + 2) + ' 21 ' + hem + 'L19 -64Z';
      s += cloth(ctx, l, color, { pattern: pat, patternOpacity: .4 });
      s += cloth(ctx, r, color, { pattern: pat, patternOpacity: .4 });
      s += line('M-9 -90L-7 -82L-7 ' + hem + 'M9 -90L7 -82L7 ' + hem, e, .7, .6);
      s += line('M-3 -89L-3 ' + hem + 'M3 -89L3 ' + hem, lo(color, 0.7), .7, .6);
      s += buttons(ctx, color, 0, [-82, -74, -66]);
      if (kind === 'denimvest') {
        s += stitch('M-20 -88V' + (hem - 1) + 'M20 -88V' + (hem - 1), hi(color, 1.55), .35);
        s += path('M-18 -80H-10V-73H-18Z', lo(color, 0.94), { stroke: e, sw: .4 });
        s += path('M18 -80H10V-73H18Z', lo(color, 0.94), { stroke: e, sw: .4 });
      }
      return s;
    }

    if (kind === 'puffer' || kind === 'quilted') {
      var qd = 'M-24 -90Q0 -96 24 -90L22 ' + hem + 'Q0 ' + (hem + 4) + ' -22 ' + hem + 'Z';
      s += cloth(ctx, qd, color, { pattern: pat, patternOpacity: .55 });
      s += neckTrim(ctx, { neck: 'turtle' }, color);
      // 充绒横向绗缝
      var rows = kind === 'puffer' ? 5 : 4;
      for (var qi = 0; qi < rows; qi++) {
        var qy = -86 + qi * ((hem + 86) / rows);
        s += line('M-21 ' + qy + 'Q0 ' + (qy + 2) + ' 21 ' + qy, lo(color, 0.72), .65, .5);
        s += line('M-19 ' + (qy + 1.4) + 'Q0 ' + (qy + 3.4) + ' 19 ' + (qy + 1.4), hi(color, 1.16), .55, .3);
      }
      s += line('M0 -89V' + hem, lo(color, 0.62), .8, .6);
      s += path('M-17 -83H-6V-64H-17Z', lo(color, 0.9), { stroke: e, sw: .45, opacity: .8 });
      s += path('M17 -83H6V-64H17Z', lo(color, 0.9), { stroke: e, sw: .45, opacity: .8 });
      s += line('M-1 -64V-42', hi(color, 1.2), .5, .5);
      s += '<circle cx="0" cy="-80" r="1" fill="' + lo(color, 0.55) + '"/>';
      return s;
    }

    // 开襟/西装/风衣/牛仔外套
    var open = ['trench', 'longcardigan', 'blazer', 'tailored', 'croppedtrench', 'denimjacket'].indexOf(kind) >= 0;
    var lw = kind === 'longcardigan' ? 24 : 23;
    if (open) {
      var lp = 'M-22 -90Q-11 -94 -4 -90L-4 ' + hem + 'Q-14 ' + (hem + 2) + ' -21 ' + hem + 'L-19 -64Z';
      var rp = 'M22 -90Q11 -94 4 -90L4 ' + hem + 'Q14 ' + (hem + 2) + ' 21 ' + hem + 'L19 -64Z';
      s += cloth(ctx, lp, color, { pattern: pat, patternOpacity: .42 });
      s += cloth(ctx, rp, color, { pattern: pat, patternOpacity: .42 });
      s += path('M-4 ' + (hem - 1) + 'L-4 -90H4L4 ' + (hem - 1) + 'Q0 ' + (hem + 1) + ' -4 ' + (hem - 1) + 'Z', lo(color, 0.6), { opacity: .2 });
      s += line('M-4 -90L-4 ' + hem + 'M4 -90L4 ' + hem, lo(color, 0.66), .8, .7);
    } else {
      var fd = 'M-23 -90Q0 -95 23 -90L21 ' + hem + 'Q0 ' + (hem + 3) + ' -21 ' + hem + 'Z';
      s += cloth(ctx, fd, color, { pattern: pat, patternOpacity: .42 });
      s += line('M0 -90V' + hem, lo(color, 0.66), .8, .7);
    }

    // 翻领
    if (['trench', 'blazer', 'tailored', 'croppedtrench', 'denimjacket'].indexOf(kind) >= 0) {
      s += lapel(ctx, color, -1);
      s += lapel(ctx, color, 1);
      if (kind === 'denimjacket') {
        s += path('M-10 -91Q0 -87 10 -91L8 -86Q0 -82 -8 -86Z', hi(color, 1.06), { stroke: e, sw: .55 });
      }
      if (kind !== 'denimjacket') {
        s += line('M-12 -78H-3M12 -78H3', lo(color, 0.72), .6, .5);
      }
    }
    if (kind === 'longcardigan') {
      s += ribbedHem(color, hem, 21);
    }
    if (kind === 'trench' || kind === 'croppedtrench') {
      // 腰带 / 风暴片 / 肩章
      s += path('M-20 -64H20V-60H-20Z', lo(color, 0.9), { stroke: e, sw: .5 });
      s += '<rect x="-3" y="-64" width="6" height="4" rx="1" fill="' + hi(color, 1.18) + '" stroke="' + lo(color, 0.68) + '" stroke-width=".35"/>';
      s += line('M-18 -84Q-6 -80 0 -84Q6 -80 18 -84', lo(color, 0.74), .7, .4);
      s += buttons(ctx, color, -4, [-84, -74]);
      s += line('M-21 -88L-14 -86M21 -88L14 -86', lo(color, 0.72), .8, .6);
      s += path('M-22 -44H-10V-40H-22Z', lo(color, 0.92), { stroke: e, sw: .4, opacity: .8 });
      s += path('M22 -44H10V-40H22Z', lo(color, 0.92), { stroke: e, sw: .4, opacity: .8 });
      if (kind === 'trench') {
        s += line('M-20 -30Q0 -26 20 -30', hi(color, 1.1), .6, .35);
      }
    }
    if (kind === 'denimjacket') {
      s += stitch('M-21 -88V' + (hem - 1) + 'M21 -88V' + (hem - 1), hi(color, 1.55), .35);
      s += path('M-18 -78H-10V-71H-18Z', lo(color, 0.94), { stroke: e, sw: .4 });
      s += path('M18 -78H10V-71H18Z', lo(color, 0.94), { stroke: e, sw: .4 });
      s += buttons(ctx, color, 0, [-84, -74, -64]);
    }
    if (kind === 'blazer' || kind === 'tailored') {
      s += line('M-3 -88L-8 -64M3 -88L8 -64', hi(color, 1.12), .6, .35);
      s += path('M-22 -46H-10V-42H-22Z', lo(color, 0.94), { stroke: e, sw: .4, opacity: .8 });
      s += path('M22 -46H10V-42H22Z', lo(color, 0.94), { stroke: e, sw: .4, opacity: .8 });
      s += buttons(ctx, color, 0, kind === 'tailored' ? [-80, -71] : [-82, -72]);
    }
    if (kind === 'longcardigan' || kind === 'blazer' || kind === 'tailored') {
      s += line('M-20 ' + (hem - 1) + 'Q0 ' + (hem + 2) + ' 20 ' + (hem - 1), lo(color, 0.7), .7, .4);
    }
    return s;
  };

  /* ---------------- 袜子 ---------------- */

  G.hosiery = function (ctx, item) {
    if (!item) { return ''; }
    var look = item.look || Iso.lookOf(item) || {};
    var kind = look.s || item.shape || 'opaque';
    var color = item.color || '#D8C9B8';
    var s = '';
    if (kind === 'sheer') {
      s += line('M-14 -57Q-12 -34 -12.5 -10', color, 7.8, .38);
      s += line('M14 -57Q12 -34 12.5 -10', color, 7.8, .38);
      s += line('M-15 -52Q-13 -36 -14 -14', hi(color, 1.3), .8, .25);
      s += line('M-12 -12H-16', color, .8, .55);
      s += line('M12 -12H16', color, .8, .55);
      return s;
    }
    if (kind === 'opaque') {
      s += line('M-14 -58Q-12 -34 -12.5 -10', color, 8.0, .9);
      s += line('M14 -58Q12 -34 12.5 -10', color, 8.0, .9);
      s += line('M-15 -54Q-13 -36 -14 -13', lo(color, 0.85), 3.4, .3);
      s += line('M15 -54Q13 -36 14 -13', hi(color, 1.1), 1.1, .35);
      return s;
    }
    if (kind === 'fishnet') {
      s += line('M-14 -58Q-12 -34 -12.5 -10', color, 7.8, .42);
      s += line('M14 -58Q12 -34 12.5 -10', color, 7.8, .42);
      for (var i = 0; i < 5; i++) {
        var y = -54 + i * 9;
        s += line('M-16 ' + y + 'L-9 ' + (y + 6) + 'M-9 ' + y + 'L-16 ' + (y + 6), color, .55, .75);
        s += line('M9 ' + y + 'L16 ' + (y + 6) + 'M16 ' + y + 'L9 ' + (y + 6), color, .55, .75);
      }
      return s;
    }
    if (kind === 'knee' || kind === 'ankle') {
      var top = kind === 'knee' ? -32 : -20;
      s += path('M-18 ' + top + 'L-8 ' + top + 'L-7 -10L-16 -10Z', color, { stroke: edge(color), sw: .55 });
      s += path('M18 ' + top + 'L8 ' + top + 'L7 -10L16 -10Z', color, { stroke: edge(color), sw: .55 });
      s += line('M-18 ' + (top + 2.4) + 'H-8M18 ' + (top + 2.4) + 'H8', hi(color, 1.18), .8, .8);
      s += line('M-17 ' + (top + 5) + 'L-8 ' + (top + 5) + 'M17 ' + (top + 5) + 'L8 ' + (top + 5), lo(color, 0.78), .55, .4);
      if (kind === 'ankle') {
        s += line('M-17 -17H-8M17 -17H8', hi(color, 1.2), .7, .7);
      }
      return s;
    }
    // legging
    s += line('M-14.5 -58Q-12 -34 -12.5 -10', color, 8.6, .96);
    s += line('M14.5 -58Q12 -34 12.5 -10', color, 8.6, .96);
    s += line('M-15 -56Q-13 -36 -14 -12', hi(color, 1.5), .6, .22);
    return s;
  };

  /* ---------------- 鞋 ---------------- */

  function shoeOne(ctx, look, color, x, sign) {
    var e = edge(color);
    var s = '';
    s += ellipse(x, .7, 8.2, 2.3, '#3F332B', { opacity: .13 });
    var kind = look.s || 'flat';
    var sole = lo(color, 0.65);

    var base = function (top) {
      var t = top == null ? -8 : top;
      return 'M' + (x - 7) + ' ' + t + 'Q' + (x - 8.4) + ' -1 ' + (x - 2) + ' .2L' + (x + 7) + ' .2Q' + (x + 8.4) + ' -2 ' + (x + 6.8) + ' ' + t + 'Q' + (x + 2) + ' ' + (t - 1.4) + ' ' + (x - 7) + ' ' + t + 'Z';
    };

    if (kind === 'sneaker' || kind === 'runner') {
      var upper = kind === 'runner' ? color : '#F3EDE2';
      s += path('M' + (x - 6.6) + ' -8.6Q' + (x - 7.8) + ' -6 ' + (x - 6.2) + ' -4.2Q' + (x - 3) + ' -1.4 ' + (x + 1.5) + ' -1.4Q' + (x + 5.8) + ' -1.4 ' + (x + 6.8) + ' -3.6Q' + (x + 7.2) + ' -6 ' + (x + 5.4) + ' -8.2Q' + (x + 1) + ' -10 ' + (x - 6.6) + ' -8.6Z', upper, { stroke: e, sw: .6 });
      s += path('M' + (x - 7) + ' -3.2Q' + (x - 7.4) + ' .2 ' + (x - 3) + ' .3L' + (x + 4.6) + ' .3Q' + (x + 6.8) + ' 0 ' + (x + 6.6) + ' -3.2Z', '#FFFFFF', { stroke: e, sw: .5 });
      s += line('M' + (x - 6.6) + ' .2H' + (x + 6.2), '#8E8578', 1.1, .8);
      s += line('M' + (x - 6.6) + ' -2.8H' + (x + 6.4), lo(color, 0.66), .5, .55);
      s += path('M' + (x - 6.4) + ' -4.4Q' + (x - 3.6) + ' -2.4 ' + (x - 0.6) + ' -2.4L' + (x - 0.6) + ' -1.6Q' + (x - 4) + ' -1.6 ' + (x - 6.2) + ' -3.2Z', lo(upper, 0.9), { opacity: .95 });
      s += path('M' + (x + 4.6) + ' -7.6Q' + (x + 6.6) + ' -5.6 ' + (x + 6.4) + ' -3.4', lo(upper, 0.8), { opacity: .5 });
      s += line('M' + (x - 4.6) + ' -7.6L' + (x + 1.2) + ' -4.6M' + (x - 2.8) + ' -8.4L' + (x + 3) + ' -5.4M' + (x - 0.8) + ' -8.8L' + (x + 4.6) + ' -6.2', '#FFF9EF', .5, .8);
      if (kind === 'runner') {
        s += line('M' + (x - 5) + ' -6.2Q' + (x - 1) + ' -4.4 ' + (x + 5) + ' -5.4', hi(color, 1.3), .5, .5);
      }
      return s;
    }

    if (kind === 'ankleboot' || kind === 'chelsea') {
      var shaft = kind === 'ankleboot' ? -22 : -18;
      s += path('M' + (x - 6) + ' ' + shaft + 'H' + (x + 5) + 'V-2L' + (x + 7) + ' 0H' + (x - 7) + 'L' + (x - 6) + ' ' + (shaft + 4) + 'Z', color, { stroke: e, sw: .7 });
      s += path('M' + (x - 4) + ' ' + (shaft + 1) + 'H' + (x + 3) + 'V-5H' + (x - 4) + 'Z', hi(color, 1.12), { opacity: .3 });
      s += line('M' + (x - 6.2) + ' -3.4H' + (x + 6.8), lo(color, 0.68), .8, .5);
      s += path('M' + (x - 7.4) + ' -3.2H' + (x + 7.2) + 'V.2H' + (x - 7.4) + 'Z', sole, { opacity: .95 });
      if (kind === 'chelsea') {
        s += path('M' + (x + 1) + ' ' + (shaft + 2) + 'H' + (x + 5) + 'V-7H' + (x + 1) + 'Z', lo(color, 0.78), { opacity: .8 });
        s += line('M' + (x + 2.5) + ' ' + (shaft + 3) + 'V-8', hi(color, 1.1), .35, .5);
      } else {
        s += line('M' + (x + 4.4) + ' -18V-4', lo(color, 0.7), .5, .6);
      }
      return s;
    }

    if (kind === 'stiletto' || kind === 'kitten') {
      s += path('M' + (x - 7) + ' -7Q' + (x - 8) + ' -2 ' + (x + 1) + ' 0L' + (x + 7.2) + ' .4Q' + (x + 5) + ' -4 ' + (x + 2) + ' -7Q' + (x - 3) + ' -9 ' + (x - 7) + ' -7Z', color, { stroke: e, sw: .6 });
      s += line('M' + (x + 5.4) + ' .2L' + (x + 4.6) + ' ' + (kind === 'kitten' ? 4.4 : 5.6), lo(color, 0.6), kind === 'kitten' ? 1.1 : .9, .95);
      s += line('M' + (x - 6) + ' -6.2Q' + (x - 3) + ' -4.4 ' + (x + 2) + ' -5.2', hi(color, 1.25), .55, .4);
      if (kind === 'kitten') {
        s += line('M' + (x + 2) + ' -6.8Q' + (x + 6) + ' -4 ' + (x + 6.6) + ' -1.4', lo(color, 0.7), .5, .6);
      }
      return s;
    }

    if (kind === 'sandal') {
      s += path('M' + (x - 7) + ' -2.4Q' + (x - 8) + ' -1 ' + (x - 2) + ' .2L' + (x + 7) + ' .2Q' + (x + 8) + ' -1.4 ' + (x + 6.4) + ' -3Z', color, { stroke: e, sw: .5 });
      s += line('M' + (x - 6) + ' -6.6Q' + (x - 2) + ' -9 ' + (x + 3) + ' -7.2', color, 1.5, .95);
      s += line('M' + (x - 4) + ' -4.4Q' + (x + 1) + ' -6.4 ' + (x + 5) + ' -4.2', color, 1.2, .9);
      s += line('M' + (x + 5) + ' .4L' + (x + 4.4) + ' 5', lo(color, 0.6), .9, .9);
      return s;
    }

    if (kind === 'platform') {
      s += path(base(-8), color, { stroke: e, sw: .65 });
      s += path('M' + (x - 7.4) + ' -2.6H' + (x + 7.2) + 'V2.8H' + (x - 7.4) + 'Z', sole, { stroke: e, sw: .5 });
      s += line('M' + (x - 4) + ' -7.2Q' + (x + 1) + ' -9 ' + (x + 5) + ' -7', hi(color, 1.25), .6, .4);
      s += line('M' + (x - 5) + ' -5.2H' + (x + 5), lo(color, 0.7), .8, .8);
      s += line('M' + (x + 3) + ' -8.4L' + (x + 4.4) + ' -5.4', '#E3B23C', .7, .9);
      return s;
    }

    if (kind === 'slipper') {
      s += '<ellipse cx="' + x + '" cy="-5.6" rx="7.6" ry="4.4" fill="' + hi(color, 1.06) + '" stroke="' + e + '" stroke-width=".6"/>';
      for (var fi = -2; fi <= 2; fi++) {
        s += '<circle cx="' + (x + fi * 2.6) + '" cy="-8.4" r="1.2" fill="' + hi(color, 1.16) + '"/>';
      }
      s += path('M' + (x - 7.2) + ' -3.2H' + (x + 7) + 'V.2H' + (x - 7.2) + 'Z', sole, { opacity: .9 });
      return s;
    }

    if (kind === 'ballet') {
      s += path(base(-7.4), color, { stroke: e, sw: .6 });
      s += path('M' + (x - 4) + ' -6.6Q' + (x - 1) + ' -4.6 ' + (x + 2) + ' -6.8', hi(color, 1.18), { opacity: .55 });
      s += line('M' + (x - 1.4) + ' -7.4L' + (x - .2) + ' -5.2M' + (x + 1.4) + ' -7.4L' + (x + .2) + ' -5.2', lo(color, 0.7), .5, .9);
      s += ellipse(x - .2, -6.4, .9, .7, hi(color, 1.2), { stroke: e, sw: .3 });
      return s;
    }

    // mary / loafer / flat
    s += path(base(kind === 'mary' ? -8 : -7.6), color, { stroke: e, sw: .6 });
    s += line('M' + (x - 6.2) + ' -6.6Q' + (x - 2) + ' -4.6 ' + (x + 2.2) + ' -6.8', hi(color, 1.2), .6, .4);
    if (kind === 'mary') {
      s += line('M' + (x - 6.4) + ' -4.6Q' + (x - 2) + ' -6 ' + (x + 2.4) + ' -4.4', lo(color, 0.66), 1.3, .95);
      s += '<rect x="' + (x + 2.4) + '" y="-5.4" width="1.7" height="1.7" rx=".3" fill="#E3B23C" stroke="' + lo(color, 0.6) + '" stroke-width=".25"/>';
    }
    if (kind === 'loafer') {
      s += line('M' + (x - 5.4) + ' -7Q' + (x - 1) + ' -5.4 ' + (x + 3.4) + ' -7', lo(color, 0.7), .8, .8);
      s += path('M' + (x - 1.6) + ' -6.8H' + (x + 1.6) + 'V-5.6H' + (x - 1.6) + 'Z', hi(color, 1.1), { opacity: .7 });
    }
    s += path('M' + (x - 7) + ' -2.2H' + (x + 6.8) + 'V.1H' + (x - 7) + 'Z', lo(color, 0.55), { opacity: .85 });
    return s;
  }

  G.shoes = function (ctx) {
    var item = ctx.shoes;
    var look = item && (item.look || Iso.lookOf(item));
    if (!item || !look) { return ''; }
    var color = item.color;
    return shoeOne(ctx, look, color, -12.5, -1) + shoeOne(ctx, look, color, 12.5, 1);
  };

  /* ---------------- 包 ---------------- */

  G.bag = function (ctx) {
    var item = ctx.bag;
    var look = item && (item.look || Iso.lookOf(item));
    if (!item || !look) { return ''; }
    var color = item.color;
    var e = edge(color);
    var hand = ctx.armSpec[0];
    var hx = hand.hx, hy = hand.hy;
    var s = '';
    var kind = look.s || 'tote';
    var pat = look.m === 'straw' ? pattern(ctx, 'straw', color) : null;

    if (kind === 'clutch') {
      s += path('M' + (hx - 7) + ' ' + (hy + 4) + 'H' + (hx + 5) + 'L' + (hx + 4) + ' ' + (hy + 11) + 'H' + (hx - 6) + 'Z', color, { stroke: e, sw: .65 });
      s += line('M' + (hx - 7) + ' ' + (hy + 5) + 'L' + (hx + 5) + ' ' + (hy + 5), hi(color, 1.2), .6, .5);
      s += '<circle cx="' + (hx - 1) + '" cy="' + (hy + 7.5) + '" r="1" fill="#E3B23C" stroke="' + lo(color, 0.6) + '" stroke-width=".3"/>';
      return s;
    }

    if (kind === 'backpack') {
      s += path('M' + (hx - 8) + ' ' + (hy + 4) + 'Q' + (hx - 9) + ' ' + (hy + 13) + ' ' + (hx - 2) + ' ' + (hy + 15) + 'H' + (hx + 1) + 'Q' + (hx + 7) + ' ' + (hy + 12) + ' ' + (hx + 5) + ' ' + (hy + 5) + 'Z', color, { stroke: e, sw: .65 });
      s += path('M' + (hx - 6) + ' ' + (hy + 5) + 'V' + (hy + 13) + 'M' + (hx + 3) + ' ' + (hy + 5) + 'V' + (hy + 13), lo(color, 0.74), .55, .5);
      s += line('M' + (hx - 7) + ' ' + (hy + 8) + 'Q' + (hx - 2) + ' ' + (hy + 10) + ' ' + (hx + 4) + ' ' + (hy + 8), hi(color, 1.16), .55, .4);
      s += line('M' + (hx - 6) + ' ' + (hy + 5) + 'L' + (hx - 2) + ' ' + (hy + 15), lo(color, 0.68), .5, .5);
      return s;
    }

    if (kind === 'bucket') {
      s += path('M' + (hx - 7) + ' ' + (hy + 4) + 'H' + (hx + 5) + 'L' + (hx + 4) + ' ' + (hy + 15) + 'Q' + (hx - 1) + ' ' + (hy + 17) + ' ' + (hx - 6) + ' ' + (hy + 15) + 'Z', color, { stroke: e, sw: .65 });
      s += line('M' + (hx - 6) + ' ' + (hy + 7) + 'Q' + (hx - 1) + ' ' + (hy + 9) + ' ' + (hx + 5) + ' ' + (hy + 7), lo(color, 0.7), .6, .8);
      s += line('M' + (hx - 4) + ' ' + (hy + 4) + 'L' + (hx - 2) + ' ' + (hy + 8) + 'M' + (hx + 3) + ' ' + (hy + 4) + 'L' + (hx + 1) + ' ' + (hy + 8), hi(color, 1.2), .55, .8);
      s += '<circle cx="' + (hx - 1) + '" cy="' + (hy + 9) + '" r=".8" fill="' + hi(color, 1.25) + '"/>';
      return s;
    }

    if (kind === 'baguette') {
      s += path('M' + (hx - 9) + ' ' + (hy + 4) + 'H' + (hx + 5) + 'L' + (hx + 5) + ' ' + (hy + 12) + 'H' + (hx - 9) + 'Z', color, { stroke: e, sw: .65 });
      s += path('M' + (hx - 9) + ' ' + (hy + 4) + 'H' + (hx + 5) + 'V' + (hy + 7) + 'H' + (hx - 9) + 'Z', hi(color, 1.1), { stroke: e, sw: .45, opacity: .9 });
      s += '<circle cx="' + (hx - 2) + '" cy="' + (hy + 7.2) + '" r=".9" fill="#E3B23C"/>';
      s += line('M' + (hx - 6) + ' ' + (hy + 4) + 'Q' + (hx - 5) + ' ' + (hy - 2) + ' ' + (hx + 1) + ' ' + (hy - 2), lo(color, 0.7), .55, .7);
      return s;
    }

    if (kind === 'saddle') {
      s += path('M' + (hx - 8) + ' ' + (hy + 4) + 'Q' + (hx - 9) + ' ' + (hy + 14) + ' ' + (hx - 1) + ' ' + (hy + 15) + 'Q' + (hx + 6) + ' ' + (hy + 12) + ' ' + (hx + 5) + ' ' + (hy + 4) + 'Z', color, { stroke: e, sw: .65 });
      s += path('M' + (hx - 7) + ' ' + (hy + 4) + 'Q' + (hx - 2) + ' ' + (hy + 8) + ' ' + (hx + 4) + ' ' + (hy + 4) + 'Z', hi(color, 1.1), { stroke: e, sw: .4, opacity: .9 });
      s += '<circle cx="' + (hx - 1) + '" cy="' + (hy + 6.6) + '" r=".8" fill="#E3B23C"/>';
      return s;
    }

    if (kind === 'mini') {
      s += path('M' + (hx - 5) + ' ' + (hy + 5) + 'H' + (hx + 4) + 'V' + (hy + 12) + 'H' + (hx - 5) + 'Z', color, { stroke: e, sw: .6 });
      s += line('M' + (hx - 4.4) + ' ' + (hy + 6) + 'H' + (hx + 3.4), hi(color, 1.2), .5, .5);
      s += line('M' + (hx - 4) + ' ' + (hy + 5) + 'L' + (hx - 2) + ' ' + (hy - 1) + 'L' + (hx + 2) + ' ' + (hy - 3), lo(color, 0.7), .45, .7);
      s += '<circle cx="' + (hx - 1) + '" cy="' + (hy + 7.6) + '" r=".75" fill="#E3B23C"/>';
      return s;
    }

    if (kind === 'shoulder') {
      s += path('M' + (hx - 7) + ' ' + (hy + 4) + 'H' + (hx + 5) + 'L' + (hx + 4) + ' ' + (hy + 13) + 'H' + (hx - 6) + 'Z', color, { stroke: e, sw: .65 });
      s += path('M' + (hx - 7) + ' ' + (hy + 4) + 'H' + (hx + 5) + 'V' + (hy + 7) + 'H' + (hx - 7) + 'Z', hi(color, 1.08), { stroke: e, sw: .45 });
      s += '<rect x="' + (hx - 1.5) + '" y="' + (hy + 6.2) + '" width="3" height="2.2" rx=".5" fill="#E3B23C" stroke="' + lo(color, 0.6) + '" stroke-width=".25"/>';
      s += line('M' + (hx - 4) + ' ' + (hy + 4) + 'Q' + (hx - 3) + ' ' + (hy - 3) + ' ' + (hx + 2) + ' ' + (hy - 3), lo(color, 0.7), .55, .7);
      return s;
    }

    // tote（草编）
    s += path('M' + (hx - 7) + ' ' + (hy + 4) + 'H' + (hx + 6) + 'L' + (hx + 5) + ' ' + (hy + 15) + 'H' + (hx - 6) + 'Z', color, { stroke: e, sw: .65 });
    if (pat) {
      s += path('M' + (hx - 7) + ' ' + (hy + 4) + 'H' + (hx + 6) + 'L' + (hx + 5) + ' ' + (hy + 15) + 'H' + (hx - 6) + 'Z', pat, { opacity: .75 });
    }
    s += line('M' + (hx - 5) + ' ' + (hy + 4) + 'Q' + (hx - 5) + ' ' + (hy - 4) + ' ' + (hx - 1) + ' ' + (hy - 4) + 'Q' + (hx + 3) + ' ' + (hy - 4) + ' ' + (hx + 3) + ' ' + (hy + 4), lo(color, 0.68), .9, .95);
    s += line('M' + (hx - 6) + ' ' + (hy + 7) + 'H' + (hx + 5), hi(color, 1.2), .6, .55);
    return s;
  };

  /* ---------------- 配饰 ---------------- */

  function neckAcc(ctx, item, color) {
    var look = item.look || Iso.lookOf(item) || {};
    var kind = look.s || item.shape;
    var s = '';
    if (kind === 'scarf') {
      s += path('M-10 -91Q0 -87 10 -91L9 -86Q0 -82 -9 -86Z', color, { stroke: edge(color), sw: .55 });
      s += path('M4 -87L8 -78L2 -81Z', color, { stroke: edge(color), sw: .5 });
      s += line('M-8 -89Q0 -86 8 -89', hi(color, 1.2), .5, .5);
      return s;
    }
    if (kind === 'choker') {
      s += line('M-13 -90Q0 -87 13 -90', color, 2.6, .95);
      s += line('M-13 -90Q0 -87 13 -90', hi(color, 1.3), .55, .35);
      return s;
    }
    if (kind === 'pendant') {
      s += line('M-10 -91Q0 -82 10 -91', color, .8, .85);
      s += '<circle cx="0" cy="-83" r="2.2" fill="none" stroke="' + color + '" stroke-width=".8"/>';
      s += '<circle cx="0" cy="-83" r=".9" fill="' + hi(color, 1.25) + '"/>';
      return s;
    }
    if (kind === 'collar') {
      for (var ci = -3; ci <= 3; ci++) {
        s += '<circle cx="' + (ci * 4) + '" cy="' + (-87 + Math.abs(ci) * .7) + '" r="1.6" fill="#FFF9EF" stroke="' + edge(color) + '" stroke-width=".4"/>';
      }
      s += line('M-13 -89Q0 -82 13 -89', lo(color, 0.8), .5, .5);
      return s;
    }
    if (kind === 'pearl') {
      for (var pi = -3; pi <= 3; pi++) {
        s += '<circle cx="' + (pi * 3.2) + '" cy="' + (-88 + Math.abs(pi) * .6) + '" r="1.5" fill="#FFF9EF" stroke="' + edge(color) + '" stroke-width=".4"/>';
      }
      return s;
    }
    // chain
    s += line('M-10 -91Q0 -82 10 -91', color, .7, .95);
    for (var li = -2; li <= 2; li++) {
      s += '<circle cx="' + (li * 4) + '" cy="' + (-86 + Math.abs(li) * 1.4) + '" r="1" fill="none" stroke="' + color + '" stroke-width=".45"/>';
    }
    return s;
  }

  G.accessories = function (ctx) {
    var acc = ctx.acc || {};
    var s = '';
    if (acc.neck) {
      s += neckAcc(ctx, acc.neck, acc.neck.color);
    }
    if (acc.waist) {
      var w = acc.waist;
      var wl = w.look || Iso.lookOf(w) || {};
      if (wl.s === 'chainbelt') {
        s += line('M-18 -63H18', w.color, .9, .85);
        for (var ci = -4; ci <= 4; ci++) {
          s += '<circle cx="' + (ci * 4) + '" cy="' + (-63 + Math.abs(ci % 2) * 1.2) + '" r=".9" fill="none" stroke="' + w.color + '" stroke-width=".4"/>';
        }
      } else {
        s += path('M-18 -64H18V-61.4H-18Z', w.color, { stroke: edge(w.color), sw: .45 });
        s += '<rect x="5" y="-64.4" width="4.2" height="3.8" rx=".6" fill="none" stroke="' + hi(w.color, 1.4) + '" stroke-width=".6"/>';
      }
    }
    if (acc.wrist) {
      var w2 = acc.wrist;
      var wl2 = w2.look || Iso.lookOf(w2) || {};
      var hand = wl2.s === 'ring' ? ctx.armSpec[1] : ctx.armSpec[0];
      var x = hand.hx, y = hand.hy + 1;
      if (wl2.s === 'watch') {
        s += path('M' + (x - 3) + ' ' + (y - 1.4) + 'H' + (x + 3) + 'V' + (y + 1.4) + 'H' + (x - 3) + 'Z', w2.color, { stroke: edge(w2.color), sw: .4 });
        s += '<circle cx="' + x + '" cy="' + y + '" r="1.1" fill="#FFF9EF" stroke="' + edge(w2.color) + '" stroke-width=".3"/>';
      } else if (wl2.s === 'ring') {
        s += '<circle cx="' + (x + 1) + '" cy="' + (y + .4) + '" r="1.1" fill="none" stroke="' + w2.color + '" stroke-width=".6"/>';
      } else if (wl2.s === 'beads') {
        for (var bi = 0; bi < 4; bi++) {
          s += '<circle cx="' + (x - 2.4 + bi * 1.6) + '" cy="' + (y - .6) + '" r=".7" fill="' + (bi % 2 ? hi(w2.color, 1.2) : w2.color) + '"/>';
        }
      } else {
        s += line('M' + (x - 3) + ' ' + (y - 1) + 'Q' + x + ' ' + (y + 1.6) + ' ' + (x + 3) + ' ' + (y - 1), w2.color, 1.4, .95);
      }
    }
    if (acc.other) {
      var bo = acc.other;
      s += '<circle cx="-10" cy="-78" r="2.2" fill="' + bo.color + '" stroke="' + edge(bo.color) + '" stroke-width=".5"/>';
      s += '<circle cx="-10" cy="-78" r=".8" fill="' + hi(bo.color, 1.3) + '"/>';
      for (var ri = 0; ri < 4; ri++) {
        s += '<circle cx="' + (-11.6 + (ri % 2) * 3.2) + '" cy="' + (-79.6 + Math.floor(ri / 2) * 3.2) + '" r=".55" fill="#FFF9EF"/>';
      }
    }
    return s;
  };

  /* ---------------- 店员围裙 ---------------- */

  G.apron = function (ctx, color) {
    if (!color) { return ''; }
    var c = color;
    var e = edge(c);
    var s = path('M-17 -84H17L19 -43Q0 -38 -19 -43Z', c, { stroke: e, sw: .6 });
    s += path('M-10 -86H10V-74H-10Z', c, { stroke: e, sw: .5 });
    s += line('M-10 -86L-16 -91M10 -86L16 -91', lo(c, 0.7), .8, .8);
    s += path('M-8 -62H8V-53H-8Z', hi(c, 1.1), { stroke: e, sw: .4 });
    s += '<rect x="-5" y="-83" width="10" height="5" rx="1" fill="#FFF9EF" stroke="' + e + '" stroke-width=".4"/>';
    s += line('M-15 -70Q0 -66 15 -70', hi(c, 1.12), .5, .4);
    return s;
  };

  G.decor = function (ctx, cat) {
    if (ctx.back) { return ''; }
    var item = cat === 'top' ? ctx.top : cat === 'dress' ? ctx.dress : cat === 'bottom' ? ctx.bottom : ctx.outer;
    var look = item && (item.look || Iso.lookOf(item));
    if (!look || !look.decor || !look.decor.length) { return ''; }
    var color = item.color;
    var hem = cat === 'top' ? (TOP_HEM[look.len] == null ? -62 : TOP_HEM[look.len])
      : cat === 'dress' ? (BOT_HEM[look.len] == null ? -20 : BOT_HEM[look.len])
      : cat === 'bottom' ? (BOT_HEM[look.len] == null ? -20 : BOT_HEM[look.len])
      : (OUT_HEM[look.len] == null ? -48 : OUT_HEM[look.len]);
    var s = '';
    look.decor.forEach(function (id) {
      if (id === 'lace') {
        var lace = 'M-15 ' + (hem - 1) + 'Q-12 ' + (hem - 4) + ' -9 ' + (hem - 1) +
          'Q-6 ' + (hem - 4) + ' -3 ' + (hem - 1) + 'Q0 ' + (hem - 4) + ' 3 ' + (hem - 1) +
          'Q6 ' + (hem - 4) + ' 9 ' + (hem - 1) + 'Q12 ' + (hem - 4) + ' 15 ' + (hem - 1);
        s += line(lace, hi(color, 1.35), .75, .8);
        s += line('M-10 -89Q0 -84 10 -89', hi(color, 1.35), .7, .65);
      } else if (id === 'ruffle') {
        var rf = 'M-16 ' + (hem + 1) + 'Q-13 ' + (hem - 3) + ' -10 ' + (hem + 1) +
          'Q-7 ' + (hem - 3) + ' -4 ' + (hem + 1) + 'Q-1 ' + (hem - 3) + ' 2 ' + (hem + 1) +
          'Q5 ' + (hem - 3) + ' 8 ' + (hem + 1) + 'Q11 ' + (hem - 3) + ' 14 ' + (hem + 1);
        s += line(rf, lo(color, 0.82), 1.8, .85);
        s += line(rf, hi(color, 1.2), .6, .45);
      } else if (id === 'tassel') {
        for (var ti = -3; ti <= 3; ti++) {
          var tx = ti * 4.2;
          s += line('M' + tx + ' ' + (hem - 1) + 'V' + (hem + 5), lo(color, 0.72), .8, .9);
          s += '<circle cx="' + tx + '" cy="' + (hem + 5.5) + '" r="1" fill="' + hi(color, 1.2) + '"/>';
        }
      } else if (id === 'pearl') {
        for (var pi = -3; pi <= 3; pi++) {
          s += '<circle cx="' + (pi * 3.2) + '" cy="' + (-87 + Math.abs(pi) * .6) + '" r="1.45" fill="#FFF9EF" stroke="' + edge(color) + '" stroke-width=".35"/>';
        }
        for (var pj = 0; pj < 3; pj++) {
          s += '<circle cx="0" cy="' + (-82 + pj * 5) + '" r="1.2" fill="#FFF9EF" stroke="' + edge(color) + '" stroke-width=".3"/>';
        }
      } else if (id === 'rhinestone' || id === 'sequin') {
        var n = id === 'rhinestone' ? 7 : 12;
        for (var di = 0; di < n; di++) {
          var dx = ((di * 7) % 23) - 11;
          var dy = -80 + ((di * 11) % 22);
          s += '<path d="M' + dx + ' ' + (dy - 1.2) + 'L' + (dx + 1.2) + ' ' + dy + 'L' + dx + ' ' + (dy + 1.2) + 'L' + (dx - 1.2) + ' ' + dy + 'Z" fill="' + (di % 2 ? '#FFF9EF' : hi(color, 1.35)) + '" opacity=".9"/>';
        }
      } else if (id === 'embroidery') {
        var ex = -9, ey = -76;
        for (var ei = 0; ei < 5; ei++) {
          var ang = ei * Math.PI * 2 / 5;
          s += '<ellipse cx="' + (ex + Math.cos(ang) * 2.1).toFixed(2) + '" cy="' + (ey + Math.sin(ang) * 2.1).toFixed(2) + '" rx="1.5" ry="1.1" fill="' + hi(color, 1.3) + '" stroke="' + edge(color) + '" stroke-width=".25"/>';
        }
        s += '<circle cx="' + ex + '" cy="' + ey + '" r="1.1" fill="#E3B23C"/>';
      } else if (id === 'patch') {
        s += path('M8 -74H17V-64H8Z', lo(color, 0.92), { stroke: edge(color), sw: .55 });
        s += line('M9 -72H16M9 -69H16M9 -66H16', hi(color, 1.2), .45, .5);
        s += '<circle cx="8.6" cy="-73.4" r=".5" fill="' + hi(color, 1.3) + '"/><circle cx="16.4" cy="-73.4" r=".5" fill="' + hi(color, 1.3) + '"/>';
      }
    });
    return s;
  };

  G.makeCtx = ctxNew;
  G.edge = edge;
  G.lum = lum;
  G.pattern = pattern;
  G.grad = grad;
})();
