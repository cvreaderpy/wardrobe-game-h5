/* 衣间小日子 — 等距人物（矢量拆件） */
(function () {
  var Iso = window.Iso;
  var D = Iso.draw;
  var C = Iso.C;
  var GD = window.GAME_DATA;
  var LINE = C.line;
  Iso.character = Iso.character || {};

  function colorOf(name) {
    return (GD.COLOR_HEX && GD.COLOR_HEX[name]) || C[name] || '#D99A9A';
  }

  function edgeHair(hex) { return Iso.shade(hex, 0.62); }
  function lo2(hex) { return Iso.shade(hex, 0.78); }
  function hi2(hex) { return Iso.shade(hex, 1.18); }

  function hash(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) | 0; }
    return Math.abs(h);
  }

  Iso.character.appearance = function (customer) {
    var p = (customer && customer.portrait) || {};
    var id = (customer && (customer.appearanceOf || customer.id)) || 'guest';
    var h = 1 + ((hash(id) % 5) - 2) * 0.03;
    var hn = hash(id);
    var faces = ['oval', 'round', 'heart', 'long'];
    var eyes = ['almond', 'upturned', 'round'];
    var brows = ['soft', 'straight', 'arched'];
    var lips = ['soft', 'full', 'thin'];
    return {
      id: id,
      skin: p.skin || '#F2D3B8',
      hair: p.hair || '#2E2A27',
      hairStyle: p.hairStyle || 'bob',
      accessory: p.accessory || 'none',
      height: h,
      faceShape: p.faceShape || faces[hn % faces.length],
      eyeStyle: p.eyeStyle || eyes[Math.floor(hn / 7) % eyes.length],
      browStyle: p.browStyle || brows[Math.floor(hn / 11) % brows.length],
      lipStyle: p.lipStyle || lips[Math.floor(hn / 13) % lips.length],
      hairPart: p.hairPart || (Math.floor(hn / 17) % 2 ? 'middle' : 'side')
    };
  };

  Iso.character.outfit = function (s, customer) {
    var ids = [];
    if (s && s.pendingResult && s.pendingResult.itemIds) { ids = s.pendingResult.itemIds; }
    else if (s && s.selectedItems) { ids = s.selectedItems; }
    var pick = {};
    var acc = {};
    ids.forEach(function (id) {
      var it = GD.ITEMS_BY_ID[id];
      if (!it) { return; }
      if (it.cat === 'accessory') { acc[it.slot] = it; }
      else if (!pick[it.cat]) { pick[it.cat] = it; }
    });
    var p = (customer && customer.portrait) || {};
    var fallbackBottom = ['#8A9A7B', '#6B7F95', '#C97B63', '#B7A6C9'][hash((customer && customer.id) || '') % 4];
    function item(it, fallbackShape, fallbackColor, cat) {
      if (!it) {
        return { shape: fallbackShape, color: fallbackColor, look: Iso.lookOf({ id: '', cat: cat }) };
      }
      return { shape: it.shape, color: colorOf(it.color), id: it.id, name: it.name, look: Iso.lookOf(it) };
    }
    return {
      top: item(pick.top, 'blouse', p.top || '#F1E3D3', 'top'),
      bottom: item(pick.bottom, 'skirt', fallbackBottom, 'bottom'),
      dress: pick.dress ? item(pick.dress, 'dress', '#D99A9A', 'dress') : null,
      outer: pick.outer ? item(pick.outer, 'coat', '#E3B23C', 'outer') : null,
      shoes: item(pick.shoes, 'flat', '#6B4F3A', 'shoes'),
      bag: pick.bag ? item(pick.bag, 'tote', '#C97B63', 'bag') : null,
      hosiery: pick.hosiery ? item(pick.hosiery, 'tights', '#D8C9B8', 'hosiery') : null,
      acc: acc,
      portrait: p
    };
  };

  function staffNumber(m) {
    var id = String((m && (m.lookSeed || m.uid || m.name)) || 'staff');
    var n = parseInt(id.replace(/\D/g, ''), 10);
    return n > 0 ? n : (hash(id) % 97) + 1;
  }

  Iso.character.staffAppearance = function (m) {
    var id = (m && (m.lookSeed || m.uid || m.name)) || 'staff';
    var n = staffNumber(m);
    var skins = ['#F2D3B8', '#EBC9A9', '#F5DCC6', '#D9B08C', '#E3BFA0'];
    var hairs = ['#2E2A27', '#3F332B', '#6B4F3A', '#B7A6C9', '#D99A9A', '#A65E3A'];
    var styles = ['bob', 'short', 'long', 'bun', 'ponytail', 'wavy', 'pixie', 'braid'];
    var accs = ['none', 'glasses', 'earrings', 'headband'];
    var faces = ['oval', 'round', 'heart', 'long'];
    var eyes = ['almond', 'upturned', 'round'];
    return {
      id: 'staff-' + id,
      skin: skins[(n - 1) % skins.length],
      hair: hairs[(n * 2 + 1) % hairs.length],
      hairStyle: styles[(n - 1) % styles.length],
      accessory: accs[(n * 3) % accs.length],
      height: 0.94 + ((n * 2) % 3) * 0.04,
      faceShape: faces[(n + 1) % faces.length],
      eyeStyle: eyes[n % eyes.length],
      browStyle: ['soft', 'straight', 'arched'][(n + 2) % 3],
      lipStyle: ['soft', 'full', 'thin'][n % 3],
      hairPart: n % 2 ? 'middle' : 'side'
    };
  };

  Iso.character.staffOutfit = function (m) {
    var n = staffNumber(m);
    var skirts = ['#8A9A7B', '#6B7F95', '#B8786F', '#B7A6C9', '#8C674B'];
    var aprons = ['#C97B63', '#C99B3F', '#7C8F6C', '#6B4F3A', '#B8786F'];
    var i = (n - 1) % skirts.length;
    return {
      top: { shape: 'blouse', color: '#FFF9EF', look: { s: 'blouse', m: 'cotton', p: 'none', neck: 'v', slv: 'short', len: 'waist', fit: 'regular' } },
      bottom: { shape: 'skirt', color: skirts[i], look: { s: 'skirt', m: 'wool', p: 'none', rise: 'high', len: 'knee' } },
      dress: null,
      outer: null,
      shoes: { shape: 'flat', color: '#6B4F3A', look: { s: 'flat', m: 'leather', heel: 'flat' } },
      bag: null,
      acc: {},
      apron: aprons[i],
      uniform: true,
      portrait: {}
    };
  };

  function keyOf(o) {
    if (!o) { return '-'; }
    return (o.id || o.shape) + ':' + o.color;
  }

  Iso.character.outfitKey = function (o) {
    return [keyOf(o.top), keyOf(o.bottom), keyOf(o.dress), keyOf(o.outer), keyOf(o.shoes), keyOf(o.bag), keyOf(o.hosiery),
      Object.keys(o.acc).sort().map(function (k) { return k + '=' + o.acc[k].id; }).join(','),
      o.uniform ? 'u:' + (o.apron || '') : ''].join('|');
  };

  Iso.character.appearanceKey = function (a) {
    return [a.skin, a.hair, a.hairStyle, a.accessory, a.faceShape, a.eyeStyle, a.browStyle, a.lipStyle, a.hairPart].join('|');
  };

  Iso.character.poses = ['stand', 'hip', 'twirl', 'mirror'];

  // 身体 / 头部比例：身体纵向拉长 15%，头缩到 0.84，整体高度不变
  Iso.character.RIG = { bodyStretch: 1.15, headScale: 0.84 };

  /* ---------------- 身体 ---------------- */
  Iso.character.body = function (a, o, pose, opts) {
    var ctx = Iso.garment.makeCtx(a, o, pose || 'stand', opts);
    var s = '';
    s += Iso.garment.legs(ctx);
    if (o.hosiery) { s += Iso.garment.hosiery(ctx, o.hosiery); }
    s += Iso.garment.shoes(ctx, o.shoes);
    s += Iso.garment.torso(ctx);
    if (o.bottom && !o.dress) {
      s += Iso.garment.bottom(ctx);
      s += Iso.garment.decor(ctx, 'bottom');
    }
    if (o.dress) {
      s += Iso.garment.dress(ctx);
      s += Iso.garment.decor(ctx, 'dress');
    } else {
      s += Iso.garment.top(ctx);
      s += Iso.garment.decor(ctx, 'top');
    }
    s += Iso.garment.waistOverlay(ctx);
    s += Iso.garment.arms(ctx);
    if (o.outer) {
      s += Iso.garment.outer(ctx);
      s += Iso.garment.outerSleeves(ctx);
      s += Iso.garment.decor(ctx, 'outer');
    }
    if (!ctx.back) {
      if (o.uniform) { s += Iso.garment.apron(ctx, o.apron); }
      if (o.bag) { s += Iso.garment.bag(ctx); }
      s += Iso.garment.accessories(ctx);
    }
    return { vb: { x: -46, y: -110, w: 92, h: 112 }, body: '<defs>' + ctx.defs + '</defs>' + s };
  };

  Iso.character.mannequin = function (a, o, pose, opts) {
    opts = opts || {};
    var art = Iso.character.body(a, o, pose, { back: !!opts.back });
    var cap = '<path d="M-6.4 -95H6.4V-100Q0 -103 -6.4 -100Z" fill="#DCC5AA" stroke="#B99A78" stroke-width=".6"/>';
    cap += '<ellipse cx="0" cy="-95" rx="6.4" ry="2.8" fill="#E5D0B7" stroke="#B99A78" stroke-width=".5"/>';
    return { vb: art.vb, body: cap + art.body };
  };

  var manCache = {};
  Iso.character.mannequinUrl = function (a, o, pose, back) {
    var key = ['mq', Iso.character.appearanceKey(a), Iso.character.outfitKey(o), pose || 'stand', back ? 1 : 0].join('|');
    if (manCache[key]) { return manCache[key]; }
    var art = Iso.character.mannequin(a, o, pose, { back: !!back });
    var svg = Iso.draw.svg(art.vb, art.body, 2);
    var url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    var keys = Object.keys(manCache);
    if (keys.length > 60) { delete manCache[keys[0]]; }
    manCache[key] = url;
    return url;
  };

  Iso.character.full = function (a, o, pose, expr) {
    var body = Iso.character.body(a, o, pose || 'stand');
    var head = Iso.character.head(a, expr || 'calm');
    var back = Iso.character.backHair(a);
    var R = Iso.character.RIG;
    var S = R.bodyStretch;
    var hs = R.headScale;
    var ty = -88 * S + 88 * hs;
    var th = 'translate(0,' + ty.toFixed(2) + ') scale(1,' + hs + ')';
    var s = '';
    if (back) { s += '<g transform="' + th + '">' + back.body + '</g>'; }
    s += '<g transform="scale(1,' + S + ')">' + body.body + '</g>';
    s += '<g transform="' + th + '">' + head.body + '</g>';
    var top = Math.min(-166 * hs + ty, -110 * S);
    return { vb: { x: -46, y: Math.floor(top) - 2, w: 92, h: Math.ceil(2 * S - top) + 4 }, body: s };
  };

  var imgCache = {};
  Iso.character.imageUrl = function (a, o, pose, expr) {
    var key = [Iso.character.appearanceKey(a), Iso.character.outfitKey(o), pose || 'stand', expr || 'calm'].join('|');
    if (imgCache[key]) { return imgCache[key]; }
    var art = Iso.character.full(a, o, pose, expr);
    var svg = Iso.draw.svg(art.vb, art.body, 2);
    var url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    var keys = Object.keys(imgCache);
    if (keys.length > 80) { delete imgCache[keys[0]]; }
    imgCache[key] = url;
    return url;
  };

  /* ---------------- 头 ---------------- */
  Iso.character.head = function (a, expr) {
    var skin = a.skin, hair = a.hair;
    var style = a.hairStyle;
    var faceShape = a.faceShape || 'oval';
    var eyeStyle = a.eyeStyle || 'almond';
    var browStyle = a.browStyle || 'soft';
    var lipStyle = a.lipStyle || 'soft';
    var s = '';

    // 后发
    var shortStyle = style === 'short' || style === 'pixie';
    if (shortStyle) {
      s += '<path d="M-22 -120C-25 -146 -12 -157 0 -157C14 -157 25 -144 22 -118L22 -104H-22Z" fill="' + hair + '" stroke="' + LINE + '" stroke-width="1.8"/>';
      if (style === 'pixie') {
        s += '<path d="M-20 -136Q-6 -148 8 -140L16 -132L5 -130Q-8 -132 -18 -124Z" fill="' + Iso.shade(hair, 1.18) + '" opacity=".45"/>';
      }
    } else if (style === 'wavy') {
      s += '<path d="M-26 -122C-31 -145 -14 -159 0 -159C16 -159 32 -144 26 -118L28 -96Q24 -88 18 -92Q10 -82 2 -92Q-8 -82 -16 -92Q-24 -88 -27 -96Z" fill="' + hair + '" stroke="' + LINE + '" stroke-width="1.8"/>';
      s += '<path d="M-25 -112Q-34 -98 -27 -82L-16 -86Q-21 -98 -17 -111Z" fill="' + hair + '" stroke="' + LINE + '" stroke-width="1.4"/>';
      s += '<path d="M25 -112Q34 -98 27 -82L16 -86Q21 -98 17 -111Z" fill="' + hair + '" stroke="' + LINE + '" stroke-width="1.4"/>';
      s += '<path d="M-20 -105Q-22 -92 -30 -86M20 -105Q22 -92 30 -86" fill="none" stroke="' + Iso.shade(hair, 1.35) + '" stroke-width="1" opacity=".35"/>';
    } else if (style === 'braid') {
      s += '<path d="M-23 -118C-26 -145 -12 -157 0 -157C15 -157 27 -144 23 -116L23 -93Q23 -85 15 -89L15 -108C8 -114 -8 -114 -15 -108L-15 -89Q-23 -85 -23 -93Z" fill="' + hair + '" stroke="' + LINE + '" stroke-width="1.8"/>';
      s += '<path d="M20 -104Q30 -94 27 -78Q24 -66 17 -64Q22 -78 16 -92Z" fill="' + hair + '" stroke="' + LINE + '" stroke-width="1.4"/>';
      s += '<path d="M22 -98L28 -94M22 -90L29 -86M21 -82L27 -78" stroke="' + Iso.shade(hair, 1.3) + '" stroke-width="1.1" opacity=".6"/>';
    } else if (style === 'ponytail') {
      s += '<path d="M-23 -118C-26 -145 -12 -157 0 -157C15 -157 27 -144 23 -116L23 -93Q23 -85 15 -89L15 -108C8 -114 -8 -114 -15 -108L-15 -89Q-23 -85 -23 -93Z" fill="' + hair + '" stroke="' + LINE + '" stroke-width="1.8"/>';
      s += '<path d="M18 -142Q34 -134 31 -112Q29 -94 20 -84Q22 -104 17 -120Q14 -132 10 -138Z" fill="' + hair + '" stroke="' + LINE + '" stroke-width="1.4"/>';
      s += '<path d="M21 -136Q28 -124 24 -106" fill="none" stroke="' + Iso.shade(hair, 1.4) + '" stroke-width="1" opacity=".35"/>';
    } else {
      s += '<path d="M-23 -118C-26 -145 -12 -157 0 -157C15 -157 27 -144 23 -116L23 -93Q23 -85 15 -89L15 -108C8 -114 -8 -114 -15 -108L-15 -89Q-23 -85 -23 -93Z" fill="' + hair + '" stroke="' + LINE + '" stroke-width="1.8"/>';
      if (style === 'long') {
        s += '<path d="M-23 -110Q-30 -96 -26 -84L-16 -86Q-19 -98 -16 -112Z" fill="' + hair + '" stroke="' + LINE + '" stroke-width="1.4"/>';
        s += '<path d="M23 -110Q30 -96 26 -84L16 -86Q19 -98 16 -112Z" fill="' + hair + '" stroke="' + LINE + '" stroke-width="1.4"/>';
      }
    }
    // 丸子头
    if (style === 'bun') {
      s += '<circle cx="12" cy="-149" r="10" fill="' + hair + '" stroke="' + LINE + '" stroke-width="1.6"/>';
      s += '<path d="M4 -146Q12 -153 20 -146" fill="none" stroke="' + Iso.shade(hair, 1.5) + '" stroke-width="1.2" opacity=".55"/>';
    }

    // 脖子
    s += '<path d="M-5 -100H5V-88Q0 -84 -5 -88Z" fill="' + skin + '" stroke="' + LINE + '" stroke-width="1.5"/>';

    // 耳朵
    s += '<ellipse cx="-18" cy="-112" rx="3" ry="4.4" fill="' + skin + '" stroke="' + LINE + '" stroke-width="1.4"/>';
    s += '<ellipse cx="18" cy="-112" rx="3" ry="4.4" fill="' + skin + '" stroke="' + LINE + '" stroke-width="1.4"/>';

    // 脸（不同脸型）
    if (faceShape === 'heart') {
      s += '<path d="M-19 -122C-20 -140 -12 -146 0 -146C12 -146 20 -140 19 -122L17 -111C14 -101 7 -95 0 -94C-7 -95 -14 -101 -17 -111Z" fill="' + skin + '" stroke="' + LINE + '" stroke-width="1.8"/>';
    } else if (faceShape === 'long') {
      s += '<path d="M-17 -124C-18 -142 -10 -149 0 -149C10 -149 18 -142 17 -124L16 -106C12 -97 6 -93 0 -92C-6 -93 -12 -97 -16 -106Z" fill="' + skin + '" stroke="' + LINE + '" stroke-width="1.8"/>';
    } else if (faceShape === 'round') {
      s += '<ellipse cx="0" cy="-117" rx="20" ry="20.8" fill="' + skin + '" stroke="' + LINE + '" stroke-width="1.8"/>';
    } else {
      s += '<ellipse cx="0" cy="-118" rx="19" ry="22.5" fill="' + skin + '" stroke="' + LINE + '" stroke-width="1.8"/>';
    }
    s += '<path d="M-10 -101Q0 -96 10 -101" fill="none" stroke="' + Iso.shade(skin, 0.9) + '" stroke-width=".8" opacity=".35"/>';

    // 刘海（按发型变化）
    if (style === 'pixie') {
      s += '<path d="M-21 -130Q-15 -148 2 -149Q20 -148 21 -128Q12 -137 2 -134Q-9 -132 -17 -123Z" fill="' + hair + '" stroke="' + LINE + '" stroke-width="1.7" stroke-linejoin="round"/>';
    } else if (style === 'ponytail' || style === 'braid') {
      s += '<path d="M-21 -130Q-15 -149 0 -149Q15 -149 21 -130Q13 -138 2 -136Q-8 -135 -15 -126Z" fill="' + hair + '" stroke="' + LINE + '" stroke-width="1.7" stroke-linejoin="round"/>';
      s += '<path d="M-1 -148Q3 -140 1 -132" fill="none" stroke="' + Iso.shade(hair, 1.35) + '" stroke-width="1" opacity=".45"/>';
    } else if (style === 'wavy') {
      s += '<path d="M-22 -130Q-17 -149 0 -149Q19 -148 22 -127Q14 -139 4 -135Q-7 -132 -16 -124Q-20 -121 -22 -130Z" fill="' + hair + '" stroke="' + LINE + '" stroke-width="1.7" stroke-linejoin="round"/>';
      s += '<path d="M-21 -130Q-27 -114 -21 -96Q-15 -91 -11 -99Q-18 -113 -15 -126Z" fill="' + hair + '" stroke="' + LINE + '" stroke-width="1.4"/>';
      s += '<path d="M18 -130Q25 -113 18 -99Q12 -94 10 -102Q17 -114 14 -126Z" fill="' + hair + '" stroke="' + LINE + '" stroke-width="1.4"/>';
    } else {
      s += '<path d="M-21 -130Q-17 -148 0 -149Q19 -148 21 -128Q13 -138 3 -136Q-8 -134 -16 -125Q-20 -122 -21 -130Z" fill="' + hair + '" stroke="' + LINE + '" stroke-width="1.7" stroke-linejoin="round"/>';
      if (style !== 'short') {
        s += '<path d="M-21 -130Q-26 -114 -20 -98Q-14 -93 -11 -99Q-17 -112 -15 -126Z" fill="' + hair + '" stroke="' + LINE + '" stroke-width="1.4"/>';
        s += '<path d="M18 -130Q23 -114 18 -100Q13 -96 11 -102Q16 -114 14 -126Z" fill="' + hair + '" stroke="' + LINE + '" stroke-width="1.4"/>';
      }
    }
    if (style === 'long' || style === 'braid') {
      s += '<path d="M-23 -104Q-24 -92 -20 -82L-14 -84Q-18 -96 -17 -106Z" fill="' + hair + '" stroke="' + LINE + '" stroke-width="1.3"/>';
      s += '<path d="M23 -104Q24 -92 20 -82L14 -84Q18 -96 17 -106Z" fill="' + hair + '" stroke="' + LINE + '" stroke-width="1.3"/>';
    }

    // 头发高光
    s += '<path d="M-17 -142Q-10 -151 1 -150Q-6 -145 -10 -137Z" fill="' + Iso.shade(hair, 1.6) + '" opacity=".2"/>';
    s += '<path d="M6 -148Q13 -146 17 -139Q12 -142 8 -143Z" fill="' + Iso.shade(hair, 1.45) + '" opacity=".16"/>';

    // 眉毛
    var browStroke = Iso.shade(hair, 0.9);
    var brow = '<path d="M-13 -126Q-7 -130 -1 -126M1 -126Q7 -130 13 -126" fill="none" stroke="' + browStroke + '" stroke-width="1.25" stroke-linecap="round"/>';
    if (browStyle === 'straight') {
      brow = '<path d="M-13 -126H-2M2 -126H13" fill="none" stroke="' + browStroke + '" stroke-width="1.25" stroke-linecap="round"/>';
    } else if (browStyle === 'arched') {
      brow = '<path d="M-13 -125Q-7 -132 -1 -126M1 -126Q7 -132 13 -125" fill="none" stroke="' + browStroke + '" stroke-width="1.15" stroke-linecap="round"/>';
    }
    if (expr === 'hesitant') {
      brow = '<path d="M-13 -127Q-7 -129 -1 -125M1 -125Q7 -129 13 -127" fill="none" stroke="' + browStroke + '" stroke-width="1.25" stroke-linecap="round"/>';
    }
    s += brow;

    // 眼睛：眼白 + 虹膜 + 高光 + 睫毛
    function eye(cx, rx, ry, rot, lash) {
      var g = '<g' + (rot ? ' transform="rotate(' + rot + ' ' + cx + ' -117)"' : '') + '>';
      g += '<ellipse cx="' + cx + '" cy="-117" rx="' + rx + '" ry="' + ry + '" fill="#FFFDF8" stroke="#3F332B" stroke-width=".42"/>';
      g += '<ellipse cx="' + cx + '" cy="-116.7" rx="' + (rx * .62).toFixed(2) + '" ry="' + (ry * .76).toFixed(2) + '" fill="#4A3B32"/>';
      g += '<ellipse cx="' + cx + '" cy="-116.3" rx="' + (rx * .3).toFixed(2) + '" ry="' + (ry * .4).toFixed(2) + '" fill="#2E2A27"/>';
      g += '<circle cx="' + (cx - rx * .3) + '" cy="-118.1" r=".8" fill="#FFFDF8"/>';
      g += '<circle cx="' + (cx + rx * .35) + '" cy="-115.4" r=".42" fill="#FFFDF8" opacity=".75"/>';
      g += '<path d="M' + (cx - rx) + ' -118.8Q' + cx + ' -121 ' + (cx + rx) + ' -118.8" fill="none" stroke="#2E2A27" stroke-width=".8" stroke-linecap="round"/>';
      if (lash) {
        g += '<path d="M' + (cx + rx * .75) + ' -120L' + (cx + rx * 1.35) + ' -121.8" stroke="#2E2A27" stroke-width=".65" stroke-linecap="round"/>';
      }
      return g + '</g>';
    }
    if (expr === 'blink' || expr === 'happy') {
      s += '<path d="M-11 -117Q-7 -113 -3 -117M3 -117Q7 -113 11 -117" fill="none" stroke="#2E2A27" stroke-width="1.15" stroke-linecap="round"/>';
      s += '<path d="M-10.5 -118.5L-12.5 -120M10.5 -118.5L12.5 -120" stroke="#2E2A27" stroke-width=".6" stroke-linecap="round"/>';
    } else if (expr === 'surprised') {
      s += '<ellipse cx="-7" cy="-117" rx="3.5" ry="4.3" fill="#FFFDF8" stroke="#3F332B" stroke-width=".4"/>';
      s += '<ellipse cx="7" cy="-117" rx="3.5" ry="4.3" fill="#FFFDF8" stroke="#3F332B" stroke-width=".4"/>';
      s += '<circle cx="-7" cy="-117" r="2" fill="#4A3B32"/><circle cx="7" cy="-117" r="2" fill="#4A3B32"/>';
      s += '<circle cx="-7.8" cy="-118.2" r=".8" fill="#FFFDF8"/><circle cx="6.2" cy="-118.2" r=".8" fill="#FFFDF8"/>';
    } else if (eyeStyle === 'upturned') {
      s += eye(-7, 3.25, 3.7, -7, true);
      s += eye(7, 3.25, 3.7, 7, true);
    } else if (eyeStyle === 'round') {
      s += eye(-7, 3.6, 4.05, 0, false);
      s += eye(7, 3.6, 4.05, 0, false);
    } else {
      s += eye(-7, 3.2, 3.75, 0, true);
      s += eye(7, 3.2, 3.75, 0, true);
    }

    // 眼镜（人物自带或搭配）
    var glasses = a.accessory === 'glasses' || (a.accEyes);
    if (glasses) {
      var sun = a.accEyes && a.accEyes.shape === 'sunglasses';
      var fill = sun ? '#3F332B' : '#DCEBEF';
      var op = sun ? '.82' : '.14';
      s += '<circle cx="-7" cy="-117" r="4.9" fill="' + fill + '" fill-opacity="' + op + '" stroke="' + LINE + '" stroke-width="1.05"/>';
      s += '<circle cx="7" cy="-117" r="4.9" fill="' + fill + '" fill-opacity="' + op + '" stroke="' + LINE + '" stroke-width="1.05"/>';
      s += '<path d="M-2.2 -117H2.2M-11.8 -117L-16 -118.6M11.8 -117L16 -115.4" stroke="' + LINE + '" stroke-width="1.05" fill="none"/>';
      if (!sun) {
        s += '<path d="M-9.4 -119.6Q-7 -121 -4.6 -119.6" fill="none" stroke="#FFFDF8" stroke-width=".7" opacity=".55"/>';
        s += '<path d="M4.6 -119.6Q7 -121 9.4 -119.6" fill="none" stroke="#FFFDF8" stroke-width=".7" opacity=".55"/>';
      }
    }
    // 鼻子 / 嘴
    s += '<path d="M0 -110Q2 -108 0 -107" fill="none" stroke="' + Iso.shade(skin, 0.8) + '" stroke-width="1.1" stroke-linecap="round"/>';
    if (expr === 'talk') {
      s += '<ellipse cx="0" cy="-102" rx="2.6" ry="3.2" fill="#8A5A4A" stroke="' + LINE + '" stroke-width=".8"/>';
    } else if (expr === 'happy') {
      s += '<path d="M-5 -103Q0 -98 5 -103" fill="none" stroke="#8A5A4A" stroke-width="1.7" stroke-linecap="round"/>';
    } else if (expr === 'hesitant') {
      s += '<path d="M-4 -102Q0 -104 4 -102" fill="none" stroke="#8A5A4A" stroke-width="1.15" stroke-linecap="round"/>';
    } else if (expr === 'surprised') {
      s += '<ellipse cx="0" cy="-102" rx="2" ry="2.6" fill="#8A5A4A"/>';
    } else if (lipStyle === 'full') {
      s += '<path d="M-6 -103Q0 -97 6 -103Q0 -100 -6 -103Z" fill="#B06A5A" stroke="#8A5A4A" stroke-width=".8"/>';
      s += '<path d="M-4 -102Q0 -100 4 -102" fill="none" stroke="#F3B7A8" stroke-width=".7" opacity=".5"/>';
    } else if (lipStyle === 'thin') {
      s += '<path d="M-5 -102Q0 -100 5 -102" fill="none" stroke="#8A5A4A" stroke-width="1.4" stroke-linecap="round"/>';
    } else {
      s += '<path d="M-5 -103Q0 -99 5 -103" fill="none" stroke="#8A5A4A" stroke-width="1.25" stroke-linecap="round"/>';
      s += '<path d="M-3 -101.5Q0 -100 3 -101.5" fill="none" stroke="#E8A18F" stroke-width=".8" opacity=".5"/>';
    }

    // 腮红
    s += '<ellipse cx="-13" cy="-108" rx="4" ry="2.4" fill="#E08C7B" opacity="' + (expr === 'happy' ? '.5' : '.35') + '"/>';
    s += '<ellipse cx="13" cy="-108" rx="4" ry="2.4" fill="#E08C7B" opacity="' + (expr === 'happy' ? '.5' : '.35') + '"/>';

    // 发箍（店员）
    if (a.accessory === 'headband') {
      s += '<path d="M-21 -136Q0 -147 21 -136" fill="none" stroke="#D99A9A" stroke-width="3.2" stroke-linecap="round"/>';
      s += '<path d="M-21 -136Q0 -147 21 -136" fill="none" stroke="' + LINE + '" stroke-width=".7" opacity=".4"/>';
    }

    // 耳饰：耳钉 / 圈耳环 / 长坠 / 耳骨夹
    if (a.accEar) {
      var el = Iso.lookOf(a.accEar) || {};
      var ekind = el.s || a.accEar.shape;
      var ec = colorOf(a.accEar.color);
      [-18, 18].forEach(function (x) {
        if (ekind === 'hoop') {
          s += '<circle cx="' + x + '" cy="-104.5" r="2.7" fill="none" stroke="' + ec + '" stroke-width=".85"/>';
        } else if (ekind === 'drop') {
          s += '<circle cx="' + x + '" cy="-105" r=".9" fill="' + ec + '"/>';
          s += '<path d="M' + x + ' -104V-101" stroke="' + ec + '" stroke-width=".6"/>';
          s += '<circle cx="' + x + '" cy="-99.6" r="1.5" fill="' + ec + '" stroke="' + edgeHair(ec) + '" stroke-width=".25"/>';
        } else if (ekind === 'cuff') {
          s += '<path d="M' + (x + (x < 0 ? 2.2 : -2.2)) + ' -112Q' + x + ' -109 ' + (x + (x < 0 ? 1 : -1)) + ' -106" fill="none" stroke="' + ec + '" stroke-width="1.1" stroke-linecap="round"/>';
        } else {
          s += '<circle cx="' + x + '" cy="-105" r="1.6" fill="' + ec + '" stroke="' + edgeHair(ec) + '" stroke-width=".3"/>';
        }
      });
    }
    if (a.accessory === 'earrings' && !a.accEar) {
      s += '<circle cx="-18" cy="-105" r="1.6" fill="#E3B23C" stroke="#8C674B" stroke-width=".3"/>';
      s += '<circle cx="18" cy="-105" r="1.6" fill="#E3B23C" stroke="#8C674B" stroke-width=".3"/>';
    }

    // 帽子 / 发饰
    if (a.hat) {
      var hc = colorOf(a.hat.color);
      s += '<path d="M-23 -146Q-21 -159 2 -159Q25 -159 23 -146Q8 -152 -23 -146Z" fill="' + hc + '" stroke="' + edgeHair(hc) + '" stroke-width=".8"/>';
      s += '<path d="M-21 -146Q0 -151 21 -146" fill="none" stroke="' + lo2(hc) + '" stroke-width="1"/>';
      s += '<circle cx="2" cy="-159" r="2.1" fill="' + hi2(hc) + '" stroke="' + edgeHair(hc) + '" stroke-width=".4"/>';
    } else if (a.hairClip) {
      var hl = Iso.lookOf(a.hairClip) || {};
      var hkind = hl.s || a.hairClip.shape;
      var cc = colorOf(a.hairClip.color);
      if (hkind === 'bow') {
        s += '<path d="M11 -143L5 -147L6 -138Z" fill="' + cc + '" stroke="' + edgeHair(cc) + '" stroke-width=".5"/>';
        s += '<path d="M13 -143L19 -147L18 -138Z" fill="' + cc + '" stroke="' + edgeHair(cc) + '" stroke-width=".5"/>';
        s += '<circle cx="12" cy="-142" r="1.6" fill="' + hi2(cc) + '" stroke="' + edgeHair(cc) + '" stroke-width=".35"/>';
      } else if (hkind === 'scrunchie') {
        s += '<circle cx="15" cy="-139" r="4.2" fill="none" stroke="' + cc + '" stroke-width="2.4" opacity=".95"/>';
        s += '<path d="M11 -141Q15 -145 19 -141M11 -137Q15 -133 19 -137" fill="none" stroke="' + hi2(cc) + '" stroke-width=".8" opacity=".6"/>';
      } else if (hkind === 'claw') {
        s += '<path d="M8 -141Q12 -148 19 -144L18 -140Q14 -142 11 -138Z" fill="' + cc + '" stroke="' + edgeHair(cc) + '" stroke-width=".45"/>';
        s += '<path d="M10 -141L15 -143M11 -139L16 -141" stroke="' + lo2(cc) + '" stroke-width=".5"/>';
      } else if (hkind === 'headband') {
        s += '<path d="M-21 -136Q0 -149 21 -136" fill="none" stroke="' + cc + '" stroke-width="2.8" stroke-linecap="round"/>';
        s += '<path d="M-21 -136Q0 -149 21 -136" fill="none" stroke="' + hi2(cc) + '" stroke-width=".8" opacity=".45"/>';
      } else if (hkind === 'hairpin') {
        s += '<path d="M9 -142H20" stroke="' + cc + '" stroke-width="1.4" stroke-linecap="round"/>';
        s += '<circle cx="9" cy="-142" r="1.3" fill="#FFF9EF" stroke="' + edgeHair(cc) + '" stroke-width=".3"/>';
      } else {
        s += '<path d="M10 -142H20" stroke="' + cc + '" stroke-width="3" stroke-linecap="round"/>';
        s += '<path d="M10 -142H20" stroke="' + hi2(cc) + '" stroke-width=".7" opacity=".5"/>';
      }
    }

    return { vb: { x: -40, y: -166, w: 80, h: 78 }, body: s };
  };

  Iso.character.backHair = function (a) {
    var style = a.hairStyle;
    if (style !== 'long' && style !== 'wavy' && style !== 'braid') { return null; }
    var hair = a.hair;
    var body = '';
    if (style === 'wavy') {
      body = '<path d="M-31 -150Q0 -162 31 -150L34 -104Q33 -82 24 -66Q16 -56 12 -66Q22 -82 18 -104Q14 -128 0 -138Q-14 -128 -18 -104Q-22 -82 -12 -66Q-16 -56 -24 -66Q-33 -82 -34 -104Z" fill="' + hair + '" stroke="' + LINE + '" stroke-width="1.8"/>' +
        '<path d="M-26 -138Q-34 -108 -25 -74M0 -146V-58M26 -138Q34 -108 25 -74" fill="none" stroke="' + Iso.shade(hair, 1.5) + '" stroke-width="1.2" opacity=".3"/>';
    } else if (style === 'braid') {
      body = '<path d="M-28 -150Q0 -160 28 -150L30 -104Q28 -74 16 -58Q0 -50 -16 -58Q-28 -74 -30 -104Z" fill="' + hair + '" stroke="' + LINE + '" stroke-width="1.8"/>' +
        '<path d="M-22 -138Q-28 -108 -22 -74M0 -146V-60M22 -138Q28 -108 22 -74" fill="none" stroke="' + Iso.shade(hair, 1.5) + '" stroke-width="1.2" opacity=".32"/>' +
        '<path d="M22 -82Q32 -74 28 -58Q26 -46 18 -42Q22 -56 17 -68Z" fill="' + hair + '" stroke="' + LINE + '" stroke-width="1.4"/>' +
        '<path d="M24 -76L30 -72M23 -68L30 -64M22 -60L28 -56" stroke="' + Iso.shade(hair, 1.3) + '" stroke-width="1" opacity=".55"/>';
    } else {
      body = '<path d="M-28 -150Q0 -160 28 -150L30 -104Q28 -74 16 -58Q0 -50 -16 -58Q-28 -74 -30 -104Z" fill="' + hair + '" stroke="' + LINE + '" stroke-width="1.8"/>' +
        '<path d="M-22 -138Q-28 -108 -22 -74M0 -146V-60M22 -138Q28 -108 22 -74" fill="none" stroke="' + Iso.shade(hair, 1.5) + '" stroke-width="1.2" opacity=".32"/>' +
        '<path d="M-16 -60Q0 -54 16 -60" fill="none" stroke="' + Iso.shade(hair, 1.5) + '" stroke-width="1.2" opacity=".3"/>';
    }
    return { vb: { x: -40, y: -166, w: 80, h: 112 }, body: body };
  };

  Iso.character.shadow = function () {
    return {
      vb: { x: -34, y: -10, w: 68, h: 20 },
      body: D.defs + '<ellipse cx="0" cy="0" rx="25" ry="6" fill="#3F332B" opacity=".22" filter="url(#soft)"/>'
    };
  };
})();
