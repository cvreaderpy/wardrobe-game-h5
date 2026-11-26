/* 衣间小日子 — 界面与绘制 */
(function () {
  var D = window.GAME_DATA;
  var E = window.Engine;

  var UI = {};
  UI.screens = {};
  UI.overrideScreen = null;
  UI.helpReturn = 'title';
  UI.lastShareDataUrl = null;
  UI._clearSel = {};
  UI._decorSel = null;
  UI._design = {
    cat: 'top', silhouette: 'shirt', fabric: 'cotton', pattern: 'none',
    color: 'cream', deco: [], priceMode: 'mid', name: '',
    custom: null, print: null
  };
  UI._designStep = 'shape';
  UI._designSide = 'front';
  UI._designModel = 'mannequin';
  UI._designPose = 'stand';
  UI._designOrderId = null;
  UI._designPreviewCache = {};
  UI._designThumbs = {};
  UI._board = null;
  UI._placeId = null;
  UI._lastKey = null;
  UI._stageSig = '';
  UI._screenSig = '';
  UI._lastStateObj = null;
  var toastTimer = null;
  var DEBUG = true; // 发布到小红书前改成 false，隐藏测试工具

  /* ---------------- 基础工具 ---------------- */

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function money(n) {
    var v = Math.round(Number(n) || 0);
    var sign = v < 0 ? '-' : '';
    var s = String(Math.abs(v));
    s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return sign + '¥' + s;
  }

  function styleLabels(styles) {
    return (styles || []).map(function (s) { return D.STYLE_LABELS[s] || s; });
  }

  function styleTags(styles, cls) {
    return styleLabels(styles).map(function (s) {
      return '<span class="tag ' + (cls || 'style') + '">' + esc(s) + '</span>';
    }).join('');
  }

  function itemById(id) { return D.ITEMS_BY_ID[id]; }
  function customerById(id) { return D.CUSTOMERS_BY_ID[id]; }

  function unique(arr) {
    var out = [];
    arr.forEach(function (x) { if (out.indexOf(x) < 0) { out.push(x); } });
    return out;
  }

  /* ---------------- 商品 SVG ---------------- */

  var svgCache = {};

  function itemSvg(item) {
    if (!item) { return ''; }
    var key = item.id || item.name;
    if (!item.image && svgCache[key]) { return svgCache[key]; }
    var html = buildItemSvg(item);
    if (!item.image) { svgCache[key] = html; }
    return html;
  }

  UI.clearSvgCache = function () { svgCache = {}; };

  function buildItemSvg(item) {
    if (item.image) {
      return '<img src="' + esc(item.image) + '" alt="' + esc(item.name) + '" style="width:100%;height:100%;object-fit:contain;display:block">';
    }
    var fill = D.COLOR_HEX[item.color] || '#D8C9B8';
    var st = ' stroke="#5B4636" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';
    var detail = ' stroke="#5B4636" stroke-width="2" fill="none" stroke-linecap="round"';
    var white = ' stroke="rgba(255,255,255,.5)" stroke-width="2" fill="none" stroke-linecap="round"';
    var shape = item.shape || item.cat;
    var variant = item.variant || '';
    var body = '';

    switch (shape) {
      case 'top':
        body = '<path d="M32 28 L42 20 Q50 27 58 20 L68 28 L80 42 L68 48 L66 84 Q50 90 34 84 L32 48 L20 42 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M42 20 Q50 30 58 20"' + detail + '/>' +
          '<path d="M40 46 L60 46"' + white + '/>';
        break;
      case 'shirt':
        body = '<path d="M32 28 L42 20 L50 32 L58 20 L68 28 L80 42 L68 48 L66 84 Q50 90 34 84 L32 48 L20 42 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M42 20 L50 32 L58 20"' + detail + '/>' +
          '<path d="M50 32 L50 84"' + detail + '/>' +
          '<circle cx="50" cy="48" r="1.8" fill="#5B4636"/><circle cx="50" cy="60" r="1.8" fill="#5B4636"/><circle cx="50" cy="72" r="1.8" fill="#5B4636"/>';
        break;
      case 'tee':
        body = '<path d="M34 26 L42 20 Q50 27 58 20 L66 26 L76 38 L66 44 L64 84 Q50 89 36 84 L34 44 L24 38 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M42 20 Q50 30 58 20"' + detail + '/>' +
          '<path d="M40 46 L60 46"' + white + '/>';
        break;
      case 'blouse':
        body = '<path d="M34 26 Q26 30 24 40 Q28 46 34 44 L36 84 Q50 89 64 84 L66 44 Q72 46 76 40 Q74 30 66 26 L58 20 Q50 28 42 20 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M42 20 Q46 28 50 28 Q54 28 58 20"' + detail + '/>' +
          '<path d="M38 52 L62 52"' + white + '/>';
        break;
      case 'hoodie':
        body = '<path d="M28 30 Q30 16 50 16 Q70 16 72 30 L80 44 L68 50 L66 86 Q50 91 34 86 L32 50 L20 44 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M36 28 Q50 42 64 28"' + detail + '/>' +
          '<path d="M40 68 L60 68 L58 80 L42 80 Z" fill="rgba(255,255,255,.25)" stroke="#5B4636" stroke-width="2" stroke-linejoin="round"/>';
        break;
      case 'cami':
        body = '<path d="M36 30 L44 26 L50 38 L56 26 L64 30 L62 84 Q50 89 38 84 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M40 26 Q38 16 44 14"' + detail + '/><path d="M60 26 Q62 16 56 14"' + detail + '/>' +
          '<path d="M42 42 L58 42"' + white + '/>';
        break;
      case 'pants':
        body = '<path d="M34 22 L66 22 L62 84 L52 84 L50 48 L48 84 L38 84 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M34 30 L66 30"' + detail + '/>' +
          '<path d="M42 30 L42 40 M58 30 L58 40"' + white + '/>';
        break;
      case 'skirt':
        body = '<path d="M34 22 L66 22 L78 84 Q50 91 22 84 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M34 30 L66 30"' + detail + '/>' +
          '<path d="M40 32 L35 82 M50 32 L50 86 M60 32 L65 82"' + white + '/>';
        break;
      case 'shorts':
        body = '<path d="M34 22 L66 22 L64 62 L52 62 L50 42 L48 62 L36 62 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M34 30 L66 30"' + detail + '/>' +
          '<path d="M42 30 L42 42 M58 30 L58 42"' + white + '/>';
        break;
      case 'dress':
        body = '<path d="M40 18 L46 14 Q50 20 54 14 L60 18 L58 44 L74 86 Q50 94 26 86 L42 44 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M42 44 L58 44"' + detail + '/>' +
          '<path d="M46 14 Q50 20 54 14"' + detail + '/>' +
          '<path d="M40 58 Q50 62 60 58"' + white + '/>';
        break;
      case 'coat':
        body = '<path d="M30 24 L42 18 L50 30 L58 18 L70 24 L80 46 L68 50 L66 86 L34 86 L32 50 L20 46 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M42 18 L50 30 L58 18"' + detail + '/>' +
          '<path d="M50 30 L50 86"' + detail + '/>' +
          '<path d="M34 66 L66 66"' + white + '/>';
        break;
      case 'jacket':
        body = '<path d="M30 26 L42 20 L50 30 L58 20 L70 26 L78 44 L68 48 L66 70 L34 70 L32 48 L22 44 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M42 20 L50 30 L58 20"' + detail + '/>' +
          '<path d="M50 30 L50 70"' + detail + '/>';
        break;
      case 'blazer':
        body = '<path d="M30 24 L42 18 L50 34 L58 18 L70 24 L80 46 L68 50 L66 82 L34 82 L32 50 L20 46 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M42 18 L50 34 L58 18"' + detail + '/>' +
          '<path d="M50 42 L50 82"' + detail + '/>' +
          '<circle cx="50" cy="54" r="1.8" fill="#5B4636"/><circle cx="50" cy="68" r="1.8" fill="#5B4636"/>';
        break;
      case 'mary':
        body = '<path d="M18 60 Q26 48 42 52 L58 60 L82 66 Q88 70 84 78 L24 78 Q14 72 18 60 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M36 56 Q50 50 64 58"' + detail + '/>' +
          '<path d="M30 68 L74 68"' + white + '/>';
        break;
      case 'loafer':
        body = '<path d="M18 60 Q26 50 42 54 L58 60 L84 66 Q89 70 84 78 L24 78 Q14 72 18 60 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M34 58 Q48 54 60 60"' + detail + '/>' +
          '<path d="M30 68 L74 68"' + white + '/>';
        break;
      case 'sneaker':
        body = '<path d="M18 58 Q28 48 42 52 L58 60 L82 64 Q88 68 84 76 L24 76 Q14 70 18 58 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M30 50 L54 58"' + detail + '/>' +
          '<path d="M34 58 L38 52 M42 60 L46 54 M50 62 L54 56"' + white + '/>' +
          '<path d="M22 72 L82 72"' + detail + '/>';
        break;
      case 'heel':
        body = '<path d="M18 60 Q26 50 42 54 L58 60 L80 64 Q86 68 82 74 L24 76 Q16 70 18 60 Z" fill="' + fill + '"' + st + '/>' +
          '<rect x="70" y="68" width="5" height="16" rx="2" fill="' + fill + '"' + st + '/>' +
          '<path d="M30 66 L64 66"' + white + '/>';
        break;
      case 'boot':
        body = '<path d="M28 26 L46 26 L46 58 Q58 62 66 66 L82 70 Q88 74 82 82 L24 82 Q18 76 22 68 L30 62 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M28 34 L46 34"' + detail + '/>' +
          '<path d="M30 70 L72 70"' + white + '/>';
        break;
      case 'tote':
        body = '<path d="M28 42 L72 42 L78 84 L22 84 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M40 42 Q40 24 50 24 Q60 24 60 42"' + detail + '/>' +
          '<path d="M34 56 L66 56"' + white + '/>';
        break;
      case 'bag':
        body = '<path d="M26 40 L74 40 L80 70 Q80 82 68 82 L32 82 Q20 82 20 70 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M38 40 Q38 24 50 24 Q62 24 62 40"' + detail + '/>' +
          '<path d="M28 54 L72 54"' + detail + '/>' +
          '<circle cx="50" cy="54" r="3" fill="#E3B23C" stroke="#5B4636" stroke-width="1.5"/>';
        break;
      case 'scarf':
        body = '<path d="M26 34 Q40 24 54 34 Q64 42 74 34 L78 44 Q64 56 50 46 Q38 38 26 48 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M54 44 L48 74 L58 74 L62 46" fill="' + fill + '"' + st + '/>' +
          '<path d="M34 36 Q44 30 52 38"' + white + '/>';
        break;
      case 'pearl':
        body = '<path d="M26 36 Q28 70 50 74 Q72 70 74 36" fill="none" stroke="#5B4636" stroke-width="2"/>' +
          '<circle cx="30" cy="44" r="3" fill="#FFFDF8" stroke="#5B4636" stroke-width="1.5"/>' +
          '<circle cx="34" cy="56" r="3" fill="#FFFDF8" stroke="#5B4636" stroke-width="1.5"/>' +
          '<circle cx="42" cy="66" r="3" fill="#FFFDF8" stroke="#5B4636" stroke-width="1.5"/>' +
          '<circle cx="50" cy="70" r="3" fill="#FFFDF8" stroke="#5B4636" stroke-width="1.5"/>' +
          '<circle cx="58" cy="66" r="3" fill="#FFFDF8" stroke="#5B4636" stroke-width="1.5"/>' +
          '<circle cx="66" cy="56" r="3" fill="#FFFDF8" stroke="#5B4636" stroke-width="1.5"/>' +
          '<circle cx="70" cy="44" r="3" fill="#FFFDF8" stroke="#5B4636" stroke-width="1.5"/>';
        break;
      case 'glasses':
        body = '<circle cx="38" cy="50" r="14" fill="rgba(255,255,255,.25)" stroke="#5B4636" stroke-width="3"/>' +
          '<circle cx="62" cy="50" r="14" fill="rgba(255,255,255,.25)" stroke="#5B4636" stroke-width="3"/>' +
          '<path d="M52 50 L48 50" stroke="#5B4636" stroke-width="3"/>' +
          '<path d="M24 46 L16 42 M76 46 L84 42" stroke="#5B4636" stroke-width="3" stroke-linecap="round"/>' +
          '<path d="M30 42 Q38 36 46 42" stroke="rgba(255,255,255,.5)" stroke-width="2" fill="none"/>';
        break;
      case 'beret':
        body = '<path d="M26 56 Q26 28 50 28 Q74 28 74 56 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M22 56 Q50 66 78 56 L78 64 Q50 74 22 64 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M50 28 Q48 20 54 18" stroke="#5B4636" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
        break;
      case 'vest':
        body = '<path d="M36 26 L42 20 L50 34 L58 20 L64 26 L64 44 L60 48 L60 84 Q50 89 40 84 L40 48 L36 44 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M42 20 L50 34 L58 20"' + detail + '/>' +
          '<path d="M50 40 L50 84"' + detail + '/>' +
          '<circle cx="50" cy="52" r="1.8" fill="#5B4636"/><circle cx="50" cy="64" r="1.8" fill="#5B4636"/><circle cx="50" cy="76" r="1.8" fill="#5B4636"/>';
        break;
      case 'corset':
        body = '<path d="M34 30 Q34 22 40 22 L60 22 Q66 22 66 30 L64 52 L70 84 Q50 90 30 84 L36 52 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M40 32 L44 82 M50 24 L50 86 M60 32 L56 82"' + detail + '/>' +
          '<path d="M42 44 L58 52 M42 56 L58 64"' + white + '/>';
        break;
      case 'pleat':
        body = '<path d="M34 26 L66 26 L80 72 Q50 80 20 72 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M34 34 L66 34"' + detail + '/>' +
          '<path d="M40 36 L34 70 M50 36 L50 74 M60 36 L66 70"' + white + '/>';
        break;
      case 'slip':
        body = '<path d="M40 20 L46 16 Q50 22 54 16 L60 20 L58 42 L68 84 Q56 90 50 86 Q44 90 32 84 L42 42 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M44 18 Q42 10 36 8 M56 18 Q58 10 64 8"' + detail + '/>' +
          '<path d="M42 42 L58 42"' + detail + '/>' +
          '<path d="M46 58 Q54 62 60 58"' + white + '/>';
        break;
      case 'flat':
        body = '<path d="M16 62 Q24 52 42 54 L58 60 L82 66 Q88 70 84 78 L22 78 Q12 72 16 62 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M36 60 Q44 54 50 62 Q56 54 64 60"' + detail + '/>' +
          '<circle cx="50" cy="62" r="2" fill="#5B4636"/>' +
          '<path d="M28 68 L74 68"' + white + '/>';
        break;
      case 'sandal':
        body = '<path d="M18 66 Q30 58 48 62 L80 68 Q86 72 82 78 L24 78 Q14 74 18 66 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M32 64 L44 50 M44 64 L54 52 M56 66 L66 54"' + detail + '/>' +
          '<path d="M24 72 L82 72"' + white + '/>';
        break;
      case 'belt':
        body = '<path d="M28 32 Q50 22 72 32 L68 48 Q50 40 32 48 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M28 54 Q50 44 72 54 L68 70 Q50 62 32 70 Z" fill="' + fill + '"' + st + '/>' +
          '<rect x="44" y="40" width="12" height="18" rx="2"' + detail + '/>' +
          '<path d="M50 40 L50 58"' + detail + '/>';
        break;
      case 'hairclip':
        body = '<path d="M24 48 Q24 30 42 38 L50 50 L58 38 Q76 30 76 48 Q76 66 58 58 L50 50 L42 58 Q24 66 24 48 Z" fill="' + fill + '"' + st + '/>' +
          '<circle cx="50" cy="50" r="4" fill="rgba(255,255,255,.35)" stroke="#5B4636" stroke-width="2"/>' +
          '<path d="M30 44 Q36 40 42 44"' + white + '/>';
        break;
      case 'sunglasses':
        body = '<path d="M18 44 L44 40 L46 56 Q34 62 24 56 Z" fill="rgba(46,42,39,.82)"' + st + '/>' +
          '<path d="M56 40 L82 44 L76 56 Q66 62 54 56 Z" fill="rgba(46,42,39,.82)"' + st + '/>' +
          '<path d="M46 48 L54 48 M18 44 L10 40 M82 44 L90 40" stroke="#5B4636" stroke-width="2.4" stroke-linecap="round" fill="none"/>' +
          '<path d="M24 46 Q30 42 38 46" stroke="rgba(255,255,255,.4)" stroke-width="1.6" fill="none"/>';
        break;
      case 'tights':
        body = '<rect x="32" y="16" width="36" height="12" rx="4" fill="' + fill + '"' + st + '/>' +
          '<path d="M36 28 L48 28 L46 86 L36 86 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M52 28 L64 28 L64 86 L54 86 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M40 38 L42 78 M58 38 L58 78"' + white + '/>';
        break;
      case 'fishnet':
        body = '<rect x="32" y="16" width="36" height="12" rx="4" fill="' + fill + '" fill-opacity=".35"' + st + '/>' +
          '<path d="M36 28 L48 28 L46 86 L36 86 Z" fill="' + fill + '" fill-opacity=".18"' + st + '/>' +
          '<path d="M52 28 L64 28 L64 86 L54 86 Z" fill="' + fill + '" fill-opacity=".18"' + st + '/>' +
          '<path d="M38 34 L46 42 M38 44 L46 52 M38 54 L46 62 M38 64 L46 72 M38 74 L44 80 M56 34 L62 40 M56 44 L62 50 M56 54 L62 60 M56 64 L62 70 M56 74 L62 80" stroke="#5B4636" stroke-width="1.1" fill="none" opacity=".65"/>';
        break;
      case 'knee':
        body = '<path d="M34 24 L48 24 L46 70 L40 78 L34 70 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M52 24 L66 24 L66 70 L60 78 L54 70 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M34 30 L48 30 M52 30 L66 30"' + detail + '/>' +
          '<path d="M38 38 L44 44 M58 38 L64 44"' + white + '/>';
        break;
      case 'tube':
        body = '<path d="M32 30 Q32 24 38 24 L62 24 Q68 24 68 30 L66 84 Q50 89 34 84 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M36 34 Q50 40 64 34"' + detail + '/>' +
          '<path d="M40 52 L60 52"' + white + '/>';
        break;
      case 'turtle':
        body = '<rect x="40" y="12" width="20" height="16" rx="4" fill="' + fill + '"' + st + '/>' +
          '<path d="M32 28 L42 22 Q50 30 58 22 L68 28 L80 42 L68 48 L66 84 Q50 89 34 84 L32 48 L20 42 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M42 22 Q50 30 58 22"' + detail + '/>' +
          '<path d="M40 46 L60 46"' + white + '/>';
        break;
      case 'tier':
        body = '<path d="M34 22 L66 22 L74 44 Q50 52 26 44 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M30 46 Q50 54 70 46 L78 66 Q50 76 22 66 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M26 68 Q50 78 74 68 L80 86 Q50 96 20 86 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M34 30 L66 30 M28 54 L72 54 M24 76 L76 76"' + detail + '/>';
        break;
      case 'backpack':
        body = '<path d="M28 38 Q28 20 50 20 Q72 20 72 38 L74 82 Q50 88 26 82 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M38 20 Q38 12 50 12 Q62 12 62 20"' + detail + '/>' +
          '<path d="M36 44 L64 44 L64 66 L36 66 Z" fill="rgba(255,255,255,.2)" stroke="#5B4636" stroke-width="2" stroke-linejoin="round"/>' +
          '<path d="M32 40 Q20 50 22 70 M68 40 Q80 50 78 70"' + detail + '/>';
        break;
      case 'clutch':
        body = '<path d="M22 40 Q50 34 78 40 L80 76 Q50 84 20 76 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M22 44 L80 44"' + detail + '/>' +
          '<circle cx="50" cy="52" r="3" fill="#E3B23C" stroke="#5B4636" stroke-width="1.2"/>';
        break;
      case 'necklace':
        if (variant === 'choker') {
          body = '<path d="M28 40 Q50 50 72 40" fill="none" stroke="' + fill + '" stroke-width="7" stroke-linecap="round"/>' +
            '<path d="M28 40 Q50 50 72 40" fill="none" stroke="#5B4636" stroke-width="1.6" stroke-linecap="round"/>' +
            '<circle cx="50" cy="50" r="3" fill="' + fill + '" stroke="#5B4636" stroke-width="1"/>';
        } else if (variant === 'pendant') {
          body = '<path d="M26 38 Q28 68 50 76 Q72 68 74 38" fill="none" stroke="' + fill + '" stroke-width="2.2"/>' +
            '<path d="M50 76 Q43 68 50 62 Q57 68 50 76 Z" fill="' + fill + '" stroke="#5B4636" stroke-width="1.3"/>';
        } else if (variant === 'collar') {
          body = '<path d="M26 38 Q28 66 50 72 Q72 66 74 38" fill="none" stroke="' + fill + '" stroke-width="4"/>' +
            '<circle cx="32" cy="50" r="2.6" fill="#FFFDF8" stroke="#5B4636" stroke-width=".8"/>' +
            '<circle cx="40" cy="61" r="2.6" fill="#FFFDF8" stroke="#5B4636" stroke-width=".8"/>' +
            '<circle cx="50" cy="66" r="2.6" fill="#FFFDF8" stroke="#5B4636" stroke-width=".8"/>' +
            '<circle cx="60" cy="61" r="2.6" fill="#FFFDF8" stroke="#5B4636" stroke-width=".8"/>' +
            '<circle cx="68" cy="50" r="2.6" fill="#FFFDF8" stroke="#5B4636" stroke-width=".8"/>';
        } else {
          body = '<path d="M26 38 Q28 68 50 76 Q72 68 74 38" fill="none" stroke="' + fill + '" stroke-width="2.2"/>' +
            '<circle cx="50" cy="76" r="3" fill="' + fill + '" stroke="#5B4636" stroke-width="1"/>';
        }
        break;
      case 'earrings':
        if (variant === 'hoop') {
          body = '<circle cx="34" cy="50" r="12" fill="none" stroke="' + fill + '" stroke-width="3"/>' +
            '<circle cx="66" cy="50" r="12" fill="none" stroke="' + fill + '" stroke-width="3"/>';
        } else if (variant === 'drop') {
          body = '<path d="M34 30 L34 48 M66 30 L66 48" stroke="#5B4636" stroke-width="1.6"/>' +
            '<path d="M34 48 Q28 58 34 64 Q40 58 34 48 Z" fill="' + fill + '" stroke="#5B4636" stroke-width="1.2"/>' +
            '<path d="M66 48 Q60 58 66 64 Q72 58 66 48 Z" fill="' + fill + '" stroke="#5B4636" stroke-width="1.2"/>';
        } else if (variant === 'cuff') {
          body = '<path d="M24 44 Q34 36 42 46" fill="none" stroke="' + fill + '" stroke-width="3.5" stroke-linecap="round"/>' +
            '<path d="M58 46 Q66 36 76 44" fill="none" stroke="' + fill + '" stroke-width="3.5" stroke-linecap="round"/>';
        } else {
          body = '<circle cx="34" cy="50" r="4" fill="' + fill + '" stroke="#5B4636" stroke-width="1.2"/>' +
            '<circle cx="66" cy="50" r="4" fill="' + fill + '" stroke="#5B4636" stroke-width="1.2"/>';
        }
        break;
      case 'hair':
        if (variant === 'scrunchie') {
          body = '<circle cx="50" cy="50" r="18" fill="' + fill + '"' + st + '/>' +
            '<circle cx="50" cy="50" r="10" fill="rgba(255,255,255,.25)" stroke="#5B4636" stroke-width="2"/>' +
            '<path d="M34 42 Q40 34 50 36 M66 42 Q60 34 50 36 M34 58 Q40 66 50 64 M66 58 Q60 66 50 64"' + detail + '/>';
        } else if (variant === 'claw') {
          body = '<path d="M24 42 Q50 30 76 42 L74 56 Q50 48 26 56 Z" fill="' + fill + '"' + st + '/>' +
            '<path d="M30 42 L32 56 M40 38 L41 54 M50 36 L50 53 M60 38 L59 54 M70 42 L68 56"' + detail + '/>';
        } else if (variant === 'headband') {
          body = '<path d="M22 62 Q22 24 50 24 Q78 24 78 62" fill="none" stroke="' + fill + '" stroke-width="7" stroke-linecap="round"/>' +
            '<path d="M22 62 Q22 24 50 24 Q78 24 78 62" fill="none" stroke="#5B4636" stroke-width="1.4" stroke-linecap="round"/>';
        } else if (variant === 'pin') {
          body = '<rect x="26" y="46" width="48" height="4" rx="2" fill="' + fill + '" stroke="#5B4636" stroke-width="1.2"/>' +
            '<rect x="26" y="54" width="48" height="4" rx="2" fill="' + fill + '" stroke="#5B4636" stroke-width="1.2"/>';
        } else {
          body = '<path d="M24 48 Q24 30 42 38 L50 50 L58 38 Q76 30 76 48 Q76 66 58 58 L50 50 L42 58 Q24 66 24 48 Z" fill="' + fill + '"' + st + '/>' +
            '<circle cx="50" cy="50" r="4" fill="rgba(255,255,255,.35)" stroke="#5B4636" stroke-width="2"/>';
        }
        break;
      case 'wrist':
        if (variant === 'watch') {
          body = '<rect x="38" y="28" width="24" height="44" rx="8" fill="' + fill + '"' + st + '/>' +
            '<circle cx="50" cy="50" r="11" fill="#FFFDF8" stroke="#5B4636" stroke-width="2"/>' +
            '<path d="M50 44 L50 50 L55 53" stroke="#5B4636" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
        } else if (variant === 'beads') {
          body = '<path d="M26 56 Q50 30 74 56" fill="none" stroke="#5B4636" stroke-width="1.2"/>' +
            '<circle cx="30" cy="52" r="3" fill="' + fill + '" stroke="#5B4636" stroke-width=".8"/>' +
            '<circle cx="40" cy="42" r="3" fill="' + fill + '" stroke="#5B4636" stroke-width=".8"/>' +
            '<circle cx="50" cy="38" r="3" fill="' + fill + '" stroke="#5B4636" stroke-width=".8"/>' +
            '<circle cx="60" cy="42" r="3" fill="' + fill + '" stroke="#5B4636" stroke-width=".8"/>' +
            '<circle cx="70" cy="52" r="3" fill="' + fill + '" stroke="#5B4636" stroke-width=".8"/>';
        } else if (variant === 'ring') {
          body = '<circle cx="38" cy="54" r="12" fill="none" stroke="' + fill + '" stroke-width="3"/>' +
            '<circle cx="62" cy="54" r="12" fill="none" stroke="' + fill + '" stroke-width="3"/>';
        } else {
          body = '<ellipse cx="50" cy="50" rx="20" ry="14" fill="none" stroke="' + fill + '" stroke-width="4"/>' +
            '<ellipse cx="50" cy="50" rx="14" ry="9" fill="none" stroke="#5B4636" stroke-width="1.2"/>';
        }
        break;
      case 'chainbelt':
        body = '<path d="M22 50 Q50 38 78 50" fill="none" stroke="' + fill + '" stroke-width="4"/>' +
          '<circle cx="28" cy="47" r="4" fill="none" stroke="#5B4636" stroke-width="1.4"/>' +
          '<circle cx="40" cy="42" r="4" fill="none" stroke="#5B4636" stroke-width="1.4"/>' +
          '<circle cx="50" cy="40" r="4" fill="none" stroke="#5B4636" stroke-width="1.4"/>' +
          '<circle cx="60" cy="42" r="4" fill="none" stroke="#5B4636" stroke-width="1.4"/>' +
          '<circle cx="72" cy="47" r="4" fill="none" stroke="#5B4636" stroke-width="1.4"/>';
        break;
      case 'brooch':
        body = '<circle cx="50" cy="50" r="16" fill="' + fill + '"' + st + '/>' +
          '<circle cx="50" cy="50" r="8" fill="rgba(255,255,255,.35)" stroke="#5B4636" stroke-width="1.6"/>' +
          '<path d="M50 34 L50 66 M34 50 L66 50 M39 39 L61 61 M61 39 L39 61"' + detail + '/>';
        break;
      case 'ankle':
        body = '<path d="M34 40 L48 40 L46 70 L40 76 L34 70 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M52 40 L66 40 L66 70 L60 76 L54 70 Z" fill="' + fill + '"' + st + '/>' +
          '<path d="M34 46 L48 46 M52 46 L66 46"' + detail + '/>';
        break;
      default:
        body = '<rect x="26" y="26" width="48" height="48" rx="8" fill="' + fill + '"' + st + '/>';
    }

    return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<ellipse cx="50" cy="89" rx="26" ry="4" fill="rgba(91,70,54,.12)"/>' +
      body +
      '</svg>';
  }

  function miniItem(id) {
    var item = itemById(id);
    if (!item) { return ''; }
    return '<span class="mini-item" title="' + esc(item.name) + '">' + itemSvg(item) + '</span>';
  }

  /* ---------------- 人物头像 SVG ---------------- */

  function avatarSvg(customer) {
    var p = customer.portrait || {};
    if (p.image) {
      return '<img src="' + esc(p.image) + '" alt="' + esc(customer.name) + '" style="width:100%;height:100%;object-fit:cover;display:block">';
    }
    var skin = p.skin || '#F2D3B8';
    var hair = p.hair || '#2E2A27';
    var top = p.top || '#E8E2D6';
    var st = ' stroke="#5B4636" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';
    var hairBack = '';
    var hairFront = '';

    if (p.hairStyle === 'long') {
      hairBack = '<path d="M24 44 Q24 14 50 14 Q76 14 76 44 L78 86 Q68 90 64 78 L64 42 Q50 26 36 42 L36 78 Q32 90 22 86 Z" fill="' + hair + '"' + st + '/>';
      hairFront = '<path d="M28 44 Q28 18 50 18 Q72 18 72 44 L71 52 Q64 48 64 39 Q50 28 36 39 Q36 48 29 52 Z" fill="' + hair + '"' + st + '/>';
    } else if (p.hairStyle === 'wavy') {
      hairBack = '<path d="M22 44 Q22 12 50 12 Q78 12 78 44 L82 88 Q72 94 66 82 Q70 68 64 56 Q64 40 50 26 Q36 40 36 56 Q30 68 34 82 Q28 94 18 88 Z" fill="' + hair + '"' + st + '/>';
      hairFront = '<path d="M27 45 Q26 16 50 16 Q74 16 73 45 L72 53 Q64 48 64 38 Q50 27 37 38 Q36 48 28 53 Z" fill="' + hair + '"' + st + '/>';
    } else if (p.hairStyle === 'ponytail') {
      hairBack = '<path d="M26 46 Q26 16 50 16 Q74 16 74 46 L74 64 Q66 60 66 46 Q50 30 34 46 Q34 60 26 64 Z" fill="' + hair + '"' + st + '/>' +
        '<path d="M70 28 Q88 34 85 58 Q83 76 72 88 Q74 66 68 48 Q66 36 62 30 Z" fill="' + hair + '"' + st + '/>';
      hairFront = '<path d="M28 44 Q28 18 50 18 Q72 18 72 44 L71 51 Q64 47 64 39 Q50 28 36 39 Q36 47 29 51 Z" fill="' + hair + '"' + st + '/>';
    } else if (p.hairStyle === 'braid') {
      hairBack = '<path d="M24 44 Q24 14 50 14 Q76 14 76 44 L77 84 Q70 88 66 78 L64 42 Q50 26 36 42 L36 78 Q30 88 23 84 Z" fill="' + hair + '"' + st + '/>' +
        '<path d="M68 58 Q82 62 78 80 Q76 91 66 94 Q72 82 68 72 Q65 64 64 60 Z" fill="' + hair + '"' + st + '/>' +
        '<path d="M72 68 L78 72 M71 76 L78 80 M69 84 L75 87" stroke="rgba(255,255,255,.28)" stroke-width="1.6" fill="none"/>';
      hairFront = '<path d="M28 44 Q28 18 50 18 Q72 18 72 44 L71 51 Q64 47 64 39 Q50 28 36 39 Q36 47 29 51 Z" fill="' + hair + '"' + st + '/>';
    } else if (p.hairStyle === 'pixie') {
      hairBack = '';
      hairFront = '<path d="M28 45 Q26 18 50 18 Q73 18 72 44 L70 49 Q61 42 57 34 Q45 29 36 37 Q33 46 28 49 Z" fill="' + hair + '"' + st + '/>';
    } else if (p.hairStyle === 'bob') {
      hairBack = '<path d="M25 46 Q25 16 50 16 Q75 16 75 46 L75 62 Q68 58 67 46 Q50 30 33 46 Q32 58 25 62 Z" fill="' + hair + '"' + st + '/>';
      hairFront = '<path d="M28 44 Q28 18 50 18 Q72 18 72 44 L71 51 Q64 47 64 39 Q50 28 36 39 Q36 47 29 51 Z" fill="' + hair + '"' + st + '/>';
    } else if (p.hairStyle === 'bun') {
      hairBack = '<circle cx="50" cy="14" r="10" fill="' + hair + '"' + st + '/>';
      hairFront = '<path d="M28 45 Q28 18 50 18 Q72 18 72 45 L71 51 Q64 47 64 39 Q50 28 36 39 Q36 47 29 51 Z" fill="' + hair + '"' + st + '/>';
    } else {
      hairBack = '';
      hairFront = '<path d="M28 44 Q28 17 50 17 Q72 17 72 44 L72 48 Q64 46 63 38 Q50 28 37 38 Q36 46 28 48 Z" fill="' + hair + '"' + st + '/>';
    }

    var eyes = '';
    var brows = '';
    var mouth = '';
    if (p.expression === 'happy') {
      eyes = '<path d="M38 46 Q42 42 46 46" fill="none" stroke="#3F332B" stroke-width="2.5" stroke-linecap="round"/>' +
        '<path d="M54 46 Q58 42 62 46" fill="none" stroke="#3F332B" stroke-width="2.5" stroke-linecap="round"/>';
      mouth = '<path d="M43 54 Q50 63 57 54" fill="#7A4A3A" stroke="#5B4636" stroke-width="1.5" stroke-linejoin="round"/>';
    } else if (p.expression === 'hesitant') {
      eyes = '<ellipse cx="42" cy="46" rx="2.2" ry="3.2" fill="#3F332B"/><ellipse cx="58" cy="46" rx="2.2" ry="3.2" fill="#3F332B"/>';
      brows = '<path d="M37 39 L46 41 M54 41 L63 39" stroke="#3F332B" stroke-width="2" stroke-linecap="round" fill="none"/>';
      mouth = '<path d="M45 56 L55 56" stroke="#7A4A3A" stroke-width="2" stroke-linecap="round" fill="none"/>';
    } else {
      eyes = '<ellipse cx="42" cy="46" rx="2.5" ry="3.5" fill="#3F332B"/><ellipse cx="58" cy="46" rx="2.5" ry="3.5" fill="#3F332B"/>';
      mouth = '<path d="M45 55 Q50 59 55 55" fill="none" stroke="#7A4A3A" stroke-width="2" stroke-linecap="round"/>';
    }

    var accessory = '';
    if (p.accessory === 'glasses') {
      accessory = '<circle cx="42" cy="46" r="7" fill="none" stroke="#5B4636" stroke-width="1.8"/>' +
        '<circle cx="58" cy="46" r="7" fill="none" stroke="#5B4636" stroke-width="1.8"/>' +
        '<path d="M49 46 L51 46" stroke="#5B4636" stroke-width="1.8"/>';
    } else if (p.accessory === 'earrings') {
      accessory = '<circle cx="27" cy="57" r="2.5" fill="#E3B23C" stroke="#5B4636" stroke-width="1"/>' +
        '<circle cx="73" cy="57" r="2.5" fill="#E3B23C" stroke="#5B4636" stroke-width="1"/>';
    } else if (p.accessory === 'pearl') {
      accessory = '<path d="M38 72 Q50 80 62 72" fill="none" stroke="#5B4636" stroke-width="1.5"/>' +
        '<circle cx="44" cy="75" r="2.2" fill="#FFFDF8" stroke="#5B4636" stroke-width="1"/>' +
        '<circle cx="50" cy="77" r="2.2" fill="#FFFDF8" stroke="#5B4636" stroke-width="1"/>' +
        '<circle cx="56" cy="75" r="2.2" fill="#FFFDF8" stroke="#5B4636" stroke-width="1"/>';
    }

    return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<rect width="100" height="100" fill="#F1E3D3"/>' +
      '<circle cx="50" cy="50" r="48" fill="#F7EBDD"/>' +
      hairBack +
      '<path d="M18 100 Q22 78 38 74 L62 74 Q78 78 82 100 Z" fill="' + top + '"' + st + '/>' +
      '<path d="M40 74 Q50 82 60 74" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2" stroke-linecap="round"/>' +
      '<rect x="45" y="60" width="10" height="14" rx="4" fill="' + skin + '"' + st + '/>' +
      '<ellipse cx="50" cy="44" rx="21" ry="24" fill="' + skin + '"' + st + '/>' +
      '<circle cx="28" cy="47" r="4" fill="' + skin + '"' + st + '/>' +
      '<circle cx="72" cy="47" r="4" fill="' + skin + '"' + st + '/>' +
      hairFront +
      brows + eyes + mouth +
      '<circle cx="34" cy="55" r="4" fill="#D99A9A" opacity=".38"/>' +
      '<circle cx="66" cy="55" r="4" fill="#D99A9A" opacity=".38"/>' +
      accessory +
      '</svg>';
  }

  /* ---------------- 店铺场景 SVG ---------------- */

  function storeSvg(state) {
    var day = state && state.day ? state.day : 1;
    var cfg = D.DAYS[Math.max(0, Math.min(D.DAYS.length - 1, day - 1))] || D.DAYS[0];
    var weather = D.WEATHER[cfg.weather] || D.WEATHER.sunny;
    var inv = [];

    if (state && state.inventory) {
      var map = state.inventory.shelf || state.inventory;
      Object.keys(map).forEach(function (id) {
        if (map[id] && map[id].qty > 0 && D.ITEMS_BY_ID[id]) {
          inv.push(D.ITEMS_BY_ID[id]);
        }
      });
    }
    if (!inv.length) {
      inv = D.STARTING_INVENTORY.slice(0, 3).map(function (id) { return D.ITEMS_BY_ID[id]; });
    }
    var c1 = D.COLOR_HEX[inv[0].color] || '#D99A9A';
    var c2 = inv[1] ? (D.COLOR_HEX[inv[1].color] || '#8A9A7B') : '#8A9A7B';
    var c3 = inv[2] ? (D.COLOR_HEX[inv[2].color] || '#E3B23C') : '#E3B23C';

    var sky = '#CFE3E8';
    var sun = '<circle cx="58" cy="52" r="11" fill="#E3B23C"/>';
    var cloud = '<path d="M38 58 Q38 48 48 48 Q52 40 62 44 Q72 44 72 54 Q82 54 82 62 L38 62 Q30 62 32 56 Q33 58 38 58 Z" fill="#FFFDF8" opacity=".9"/>';
    var rain = '<path d="M40 50 L36 66 M52 50 L48 66 M64 50 L60 66" stroke="#6B7F95" stroke-width="3" stroke-linecap="round"/>';
    var weatherArt = '';
    if (weather.id === 'rain') {
      weatherArt = cloud + rain;
    } else if (weather.id === 'cloudy') {
      weatherArt = cloud;
    } else if (weather.id === 'cold') {
      weatherArt = '<path d="M50 42 L50 62 M40 52 L60 52 M43 45 L57 59 M57 45 L43 59" stroke="#8FB6C8" stroke-width="3" stroke-linecap="round"/>';
    } else {
      weatherArt = sun + '<circle cx="72" cy="40" r="3" fill="#E3B23C"/><circle cx="80" cy="48" r="2" fill="#E3B23C"/>';
    }

    var bunting = '<path d="M0 16 Q90 32 180 16 Q270 0 360 16" fill="none" stroke="#5B4636" stroke-width="2"/>' +
      '<path d="M30 21 L38 21 L34 30 Z" fill="#C97B63"/><path d="M76 26 L84 26 L80 35 Z" fill="#8A9A7B"/>' +
      '<path d="M124 27 L132 27 L128 36 Z" fill="#E3B23C"/><path d="M238 22 L246 22 L242 31 Z" fill="#D99A9A"/>' +
      '<path d="M290 18 L298 18 L294 27 Z" fill="#6B7F95"/>';

    var rack = '<rect x="126" y="72" width="4" height="74" rx="2" fill="#6B4F3A"/>' +
      '<rect x="218" y="72" width="4" height="74" rx="2" fill="#6B4F3A"/>' +
      '<rect x="126" y="72" width="96" height="4" rx="2" fill="#6B4F3A"/>' +
      '<path d="M146 76 L146 84 Q146 90 152 90" fill="none" stroke="#5B4636" stroke-width="2"/>' +
      '<path d="M174 76 L174 84 Q174 90 180 90" fill="none" stroke="#5B4636" stroke-width="2"/>' +
      '<path d="M202 76 L202 84 Q202 90 208 90" fill="none" stroke="#5B4636" stroke-width="2"/>' +
      '<path d="M140 88 L158 88 L156 124 Q150 128 144 124 Z" fill="' + c1 + '" stroke="#5B4636" stroke-width="2"/>' +
      '<path d="M168 88 L186 88 L184 124 Q178 128 172 124 Z" fill="' + c2 + '" stroke="#5B4636" stroke-width="2"/>' +
      '<path d="M196 88 L214 88 L212 124 Q206 128 200 124 Z" fill="' + c3 + '" stroke="#5B4636" stroke-width="2"/>';

    var mirror = '<ellipse cx="278" cy="92" rx="25" ry="34" fill="#DCEBEF" stroke="#5B4636" stroke-width="3"/>' +
      '<path d="M266 72 Q282 66 290 78" fill="none" stroke="#FFFDF8" stroke-width="4" stroke-linecap="round"/>' +
      '<rect x="274" y="124" width="8" height="18" rx="3" fill="#6B4F3A"/>';

    var counter = '<rect x="238" y="144" width="110" height="10" rx="3" fill="#6B4F3A" stroke="#5B4636" stroke-width="2"/>' +
      '<rect x="244" y="154" width="98" height="40" rx="4" fill="#C9A57E" stroke="#5B4636" stroke-width="2"/>' +
      '<rect x="252" y="162" width="30" height="24" rx="3" fill="#FFF9EF" stroke="#5B4636" stroke-width="2"/>' +
      '<circle cx="267" cy="174" r="6" fill="#E3B23C" stroke="#5B4636" stroke-width="1.5"/>' +
      '<rect x="296" y="160" width="34" height="12" rx="3" fill="#8A9A7B" stroke="#5B4636" stroke-width="2"/>';

    var plant = '<path d="M34 178 L66 178 L62 206 L38 206 Z" fill="#C97B63" stroke="#5B4636" stroke-width="2"/>' +
      '<path d="M50 178 Q50 150 36 144 Q50 146 54 166 Q58 142 72 138 Q62 154 58 178" fill="#8A9A7B" stroke="#5B4636" stroke-width="2"/>';

    var cat = '<ellipse cx="126" cy="198" rx="24" ry="10" fill="#E3B23C" stroke="#5B4636" stroke-width="2"/>' +
      '<circle cx="106" cy="193" r="9" fill="#E3B23C" stroke="#5B4636" stroke-width="2"/>' +
      '<path d="M99 187 L102 180 L106 187 M111 187 L115 180 L118 187" fill="#E3B23C" stroke="#5B4636" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<path d="M147 198 Q158 196 154 188" fill="none" stroke="#5B4636" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M102 194 L104 194 M109 194 L111 194" stroke="#5B4636" stroke-width="1.5" stroke-linecap="round"/>';

    var rug = '<ellipse cx="126" cy="204" rx="58" ry="9" fill="#C97B63" opacity=".22"/>';

    return '<div class="store-scene">' +
      '<svg viewBox="0 0 360 220" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<rect width="360" height="220" fill="#F1E3D3"/>' +
      '<rect y="152" width="360" height="68" fill="#D8B89B"/>' +
      '<path d="M0 170 L360 170 M0 190 L360 190 M0 210 L360 210" stroke="#C9A57E" stroke-width="1.5" opacity=".55"/>' +
      '<path d="M120 0 L120 152 M240 0 L240 152" stroke="#E4D3BE" stroke-width="2"/>' +
      '<rect x="18" y="28" width="104" height="86" rx="5" fill="' + sky + '" stroke="#5B4636" stroke-width="3"/>' +
      '<path d="M18 86 L122 86" stroke="#5B4636" stroke-width="2"/>' +
      '<rect x="14" y="114" width="112" height="7" rx="3" fill="#6B4F3A"/>' +
      weatherArt +
      '<rect x="138" y="20" width="104" height="30" rx="5" fill="#FFF9EF" stroke="#5B4636" stroke-width="2.5"/>' +
      bunting +
      rack +
      mirror +
      counter +
      plant +
      rug +
      cat +
      '</svg>' +
      '<div class="store-sign">' + esc(state && state.shopName ? state.shopName : '衣间小日子') + '</div>' +
      '<div class="store-weather">' + esc(weather.icon + ' ' + weather.name) + '</div>' +
      '</div>';
  }

  /* ---------------- 通用片段 ---------------- */

  function header(s, title) {
    if (!s) {
      return '<div class="topbar"><div class="brand-mini">衣间小日子</div>' +
        '<div class="pill-row"><span class="pill">7 天开店</span></div></div>';
    }
    return '<div class="topbar">' +
      '<div class="brand-mini">' + esc(title || '衣间小日子') + '</div>' +
      '<div class="pill-row">' +
      '<button type="button" class="pill wardrobe-pill" data-action="open-wardrobe">衣橱 ' + E.getInventoryCount() + '</button>' +
      '<span class="pill season-pill">' + esc(E.getSeason(s.day).name) + ' ' + E.getDayInSeason(s.day) + '/' + s.maxDay + '</span>' +
      '<span class="pill cash">' + money(s.cash) + '</span>' +
      '<span class="pill rep">口碑 ' + s.reputation + '</span>' +
      '</div></div>';
  }

  function progressDots(s) {
    var total = s.customersToday.length || 0;
    var out = '<div class="progress-dots">';
    for (var i = 0; i < total; i++) {
      var cls = i < s.customerIndex ? 'done' : i === s.customerIndex ? 'active' : '';
      out += '<span class="dot ' + cls + '"></span>';
    }
    out += '</div>';
    return out;
  }

  function queueStatusLabel(rec) {
    if (rec.status === 'serving') { return '你接待中'; }
    if (rec.status === 'staff' || rec.status === 'staffFitting') {
      return (rec.staffName || '店员') + '接待' + (rec.status === 'staffFitting' ? ' · 试衣' : '');
    }
    if (rec.status === 'fitting') { return '换装中'; }
    if (rec.status === 'fittingWait') { return '等试衣间'; }
    if (rec.status === 'waiting') { return '等位 · ♥' + Math.max(0, rec.patience || 0); }
    if (rec.status === 'left') { return rec.leaveReason === 'crowd' ? '没进店' : '等太久走了'; }
    return '已完成';
  }

  function queueStrip(s) {
    var list = E.getQueue();
    if (!list.length) { return ''; }
    var q = E.getQueueSummary();
    var mine = q.serving + q.fitting + q.fittingWait;
    var html = '<div class="queue-strip">' +
      '<div class="queue-strip-head"><strong>店内 ' + q.onFloor + ' 位</strong>' +
      '<span>你 ' + mine + ' · 店员 ' + q.staff + ' · 等位 ' + q.waiting + '</span></div>' +
      '<div class="queue-chips">';
    list.forEach(function (r) {
      if (r.status === 'done') { return; }
      var c = r.customer;
      if (!c) { return; }
      var cls = 'queue-chip ' + r.status;
      html += '<span class="' + cls + '">' +
        '<span class="queue-avatar">' + avatarSvg(c) + '</span>' +
        '<span class="queue-chip-text"><b>' + esc(c.name) + '</b><i>' + esc(queueStatusLabel(r)) + '</i></span>' +
        '</span>';
    });
    html += '</div>';
    var logs = E.getStaffLog().filter(function (l) {
      return l.type === 'staffSale' || l.type === 'staffLeave' || l.type === 'queueLeft';
    }).slice(-2);
    if (logs.length) {
      html += '<div class="queue-log">' + logs.map(function (l) {
        if (l.type === 'staffSale') {
          return esc((l.staffName || '店员') + '接待 ' + l.customerName + ' · 成交 ' + (l.score || '') + ' 分 / ¥' + (l.revenue || 0));
        }
        if (l.type === 'staffLeave') {
          return esc((l.staffName || '店员') + '接待 ' + l.customerName + ' · 没成交');
        }
        return esc(l.customerName + ' 等太久走了');
      }).join(' · ') + '</div>';
    }
    return html + '</div>';
  }

  function poseButtonsHtml(s) {
    var cur = s.previewPose || 'stand';
    var poses = [['stand', '自然'], ['hip', '叉腰'], ['twirl', '转身'], ['mirror', '照镜子']];
    return '<div class="pose-row"><span class="pose-label">试穿姿势</span>' +
      poses.map(function (p) {
        return '<button type="button" class="pose-btn' + (cur === p[0] ? ' active' : '') +
          '" data-action="set-pose" data-id="' + p[0] + '">' + p[1] + '</button>';
      }).join('') + '</div>';
  }

  function staffLogHtml() {
    var logs = E.getStaffLog().filter(function (l) {
      return l.type === 'staffSale' || l.type === 'staffLeave';
    }).slice(-3);
    if (!logs.length) { return ''; }
    return '<div class="staff-log"><div class="staff-log-title">店员接待记录</div>' +
      logs.map(function (l) {
        return '<div class="staff-log-row"><span>' + esc((l.staffName || '店员') + ' · ' + l.customerName) + '</span>' +
          '<strong>' + esc(l.type === 'staffSale' ? ('成交 ¥' + (l.revenue || 0)) : '未成交') + '</strong></div>';
      }).join('') + '</div>';
  }

  function affinityBar(s) {
    var v = Math.max(0, Math.min(100, s.affinity || 0));
    return '<div class="affinity-row">' +
      '<span class="affinity-label">好感</span>' +
      '<div class="affinity-bar"><i style="width:' + v + '%"></i></div>' +
      '<strong class="affinity-value">' + esc(E.getAffinityLabel(v)) + '</strong>' +
      '</div>';
  }

  function patienceHearts(s) {
    var max = Math.max(1, s.patience || 2);
    var left = E.getPatienceLeft();
    var out = '<span class="patience-row"><span class="affinity-label">耐心</span><span class="hearts">';
    for (var i = 0; i < max; i++) {
      out += '<span class="heart' + (i < left ? ' full' : '') + '">♥</span>';
    }
    out += '</span><span class="small muted">还能试 ' + left + ' 次</span></span>';
    return out;
  }

  function revealChips(s, c) {
    if (!s.revealed || !s.revealed.length) { return ''; }
    var html = '<div class="reveal-box"><div class="reveal-title">你套出来的信息</div><div class="chips">';
    s.revealed.forEach(function (key) {
      if (key === 'avoid') {
        html += '<span class="tag warn">避雷 · ' + styleLabels(c.avoid).join(' / ') + '</span>';
      } else if (key === 'budget') {
        html += '<span class="tag gold">预算底线 · ' + money(c.budget) + '</span>';
      } else if (key === 'body') {
        html += '<span class="tag">身材诉求 · ' + esc(c.bodyLabel) + '</span>';
      } else if (key === 'style') {
        html += '<span class="tag sage">想要的感觉 · ' + esc(c.request) + '</span>';
      }
    });
    html += '</div></div>';
    return html;
  }

  function extraStatus(ok) {
    return '<span class="extra-status ' + (ok ? 'ok' : 'miss') + '">' + (ok ? '✓' : '✗') + '</span>';
  }

  function wishCard(s, c) {
    var w = E.getWish(c);
    var ch = E.getChallenge(c);
    var challenge = '<div class="wish-challenge">◎ 今日挑战 · ' + esc(ch.label) + '：' + esc(ch.desc) + '</div>';
    if (!s.wishRevealed) {
      return '<div class="wish-card locked">' +
        '<div class="wish-title">✦ 她还有话没说</div>' +
        '<div class="wish-desc">倒杯温水，或把好感聊到 65，她会告诉你。</div>' +
        challenge +
        '</div>';
    }
    return '<div class="wish-card">' +
      '<div class="wish-title">✦ 她的心愿：' + esc(w.label) + '</div>' +
      '<div class="wish-desc">' + esc(w.desc) + '</div>' +
      challenge +
      '</div>';
  }

  function extrasCard(s, c) {
    var ex = E.evaluateExtras(c, s.selectedItems);
    var w = E.getWish(c);
    var ch = E.getChallenge(c);
    var wishStatus = s.wishRevealed ? extraStatus(ex.wish.done) : '<span class="extra-status locked">待揭晓</span>';
    return '<div class="extra-card">' +
      '<div class="extra-row">' +
      '<span class="extra-label">✦ ' + esc(w.label) + '</span>' +
      '<span class="extra-desc">' + (s.wishRevealed ? esc(w.desc) : '聊聊天 / 倒杯水，她才会说') + '</span>' +
      wishStatus +
      '</div>' +
      '<div class="extra-row">' +
      '<span class="extra-label">◎ ' + esc(ch.label) + '</span>' +
      '<span class="extra-desc">' + esc(ch.desc) + '</span>' +
      extraStatus(ex.challenge.done) +
      '</div>' +
      '<div class="extra-foot">完成可得：心愿 +¥80 · 挑战 +¥60</div>' +
      '<button type="button" class="btn small mt6" data-action="try-outfit">就这套，进试衣间</button>' +
      '</div>';
  }

  function optionExtras(ex) {
    var wish = ex.wish.revealed
      ? (ex.wish.done ? '心愿 ✓' : '心愿 ✗')
      : '心愿 ?';
    return '<div class="option-extras">' +
      '<span class="extra-pill ' + (ex.wish.revealed ? (ex.wish.done ? 'ok' : 'miss') : 'locked') + '">' + wish + '</span>' +
      '<span class="extra-pill ' + (ex.challenge.done ? 'ok' : 'miss') + '">挑战 ' + (ex.challenge.done ? '✓' : '✗') + '</span>' +
      '</div>';
  }

  function resultExtras(pr) {
    var ex = pr.extras;
    if (!ex) { return ''; }
    return '<div class="card extra-card">' +
      '<div class="section-head"><h3>心愿与挑战</h3><span class="small">' +
      (pr.sale && pr.sale.extraTip ? '已计入小费' : (pr.sale ? '本次未结算小费' : '没成交，但她记住了')) + '</span></div>' +
      '<div class="extra-row">' +
      '<span class="extra-label">✦ ' + esc(ex.wish.label) + '</span>' +
      '<span class="extra-desc">' + esc(ex.wish.desc) + '</span>' +
      extraStatus(ex.wish.done) +
      '</div>' +
      '<div class="extra-row">' +
      '<span class="extra-label">◎ ' + esc(ex.challenge.label) + '</span>' +
      '<span class="extra-desc">' + esc(ex.challenge.desc) + '</span>' +
      extraStatus(ex.challenge.done) +
      '</div>' +
      (pr.sale && pr.sale.extraTip ? '<div class="extra-foot">心愿 / 挑战小费 +' + money(pr.sale.extraTip) + '</div>' : '') +
      (ex.tip && !pr.sale ? '<div class="extra-foot">成交时这份用心会变成小费</div>' : '') +
      '</div>';
  }

  function customerMiniBar(s, c) {
    return '<div class="customer-mini">' +
      '<div class="avatar tiny-avatar">' + avatarSvg(c) + '</div>' +
      '<div class="customer-mini-info">' +
      '<div class="customer-name">' + esc(c.name) + '<span class="small muted"> · ' + esc(c.occasion) + '</span></div>' +
      '<div class="small muted">' + esc(c.job) + ' · 预算 ' + money(c.budget) + '</div>' +
      '</div>' +
      '<div class="customer-mini-tags">' + styleTags(c.styles.slice(0, 2)) + '</div>' +
      '</div>' +
      affinityBar(s) +
      patienceHearts(s);
  }

  function customerCard(s, c, mini) {
    var cfg = E.getDayConfig(s.day);
    var budgetLeft = c.budget;
    var html = '<div class="card customer-card">' +
      '<div class="customer-head">' +
      '<div class="avatar' + (mini ? ' small' : '') + '">' + avatarSvg(c) + '</div>' +
      '<div class="customer-meta">' +
      '<div class="customer-name">' + esc(c.name) + (mini ? '' : '<span class="small muted" style="font-weight:400"> · ' + c.age + ' 岁</span>') + '</div>' +
      '<div class="customer-job">' + esc(c.job) + ' · ' + esc(c.occasion) + '</div>' +
      '<div class="chips">' +
      '<span class="tag gold">预算 ' + money(c.budget) + '</span>' +
      '<span class="tag">正式度 ' + c.formality + '/5</span>' +
      '</div></div></div>';

    if (!mini) {
      html += '<div class="customer-quote">“' + esc(c.story) + '”</div>' +
        '<div class="customer-request"><span class="request-label">需求</span>' + esc(c.request) + '</div>' +
        '<div class="info-grid">' +
        '<div class="info-box"><div class="k">偏好风格</div><div class="v">' + styleLabels(c.styles).join(' / ') + '</div></div>' +
        '<div class="info-box"><div class="k">避雷</div><div class="v">' + styleLabels(c.avoid).join(' / ') + '</div></div>' +
        '<div class="info-box"><div class="k">身材诉求</div><div class="v">' + esc(c.bodyLabel) + '</div></div>' +
        '<div class="info-box"><div class="k">今日流行</div><div class="v">' + esc(D.TRENDS[cfg.trend].name) + '</div></div>' +
        '</div>';
    }
    html += '</div>';
    return html;
  }

  function appointmentStrip(list) {
    if (!list || !list.length) { return ''; }
    var html = '<div class="card soft appointment-card">' +
      '<div class="section-head"><h3>今日预约</h3><span class="small">先看需求，再决定进什么货</span></div>';
    list.forEach(function (c) {
      html += '<div class="appointment-row">' +
        '<div class="avatar small">' + avatarSvg(c) + '</div>' +
        '<div class="appointment-info">' +
        '<div class="appointment-name">' + esc(c.name) + ' <span class="small muted">' + esc(c.occasion) + '</span></div>' +
        '<div class="small muted">预算 ' + money(c.budget) + ' · 偏好 ' + styleLabels(c.styles).join(' / ') + '</div>' +
        '</div></div>';
    });
    html += '</div>';
    return html;
  }

  function lotCard(lot, selected) {
    var items = lot.items.map(miniItem).join('');
    return '<button type="button" class="lot-card' + (selected ? ' selected' : '') + '" data-action="select-lot" data-id="' + lot.id + '">' +
      '<div class="lot-top">' +
      '<div><div class="lot-name">' + esc(lot.name) + '</div><div class="lot-tagline">' + esc(lot.tagline) + '</div></div>' +
      '<div class="lot-cost">' + money(E.getLotCost(lot)) + '</div>' +
      '</div>' +
      '<div class="lot-items">' + items + '</div>' +
      '<div class="chips"><span class="tag">每款 ×2</span></div>' +
      '</button>';
  }

  function marketingCard(m, selected) {
    return '<button type="button" class="marketing-card' + (selected ? ' selected' : '') + '" data-action="select-marketing" data-id="' + m.id + '">' +
      '<div class="marketing-icon">' + m.icon + '</div>' +
      '<div class="marketing-name">' + esc(m.name) + '</div>' +
      '<div class="marketing-desc">' + esc(m.desc) + '</div>' +
      '</button>';
  }

  function itemCard(entry, opts) {
    opts = opts || {};
    var item = entry.item || entry;
    var qty = entry.qty == null ? null : entry.qty;
    var selected = !!opts.selected;
    var tag = opts.action ? 'button' : 'div';
    var attrs = opts.action ? ' type="button" data-action="' + opts.action + '" data-id="' + item.id + '"' : '';
    var cls = 'item-card' + (selected ? ' selected' : '') + (qty === 0 && !entry.incoming ? ' out' : '');
    return '<' + tag + attrs + ' class="' + cls + '">' +
      (opts.badge ? '<span class="window-badge">' + opts.badge + '</span>' : (selected ? '<span class="selected-mark">✓</span>' : '')) +
      '<div class="item-art">' + itemSvg(item) + '</div>' +
      '<div class="item-name">' + esc(item.name) + '</div>' +
      '<div class="item-sub"><span class="price">' + money(E.getEffectivePrice(item)) + '</span>' +
      (qty != null ? '<span class="qty">' + (entry.incoming && !qty ? '到货 ' + entry.incoming : '库存 ' + qty) + '</span>' : '<span class="qty">' + esc(D.STYLE_LABELS[item.style[0]]) + '</span>') +
      '</div>' +
      (opts.showCost ? '<div class="item-cost">进 ' + money(item.cost) + ' · 毛 ' + money(E.getEffectivePrice(item) - item.cost) + '</div>' : '') +
      '</' + tag + '>';
  }

  function lookIdsFor(s) {
    var pr = s && s.pendingResult;
    if (pr && pr.itemIds && pr.itemIds.length) { return pr.itemIds; }
    if (s && s.selectedItems && s.selectedItems.length) { return s.selectedItems; }
    var rec = s && s.servingCustomerId ? E.getQueueRecord(s.servingCustomerId) : null;
    return (rec && rec.itemIds) || [];
  }

  function lookFigure(c, ids, pose, expr, cls) {
    if (!c || !window.Iso || !Iso.character || !Iso.character.imageUrl) { return ''; }
    var o = Iso.character.outfit({ selectedItems: ids || [] }, c);
    var url = Iso.character.imageUrl(Iso.character.appearance(c), o, pose || 'stand', expr || 'calm');
    return '<img class="look-img' + (cls ? ' ' + cls : '') + '" src="' + esc(url) + '" alt="">';
  }

  function lookFab() {
    return '<button type="button" class="look-fab" data-action="open-look">看整体</button>';
  }

  function optionCard(opt, index, extras) {
    var ids = opt.items;
    var tags = unique(ids.map(function (id) {
      var it = itemById(id);
      return it ? it.style[0] : null;
    }).filter(Boolean));
    var c = E.currentCustomer();
    var look = c ? lookFigure(c, ids, 'stand', 'calm', 'option-look-img') : '';
    return '<button type="button" class="option-card" data-action="choose-option" data-id="' + index + '">' +
      '<div class="option-head"><span class="option-label">' + esc(opt.label) + '</span><span class="option-price">' + money(opt.total) + '</span></div>' +
      '<div class="option-body">' +
      (look ? '<div class="option-look">' + look + '</div>' : '') +
      '<div class="option-info">' +
      '<div class="option-items">' + ids.map(miniItem).join('') + '</div>' +
      '<div class="chips">' + styleTags(tags) + '</div>' +
      '<div class="option-reason">' + esc(opt.reason) + '</div>' +
      (extras ? optionExtras(extras) : '') +
      '</div></div>' +
      '</button>';
  }

  function scoreRing(score) {
    var r = 52;
    var c = 2 * Math.PI * r;
    var offset = c * (1 - Math.max(0, Math.min(100, score)) / 100);
    return '<div class="score-ring" style="background:none">' +
      '<svg viewBox="0 0 120 120" width="108" height="108" style="position:absolute;top:0;left:0">' +
      '<circle cx="60" cy="60" r="' + r + '" fill="none" stroke="#EFE6D8" stroke-width="10"/>' +
      '<circle cx="60" cy="60" r="' + r + '" fill="none" stroke="#C97B63" stroke-width="10" stroke-linecap="round" ' +
      'stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + offset.toFixed(1) + '" transform="rotate(-90 60 60)"/>' +
      '</svg>' +
      '<div class="score-ring-inner"><div class="score-number">' + score + '</div><div class="score-label">搭配分</div></div>' +
      '</div>';
  }

  function breakdownRow(name, value, max) {
    var pct = Math.max(0, Math.min(100, (value / max) * 100));
    return '<div class="breakdown-row">' +
      '<div class="breakdown-name">' + name + '</div>' +
      '<div class="breakdown-bar"><i class="' + (pct < 50 ? 'warn' : '') + '" style="width:' + pct + '%"></i></div>' +
      '<div class="breakdown-value">' + Math.round(value) + '/' + max + '</div>' +
      '</div>';
  }

  function receiptRow(label, value, cls) {
    return '<div class="receipt-row"><span>' + esc(label) + '</span><span class="' + (cls || '') + '">' + value + '</span></div>';
  }

  function goalBadge(met) {
    return '<span class="goal-badge' + (met ? '' : ' miss') + '">' + (met ? '✓ 今日目标达成' : '× 今日目标未达成') + '</span>';
  }

  /* ---------------- 标题页 ---------------- */

  /* ---------------- 设计工坊 2.0 ---------------- */

  var DESIGN_APP = {
    skin: '#F2D3B8', hair: '#3F332B', hairStyle: 'bun', accessory: 'none',
    faceShape: 'oval', eyeStyle: 'almond', browStyle: 'soft', lipStyle: 'soft',
    hairPart: 'side', height: 1
  };

  function designSeasonName(id) {
    var hit = (D.SEASONS || []).filter(function (x) { return x.id === id; })[0];
    return hit ? hit.name : id;
  }

  function designHash(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) | 0; }
    return Math.abs(h).toString(36);
  }

  function designDefaults() {
    return {
      cat: 'top', silhouette: 'shirt', fabric: 'cotton', pattern: 'none',
      color: 'cream', deco: [], priceMode: 'mid', name: '',
      custom: null, print: null
    };
  }

  function normalizeDesignCfg(cfg) {
    var d = designDefaults();
    if (cfg && typeof cfg === 'object') {
      Object.keys(d).forEach(function (k) { if (cfg[k] !== undefined) { d[k] = cfg[k]; } });
    }
    if (!Array.isArray(d.deco)) { d.deco = []; }
    d.deco = d.deco.slice(0, D.DESIGN.maxDecorations);
    return d;
  }

  function designSil(cat, id) {
    var list = (D.DESIGN.silhouettes && D.DESIGN.silhouettes[cat]) || [];
    return list.filter(function (x) { return x.id === id; })[0] || list[0] || null;
  }

  function designLook(cfg) {
    var sil = designSil(cfg.cat, cfg.silhouette);
    var base = (sil && sil.look) || { s: 'tee', neck: 'crew', slv: 'short', len: 'waist', fit: 'regular' };
    var look = {};
    for (var k in base) { look[k] = base[k]; }
    var fb = (D.DESIGN.fabricLook && D.DESIGN.fabricLook[cfg.fabric]) || { m: 'cotton', p: 'none' };
    look.m = fb.m;
    look.p = cfg.pattern || fb.p || 'none';
    look.decor = (cfg.deco || []).slice(0, D.DESIGN.maxDecorations);
    if (cfg.custom) { look.custom = cfg.custom; }
    if (cfg.print) { look.print = cfg.print; }
    return look;
  }

  function designPseudoItem(cfg) {
    var look = designLook(cfg);
    var sig = JSON.stringify({
      cat: cfg.cat, sil: cfg.silhouette, fabric: cfg.fabric, pattern: cfg.pattern,
      deco: cfg.deco, custom: cfg.custom, print: cfg.print
    });
    return {
      id: 'preview-' + designHash(sig),
      shape: cfg.cat,
      color: D.COLOR_HEX[cfg.color] || '#D8C9B8',
      look: look
    };
  }

  function designNeutral(id) {
    var it = D.ITEMS_BY_ID[id];
    if (!it) { return null; }
    return { id: it.id, shape: it.shape, color: D.COLOR_HEX[it.color] || it.color, look: Iso.lookOf(it) };
  }

  function designOutfit(cfg) {
    var model = { id: 'design-model', portrait: { skin: DESIGN_APP.skin, hair: DESIGN_APP.hair, top: '#F1E3D3' } };
    var o = Iso.character.outfit({ selectedItems: [] }, model);
    o.top = null; o.bottom = null; o.dress = null; o.outer = null;
    o.bag = null; o.hosiery = null; o.acc = {}; o.uniform = false;
    o.shoes = designNeutral('s_sneaker');
    var item = designPseudoItem(cfg);
    if (cfg.cat === 'top') {
      o.top = item; o.bottom = designNeutral('b_jeans');
    } else if (cfg.cat === 'bottom') {
      o.bottom = item; o.top = designNeutral('t_tee');
    } else if (cfg.cat === 'dress') {
      o.dress = item;
    } else {
      o.outer = item; o.top = designNeutral('t_tee'); o.bottom = designNeutral('b_jeans');
    }
    return o;
  }

  function designPreviewUrl(cfg, side, model, thumb) {
    var pose = thumb ? 'stand' : (UI._designPose || 'stand');
    var sig = designHash(JSON.stringify({
      cat: cfg.cat, sil: cfg.silhouette, fabric: cfg.fabric, pattern: cfg.pattern,
      color: cfg.color, deco: cfg.deco, custom: cfg.custom, print: cfg.print,
      side: side, model: model, pose: pose
    }));
    var key = 'dp|' + sig;
    if (UI._designPreviewCache[key]) { return UI._designPreviewCache[key]; }
    var o = designOutfit(cfg);
    var useModel = model === 'model' && side !== 'back';
    var url = useModel
      ? Iso.character.imageUrl(DESIGN_APP, o, pose, 'calm')
      : Iso.character.mannequinUrl(DESIGN_APP, o, pose, side === 'back');
    UI._designPreviewCache[key] = url;
    var ks = Object.keys(UI._designPreviewCache);
    if (ks.length > 60) { delete UI._designPreviewCache[ks[0]]; }
    return url;
  }

  function designSilThumb(cat, silId) {
    var key = 'th|' + cat + '|' + silId;
    if (UI._designThumbs[key]) { return UI._designThumbs[key]; }
    var cfg = designDefaults();
    cfg.cat = cat; cfg.silhouette = silId;
    var url = designPreviewUrl(cfg, 'front', 'mannequin', true);
    UI._designThumbs[key] = url;
    return url;
  }

  function designPrice(calc, cfg) {
    return E.designPrice(calc, cfg.priceMode);
  }

  function designOrderForUI() {
    var s = E.state;
    if (!s) { return null; }
    var id = UI._designOrderId;
    var list = (s.orders || []).filter(function (o) { return o.kind === 'design' && o.status === 'open'; });
    if (id) {
      var hit = list.filter(function (o) { return o.id === id; })[0];
      if (hit) { return hit; }
    }
    return list[0] || null;
  }

  function designMatch(order, cfg) {
    if (!order) { return null; }
    var calc = E.computeDesign(cfg);
    var price = designPrice(calc, cfg);
    var want = order.want || {};
    var checks = [
      { label: '品类', ok: !want.cat || cfg.cat === want.cat },
      { label: '颜色', ok: !want.color || cfg.color === want.color },
      { label: '面料', ok: !want.fabric || cfg.fabric === want.fabric },
      { label: '装饰', ok: !want.deco || (cfg.deco || []).indexOf(want.deco) >= 0 },
      { label: '预算', ok: !want.budget || price <= want.budget },
      { label: '评分', ok: !want.minScore || calc.score >= want.minScore }
    ];
    var ok = checks.every(function (c) { return c.ok; });
    return { ok: ok, checks: checks, calc: calc, price: price, payout: Math.round(price * 1.15) };
  }

  function designBriefHtml(order, cfg, match) {
    if (!order) { return ''; }
    var c = customerById(order.customerId);
    var left = Math.max(0, order.deadlineDay - E.state.day + 1);
    var want = order.want || {};
    var fabric = D.DESIGN.fabrics.filter(function (f) { return f.id === want.fabric; })[0];
    var deco = D.DESIGN.decorations.filter(function (d) { return d.id === want.deco; })[0];
    var catName = (D.DESIGN.cats.filter(function (x) { return x.id === want.cat; })[0] || {}).name || want.cat;
    var html = '<div class="design-brief">';
    html += '<div class="design-brief-head">' +
      (c ? '<span class="design-brief-avatar">' + avatarSvg(c) + '</span>' : '') +
      '<div class="design-brief-info"><strong>' + esc(c ? c.name : '线上顾客') + ' · 设计单</strong>' +
      '<span>预算 ' + money(want.budget || 0) + ' · 剩 ' + left + ' 天</span></div>' +
      '<span class="design-brief-badge">' + (match && match.ok ? '可交付' : '待匹配') + '</span>' +
      '</div>';
    html += '<div class="design-brief-need">想要 <b>' +
      esc(D.COLOR_LABELS[want.color] || want.color) + ' · ' +
      esc(fabric ? fabric.name : (want.fabric || '')) + ' · ' +
      esc(deco ? deco.name : '无装饰') + ' ' + esc(catName) +
      '</b></div>';
    html += '<div class="design-match">' + (match ? match.checks.map(function (ch) {
      return '<span class="' + (ch.ok ? 'ok' : 'miss') + '">' + (ch.ok ? '✓' : '×') + ' ' + ch.label + '</span>';
    }).join('') : '') + '</div>';
    html += '</div>';
    return html;
  }

  function designScoreHtml(calc, match) {
    var defs = [
      ['shape', '版型', 25], ['fabric', '面料', 25], ['color', '配色', 20],
      ['craft', '工艺', 20], ['novelty', '新意', 10]
    ];
    var html = '<div class="design-score">';
    html += '<div class="design-score-head"><span>评分 <b>' + calc.score + '</b></span>' +
      (calc.tier === 'couture' ? '<span class="tag gold">高定</span>' : '<span class="tag">独家</span>') +
      (match ? '<span class="' + (match.ok ? 'tag sage' : 'tag warn') + '">' + (match.ok ? '可交付 +' + money(match.payout) : '未满足委托') + '</span>' : '') +
      '</div>';
    defs.forEach(function (d) {
      var val = calc.parts[d[0]] || 0;
      var pct = Math.min(100, Math.round(val / d[2] * 100));
      html += '<div class="design-score-row"><span>' + d[1] + '</span>' +
        '<i><b style="width:' + pct + '%"></b></i><em>' + Math.round(val) + '</em></div>';
    });
    html += '</div>';
    return html;
  }

  function designStepperHtml(cfg) {
    var steps = [
      ['shape', '版型'], ['fabric', '面料'], ['pattern', '图案'],
      ['color', '颜色'], ['decor', '装饰'], ['price', '定价']
    ];
    var cur = UI._designStep || 'shape';
    return '<div class="design-stepper">' + steps.map(function (s) {
      return '<button type="button" class="' + (cur === s[0] ? 'active' : '') + '" data-action="design-step" data-id="' + s[0] + '">' + s[1] + '</button>';
    }).join('') + '</div>';
  }

  function fabricSwatchHtml(f) {
    return '<span class="fabric-swatch fabric-' + f.id + '"></span>';
  }

  function patternSwatchHtml(id) {
    return '<span class="pattern-swatch pat-' + id + '"></span>';
  }

  function designStepHtml(cfg, calc, match) {
    var step = UI._designStep || 'shape';
    var html = '';
    if (step === 'shape') {
      var cats = D.DESIGN.cats;
      html += '<div class="design-cat-tabs">' + cats.map(function (c) {
        return '<button type="button" class="' + (cfg.cat === c.id ? 'active' : '') + '" data-action="design-cat" data-id="' + c.id + '">' + c.name + '</button>';
      }).join('') + '</div>';
      var list = (D.DESIGN.silhouettes && D.DESIGN.silhouettes[cfg.cat]) || [];
      html += '<div class="design-sil-grid">' + list.map(function (sil) {
        return '<button type="button" class="design-sil-card' + (cfg.silhouette === sil.id ? ' active' : '') + '" data-action="design-sil" data-id="' + sil.id + '">' +
          '<img src="' + designSilThumb(cfg.cat, sil.id) + '" alt=""><span>' + esc(sil.name) + '</span></button>';
      }).join('') + '</div>';
      html += '<div class="design-hint-row">' +
        '<button type="button" class="btn secondary small" data-action="design-board-draw">✎ 自己画版型</button>' +
        (cfg.custom ? '<button type="button" class="btn ghost small" data-action="design-board-clear">恢复预设版型</button>' : '') +
        '</div>';
      if (cfg.custom) {
        var fit = (cfg.custom.fit && typeof cfg.custom.fit === 'object') ? cfg.custom.fit : {};
        html += '<div class="design-fit">' +
          '<label>宽窄<input class="design-fit-range" data-axis="sx" type="range" min="0.8" max="1.2" step="0.02" value="' + (fit.sx || 1) + '"></label>' +
          '<label>长短<input class="design-fit-range" data-axis="sy" type="range" min="0.8" max="1.2" step="0.02" value="' + (fit.sy || 1) + '"></label>' +
          '</div>';
        html += '<div class="hint-box">已使用自定义版型。袖子/领口仍按当前预设生成；宽窄/长短以底边中心缩放。</div>';
      }
    } else if (step === 'fabric') {
      html += '<div class="design-card-grid">' + D.DESIGN.fabrics.map(function (f) {
        return '<button type="button" class="design-opt-card' + (cfg.fabric === f.id ? ' active' : '') + '" data-action="design-fabric" data-id="' + f.id + '">' +
          fabricSwatchHtml(f) + '<strong>' + f.name + '</strong>' +
          '<span>¥' + f.cost + ' · ' + f.seasons.map(designSeasonName).join('/') + '</span></button>';
      }).join('') + '</div>';
    } else if (step === 'pattern') {
      html += '<div class="design-card-grid">' + D.DESIGN.patterns.map(function (p) {
        return '<button type="button" class="design-opt-card' + (cfg.pattern === p.id ? ' active' : '') + '" data-action="design-pattern" data-id="' + p.id + '">' +
          patternSwatchHtml(p.id) + '<strong>' + p.name + '</strong></button>';
      }).join('') + '</div>';
      html += '<div class="design-hint-row">' +
        '<button type="button" class="btn secondary small" data-action="design-board-print">✎ 自己画印花</button>' +
        (cfg.print ? '<button type="button" class="btn ghost small" data-action="design-print-clear">去掉自定义印花</button>' : '') +
        '</div>';
      if (cfg.print) { html += '<div class="hint-box">已使用 32×32 自定义印花。</div>'; }
    } else if (step === 'color') {
      html += '<div class="design-color-row">' + Object.keys(D.COLOR_HEX).map(function (key) {
        return '<button type="button" class="design-color-dot' + (cfg.color === key ? ' on' : '') + '" data-action="design-color" data-id="' + key + '" style="background:' + D.COLOR_HEX[key] + '" title="' + esc(D.COLOR_LABELS[key] || key) + '"><span>' + esc(D.COLOR_LABELS[key] || key) + '</span></button>';
      }).join('') + '</div>';
    } else if (step === 'decor') {
      html += '<div class="design-card-grid">' + D.DESIGN.decorations.map(function (d) {
        var on = (cfg.deco || []).indexOf(d.id) >= 0;
        return '<button type="button" class="design-opt-card' + (on ? ' active' : '') + '" data-action="design-deco" data-id="' + d.id + '">' +
          '<strong>' + d.name + '</strong><span>¥' + d.cost + ' · 工艺 +' + d.craft + '</span></button>';
      }).join('') + '</div>';
      html += '<div class="small muted">最多 ' + D.DESIGN.maxDecorations + ' 个装饰；会直接画在衣服上。</div>';
    } else {
      html += '<div class="design-price-row">' +
        [['low', '低价 ' + money(calc.min)], ['mid', '标准 ' + money(Math.round((calc.min + calc.max) / 2))], ['high', '高价 ' + money(calc.max)]].map(function (p) {
          return '<button type="button" class="' + (cfg.priceMode === p[0] ? 'active' : '') + '" data-action="design-price" data-id="' + p[0] + '">' + p[1] + '</button>';
        }).join('') + '</div>';
      html += '<div class="design-price-meta">成本 ' + money(calc.cost) + ' · 预计毛利 ' +
        money(designPrice(calc, cfg) - calc.cost) + '</div>';
      html += '<label class="design-name-label">名字<input id="design-name" class="design-name-input" maxlength="24" placeholder="给这件衣服起个名字" value="' + esc(cfg.name || '') + '"></label>';
    }
    return html;
  }

  function designActionHtml(cfg, calc, match, order) {
    var done = E.state.designDay === E.state.day;
    var label;
    if (done) { label = '今天已经设计过了'; }
    else if (order && match && match.ok) { label = '设计并交付 · +' + money(match.payout); }
    else { label = '设计并入库 · ' + money(calc.cost); }
    var html = '<div class="design-actionbar">';
    html += '<div class="design-action-info"><span>成本 ' + money(calc.cost) + '</span>' +
      '<span>售价 ' + money(designPrice(calc, cfg)) + '</span></div>';
    html += '<button type="button" class="btn" data-action="design-create"' + (done ? ' disabled' : '') + '>' + label + '</button>';
    if (order && match && !match.ok) {
      var miss = match.checks.filter(function (c) { return !c.ok; }).map(function (c) { return c.label; });
      html += '<div class="design-action-note">还差：' + miss.join('、') + '；不匹配会先入库。</div>';
    }
    html += '</div>';
    return html;
  }

  UI.openDesign = function (orderId) {
    if (!E.state) { return; }
    var order = null;
    if (orderId) {
      order = (E.state.orders || []).filter(function (o) { return o.id === orderId; })[0] || null;
    }
    if (!order) { order = E.getDesignOrder(); }
    UI._designOrderId = order ? order.id : null;
    var draft = E.getDesignDraft();
    var useDraft = draft && (!order || draft.cat === order.want.cat);
    UI._design = useDraft ? normalizeDesignCfg(draft) : designDefaults();
    if (order && !useDraft) {
      var cfg = UI._design;
      cfg.cat = order.want.cat || cfg.cat;
      cfg.silhouette = (designSil(cfg.cat, order.want.silhouette) || {}).id || ((D.DESIGN.silhouettes[cfg.cat] || [])[0] || {}).id;
      cfg.color = order.want.color || cfg.color;
      cfg.fabric = order.want.fabric || cfg.fabric;
      cfg.deco = order.want.deco ? [order.want.deco] : [];
      cfg.pattern = (D.DESIGN.fabricLook[cfg.fabric] || {}).p || 'none';
      cfg.custom = null;
      cfg.print = null;
      cfg.name = '';
      var tmp = E.computeDesign(cfg);
      var mid = Math.round((tmp.min + tmp.max) / 2);
      cfg.priceMode = mid <= order.want.budget ? 'mid' : 'low';
    }
    UI._designStep = 'shape';
    UI._designSide = 'front';
    UI._designModel = 'mannequin';
    UI._designPose = 'stand';
    UI._board = null;
    UI.overrideScreen = 'design';
    UI._screenSig = '';
    UI.render();
    UI.scrollTop();
  };

  UI.closeDesign = function () {
    UI.overrideScreen = null;
    UI._board = null;
    UI._prepTab = 'studio';
    UI._screenSig = '';
    UI.render();
    UI.scrollTop();
  };

  UI.screens.design = function (s) {
    if (UI._board) { return designBoardHtml(s); }
    var cfg = UI._design || designDefaults();
    var calc = E.computeDesign(cfg);
    var order = designOrderForUI();
    var match = order ? designMatch(order, cfg) : null;
    var season = E.getSeason();
    var html = '<div class="design-screen">';
    html += '<div class="design-head">' +
      '<button type="button" class="design-back" data-action="design-back">←</button>' +
      '<div class="design-head-title">设计工坊</div>' +
      '<div class="design-head-meta"><span>' + esc(season.name) + ' · DAY ' + E.getDayInSeason(s.day) + '/' + s.maxDay + '</span><span>' + money(s.cash) + '</span>' +
      '<button type="button" class="design-gallery-btn" data-action="design-gallery">作品集</button></div>' +
      '</div>';
    html += designBriefHtml(order, cfg, match);
    html += '<div class="design-stage">' +
      '<div class="design-stage-tools">' +
      '<div class="design-mini-seg">' +
      '<button type="button" class="' + (UI._designModel === 'mannequin' ? 'active' : '') + '" data-action="design-model" data-id="mannequin">人台</button>' +
      '<button type="button" class="' + (UI._designModel === 'model' ? 'active' : '') + '" data-action="design-model" data-id="model">模特</button>' +
      '</div>' +
      '<div class="design-mini-seg">' +
      '<button type="button" class="' + (UI._designSide === 'front' ? 'active' : '') + '" data-action="design-side" data-id="front">正面</button>' +
      '<button type="button" class="' + (UI._designSide === 'back' ? 'active' : '') + '" data-action="design-side" data-id="back">背面</button>' +
      '</div>' +
      '</div>' +
      '<div class="design-figure"><img src="' + designPreviewUrl(cfg, UI._designSide, UI._designModel) + '" alt="设计预览"></div>' +
      '<div class="design-pose-row">' +
      [['stand', '自然'], ['hip', '叉腰'], ['twirl', '转身'], ['mirror', '照镜子']].map(function (p) {
        return '<button type="button" class="' + ((UI._designPose || 'stand') === p[0] ? 'active' : '') + '" data-action="design-pose" data-id="' + p[0] + '">' + p[1] + '</button>';
      }).join('') + '</div>' +
      (UI._designSide === 'back' ? '<div class="design-back-note">背面只用于设计稿，游戏内人物仍正面</div>' : '') +
      designScoreHtml(calc, match) +
      '</div>';
    html += designStepperHtml(cfg);
    html += '<div class="design-step-body">' + designStepHtml(cfg, calc, match) + '</div>';
    html += designActionHtml(cfg, calc, match, order);
    html += '</div>';
    return html;
  };

  UI.bindDesignScreen = function () {
    var input = document.getElementById('design-name');
    if (input) {
      input.addEventListener('input', function () {
        UI._design.name = String(input.value || '').slice(0, 24);
        E.saveDesignDraft(UI._design);
      });
    }
    var ranges = document.querySelectorAll('.design-fit-range');
    for (var i = 0; i < ranges.length; i++) {
      ranges[i].addEventListener('input', function () {
        if (!UI._design.custom) { return; }
        UI._design.custom.fit = UI._design.custom.fit || {};
        UI._design.custom.fit[this.getAttribute('data-axis')] = parseFloat(this.value) || 1;
        var img = document.querySelector('.design-figure img');
        if (img) { img.src = designPreviewUrl(UI._design, UI._designSide, UI._designModel); }
        E.saveDesignDraft(UI._design);
      });
    }
  };

  UI.designGallery = function () {
    var list = E.getDesigns().slice().reverse();
    var html = '<div class="modal-title">作品集</div>';
    if (!list.length) {
      html += '<div class="small muted mt10">还没有作品。先设计一件吧。</div>';
    } else {
      html += '<div class="design-gallery-grid">';
      list.forEach(function (d) {
        var cfg = {
          cat: d.cat, silhouette: d.silhouette || ((D.DESIGN.silhouettes[d.cat] || [])[0] || {}).id,
          fabric: d.fabricId, pattern: d.pattern || 'none', color: d.color,
          deco: d.decor || [], priceMode: 'mid', name: d.name,
          custom: d.custom || null, print: d.print || null
        };
        html += '<button type="button" class="design-gallery-card" data-action="design-gallery-open" data-id="' + d.id + '">' +
          '<img src="' + designPreviewUrl(cfg, 'front', 'mannequin', true) + '" alt="">' +
          '<strong>' + esc(d.name) + '</strong><span>' + d.score + ' 分 · ' + money(d.price) + '</span></button>';
      });
      html += '</div>';
    }
    html += '<button type="button" class="btn ghost mt10" data-action="close-modal">关上</button>';
    UI.modal(html);
  };

  UI.designResult = function (res) {
    var d = res.design;
    var cfg = {
      cat: d.cat, silhouette: d.silhouette || ((D.DESIGN.silhouettes[d.cat] || [])[0] || {}).id,
      fabric: d.fabricId, pattern: d.pattern || 'none', color: d.color,
      deco: d.decor || [], priceMode: 'mid', name: d.name,
      custom: d.custom || null, print: d.print || null
    };
    var url = designPreviewUrl(cfg, 'front', 'model', true);
    var delivery = '';
    if (res.delivered) {
      delivery = '<div class="design-delivered">已交付设计单 · +' + money(res.payout || 0) + ' · 口碑 +2</div>';
    } else if (res.order) {
      delivery = '<div class="hint-box warn mt8">还没满足委托，设计款已入库。还差：' +
        (designMatch(res.order, cfg) ? designMatch(res.order, cfg).checks.filter(function (c) { return !c.ok; }).map(function (c) { return c.label; }).join('、') : '') + '</div>';
    }
    var html = '<div class="modal-title">设计完成</div>' +
      '<div class="design-result-figure"><img src="' + url + '" alt=""></div>' +
      '<div class="design-result-name">' + esc(d.name) + '</div>' +
      '<div class="design-result-meta">' + d.score + ' 分 · ' + (d.tier === 'couture' ? '高定' : '独家') + ' · ' + money(d.price) + '</div>' +
      delivery +
      '<div class="btn-row mt10">' +
      '<button type="button" class="btn small" data-action="design-result-close">收进衣橱</button>' +
      '<button type="button" class="btn ghost small" data-action="design-share" data-id="' + d.id + '">分享这张设计</button>' +
      '</div>';
    UI._designResultId = d.id;
    UI.modal(html);
  };

  UI.renderDesign = function () {
    UI._screenSig = '';
    UI.render();
  };

  UI.showDesign = function (id) {
    var d = E.getDesigns().filter(function (x) { return x.id === id; })[0];
    if (!d) { return; }
    var cfg = {
      cat: d.cat, silhouette: d.silhouette || ((D.DESIGN.silhouettes[d.cat] || [])[0] || {}).id,
      fabric: d.fabricId, pattern: d.pattern || 'none', color: d.color,
      deco: d.decor || [], priceMode: 'mid', name: d.name,
      custom: d.custom || null, print: d.print || null
    };
    var html = '<div class="modal-title">' + esc(d.name) + '</div>' +
      '<div class="design-result-figure"><img src="' + designPreviewUrl(cfg, 'front', 'model', true) + '" alt=""></div>' +
      '<div class="design-result-meta">' + d.score + ' 分 · ' + (d.tier === 'couture' ? '高定' : '独家') + ' · ' + money(d.price) + '</div>' +
      '<div class="small muted center">' + esc((D.CATEGORY_LABELS[d.cat] || d.cat)) + ' · ' +
      esc(D.COLOR_LABELS[d.color] || d.color) + ' · ' + esc((D.DESIGN.fabrics.filter(function (f) { return f.id === d.fabricId; })[0] || {}).name || '') + '</div>' +
      '<div class="btn-row mt10"><button type="button" class="btn small" data-action="design-share" data-id="' + d.id + '">分享这张设计</button>' +
      '<button type="button" class="btn ghost small" data-action="close-modal">关上</button></div>';
    UI.modal(html);
  };

  UI.designShare = function (id) {
    var d = E.getDesigns().filter(function (x) { return x.id === id; })[0];
    if (!d) { return; }
    var cfg = {
      cat: d.cat, silhouette: d.silhouette || ((D.DESIGN.silhouettes[d.cat] || [])[0] || {}).id,
      fabric: d.fabricId, pattern: d.pattern || 'none', color: d.color,
      deco: d.decor || [], priceMode: 'mid', name: d.name,
      custom: d.custom || null, print: d.print || null
    };
    var url = designPreviewUrl(cfg, 'front', 'model', true);
    var img = new Image();
    img.onload = function () {
      var canvas = document.createElement('canvas');
      canvas.width = 900;
      canvas.height = 1200;
      var c = canvas.getContext('2d');
      c.fillStyle = '#F7F1E8';
      c.fillRect(0, 0, 900, 1200);
      c.fillStyle = '#FFFDF8';
      c.strokeStyle = '#5B4636';
      c.lineWidth = 5;
      c.beginPath();
      if (c.roundRect) { c.roundRect(40, 40, 820, 1120, 28); } else { c.rect(40, 40, 820, 1120); }
      c.fill(); c.stroke();
      c.drawImage(img, 210, 100, 480, 780);
      c.fillStyle = '#3F332B';
      c.font = '900 44px sans-serif';
      c.textAlign = 'center';
      c.fillText(d.name.slice(0, 16), 450, 940);
      c.font = '28px sans-serif';
      c.fillStyle = '#8A6A55';
      c.fillText(d.score + ' 分 · ' + (d.tier === 'couture' ? '高定' : '独家') + ' · ' + money(d.price), 450, 990);
      c.font = '24px sans-serif';
      c.fillText(E.state.shopName + ' · 设计工坊', 450, 1040);
      UI.lastShareDataUrl = canvas.toDataURL('image/png');
      UI.modal('<div class="modal-title">设计分享卡</div>' +
        '<img src="' + UI.lastShareDataUrl + '" alt="" style="width:100%;margin-top:10px;border:2px solid #5B4636;border-radius:12px">' +
        '<div class="small muted" style="text-align:center;margin-top:6px">手机上也可以长按图片保存</div>' +
        '<div class="btn-row mt10"><button type="button" class="btn small" data-action="download-share">下载 PNG</button>' +
        (canShareImage() ? '<button type="button" class="btn small" data-action="share-share">分享</button>' : '') +
        '<button type="button" class="btn ghost small" data-action="close-modal">关上</button></div>');
    };
    img.onerror = function () { UI.toast('生成分享图失败'); };
    img.src = url;
  };

  /* ---------------- 画板 ---------------- */

  function designBoardStart(mode, side) {
    var cfg = UI._design;
    var b = UI._board || {};
    b.mode = mode;
    b.side = side || b.side || 'front';
    b.tool = b.tool || 'brush';
    b.color = b.color == null ? 1 : b.color;
    b.symmetry = b.symmetry !== false;
    b.points = b.points || { front: [], back: [] };
    if (!b.points.front) { b.points.front = []; }
    if (!b.points.back) { b.points.back = []; }
    if (mode === 'print') {
      var src = cfg.print && cfg.print.grid ? cfg.print.grid : null;
      b.grid = src ? src.slice() : Array.from({ length: 32 }, function () { return Array(32).fill('.').join(''); });
      b.palette = (cfg.print && cfg.print.palette) ? cfg.print.palette.slice() : D.DESIGN.printPalette.slice();
      b.history = [];
    }
    UI._board = b;
    UI._screenSig = '';
    UI.render();
    UI.scrollTop();
  }

  function designBoardHtml(s) {
    var b = UI._board;
    var draw = b.mode !== 'print';
    var html = '<div class="design-board-screen">';
    html += '<div class="design-head">' +
      '<button type="button" class="design-back" data-action="design-board-cancel">←</button>' +
      '<div class="design-head-title">' + (draw ? '画版型' : '画印花') + '</div>' +
      '<div class="design-head-meta"><span>' + (draw ? '正面 / 背面' : '32 × 32') + '</span></div>' +
      '</div>';
    if (draw) {
      html += '<div class="board-side-tabs">' +
        '<button type="button" class="' + (b.side === 'front' ? 'active' : '') + '" data-action="board-side" data-id="front">正面</button>' +
        '<button type="button" class="' + (b.side === 'back' ? 'active' : '') + '" data-action="board-side" data-id="back">背面</button>' +
        '</div>';
      html += '<div class="board-canvas-wrap"><canvas id="design-board-canvas" width="300" height="420"></canvas></div>';
      html += '<div class="board-hint">只画衣身外轮廓，起笔/收笔会自动闭合；袖子、领口在版型里选。</div>';
      html += '<div class="board-tools">' +
        '<button type="button" data-action="board-undo">撤销</button>' +
        '<button type="button" data-action="board-clear">清空</button>' +
        '<button type="button" class="' + (b.symmetry ? 'active' : '') + '" data-action="board-symmetry">对称</button>' +
        '<button type="button" class="primary" data-action="board-generate">生成版型</button>' +
        '</div>';
    } else {
      html += '<div class="board-canvas-wrap print"><canvas id="design-board-canvas" width="320" height="320"></canvas></div>';
      html += '<div class="board-palette">' + (b.palette || []).map(function (c, i) {
        return '<button type="button" class="board-color' + (b.color === i ? ' active' : '') + '" data-action="board-color" data-id="' + i + '" style="background:' + c + '"></button>';
      }).join('') + '</div>';
      html += '<div class="board-tools">' +
        '<button type="button" class="' + (b.tool === 'brush' ? 'active' : '') + '" data-action="board-tool" data-id="brush">画笔</button>' +
        '<button type="button" class="' + (b.tool === 'eraser' ? 'active' : '') + '" data-action="board-tool" data-id="eraser">橡皮</button>' +
        '<button type="button" class="' + (b.tool === 'fill' ? 'active' : '') + '" data-action="board-tool" data-id="fill">填充</button>' +
        '<button type="button" data-action="board-undo">撤销</button>' +
        '<button type="button" data-action="board-clear">清空</button>' +
        '<button type="button" class="' + (b.symmetry ? 'active' : '') + '" data-action="board-symmetry">对称</button>' +
        '<button type="button" class="primary" data-action="board-generate">应用印花</button>' +
        '</div>';
    }
    html += '</div>';
    return html;
  }

  function designBoardClear(ctx, W, H) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#FBF5EA';
    ctx.fillRect(0, 0, W, H);
  }

  function designBoardGuide(ctx, cat) {
    var top = cat === 'bottom' ? 220 : 55;
    var bottom = cat === 'bottom' ? 395 : cat === 'dress' ? 395 : 345;
    ctx.save();
    ctx.strokeStyle = '#D8C6AE';
    ctx.fillStyle = '#F0E2D0';
    ctx.lineWidth = 1.4;
    // 人台身体
    ctx.beginPath();
    ctx.moveTo(150, top);
    ctx.lineTo(150, top + 30);
    ctx.quadraticCurveTo(112, top + 42, 105, top + 78);
    ctx.quadraticCurveTo(122, top + 108, 126, top + 155);
    ctx.quadraticCurveTo(104, bottom - 30, 108, bottom);
    ctx.lineTo(192, bottom);
    ctx.quadraticCurveTo(196, bottom - 30, 174, top + 155);
    ctx.quadraticCurveTo(178, top + 108, 195, top + 78);
    ctx.quadraticCurveTo(188, top + 42, 150, top + 30);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // 参考线
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#C9B49A';
    var lines = [
      [top + 42, '肩线'], [top + 155, '腰线'], [bottom, '下摆']
    ];
    lines.forEach(function (ln) {
      ctx.beginPath();
      ctx.moveTo(90, ln[0]);
      ctx.lineTo(210, ln[0]);
      ctx.stroke();
      ctx.fillStyle = '#B49A7C';
      ctx.font = '11px sans-serif';
      ctx.fillText(ln[1], 218, ln[0] + 4);
    });
    ctx.restore();
  }

  function designBoardRedraw(canvas, b) {
    var W = 300, H = 420;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== W * dpr) {
      canvas.width = W * dpr;
      canvas.height = H * dpr;
    }
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    designBoardClear(ctx, W, H);
    designBoardGuide(ctx, UI._design.cat);
    var pts = b.points[b.side] || [];
    function stroke(points, color, width) {
      if (points.length < 2) { return; }
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (var i = 1; i < points.length; i++) { ctx.lineTo(points[i].x, points[i].y); }
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    stroke(pts, '#C97B63', 3.2);
    if (b.symmetry && pts.length) {
      var mirror = pts.map(function (p) { return { x: W - p.x, y: p.y }; });
      stroke(mirror, 'rgba(201,123,99,.45)', 2.2);
    }
  }

  function designBoardPrintRedraw(canvas, b) {
    var W = 320, H = 320, cell = 10;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== W * dpr) {
      canvas.width = W * dpr;
      canvas.height = H * dpr;
    }
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#FFFDF8';
    ctx.fillRect(0, 0, W, H);
    for (var y = 0; y < 32; y++) {
      for (var x = 0; x < 32; x++) {
        var ch = (b.grid[y] || '')[x] || '.';
        if (ch === '.') { continue; }
        var idx = parseInt(ch, 10);
        ctx.fillStyle = b.palette[idx] || '#000';
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
    ctx.strokeStyle = 'rgba(180,154,124,.22)';
    ctx.lineWidth = 1;
    for (var g = 0; g <= 32; g += 4) {
      ctx.beginPath(); ctx.moveTo(g * cell, 0); ctx.lineTo(g * cell, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, g * cell); ctx.lineTo(W, g * cell); ctx.stroke();
    }
  }

  function designBoardPoint(canvas, e, W, H) {
    var r = canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(W, (e.clientX - r.left) * W / Math.max(1, r.width))),
      y: Math.max(0, Math.min(H, (e.clientY - r.top) * H / Math.max(1, r.height)))
    };
  }

  function designBoardFlood(grid, x, y, color, paletteLength) {
    var target = (grid[y] || '')[x] || '.';
    if (target === color) { return; }
    var stack = [[x, y]];
    while (stack.length) {
      var p = stack.pop();
      var px = p[0], py = p[1];
      if (px < 0 || py < 0 || px >= 32 || py >= 32) { continue; }
      var row = grid[py];
      if ((row[px] || '.') !== target) { continue; }
      grid[py] = row.slice(0, px) + color + row.slice(px + 1);
      stack.push([px + 1, py]); stack.push([px - 1, py]);
      stack.push([px, py + 1]); stack.push([px, py - 1]);
    }
  }

  UI.bindDesignBoard = function () {
    var canvas = document.getElementById('design-board-canvas');
    var b = UI._board;
    if (!canvas || !b) { return; }
    if (b.mode === 'print') {
      designBoardPrintRedraw(canvas, b);
      var painting = false;
      function paint(e) {
        var p = designBoardPoint(canvas, e, 320, 320);
        var x = Math.floor(p.x / 10), y = Math.floor(p.y / 10);
        if (x < 0 || y < 0 || x >= 32 || y >= 32) { return; }
        var color = b.tool === 'eraser' ? '.' : String(b.color);
        if (b.tool === 'fill') {
          b.history.push(b.grid.slice());
          designBoardFlood(b.grid, x, y, color, b.palette.length);
        } else {
          var row = b.grid[y];
          b.grid[y] = row.slice(0, x) + color + row.slice(x + 1);
          if (b.symmetry) {
            var mx = 31 - x;
            b.grid[y] = b.grid[y].slice(0, mx) + color + b.grid[y].slice(mx + 1);
          }
        }
        designBoardPrintRedraw(canvas, b);
      }
      canvas.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        painting = true;
        if (b.tool !== 'fill') { b.history.push(b.grid.slice()); }
        if (b.history.length > 24) { b.history.shift(); }
        try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
        paint(e);
      });
      canvas.addEventListener('pointermove', function (e) {
        if (!painting || b.tool === 'fill') { return; }
        e.preventDefault();
        paint(e);
      });
      canvas.addEventListener('pointerup', function () { painting = false; });
      canvas.addEventListener('pointercancel', function () { painting = false; });
      return;
    }

    designBoardRedraw(canvas, b);
    var drawing = false;
    function addPoint(e) {
      var p = designBoardPoint(canvas, e, 300, 420);
      var arr = b.points[b.side];
      if (!arr.length) { arr.push(p); }
      else {
        var last = arr[arr.length - 1];
        if (Math.hypot(p.x - last.x, p.y - last.y) > 2.2) { arr.push(p); }
      }
      designBoardRedraw(canvas, b);
    }
    canvas.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      drawing = true;
      b.points[b.side] = [];
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
      addPoint(e);
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!drawing) { return; }
      e.preventDefault();
      addPoint(e);
    });
    canvas.addEventListener('pointerup', function () { drawing = false; });
    canvas.addEventListener('pointercancel', function () { drawing = false; });
  };

  function designPointsToPath(points) {
    if (!points || points.length < 8) { return null; }
    var pts = [];
    points.forEach(function (p) {
      if (!pts.length) { pts.push(p); return; }
      var last = pts[pts.length - 1];
      if (Math.hypot(p.x - last.x, p.y - last.y) >= 4) { pts.push(p); }
    });
    if (pts.length > 90) { pts = pts.filter(function (p, i) { return i % 2 === 0 || i === pts.length - 1; }); }
    if (pts.length < 6) { return null; }
    var minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    pts.forEach(function (p) {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    });
    if (maxX - minX < 55 || maxY - minY < 55) { return null; }
    var area = 0;
    for (var i = 0; i < pts.length; i++) {
      var a = pts[i], b = pts[(i + 1) % pts.length];
      area += a.x * b.y - b.x * a.y;
    }
    if (Math.abs(area / 2) < 2500) { return null; }
    var sm = pts.map(function (p, i) {
      var a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      return { x: (a.x + p.x + b.x) / 3, y: (a.y + p.y + b.y) / 3 };
    });
    var d = 'M' + (sm[0].x / 3).toFixed(2) + ' ' + (sm[0].y / 3).toFixed(2);
    for (var j = 1; j < sm.length; j++) {
      d += ' L' + (sm[j].x / 3).toFixed(2) + ' ' + (sm[j].y / 3).toFixed(2);
    }
    d += ' Z';
    return { d: d, w: 100, h: 140 };
  }

  UI.screens.title = function () {
    var preview = E.getSavePreview();
    var name = preview ? preview.shopName : '衣间小日子';
    return '<div class="title-hero">' +
      '<span class="title-badge">7 天开店挑战</span>' +
      '<h1>衣间小日子</h1>' +
      '<p class="title-sub">一家小店，7 天一季，把日子过成自己喜欢的样子。</p>' +
      '<div class="title-store title-store2">' + (window.Scene && Scene.preview ? Scene.preview() : storeSvg({ shopName: name, day: 1, inventory: null })) + '</div>' +
      '</div>' +
      '<div class="card taped">' +
      '<label class="field-label" for="shop-name">给你的小店起个名字</label>' +
      '<input id="shop-name" class="text-input" maxlength="10" value="' + esc(name) + '">' +
      '<button type="button" class="btn mt14" data-action="start">开始新店</button>' +
      (preview ? '<button type="button" class="btn secondary" data-action="continue">' +
        (preview.completed ? '查看上次小店总结' : '继续经营 · 第 ' + preview.day + ' 天') + '</button>' : '') +
      '<button type="button" class="btn ghost" data-action="help">怎么玩</button>' +
      '<div class="title-save-row">' +
      (preview ? '<button type="button" class="btn ghost small" data-action="save-export">导出存档</button>' : '') +
      '<button type="button" class="btn ghost small" data-action="save-import">导入存档</button>' +
      '</div>' +
      '<input id="save-import-file" type="file" accept=".json,application/json" style="display:none">' +
      '</div>' +
      '<div class="footer-note">2.5D 手账风 · 经营 + 搭配 · 单局 5–10 分钟</div>' +
      (window.__WARDROBE_H5_BUILD__ ? '' : '<a class="proto-link" href="prototype.html">打开 1 位顾客的互动样片 →</a>');
  };

  /* ---------------- 今日简报 ---------------- */

  UI.screens.brief = function (s) {
    var cfg = E.getDayConfig(s.day);
    var weather = E.getWeatherDay(s.day);
    var trend = D.TRENDS[cfg.trend] || { name: cfg.trend || '日常风' };
    var season = cfg.season || E.getSeason(s.day);
    var progress = Math.round(E.getGoalProgress() * 100);
    var yesterday = s.history.length ? s.history[s.history.length - 1] : null;

    var html = header(s, '今日简报');
    html += '<div class="day-banner">' +
      '<div class="day-label">' + esc(season.name) + ' · DAY ' + cfg.dayInSeason + '<span> / ' + s.maxDay + '</span></div>' +
      '<div class="weather-box"><strong>' + esc(weather.icon + ' ' + weather.name) + '</strong>' +
      (weather.event ? '<span class="weather-alert">突发 · 原预报 ' + esc(weather.base.icon + ' ' + weather.base.name) + '</span>' : '今日流行 · ' + esc(trend.name)) +
      '</div>' +
      '</div>' +
      '<div class="season-line">第 ' + cfg.year + ' 年 · ' + esc(season.note || '') +
      (cfg.festival ? ' · <strong>' + esc(cfg.festival.name) + '</strong>' : '') + '</div>';

    html += weatherCardHtml(weather, trend.name);

    html += '<div class="card goal-card">' +
      '<div class="goal-title"><span>今日目标</span><span>' + progress + '%</span></div>' +
      '<div class="goal-text">' + esc(cfg.goal.label) + '</div>' +
      '<div class="goal-progress"><i style="width:' + progress + '%"></i></div>' +
      '</div>';

    html += '<div class="card event-card">' +
      '<div class="event-title">' + esc(cfg.eventTitle) + '</div>' +
      '<div class="event-text">' + esc(cfg.eventText) + '</div>' +
      '</div>';

    html += appointmentStrip(E.getTodayAppointments());

    html += '<div class="card soft"><div class="tip-line"><span class="tip-icon">✎</span><span>' + esc(cfg.tip) + '</span></div></div>';

    if (yesterday) {
      var ySeason = E.getSeason(yesterday.day);
      html += '<div class="card soft"><div class="section-head"><h3>昨日回顾</h3><span class="small">' + esc(ySeason.name) + ' · DAY ' + E.getDayInSeason(yesterday.day) + '</span></div>' +
        '<div class="small muted">营业额 ' + money(yesterday.revenue) + ' · 利润 ' + money(yesterday.profit) + ' · 成交 ' + yesterday.sales + ' 单</div>' +
        '</div>';
    }

    html += '<button type="button" class="btn" data-action="to-prep">准备开店</button>';
    return html;
  };

  /* ---------------- 开店准备 ---------------- */

  var CATS = ['all', 'top', 'bottom', 'dress', 'outer', 'shoes', 'bag', 'hosiery', 'accessory'];

  function categoryTabs(active, action, counts) {
    return '<div class="tabs">' + CATS.map(function (cat) {
      var label = cat === 'all' ? '全部' : D.CATEGORY_LABELS[cat];
      var n = counts && counts[cat] != null ? ' ' + counts[cat] : '';
      return '<button type="button" class="tab' + (active === cat ? ' active' : '') +
        '" data-action="' + action + '" data-id="' + cat + '">' + label + n + '</button>';
    }).join('') + '</div>';
  }

  var SLOTS = ['all', 'neck', 'ear', 'hair', 'eyes', 'wrist', 'waist', 'other'];

  function accessorySlotTabs(active, action) {
    return '<div class="slot-tabs">' + SLOTS.map(function (slot) {
      var label = slot === 'all' ? '全部' : D.ACCESSORY_SLOT_LABELS[slot];
      return '<button type="button" class="slot-tab' + (active === slot ? ' active' : '') +
        '" data-action="' + action + '" data-id="' + slot + '">' + label + '</button>';
    }).join('') + '</div>';
  }

  function filterBySlot(entries, slot) {
    if (!slot || slot === 'all') { return entries; }
    return entries.filter(function (entry) {
      return entry.item.cat === 'accessory' && (entry.item.slot || 'other') === slot;
    });
  }

  var STYLE_KEYS = Object.keys(D.STYLE_LABELS);

  function styleFilterTabs(active, action) {
    return '<div class="style-tabs">' +
      ['all'].concat(STYLE_KEYS).map(function (style) {
        var label = style === 'all' ? '全部风格' : D.STYLE_LABELS[style];
        return '<button type="button" class="style-tab' + (active === style ? ' active' : '') +
          '" data-action="' + action + '" data-id="' + style + '">' + label + '</button>';
      }).join('') + '</div>';
  }

  function filterByStyle(entries, style) {
    if (!style || style === 'all') { return entries; }
    return entries.filter(function (entry) {
      return entry.item.style.indexOf(style) >= 0;
    });
  }

  function supplyCard(entry) {
    var item = entry.item;
    var inCart = entry.qty;
    var price = E.getEffectivePrice(item);
    var cost = entry.cost != null ? entry.cost : E.getSupplyCost(item);
    var seasonTag = entry.season === 'in' ? '<span class="season-tag in">应季</span>'
      : entry.season === 'off' ? '<span class="season-tag off">过季</span>' : '';
    return '<div class="supply-card' + (inCart ? ' in-cart' : '') + '">' +
      '<div class="item-art">' + itemSvg(item) + '</div>' +
      '<div class="item-name">' + esc(item.name) + '</div>' +
      '<div class="item-sub"><span class="price">' + money(price) + '</span>' +
      '<span class="qty">进 ' + money(cost) + '</span></div>' +
      '<div class="supply-meta">库存 ' + entry.owned + ' · 毛利 ' + money(price - cost) + ' ' + seasonTag + '</div>' +
      '<div class="stepper">' +
      '<button type="button" class="step-btn" data-action="cart-minus" data-id="' + item.id + '"' + (inCart ? '' : ' disabled') + '>−</button>' +
      '<span class="step-qty' + (inCart ? ' has' : '') + '">' + inCart + '</span>' +
      '<button type="button" class="step-btn" data-action="cart-plus" data-id="' + item.id + '"' + (inCart >= 4 ? ' disabled' : '') + '>＋</button>' +
      '</div>' +
      '</div>';
  }

  /* ---------------- 开店准备：分页 ---------------- */

  function pctText(n) {
    return (n >= 0 ? '+' : '') + n + '%';
  }

  function weatherCardHtml(w, trendName) {
    if (!w || !w.event) { return ''; }
    var ev = w.event;
    var bits = ['客流 ' + pctText(w.trafficPct) + (w.prepared ? '（已应对）' : '')];
    if (w.demand && w.demand.label) { bits.push(w.demand.label); }
    if (trendName) { bits.push('今日流行 · ' + trendName); }
    if (w.patience < 0) { bits.push('顾客耐心 -1'); }
    else if (w.patience > 0) { bits.push('顾客耐心 +1'); }
    var resp = w.response;
    var html = '<div class="weather-event' + (w.prepared ? ' done' : '') + '">' +
      '<div class="weather-event-top"><span class="weather-flag">突发</span>' +
      '<strong>' + esc(w.icon + ' ' + w.name) + '</strong>' +
      '<span class="weather-base">原预报 ' + esc((w.base.icon || '') + ' ' + (w.base.name || '')) + '</span></div>' +
      '<div class="weather-event-title">' + esc(ev.title) + '</div>' +
      '<div class="weather-event-text">' + esc(ev.text) + '</div>' +
      '<div class="weather-event-meta">' + esc(bits.join(' · ')) + '</div>';
    if (resp) {
      html += w.prepared
        ? '<div class="weather-prep-done">已应对 · ' + esc(resp.label) + '：' + esc(resp.note) + '</div>'
        : '<button type="button" class="btn small weather-prep-btn" data-action="weather-prep">应对 · ' +
          esc(resp.label) + ' · ¥' + resp.cost + '</button>';
    } else {
      html += '<div class="weather-prep-done">这种天气顺势就好，不用额外准备。</div>';
    }
    return html + '</div>';
  }

  function prepTabDefs(s) {
    var appts = E.getTodayAppointments();
    var cartCount = E.getCartCount();
    var windowCount = E.getWindowItems().length;
    var staff = E.getStaff();
    var orders = E.getOpenOrders();
    var decorPct = Math.round((E.getDecorTrafficMult() - 1) * 100);
    return [
      { id: 'today', label: '今日', badge: appts.length ? String(appts.length) : '' },
      { id: 'stock', label: '进货', badge: cartCount ? String(cartCount) : '' },
      { id: 'window', label: '橱窗', badge: windowCount + '/3' },
      { id: 'decor', label: '装修', badge: (decorPct >= 0 ? '+' : '') + decorPct + '%' },
      { id: 'staff', label: '员工', badge: staff.length + '/4' },
      { id: 'studio', label: '工坊', badge: orders.length ? String(orders.length) : '' }
    ];
  }

  function prepTabs(s) {
    var tab = UI._prepTab || 'today';
    var html = '<div class="prep-tabs">';
    prepTabDefs(s).forEach(function (t) {
      html += '<button type="button" class="prep-tab' + (tab === t.id ? ' active' : '') + '" data-action="prep-tab" data-id="' + t.id + '">' +
        '<span>' + t.label + '</span>' +
        (t.badge ? '<b>' + esc(t.badge) + '</b>' : '') +
        '</button>';
    });
    return html + '</div>';
  }

  function prepToday(s) {
    var f = E.getTrafficForecast();
    var appts = E.getTodayAppointments();
    var need = appts.length;
    var counts = E.getCategoryCounts();
    var html = '<div class="prep-intro"><h2>今天只做四个决定</h2>' +
      '<p class="small muted mt6">进货、橱窗、营销、定价。剩下的，交给你的眼光。</p></div>' +
      '<div class="prep-shortcuts">' +
      '<button type="button" class="prep-shortcut" data-action="prep-tab" data-id="stock"><strong>进货</strong><span>散货 / 套装 / 仓库</span></button>' +
      '<button type="button" class="prep-shortcut" data-action="prep-tab" data-id="window"><strong>橱窗</strong><span>主推 / 营销 / 定价</span></button>' +
      '<button type="button" class="prep-shortcut wide" data-action="prep-tab" data-id="decor"><strong>装修店铺</strong><span>家具摆放 / 装修分 ' + E.getDecorScore() + ' · 客流 +' + Math.round((E.getDecorTrafficMult() - 1) * 100) + '%</span></button>' +
      '<button type="button" class="prep-shortcut" data-action="prep-tab" data-id="staff"><strong>员工</strong><span>招聘 / 培训 / 工资</span></button>' +
      '<button type="button" class="prep-shortcut" data-action="prep-tab" data-id="studio"><strong>工坊</strong><span>订单 / 设计</span></button>' +
      '</div>';

    html += weatherCardHtml(f.weather);

    html += '<div class="traffic-card">' +
      '<div class="traffic-head"><strong>今日 ' + appts.length + ' 位预约</strong>' +
      '<span>预计进店 ' + f.visitors + ' 人</span></div>' +
      '<div class="traffic-chips">' +
      '<span class="traffic-chip">基础 ' + f.baseCount + ' 位</span>' +
      '<span class="traffic-chip' + (f.decorPct ? ' on' : '') + '">装修 ' + pctText(f.decorPct) + '</span>' +
      '<span class="traffic-chip' + (f.repPct ? ' on' : '') + '">口碑 ' + pctText(f.repPct) + '</span>' +
      '<span class="traffic-chip' + (f.staffPct ? ' on' : '') + '">店员 ' + pctText(f.staffPct) + '</span>' +
      '<span class="traffic-chip' + (f.weatherPct ? ' on' : '') + '">天气 ' + pctText(f.weatherPct) + '</span>' +
      '</div>' +
      '<div class="traffic-note">预约人数由装修 / 口碑 / 天气 / 店员决定；橱窗、营销和定价也会带来额外预约。</div>' +
      '</div>';

    var floorCap = 3 + E.getStaff().length;
    if (appts.length > floorCap) {
      html += '<div class="hint-box warn">今天 ' + appts.length + ' 位预约，但店里同时最多接待 ' + floorCap +
        ' 位（3 + 店员数）。超出的顾客可能看一眼就走，雇店员或早点接待能留住人。</div>';
    }

    html += appointmentStrip(appts);

    var stockWarn = [];
    if (counts.shoes < need) { stockWarn.push('鞋只剩 ' + counts.shoes + ' 双，今天有 ' + need + ' 位预约'); }
    if (counts.top + counts.dress < need) { stockWarn.push('上装/连衣裙不足'); }
    if (counts.bottom + counts.dress < need) { stockWarn.push('下装/连衣裙不足'); }
    if (stockWarn.length) {
      html += '<div class="hint-box warn">' + stockWarn.join('；') + '。建议补货。</div>';
    }
    if (E.getInventoryCount() < 10) {
      html += '<div class="hint-box warn">衣架只剩 ' + E.getInventoryCount() + ' 件，今天很容易凑不齐一套。建议先进货。</div>';
    }

    return html;
  }

  function prepStock(s) {
    var cartCount = E.getCartCount();
    var cartCost = E.getCartCost();
    var html = '<div class="prep-section"><div class="section-head"><h3>进货</h3><span class="small">现金 ' + money(s.cash) + '</span></div>';
    html += '<div class="sub-head"><h4>散货自选</h4><span class="small muted">单款最多 4 件 · 按进价，无折扣</span></div>';
    var cartCat = s.cartCategory || 'all';
    html += categoryTabs(cartCat, 'supply-category', null);
    if (cartCat === 'accessory') { html += accessorySlotTabs(s.accessorySlot || 'all', 'supply-slot'); }
    html += styleFilterTabs(s.styleFilter || 'all', 'supply-style');
    var supply = filterByStyle(filterBySlot(E.getSupplyEntries(cartCat), cartCat === 'accessory' ? s.accessorySlot : 'all'), s.styleFilter);
    html += '<div class="supply-grid">';
    supply.forEach(function (entry) { html += supplyCard(entry); });
    html += '</div>';

    if (cartCount) {
      html += '<div class="cart-line">' +
        '<span>散货已选 <strong>' + cartCount + '</strong> 件 · 进价合计 <strong>' + money(cartCost) + '</strong></span>' +
        '<button type="button" class="btn ghost small" data-action="cart-clear">清空</button>' +
        '</div>';
    }

    html += '<div class="sub-head"><h4>推荐套装</h4><span class="small muted">打包价约 85 折，和散货可同时买</span></div>';
    (s.todayLots || []).forEach(function (id) {
      var lot = D.LOTS_BY_ID[id];
      if (lot) { html += lotCard(lot, s.pendingLot === id); }
    });
    html += '<button type="button" class="btn ghost small" data-action="select-lot" data-id="none">今天不拿套装</button>';
    html += '<button type="button" class="btn ghost small mt6" data-action="open-wardrobe">查看存货（' + E.getInventoryCount() + ' 件）</button>';
    html += '</div>';

    var storeCount = E.getStoreCount();
    var storeCap = E.getStoreCap();
    var upgradeCost = E.getStoreUpgradeCost();
    html += '<div class="prep-section"><div class="section-head"><h3>仓库</h3>' +
      '<span class="small">货架 ' + E.getShelfCount() + '/' + E.getShelfCap() + ' · 仓库 ' + storeCount + '/' + storeCap + '</span></div>' +
      '<div class="warehouse-bar">' +
      '<span class="small muted">Lv.' + E.getStoreLevel() + '</span>' +
      '<div class="btn-row">' +
      '<button type="button" class="btn ghost small" data-action="restock"' + (storeCount ? '' : ' disabled') + '>补满货架</button>' +
      '<button type="button" class="btn ghost small" data-action="open-warehouse">仓库 / 清仓</button>' +
      '</div></div>' +
      '<div class="small muted mt6">进货先入仓库，再补到货架；货架上限 ' + E.getShelfCap() + ' 件，卖完才会空出位置。' +
      (upgradeCost != null ? '升级仓库 ' + money(upgradeCost) + '，容量 +20。' : '仓库已满级。') + '</div>' +
      '</div>';
    return html;
  }

  function prepWindow(s) {
    var f = E.getTrafficForecast();
    var html = '<div class="prep-section"><div class="section-head"><h3>今日客流</h3><span class="small">预约 ' + E.getTodayAppointments().length + ' 位 · 进店 ' + f.visitors + ' 人</span></div>' +
      '<div class="traffic-chips">' +
      '<span class="traffic-chip on">橱窗 ' + pctText(f.windowPct) + '</span>' +
      '<span class="traffic-chip on">营销 ' + pctText(f.marketingPct) + '</span>' +
      '<span class="traffic-chip on">定价 ' + pctText(f.pricingPct) + '</span>' +
      '</div>' +
      '<div class="traffic-note">这三项会提升进店人数，也会带来额外预约；装修/口碑/天气决定基础客流。</div>' +
      '</div>';

    var windowIds = E.getWindowItems();
    var winPct = Math.round((E.getWindowTrafficMult() - 1) * 100);
    html += '<div class="prep-section"><div class="section-head"><h3>橱窗主推</h3>' +
      '<span class="small">' + windowIds.length + '/3 · 客流 +' + winPct + '%</span></div>';
    var invEntries = E.getWindowCandidates();
    if (!invEntries.length) {
      html += '<div class="hint-box">衣架是空的，先在店里挑几件，或者今天进点货。</div>';
    } else {
      if (windowIds.length) {
        html += '<div class="window-picked">主推：' + windowIds.map(function (id) {
          var it = D.ITEMS_BY_ID[id];
          return it ? esc(it.name) : '';
        }).filter(Boolean).join(' · ') + '</div>';
      } else {
        html += '<p class="small muted mb10">从存货或今天要进的货里挑最多 3 件。1 件 +8%，2 件 +13%，3 件 +16%。</p>';
      }
      html += '<div class="item-grid three">';
      invEntries.forEach(function (entry) {
        var idx = windowIds.indexOf(entry.item.id);
        html += itemCard(entry, {
          action: 'select-window',
          selected: idx >= 0,
          badge: idx >= 0 ? idx + 1 : 0
        });
      });
      html += '</div>';
    }
    html += '</div>';

    html += '<div class="prep-section"><div class="section-head"><h3>今日营销</h3><span class="small">一次只能选一个</span></div>' +
      '<div class="marketing-grid">';
    ['note', 'live', 'flyer', 'none'].forEach(function (id) {
      html += marketingCard(D.MARKETING[id], (s.pendingMarketing || 'none') === id);
    });
    html += '</div></div>';

    html += '<div class="prep-section"><div class="section-head"><h3>定价策略</h3><span class="small">影响客流和成交</span></div>' +
      '<div class="segmented">';
    ['budget', 'standard', 'premium'].forEach(function (id) {
      var p = D.PRICING[id];
      html += '<button type="button" class="' + (s.pricing === id ? 'active' : '') + '" data-action="select-pricing" data-id="' + id + '">' +
        p.name + '<br><span style="font-size:9px;font-weight:400">' + p.desc + '</span></button>';
    });
    html += '</div></div>';
    return html;
  }

  /** 员工头像：优先用等距人物拆件拼一个全身像，失败时退回首字头像 */
  UI.staffPortrait = function (m) {
    if (window.Iso && Iso.character && Iso.character.staffAppearance) {
      try {
        var app = Iso.character.staffAppearance(m);
        var outfit = Iso.character.staffOutfit(m);
        var body = Iso.character.body(app, outfit);
        var head = Iso.character.head(app, 'calm');
        return '<svg class="staff-portrait-svg" viewBox="-46 -168 92 172" xmlns="http://www.w3.org/2000/svg">' +
          body.body + head.body + '</svg>';
      } catch (e) {}
    }
    return '<span class="staff-portrait-fallback">' + esc(String((m && m.name) || '?').slice(0, 1)) + '</span>';
  };

  function staffSkillBars(m) {
    var skills = E.getStaffSkillKeys();
    var html = '<div class="staff-skill-list">';
    skills.forEach(function (key) {
      var lv = (m.skills && m.skills[key]) || 0;
      html += '<div class="staff-skill"><span>' + E.getStaffSkillLabel(key) + '</span><b>' + lv + '</b><div class="skill-pips">';
      for (var i = 1; i <= 5; i++) {
        html += '<i class="' + (i <= lv ? 'on' : '') + '"></i>';
      }
      html += '</div></div>';
    });
    return html + '</div>';
  }

  function staffPerkChips(m) {
    var perks = E.getStaffPerks(m);
    if (!perks.length) { return ''; }
    return '<div class="staff-perks">' + perks.map(function (p) {
      return '<span class="perk-chip ' + (p.good ? 'good' : 'bad') + '" title="' + esc(p.desc) + '">' + esc(p.name) + '</span>';
    }).join('') + '</div>';
  }

  function staffMoraleBar(m) {
    var v = Math.max(0, Math.min(100, m.morale || 0));
    var cls = v < 30 ? 'low' : v < 60 ? 'mid' : 'high';
    return '<div class="staff-morale"><span>士气</span><div class="staff-morale-track"><i class="' + cls + '" style="width:' + v + '%"></i></div><b>' + Math.round(v) + '</b></div>';
  }

  function staffCard(m) {
    var title = E.getStaffTitle(m);
    var role = m.role ? E.getStaffRoleLabel(m.role) : '未定岗';
    var pot = E.getStaffPotential(m);
    var training = m.trainingDay
      ? '培训中 · ' + E.getStaffSkillLabel(m.trainingSkill || 'sales') + ' 明天 +1'
      : '';
    return '<div class="staff-card">' +
      '<div class="staff-card-top">' +
      '<div class="staff-portrait">' + UI.staffPortrait(m) + '</div>' +
      '<div class="staff-main">' +
      '<div class="staff-head"><strong>' + esc(m.name) + '</strong>' +
      '<span class="tag">' + esc(title) + '</span>' +
      (m.manager ? '<span class="tag gold">店长</span>' : '') +
      '<span class="tag' + (m.role ? ' role' : '') + '">' + esc(role) + '</span></div>' +
      '<div class="staff-sub">' + esc(E.getStaffTraitLabel(m.personality)) + ' · 潜力 ' + esc(pot.label) +
      ' · ' + pot.days + ' 天/级</div>' +
      staffSkillBars(m) + staffMoraleBar(m) + staffPerkChips(m) +
      (training ? '<div class="staff-training">' + esc(training) + '</div>' : '') +
      '</div></div>' +
      '<div class="staff-actions">' +
      '<button type="button" class="btn ghost small" data-action="staff-train-menu" data-id="' + m.uid + '"' + (m.trainingDay ? ' disabled' : '') + '>培训</button>' +
      '<button type="button" class="btn ghost small" data-action="staff-role-menu" data-id="' + m.uid + '">岗位</button>' +
      '<button type="button" class="btn ghost small" data-action="staff-bonus" data-id="' + m.uid + '">奖金 ¥100</button>' +
      (m.manager ? '' : '<button type="button" class="btn ghost small" data-action="staff-manager" data-id="' + m.uid + '">任命店长</button>') +
      '<button type="button" class="btn ghost small" data-action="staff-fire" data-id="' + m.uid + '">解雇</button>' +
      '</div></div>';
  }

  function applicantCard(c) {
    var sum = 0;
    E.getStaffSkillKeys().forEach(function (k) { sum += (c.skills && c.skills[k]) || 0; });
    var pot = E.getStaffPotential(c);
    return '<div class="staff-card market">' +
      '<div class="staff-card-top">' +
      '<div class="staff-portrait">' + UI.staffPortrait(c) + '</div>' +
      '<div class="staff-main">' +
      '<div class="staff-head"><strong>' + esc(c.name) + '</strong>' +
      '<span class="tag">' + c.age + ' 岁</span>' +
      '<span class="tag">综合 ' + sum + '</span>' +
      '<span class="tag gold">推荐 ' + esc(E.getStaffRoleLabel(c.recommendedRole)) + '</span></div>' +
      '<div class="staff-sub">' + esc(E.getStaffTraitLabel(c.personality)) + ' · 潜力 ' + esc(pot.label) +
      ' · 日薪 ' + money(c.salary) + '</div>' +
      staffSkillBars(c) + staffPerkChips(c) +
      '</div></div>' +
      '<div class="staff-actions">' +
      '<button type="button" class="btn ghost small" data-action="staff-detail" data-id="' + esc(c.id) + '">查看档案 · 招聘 ' + money(c.hireCost) + '</button>' +
      '</div></div>';
  }

  UI.openApplicant = function (id) {
    var c = (E.state && E.state.staffMarket || []).filter(function (x) { return x.id === id; })[0];
    if (!c) { UI.toast('这个人已经不在市场了'); return; }
    var pot = E.getStaffPotential(c);
    var skills = E.getStaffSkillKeys();
    var html = '<div class="modal-title">应聘档案</div>' +
      '<div class="applicant-hero">' +
      '<div class="staff-portrait large">' + UI.staffPortrait(c) + '</div>' +
      '<div class="applicant-hero-main"><h3>' + esc(c.name) + '</h3>' +
      '<div class="small muted">' + c.age + ' 岁 · ' + esc(E.getStaffTraitLabel(c.personality)) +
      ' · 潜力 <strong>' + esc(pot.label) + '</strong></div>' +
      '<div class="applicant-quote">“' + esc(c.background && c.background.quote || '') + '”</div>' +
      '</div></div>' +
      '<div class="applicant-block"><h4>' + esc(c.background && c.background.title || '履历') + '</h4>' +
      '<p class="small muted">' + esc(c.background && c.background.text || '') + '</p></div>' +
      '<div class="applicant-block"><h4>能力</h4>' + staffSkillBars(c) +
      '<div class="small muted">推荐岗位：' + esc(E.getStaffRoleLabel(c.recommendedRole)) +
      ' · ' + esc(E.getStaffRoleDesc(c.recommendedRole)) + '</div></div>' +
      '<div class="applicant-block"><h4>特质</h4>' + staffPerkChips(c) +
      '<div class="small muted">成长：' + esc(pot.desc) + '。特质会一直跟着她。</div></div>' +
      '<div class="applicant-offer">' +
      '<div><span>日薪</span><strong>' + money(c.salary) + '</strong></div>' +
      '<div><span>招聘费</span><strong>' + money(c.hireCost) + '</strong></div>' +
      '</div>' +
      '<div class="btn-row mt10">' +
      '<button type="button" class="btn" data-action="staff-hire-confirm" data-id="' + esc(c.id) + '">确认招聘</button>' +
      '<button type="button" class="btn ghost" data-action="close-modal">再看看</button>' +
      '</div>';
    UI.modal(html);
  };

  UI.openTraining = function (uid) {
    var m = E.getStaff().filter(function (x) { return x.uid === uid; })[0];
    if (!m) { return; }
    var opts = E.getTrainingOptions(uid);
    var html = '<div class="modal-title">培训 · ' + esc(m.name) + '</div>' +
      '<div class="small muted mb10">选一门课，占用今天一天，明天技能 +1。当前现金 ' + money(E.state.cash) + '。</div>';
    opts.forEach(function (o) {
      html += '<div class="course-row' + (o.maxed ? ' maxed' : '') + '">' +
        '<div><strong>' + esc(o.label) + '</strong><span class="small muted">' + o.level + ' → ' + (o.maxed ? '满级' : o.next) + '</span></div>' +
        '<button type="button" class="btn ghost small" data-action="staff-train-course" data-id="' + uid + '|' + o.skill + '"' +
        (o.maxed ? ' disabled' : '') + '>' + (o.maxed ? '已满级' : '¥' + o.cost) + '</button>' +
        '</div>';
    });
    html += '<button type="button" class="btn ghost mt10" data-action="close-modal">先不培训</button>';
    UI.modal(html);
  };

  UI.openRoleMenu = function (uid) {
    var m = E.getStaff().filter(function (x) { return x.uid === uid; })[0];
    if (!m) { return; }
    var html = '<div class="modal-title">岗位 · ' + esc(m.name) + '</div>' +
      '<div class="small muted mb10">岗位对应技能效果 ×1.25；技能到 3 级还会解锁岗位特性。</div>';
    E.getStaffRoles().forEach(function (r) {
      html += '<div class="course-row' + (m.role === r.id ? ' active' : '') + '">' +
        '<div><strong>' + esc(r.name) + '</strong><span class="small muted">' + esc(r.desc) + '</span></div>' +
        '<button type="button" class="btn ghost small" data-action="staff-role-set" data-id="' + uid + '|' + r.id + '">' +
        (m.role === r.id ? '当前岗位' : '设为' + r.name) + '</button>' +
        '</div>';
    });
    html += '<button type="button" class="btn ghost small mt10" data-action="staff-role-set" data-id="' + uid + '|none">不定岗</button>' +
      '<button type="button" class="btn ghost mt10" data-action="close-modal">关上</button>';
    UI.modal(html);
  };

  function prepStaff(s) {
    var staff = E.getStaff();
    var html = '<div class="prep-section"><div class="section-head"><h3>我的店员</h3>' +
      '<span class="small">' + staff.length + '/4 · 日薪 ' + money(E.getStaffWages()) + '</span></div>' +
      '<div class="small muted mb6">招到的店员会直接出现在店铺里；客人进店时，其中一位会去门口迎接。</div>';
    if (staff.length) {
      staff.forEach(function (m) { html += staffCard(m); });
    } else {
      html += '<div class="small muted">还没有员工。招聘后店员会出现在店里，销售、整理、陈列、搭配会有加成，但每天要发工资。</div>';
    }
    html += '</div>';

    var market = s.staffMarket || [];
    if (market.length) {
      html += '<div class="prep-section"><div class="section-head"><h3>今日应聘</h3><span class="small">每天刷新 3 位</span></div>' +
        '<div class="small muted mb6">先看档案再决定；招聘费是一次性的，日薪每天结算。</div>';
      market.forEach(function (c) { html += applicantCard(c); });
      html += '</div>';
    }
    return html;
  }

  function prepStudio(s) {
    var orders = E.getOpenOrders();
    var designs = E.getDesigns();
    var html = '<div class="prep-section"><div class="section-head"><h3>线上订单</h3>' +
      '<span class="small">' + orders.length + ' 单待交付</span></div>';
    if (orders.length) {
      orders.forEach(function (o) {
        var left = Math.max(0, o.deadlineDay - s.day + 1);
        if (o.kind === 'design') {
          var c = customerById(o.customerId);
          var w = o.want || {};
          var fabric = D.DESIGN.fabrics.filter(function (f) { return f.id === w.fabric; })[0];
          var deco = D.DESIGN.decorations.filter(function (d) { return d.id === w.deco; })[0];
          var matched = E.findOrderMatches(o).length;
          html += '<div class="order-card design' + (left <= 1 ? ' urgent' : '') + '">' +
            '<div class="order-head"><strong>设计单 · ' + esc(c ? c.name : '线上顾客') + '</strong>' +
            '<span class="order-price">预算 ' + money(w.budget || 0) + '</span></div>' +
            '<div class="order-sub">想要 <b>' + esc(D.COLOR_LABELS[w.color] || w.color) + ' · ' +
            esc(fabric ? fabric.name : '') + (deco ? ' · ' + esc(deco.name) : '') + ' ' +
            esc(D.CATEGORY_LABELS[w.cat] || w.cat) + '</b></div>' +
            '<div class="order-sub">剩 ' + left + ' 天 · 评分 ≥ ' + (w.minScore || 70) + ' · 成交价 = 设计定价 +15%</div>' +
            '<div class="staff-actions">' +
            '<button type="button" class="btn small" data-action="design-order" data-id="' + o.id + '">去设计</button>' +
            (matched ? '<button type="button" class="btn ghost small" data-action="order-deliver" data-id="' + o.id + '">交付现有设计</button>' : '') +
            '</div></div>';
          return;
        }
        html += '<div class="order-card' + (left <= 1 ? ' urgent' : '') + '">' +
          '<div class="order-head">' +
          '<strong>' + esc(D.CATEGORY_LABELS[o.want.cat] || o.want.cat) + ' · ' +
          esc(D.STYLE_LABELS[o.want.style] || o.want.style) + ' · ' +
          esc(D.COLOR_LABELS[o.want.color] || o.want.color) + '</strong>' +
          '<span class="order-price">' + money(o.price) + '</span></div>' +
          '<div class="order-sub">要 ' + o.qty + ' 件 · 剩余 ' + left + ' 天' +
          (left <= 1 ? ' · 今天必须交付' : '') + '</div>' +
          '<div class="staff-actions"><button type="button" class="btn ghost small" data-action="order-deliver" data-id="' + o.id + '">交付</button></div>' +
          '</div>';
      });
    } else {
      html += '<div class="small muted">今天没有线上订单。粉丝越多，订单越多。</div>';
    }
    html += '</div>';

    html += '<div class="prep-section"><div class="section-head"><h3>设计工坊</h3>' +
      '<span class="small">' + designs.length + ' 件作品</span></div>' +
      '<div class="small muted mb6">自己配版型、布料、装饰，评分越高定价越高；80 分以上进高定区。</div>' +
      '<div class="small muted mb6">高定 ' + E.getCoutureDesigns().length + ' 件 · 模特位 ' + E.getCoutureSlots() +
      ' · VIP 到店概率 ' + Math.round(E.getVipChance() * 100) + '%</div>';
    var latest = designs.slice(-3).reverse();
    if (latest.length) {
      html += '<div class="design-mini-gallery">';
      latest.forEach(function (d) {
        var cfg = {
          cat: d.cat, silhouette: d.silhouette || ((D.DESIGN.silhouettes[d.cat] || [])[0] || {}).id,
          fabric: d.fabricId, pattern: d.pattern || 'none', color: d.color,
          deco: d.decor || [], priceMode: 'mid', name: d.name,
          custom: d.custom || null, print: d.print || null
        };
        html += '<button type="button" class="design-mini-card" data-action="design-gallery-open" data-id="' + d.id + '">' +
          '<img src="' + designPreviewUrl(cfg, 'front', 'mannequin', true) + '" alt="">' +
          '<span>' + d.score + ' 分</span></button>';
      });
      html += '</div>';
    }
    html += '<button type="button" class="btn ghost small" data-action="open-design">' +
      (E.state.designDay === s.day ? '今天已经设计过了' : '打开工坊 · 设计一件独家款') + '</button>' +
      '</div>';
    return html;
  }

  function prepActionBar(s) {
    var cartCost = E.getCartCost();
    var lot = s.pendingLot ? D.LOTS_BY_ID[s.pendingLot] : null;
    var mkt = s.pendingMarketing ? D.MARKETING[s.pendingMarketing] : D.MARKETING.none;
    var lotCost = lot ? E.getLotCost(lot) : 0;
    var mktCost = mkt ? mkt.cost : 0;
    var wages = E.getStaffWages();
    var cost = lotCost + cartCost + mktCost + wages;
    var after = s.cash - cost;
    var f = E.getTrafficForecast();
    var costNote = [];
    if (cartCost) { costNote.push('散货 ' + money(cartCost)); }
    if (lotCost) { costNote.push('套装 ' + money(lotCost)); }
    if (mktCost) { costNote.push('营销 ' + money(mktCost)); }
    if (wages) { costNote.push('工资 ' + money(wages)); }
    return '<div class="prep-actionbar">' +
      '<div class="prep-actionbar-main">' +
      '<div class="prep-actionbar-row"><span>预计支出</span><strong>' + money(cost) + '</strong></div>' +
      '<div class="prep-actionbar-row"><span>开门后</span><span class="' + (after < 0 ? 'neg' : '') + '">' + money(after) + '</span></div>' +
      '<div class="prep-actionbar-sub">预约 ' + f.count + ' 位 · 预计进店 ' + f.visitors + ' 人' +
      (costNote.length ? ' · ' + costNote.join(' / ') : '') + '</div>' +
      '</div>' +
      '<button type="button" class="btn" data-action="open-shop"' + (after < 0 ? ' disabled' : '') + '>开门营业</button>' +
      (after < 0 ? '<div class="prep-actionbar-warn">现金不够，先调整方案</div>' : '') +
      '</div>';
  }

  UI.screens.prep = function (s) {
    E.syncAppointments();
    var tab = UI._prepTab || 'today';
    var html = header(s, '开店准备');
    html += prepTabs(s);
    html += '<div class="prep-tab-body">';
    if (tab === 'stock') { html += prepStock(s); }
    else if (tab === 'window') { html += prepWindow(s); }
    else if (tab === 'decor') { html += prepDecor(s); }
    else if (tab === 'staff') { html += prepStaff(s); }
    else if (tab === 'studio') { html += prepStudio(s); }
    else { html += prepToday(s); }
    html += '</div>';
    html += prepActionBar(s);
    return html;
  };

  /* ---------------- 衣橱（存货总览） ---------------- */

  UI.wardrobeHtml = function (s) {
    var summary = E.getWardrobeSummary();
    var invCat = s.invCategory || 'all';
    var counts = { all: summary.pieces };
    E.getInventoryEntries('all').forEach(function (entry) {
      counts[entry.item.cat] = (counts[entry.item.cat] || 0) + entry.qty;
    });
    var html = '<div class="modal-title">衣橱</div>' +
      '<div class="wardrobe-summary">' +
      '<div><strong>' + summary.pieces + '</strong><span>件在架</span></div>' +
      '<div><strong>' + summary.kinds + '</strong><span>个款式</span></div>' +
      '<div><strong>' + money(summary.costBasis) + '</strong><span>占用成本</span></div>' +
      '<div><strong>' + money(summary.retailValue) + '</strong><span>现价全售</span></div>' +
      '</div>';
    html += categoryTabs(invCat, 'wardrobe-category', counts);
    if (invCat === 'accessory') { html += accessorySlotTabs(s.accessorySlot || 'all', 'wardrobe-slot'); }
    html += styleFilterTabs(s.styleFilter || 'all', 'wardrobe-style');
    var entries = filterByStyle(filterBySlot(E.getInventoryEntries(invCat === 'all' ? null : invCat), invCat === 'accessory' ? s.accessorySlot : 'all'), s.styleFilter);
    if (entries.length) {
      html += '<div class="item-grid three">';
      entries.forEach(function (entry) {
        html += itemCard(entry, { showCost: true });
      });
      html += '</div>';
    } else {
      html += '<div class="hint-box">这个分类没有存货。去进货挑几件吧。</div>';
    }
    html += '<button type="button" class="btn mt14" data-action="close-modal">关上柜门</button>';
    return html;
  };

  UI.openWardrobe = function () {
    var s = E.state;
    if (!s) { return; }
    UI.modal(UI.wardrobeHtml(s));
  };

  /* ---------------- 仓库 / 清仓 ---------------- */

  UI.warehouseHtml = function (s) {
    var entries = E.getStoreEntries('all');
    var sel = UI._clearSel || {};
    var cost = E.getStoreUpgradeCost();
    var count = 0;
    var cash = 0;
    entries.forEach(function (e) {
      if (sel[e.item.id]) { count += e.qty; cash += e.clearPrice * e.qty; }
    });
    var html = '<div class="modal-title">仓库</div>' +
      '<div class="wardrobe-summary warehouse-summary">' +
      '<div><strong>' + E.getShelfCount() + '/' + E.getShelfCap() + '</strong><span>货架</span></div>' +
      '<div><strong>' + E.getStoreCount() + '/' + E.getStoreCap() + '</strong><span>仓库</span></div>' +
      '<div><strong>Lv.' + E.getStoreLevel() + '</strong><span>仓库等级</span></div>' +
      '<div><strong>' + (cost == null ? '满级' : money(cost)) + '</strong><span>升级费用</span></div>' +
      '</div>';
    html += '<div class="btn-row mb10">' +
      '<button type="button" class="btn ghost small" data-action="restock"' + (E.getStoreCount() ? '' : ' disabled') + '>补满货架</button>' +
      '<button type="button" class="btn ghost small" data-action="upgrade-store"' + (cost == null ? ' disabled' : '') + '>' +
      (cost == null ? '已满级' : '升级 ' + money(cost)) + '</button>' +
      '</div>';

    if (!entries.length) {
      html += '<div class="hint-box">仓库是空的。进货会先放进仓库，再补到货架。</div>';
    } else {
      html += '<div class="small muted mb6">清仓按现价 30% 回款，从仓库直接出清。</div>';
      html += '<div class="warehouse-list">';
      entries.forEach(function (e) {
        var on = !!sel[e.item.id];
        html += '<button type="button" class="warehouse-row' + (on ? ' on' : '') + '" data-action="warehouse-toggle" data-id="' + e.item.id + '">' +
          '<span class="wh-check">' + (on ? '✓' : '') + '</span>' +
          '<span class="wh-name">' + esc(e.item.name) + '</span>' +
          '<span class="wh-qty">×' + e.qty + '</span>' +
          '<span class="wh-price">' + money(e.clearPrice) + '</span>' +
          '</button>';
      });
      html += '</div>';
    }
    html += '<button type="button" class="btn mt10" data-action="warehouse-clear"' + (count ? '' : ' disabled') + '>' +
      '清仓选中 · ' + count + ' 件 / ' + money(cash) + '</button>' +
      '<button type="button" class="btn ghost" data-action="close-modal">关上仓库</button>';
    return html;
  };

  UI.openWarehouse = function () {
    var s = E.state;
    if (!s) { return; }
    UI.modal(UI.warehouseHtml(s));
  };

  /* ---------------- 店铺装修 ---------------- */

  UI.decorHtml = function (s) {
    var placed = E.getPlacedFurniture();
    var audit = E.getDecorAudit();
    var bars = audit.breakdown.map(function (d) {
      var pct = Math.round(d.score / d.max * 100);
      return '<div class="decor-bar"><span>' + esc(d.label) + '</span>' +
        '<div class="decor-bar-track"><i class="' + d.key + '" style="width:' + pct + '%"></i></div>' +
        '<b>' + d.score + '</b></div>';
    }).join('');
    var hints = audit.hints.length
      ? '<div class="decor-hints">' + audit.hints.map(function (h) { return '<span>' + esc(h) + '</span>'; }).join('') + '</div>'
      : '';
    var html = '<div class="decor-audit">' +
      '<div class="decor-audit-top">' +
      '<div class="decor-score-big"><strong>' + audit.score + '</strong><span>' + audit.grade.key + ' · ' + esc(audit.grade.label) + '</span></div>' +
      '<div class="decor-audit-main"><b>' + esc(audit.taste.label) + '</b>' +
      '<span>占用 ' + audit.cellsUsed + '/' + audit.cellsTotal + ' 格 · 空置 ' + audit.emptyPct + '% · 客流 +' + audit.trafficPct + '%</span>' +
      '<span>' + audit.unique + ' 种家具 / 共 ' + audit.total + ' 件' + (audit.duplicatePenalty ? ' · 同款扣分 -' + audit.duplicatePenalty : '') + '</span></div>' +
      '</div>' +
      '<div class="decor-bars">' + bars + '</div>' + hints +
      '</div>' +
      '<div class="small muted mb6">' +
      (UI._placeId ? '点一个空格子放下「' + esc(D.FURNITURE_BY_ID[UI._placeId].name) + '」' : '点选家具可以旋转 / 收起；拖动已摆好的家具可以换位置。') +
      '</div>' +
      '<div class="decor-preview" id="decor-preview"></div>' +
      '<div class="decor-grid" id="decor-grid" style="grid-template-columns:repeat(' + D.SHOP_GRID.cols + ',1fr);grid-template-rows:repeat(' + D.SHOP_GRID.rows + ',1fr)">';
    for (var gy = 0; gy < D.SHOP_GRID.rows; gy++) {
      for (var gx = 0; gx < D.SHOP_GRID.cols; gx++) {
        html += '<div class="decor-cell" data-x="' + gx + '" data-y="' + gy + '"></div>';
      }
    }
    placed.forEach(function (f) {
      var baseW = f.item.w * 40;
      var baseH = f.item.h * 40;
      var art = f.rot
        ? '<svg viewBox="0 0 ' + baseH + ' ' + baseW + '" preserveAspectRatio="none">' +
          '<g transform="translate(' + baseH + ' 0) rotate(90)">' + D.furnitureArt(f.item.art, f.item.w, f.item.h) + '</g></svg>'
        : '<svg viewBox="0 0 ' + baseW + ' ' + baseH + '" preserveAspectRatio="none">' +
          D.furnitureArt(f.item.art, f.item.w, f.item.h) + '</svg>';
      html += '<div class="decor-item' + (UI._decorSel === f.uid ? ' sel' : '') + '" data-uid="' + f.uid + '"' +
        ' style="left:' + (f.x / D.SHOP_GRID.cols * 100) + '%;top:' + (f.y / D.SHOP_GRID.rows * 100) + '%;width:' + (f.w / D.SHOP_GRID.cols * 100) + '%;height:' + (f.h / D.SHOP_GRID.rows * 100) + '%">' +
        art +
        '<span class="decor-name">' + esc(f.item.name) + '</span>' +
        '<span class="decor-size">' + f.w + '×' + f.h + '</span></div>';
    });
    html += '<div class="decor-ghost" id="decor-ghost"></div>';
    html += '</div>';

    if (UI._decorSel) {
      html += '<div class="btn-row mt10">' +
        '<button type="button" class="btn ghost small" data-action="decor-rotate">旋转</button>' +
        '<button type="button" class="btn ghost small" data-action="decor-store">收起</button>' +
        '</div>';
    }

    var waiting = D.FURNITURE.filter(function (def) { return E.getFurnitureUnplaced(def.id) > 0; });
    if (waiting.length) {
      html += '<div class="small muted mt10 mb6">待摆放</div>';
      waiting.forEach(function (def) {
        html += '<button type="button" class="btn ghost small" data-action="decor-place" data-id="' + def.id + '">' +
          esc(def.name) + ' ×' + E.getFurnitureUnplaced(def.id) +
          ' · ' + def.w + '×' + def.h + ' · ' + esc(def.styleLabel) +
          (UI._placeId === def.id ? ' · 选格子' : '') + '</button>';
      });
    }

    html += '<div class="small muted mt10 mb6">家具店 · 同款超过 2 件会触发堆料扣分</div>';
    D.FURNITURE.forEach(function (def) {
      if (def.price <= 0) { return; }
      html += '<div class="decor-shop-row">' +
        '<span class="decor-shop-name">' + esc(def.name) +
        '<small>' + esc(def.styleLabel) + ' · ' + esc(def.kindLabel) + ' · ' + def.w + '×' + def.h +
        ' · 装修 +' + ((def.effects && def.effects.decor) || 0) + '</small></span>' +
        '<span class="decor-shop-price">' + money(def.price) + '</span>' +
        '<button type="button" class="btn ghost small" data-action="decor-buy" data-id="' + def.id + '">买</button>' +
        '</div>';
    });

    return html;
  };

  function prepDecor(s) {
    var decor = E.getDecorScore();
    var pct = Math.round((E.getDecorTrafficMult() - 1) * 100);
    var html = '<div class="prep-section">' +
      '<div class="section-head"><h3>店铺装修</h3><span class="small">装修分 ' + decor + ' · 客流 +' + pct + '%</span></div>' +
      '<div class="small muted mb10">家具摆好后会立刻刷新店铺舞台和今日客流，不用另外保存。货架数量还会决定存货容量。</div>' +
      UI.decorHtml(s) +
      '<button type="button" class="btn mt10" data-action="decor-done">摆好了，回今日</button>' +
      '</div>';
    return html;
  }

  UI.openDecor = function () {
    UI._prepTab = 'decor';
    UI._screenSig = '';
    UI.render();
    UI.scrollTop();
  };

  UI.refreshDecor = function () {
    UI._screenSig = '';
    UI.render();
  };

  /* ---------------- 设计工坊旧版已移除 ---------------- */

  UI.bindDecorGrid = function () {
    var grid = document.getElementById('decor-grid');
    if (!grid) { return; }
    var byUid = {};
    E.getPlacedFurniture().forEach(function (f) { byUid[f.uid] = f; });

    function cellFromEvent(ev) {
      var r = grid.getBoundingClientRect();
      var cw = r.width / D.SHOP_GRID.cols;
      var ch = r.height / D.SHOP_GRID.rows;
      return {
        x: Math.max(0, Math.min(D.SHOP_GRID.cols - 1, Math.floor((ev.clientX - r.left) / cw))),
        y: Math.max(0, Math.min(D.SHOP_GRID.rows - 1, Math.floor((ev.clientY - r.top) / ch)))
      };
    }

    function hidePreview() {
      var ghost = document.getElementById('decor-ghost');
      var bar = document.getElementById('decor-preview');
      if (ghost) { ghost.classList.remove('show', 'bad'); }
      if (bar) { bar.style.display = 'none'; bar.innerHTML = ''; }
    }

    function showPreview(x, y) {
      if (!UI._placeId) { return; }
      var def = D.FURNITURE_BY_ID[UI._placeId];
      var ghost = document.getElementById('decor-ghost');
      var bar = document.getElementById('decor-preview');
      if (!def || !ghost || !bar) { return; }
      var pv = E.previewDecorPlacement(UI._placeId, x, y, 0);
      ghost.style.left = (x / D.SHOP_GRID.cols * 100) + '%';
      ghost.style.top = (y / D.SHOP_GRID.rows * 100) + '%';
      ghost.style.width = (def.w / D.SHOP_GRID.cols * 100) + '%';
      ghost.style.height = (def.h / D.SHOP_GRID.rows * 100) + '%';
      ghost.classList.add('show');
      ghost.classList.toggle('bad', !pv.ok);
      bar.style.display = 'block';
      if (pv.ok) {
        bar.innerHTML = '放下后：装修分 ' + pv.before.score + ' → <strong>' + pv.after.score + '</strong>（' +
          (pv.deltaScore >= 0 ? '+' : '') + pv.deltaScore + '） · 客流 +' + pv.before.trafficPct +
          '% → +' + pv.after.trafficPct + '% · ' + esc(pv.after.taste.label);
      } else {
        bar.textContent = pv.message || '这个位置放不下';
      }
    }

    grid.addEventListener('pointermove', function (e) {
      if (!UI._placeId) { return; }
      var c = cellFromEvent(e);
      showPreview(c.x, c.y);
    });
    grid.addEventListener('pointerleave', hidePreview);

    grid.addEventListener('click', function (e) {
      var cell = e.target.closest ? e.target.closest('.decor-cell') : null;
      if (!cell || !UI._placeId) { return; }
      var x = parseInt(cell.getAttribute('data-x'), 10);
      var y = parseInt(cell.getAttribute('data-y'), 10);
      var pv = E.previewDecorPlacement(UI._placeId, x, y, 0);
      var res = E.placeFurniture(UI._placeId, x, y);
      if (res.ok) {
        UI._placeId = null;
        hidePreview();
        UI.refreshDecor();
        if (pv.ok) {
          UI.toast('装修分 ' + pv.before.score + ' → ' + pv.after.score + ' · 客流 +' + pv.after.trafficPct + '%');
        }
      } else {
        UI.toast(res.message || '放不下');
      }
    });

    Array.prototype.forEach.call(grid.querySelectorAll('.decor-item'), function (el) {
      var uid = el.getAttribute('data-uid');
      var f = byUid[uid];
      if (!f) { return; }
      el.addEventListener('pointerdown', function (e) {
        if (e.button !== undefined && e.button !== 0) { return; }
        e.preventDefault();
        var startX = e.clientX;
        var startY = e.clientY;
        var moved = false;
        UI._decorSel = uid;
        el.setPointerCapture && el.setPointerCapture(e.pointerId);

        function move(ev) {
          if (!moved && (Math.abs(ev.clientX - startX) > 6 || Math.abs(ev.clientY - startY) > 6)) {
            moved = true;
          }
          if (moved) {
            el.style.transform = 'translate(' + (ev.clientX - startX) + 'px,' + (ev.clientY - startY) + 'px)';
          }
        }
        function up(ev) {
          el.removeEventListener('pointermove', move);
          el.removeEventListener('pointerup', up);
          el.removeEventListener('pointercancel', up);
          var before = E.getDecorAudit();
          if (moved) {
            var r = grid.getBoundingClientRect();
            var cellW = r.width / D.SHOP_GRID.cols;
            var cellH = r.height / D.SHOP_GRID.rows;
            var x = Math.round((ev.clientX - r.left) / cellW - f.w / 2);
            var y = Math.round((ev.clientY - r.top) / cellH - f.h / 2);
            x = Math.max(0, Math.min(D.SHOP_GRID.cols - f.w, x));
            y = Math.max(0, Math.min(D.SHOP_GRID.rows - f.h, y));
            var res = E.moveFurniture(uid, x, y);
            if (!res.ok) { UI.toast(res.message || '放不下'); }
            else {
              var after = E.getDecorAudit();
              if (after.score !== before.score) {
                UI.toast('装修分 ' + before.score + ' → ' + after.score + ' · ' + after.taste.label);
              }
            }
          }
          UI.refreshDecor();
        }
        el.addEventListener('pointermove', move);
        el.addEventListener('pointerup', up);
        el.addEventListener('pointercancel', up);
      });
    });
  };

  /* ---------------- 接待对话 ---------------- */

  UI.screens.chat = function (s) {
    var c = E.currentCustomer();
    if (!c) { return UI.screens.settle(s); }
    var iso = !!(window.Scene && Scene._isoOn);
    var d = E.getDialogue(c);
    var beat = E.getChatBeat();
    var html = header(s, '接待中');
    html += queueStrip(s);
    html += '<div class="chat-stats">' + affinityBar(s) + patienceHearts(s) + '</div>';
    html += wishCard(s, c);

    if (iso) {
      html += revealChips(s, c);
      html += '<div class="iso-chat-tip">看她的表情和动作。她吃哪一套，比台词本身更重要。</div>';
      if (s.careUsed && s.careLine) {
        html += '<div class="care-note">💧 ' + esc(s.careLine) + '</div>';
      } else {
        html += '<button type="button" class="btn secondary small care-btn" data-action="care-water">💧 给她倒杯温水</button>';
      }
      html += '<button type="button" class="btn ghost small mt10" data-action="skip-chat">跳过寒暄，直接挑衣服</button>';
      return html;
    }

    if (s.chatPhase === 'done') {
      html += '<div class="card dialogue-card done">' +
        '<div class="dialogue-kicker">聊得差不多了</div>' +
        (iso ? '' : '<div class="dialogue-line customer">“那……就拜托你了。”</div>') +
        revealChips(s, c) +
        '<div class="hint-box mt10">她愿意试穿 ' + Math.max(1, s.patience) + ' 次。好感越高，越容易听到真话，也更愿意给小费。</div>' +
        '<button type="button" class="btn mt14" data-action="start-service">开始帮她挑衣服</button>' +
        '</div>';
      return html;
    }

    html += '<div class="card dialogue-card">' +
      '<div class="dialogue-kicker">' + esc(c.name) + ' · ' + esc(c.occasion) + ' · 预算 ' + money(c.budget) + '</div>';

    if (s.chatPhase === 'reply' && s.chatReply) {
      var lastPlayer = '';
      for (var li = s.dialogueLog.length - 1; li >= 0; li--) {
        if (s.dialogueLog[li].who === 'player') { lastPlayer = s.dialogueLog[li].text; break; }
      }
      var lastBeat = s.chatStep + 1 >= d.beats.length;
      html += (iso ? '' : (lastPlayer ? '<div class="dialogue-line player">“' + esc(lastPlayer) + '”</div>' : '') +
        '<div class="dialogue-line reply">“' + esc(s.chatReply.text) + '”</div>') +
        '<div class="dialogue-meta">' +
        '<span class="tone-tag ' + s.chatReply.tone + '">' + esc(D.TONE_LABELS[s.chatReply.tone] || '') + '</span>' +
        (s.chatReply.match ? '<span class="affinity-gain">说对了 · 好感 +' + s.chatReply.delta + '</span>' :
          '<span class="affinity-loss">不太对味 · 好感 ' + s.chatReply.delta + '</span>') +
        '</div>' +
        revealChips(s, c) +
        '<button type="button" class="btn mt14" data-action="' + (lastBeat ? 'start-service' : 'chat-next') + '">' +
        (lastBeat ? '好，开始帮她挑衣服' : '继续聊') + '</button>';
    } else {
      html += '<div class="dialogue-choices">';
      (beat ? beat.choices : []).forEach(function (choice, index) {
        html += '<button type="button" class="dialogue-choice" data-action="chat-choice" data-id="' + index + '">' +
          '<span class="tone-tag ' + choice.tone + '">' + esc(D.TONE_LABELS[choice.tone] || '') + '</span>' +
          '<span class="dialogue-choice-text">' + esc(choice.text) + '</span>' +
          '</button>';
      });
      html += '</div>' +
        '<div class="dialogue-tip">看她的表情和动作。她吃哪一套，比台词本身更重要。</div>';
    }
    html += '</div>';

    if (s.careUsed && s.careLine) {
      html += '<div class="care-note">💧 ' + esc(s.careLine) + '</div>';
    } else {
      html += '<button type="button" class="btn secondary small care-btn" data-action="care-water">💧 给她倒杯温水</button>';
    }

    html += '<button type="button" class="btn ghost small mt10" data-action="skip-chat">跳过寒暄，直接挑衣服</button>';
    return html;
  };

  UI.screens.customer = function (s) {
    return UI.screens.chat(s);
  };

  /* ---------------- 服务 / 搭配 ---------------- */

  UI.screens.service = function (s) {
    var c = E.currentCustomer();
    if (!c) { return UI.screens.settle(s); }
    var html = header(s, '帮她挑衣服');
    html += queueStrip(s);
    html += '<div class="service-meta">' +
      '<div class="avatar tiny-avatar">' + avatarSvg(c) + '</div>' +
      '<div class="service-meta-info"><strong>' + esc(c.name) + '</strong><span>' + esc(c.occasion) + ' · 预算 ' + money(c.budget) + '</span></div>' +
      '<div class="service-meta-stat"><span>好感 ' + esc(E.getAffinityLabel()) + '</span><span>试穿 ' + E.getPatienceLeft() + ' 次</span></div>' +
      '</div>';
    html += poseButtonsHtml(s);
    html += '<div class="card soft"><div class="small muted">“' + esc(c.request) + '”</div>' +
      '<div class="chips mt6"><span class="tag gold">预算 ' + money(c.budget) + '</span>' +
      '<span class="tag">偏好 ' + styleLabels(c.styles).join(' / ') + '</span>' +
      '<span class="tag warn">避雷 ' + styleLabels(c.avoid).join(' / ') + '</span></div>' +
      revealChips(s, c) + '</div>';
    html += s.serviceMode === 'quick' ? wishCard(s, c) : extrasCard(s, c);

    if (s.serviceMode === 'quick') {
      html += '<div class="section-head"><h3>给她推荐一套</h3><span class="small">价格已按今日定价</span></div>' +
        '<div class="small muted mb6">三个方向各有利弊。先选一个上身看看，不合适再换。</div>';
      if (s.quickOptions && s.quickOptions.length) {
        s.quickOptions.forEach(function (opt, index) {
          html += optionCard(opt, index, E.evaluateExtras(c, opt.items));
        });
      } else {
        var missing = E.getMissingForOutfit();
        html += '<div class="hint-box warn">库存里还凑不出一套完整的搭配' +
          (missing.length ? '，缺：' + missing.join('、') : '') +
          '。先去进货，或者让她先看看。</div>';
        html += '<button type="button" class="btn secondary" data-action="resolve-empty">让她先看看</button>';
      }
      if (c.styling) {
        html += '<button type="button" class="btn sage mt14" data-action="open-styling">我自己搭一套</button>';
        html += '<p class="small muted center mt6">自己搭的上限更高，也更容易踩雷。</p>';
      } else {
        html += '<button type="button" class="btn sage mt14" data-action="open-styling">我帮她搭一套</button>';
        html += '<p class="small muted center mt6">她本来只想听推荐，但你可以多试一次。</p>';
      }
      return html;
    }

    // 搭配台
    html += '<button type="button" class="btn ghost small mb10" data-action="back-to-options">← 返回推荐方案</button>';
    var cats = CATS;
    var activeCat = s.activeCategory || 'all';
    html += '<div class="tabs">';
    cats.forEach(function (cat) {
      var count = E.getInventoryEntries(cat === 'all' ? null : cat).length;
      var label = cat === 'all' ? '全部' : D.CATEGORY_LABELS[cat];
      html += '<button type="button" class="tab' + (activeCat === cat ? ' active' : '') + '" data-action="set-category" data-id="' + cat + '">' +
        label + ' ' + count + '</button>';
    });
    html += '</div>';
    if (activeCat === 'accessory') { html += accessorySlotTabs(s.accessorySlot || 'all', 'set-accessory-slot'); }
    html += styleFilterTabs(s.styleFilter || 'all', 'set-style');

    var entries = filterByStyle(filterBySlot(E.getInventoryEntries(activeCat === 'all' ? null : activeCat), activeCat === 'accessory' ? s.accessorySlot : 'all'), s.styleFilter);
    if (entries.length) {
      html += '<div class="item-grid three">';
      entries.forEach(function (entry) {
        html += itemCard(entry, {
          action: 'toggle-item',
          selected: s.selectedItems.indexOf(entry.item.id) >= 0
        });
      });
      html += '</div>';
    } else {
      html += '<div class="hint-box">这个分类暂时没有库存。换个分类看看，或者明天进货。</div>';
    }

    var total = E.getOutfitTotal(s.selectedItems);
    var over = total > c.budget;
    var selectedNames = s.selectedItems.map(function (id) {
      var it = itemById(id);
      return it ? it.name : '';
    }).filter(Boolean);
    var hasShoes = s.selectedItems.some(function (id) { var it = itemById(id); return it && it.cat === 'shoes'; });
    var hasDress = s.selectedItems.some(function (id) { var it = itemById(id); return it && it.cat === 'dress'; });
    var hasTop = s.selectedItems.some(function (id) { var it = itemById(id); return it && it.cat === 'top'; });
    var hasBottom = s.selectedItems.some(function (id) { var it = itemById(id); return it && it.cat === 'bottom'; });
    var missing = [];
    if (!hasShoes) { missing.push('鞋'); }
    if (!hasDress && !hasTop) { missing.push('上装'); }
    if (!hasDress && !hasBottom) { missing.push('下装'); }

    if (s.itemReaction) {
      html += '<div class="reaction-bubble">' +
        '<div class="avatar tiny-avatar">' + avatarSvg(c) + '</div>' +
        '<div><div class="reaction-name">' + esc(c.name) + '</div>' +
        '<div class="reaction-text">“' + esc(s.itemReaction.text) + '”</div></div>' +
        '</div>';
    }

    var left = E.getPatienceLeft();
    if (s.lastTry) {
      html += '<div class="try-feedback">' +
        '<div class="try-head"><span>她的试穿反馈</span><strong>' + s.lastTry.score + ' 分</strong></div>' +
        '<div class="try-hint">' + esc(s.lastTry.hint) + '</div>' +
        '<div class="small muted mt6">这是她的直觉，不是最终结果。' +
        (left > 0 ? '还可以再试 ' + left + ' 次。' : '她已经有点累了，做决定吧。') +
        '</div>' +
        '</div>';
    }

    html += '<div class="slot-tray">' +
      '<div class="slot-list">' +
      (selectedNames.length ? selectedNames.map(function (n) { return '<span class="slot-chip">' + esc(n) + '</span>'; }).join('') :
        '<span class="slot-empty">还没选衣服。上装 + 下装 + 鞋，是最稳的组合。</span>') +
      '</div>' +
      '<div class="budget-line"><span>合计 <strong>' + money(total) + '</strong> / 预算 ' + money(c.budget) + '</span><span>' + (over ? '超预算' : '在预算内') + '</span></div>' +
      '<div class="budget-bar"><i class="' + (over ? 'over' : '') + '" style="width:' + Math.min(100, Math.round(total / Math.max(1, c.budget) * 100)) + '%"></i></div>' +
      (missing.length ? '<div class="hint-box warn mt6">还缺：' + missing.join('、') + '。搭配不完整会扣分。</div>' : '') +
      '<div class="btn-row mt6">' +
      '<button type="button" class="btn secondary small" data-action="clear-selection">清空</button>' +
      (left > 0
        ? '<button type="button" class="btn small" data-action="try-on">试穿看看 · 剩 ' + left + ' 次</button>'
        : '<span class="small muted">试穿次数用完了</span>') +
      '</div>' +
      (s.lastTry
        ? '<button type="button" class="btn sage mt10" data-action="try-outfit">就这套，进试衣间换装</button>'
        : '<button type="button" class="btn ghost small mt10" data-action="try-outfit">不试了，直接进试衣间</button>') +
      '</div>';

    return html;
  };

  /* ---------------- 结果 ---------------- */

  UI.screens.fitting = function (s) {
    var c = E.currentCustomer();
    if (!c) { return UI.screens.settle(s); }
    var rec = E.getQueueRecord(s.servingCustomerId) || {};
    var q = E.getQueueSummary();
    var waiting = rec.status === 'fittingWait';
    var items = (s.pendingResult && s.pendingResult.itemIds) || rec.itemIds || [];
    var names = items.map(function (id) {
      var it = itemById(id);
      return it ? it.name : '';
    }).filter(Boolean);
    var html = header(s, '试衣间');
    html += queueStrip(s);
    html += '<div class="fitting-look">' + lookFigure(c, items, s.previewPose || 'stand', 'calm') + '</div>';
    html += '<div class="fitting-hero">' +
      '<div class="fitting-copy"><strong>' + esc(c.name) + '</strong>' +
      '<span>' + esc(c.occasion) + ' · 预算 ' + money(c.budget) + '</span>' +
      '<div class="small muted mt4">' + (waiting ? '抱着衣服在试衣间门口等' : '拉上帘子，正在换装') + '</div></div>' +
      '</div>';
    html += '<div class="fitting-card card' + (waiting ? ' waiting' : '') + '">' +
      '<div class="fitting-room-head"><strong>试衣间</strong><span>' +
      Math.min(q.fittingOccupied, Math.max(1, q.fittingRooms)) + ' / ' + q.fittingRooms + ' 使用中</span></div>' +
      '<div class="fitting-outfit">' + (names.length ? names.map(function (n) { return '<span class="slot-chip">' + esc(n) + '</span>'; }).join('') : '<span class="slot-empty">还没有选好衣服</span>') + '</div>' +
      (waiting
        ? '<div class="hint-box warn">前面的顾客还在试衣间里。等一等，或者让她先出来看效果。</div>'
        : (rec.noRoom
          ? '<div class="hint-box warn">店里没有试衣间，只能拉上帘子快速换一下。</div>'
          : '<div class="hint-box">换好衣服后，她会照镜子看整体效果。</div>')) +
      poseButtonsHtml(s) +
      '<div class="btn-row mt10">' +
      (waiting
        ? '<button type="button" class="btn secondary small" data-action="wait-fitting">等前一位出来</button>' +
          '<button type="button" class="btn small" data-action="complete-fitting">不等了，看效果</button>'
        : '<button type="button" class="btn small" data-action="complete-fitting">换装完成 · 看效果</button>') +
      '</div>' +
      '</div>';
    html += staffLogHtml();
    return html;
  };

  UI.screens.result = function (s) {
    var pr = s.pendingResult;
    if (!pr) {
      return E.currentCustomer() ? UI.screens.customer(s) : UI.screens.settle(s);
    }
    var c = customerById(pr.customerId);
    var r = pr.result;
    var title = '她有点犹豫';
    var sub = '喜欢，但还没下定决心。';
    if (pr.outcome === 'perfect') { title = '就是这套！'; sub = '她看着镜子，眼睛亮了。'; }
    else if (pr.outcome === 'happy') { title = '她挺喜欢'; sub = '没有惊呼，但嘴角压不住。'; }
    else if (pr.outcome === 'discount') { title = '九折成交'; sub = '她犹豫了一下，还是拿下了。'; }
    else if (pr.outcome === 'single') { title = '只带走一件'; sub = '整套没打动她，但有一件很合适。'; }
    else if (pr.outcome === 'expensive') { title = '她很喜欢，但超预算'; sub = '也许一个折扣能留住她。'; }
    else if (pr.outcome === 'invalid') { title = '还没搭完整'; sub = '她不知道该怎么试。'; }
    else if (pr.outcome === 'leave') { title = '不太像她'; sub = '她照了照镜子，放下了。'; }

    var html = header(s, '试穿结果');
    html += queueStrip(s);
    html += '<div class="result-hero">' +
      '<div class="result-look">' + lookFigure(c, pr.itemIds, s.previewPose || 'stand', 'calm') + '</div>' +
      '<div class="result-title">' + esc(title) + '</div>' +
      '<div class="result-sub">' + esc(c.name) + ' · ' + esc(sub) + '</div>' +
      scoreRing(r.score) +
      '</div>';
    html += '<div class="result-mood">' +
      '<span class="tag sage">好感 · ' + esc(E.getAffinityLabel(pr.affinity)) + '</span>' +
      (pr.affinity >= 78 && pr.result.score >= 70 ? '<span class="tag gold">她愿意为这套多给一点</span>' : '') +
      (pr.sale && pr.sale.tip ? '<span class="tag gold">小费 +' + money(pr.sale.tip) + '</span>' : '') +
      '</div>';

    html += '<div class="card">' +
      '<div class="section-head"><h3>评分拆解</h3><span class="small">满分 100</span></div>' +
      breakdownRow('风格', r.styleScore, 35) +
      breakdownRow('场合', r.occasionScore, 25) +
      breakdownRow('配色', r.colorScore, 20) +
      breakdownRow('身材', r.fitScore, 10) +
      breakdownRow('配饰', r.surpriseScore, 5) +
      breakdownRow('预算', r.budgetScore, 5) +
      (r.penalty ? '<div class="small muted mt6">扣分：' + r.penalty + ' 分（缺件/叠穿/超预算等）</div>' : '') +
      '</div>';
    html += resultExtras(pr);

    if (r.notes && r.notes.length) {
      html += '<div class="card soft"><div class="section-head"><h3>她为什么这么选</h3></div>' +
        '<ul class="note-list">' + r.notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul></div>';
    }

    if (pr.sale) {
      html += '<div class="sale-box">' +
        '<div class="sale-title">成交 ' + money(pr.sale.revenue) + (pr.sale.tip ? ' + 小费 ' + money(pr.sale.tip) : '') + '</div>' +
        '<div class="sale-row"><span>她带走了</span><strong>' + pr.sale.items.map(function (id) { return esc(itemById(id).name); }).join('、') + '</strong></div>' +
        (pr.sale.discount < 1 ? '<div class="sale-row"><span>折扣</span><strong>九折</strong></div>' : '') +
        '<div class="sale-row"><span>口碑</span><strong>+' + pr.sale.repGain + '</strong></div>' +
        '</div>';
    } else if (pr.canDiscount && !pr.resolved) {
      html += '<div class="sale-box" style="background:#FFF9EF;border-color:#E8CE91">' +
        '<div class="sale-title" style="color:#8A6417">她还在犹豫</div>' +
        '<div class="sale-row"><span>总价</span><strong>' + money(r.total) + '</strong></div>' +
        '<div class="sale-row"><span>她的预算</span><strong>' + money(c.budget) + '</strong></div>' +
        '<div class="sale-row"><span>差一点</span><strong>给她一个台阶，也许就成交了</strong></div>' +
        '</div>';
    } else {
      html += '<div class="sale-box miss">' +
        '<div class="sale-title">这一单没成交</div>' +
        '<div class="sale-row"><span>总价</span><strong>' + money(r.total) + '</strong></div>' +
        '<div class="sale-row"><span>她的预算</span><strong>' + money(c.budget) + '</strong></div>' +
        '<div class="sale-row"><span>原因</span><strong>' + esc(pr.message) + '</strong></div>' +
        '</div>';
    }

    html += staffLogHtml();

    if (pr.canDiscount && !pr.resolved) {
      html += '<div class="discount-box">' +
        '<p>她很喜欢，但还在犹豫。要不要给她打个九折？</p>' +
        '<div class="btn-row mt10">' +
        '<button type="button" class="btn secondary small" data-action="decline-discount">坚持原价</button>' +
        '<button type="button" class="btn small" data-action="accept-discount">给她九折</button>' +
        '</div></div>';
    } else {
      var qs = E.getQueueSummary();
      var last = !qs || qs.waiting === 0;
      html += '<button type="button" class="btn mt14" data-action="next-customer">' + (last ? '关店结算' : '下一位顾客') + '</button>';
    }

    return html;
  };

  /* ---------------- 结算 ---------------- */

  UI.screens.settle = function (s) {
    var ds = s.dayStats;
    if (!ds) { return UI.screens.brief(s); }
    var cfg = E.getDayConfig(s.day);
    var season = cfg.season || E.getSeason(s.day);
    var html = header(s, '今日结算');
    html += '<div class="receipt">' +
      '<div class="receipt-shop">' + esc(s.shopName) + '</div>' +
      '<div class="receipt-sub">' + esc(season.name) + ' · DAY ' + cfg.dayInSeason + '/' + s.maxDay + ' · 营业小票</div>' +
      '<div class="dashed"></div>' +
      receiptRow('进店人数', ds.visitors + ' 人') +
      receiptRow('接待顾客', ds.served + ' 位') +
      (ds.staffServed ? receiptRow('其中 · 店员接待', ds.staffServed + ' 位 / 成交 ' + (ds.staffSales || 0) + ' 单') : '') +
      receiptRow('成交单数', ds.sales + ' 单') +
      ((ds.crowdLeft || ds.queueLeft) ? receiptRow('排队离开', (ds.crowdLeft || 0) + ' 位没进店 / ' + (ds.queueLeft || 0) + ' 位等太久') : '') +
      receiptRow('营业额', money(ds.revenue), 'pos') +
      (ds.extraTip ? receiptRow('其中 · 心愿小费', '+' + money(ds.extraTip), 'pos') : '') +
      receiptRow('商品成本', '-' + money(ds.cogs), 'neg') +
      receiptRow('进货支出', '-' + money(ds.purchaseCost), 'neg') +
      receiptRow('营销支出', '-' + money(ds.marketingCost), 'neg') +
      receiptRow('员工工资', '-' + money(ds.staffCost || 0), 'neg') +
      (ds.weatherCost ? receiptRow('天气应对', '-' + money(ds.weatherCost), 'neg') : '') +
      receiptRow('房租', '-' + money(ds.rent), 'neg') +
      receiptRow('今日利润', money(ds.profit), ds.profit >= 0 ? 'pos' : 'neg') +
      receiptRow('口碑变化', (ds.reputationDelta >= 0 ? '+' : '') + ds.reputationDelta) +
      receiptRow('粉丝变化', (ds.fansDelta >= 0 ? '+' : '') + ds.fansDelta) +
      (ds.goalBonus ? receiptRow('目标奖励', '+' + money(ds.goalBonus), 'pos') : '') +
      (ds.loan ? receiptRow('临时借款', '+' + money(ds.loan), 'pos') : '') +
      '<div class="dashed"></div>' +
      '<div class="center">' + goalBadge(ds.goalMet) + '</div>' +
      '</div>';

    if (ds.eventNote) {
      html += '<div class="highlight-box"><strong>今日事件：</strong>' + esc(ds.eventNote) + '</div>';
    }

    html += staffLogHtml();

    if (ds.stylingBest) {
      var bestItems = ds.stylingBest.itemIds.map(function (id) { return esc(itemById(id).name); }).join('、');
      html += '<div class="highlight-box"><strong>今日最佳搭配：</strong>' + esc(ds.stylingBest.customerName) + ' · ' + ds.stylingBest.score + ' 分<br>' + bestItems + '</div>';
    }

    if (ds.lost && ds.lost.length) {
      html += '<div class="highlight-box"><strong>今日遗憾：</strong>' + esc(ds.lost[0].customerName) + ' —— ' + esc(ds.lost[0].reason) + '</div>';
    }

    if (ds.loan) {
      html += '<div class="hint-box warn mt10">现金流告急，你临时借了 ¥3,000，口碑 -5。下一天要更小心。</div>';
    }

    if (E.isSeasonEnd(s.day)) {
      html += '<button type="button" class="btn mt14" data-action="finish-season">' + esc(season.name) + '季结算 · 查看本季总结</button>';
    } else {
      html += '<button type="button" class="btn mt14" data-action="next-day">关店休息 · 进入第 ' + E.getDayInSeason(s.day + 1) + ' 天</button>';
    }

    return html;
  };

  /* ---------------- 总结 ---------------- */

  UI.screens.summary = function (s) {
    var sum = s.summary;
    if (!sum) { return UI.screens.settle(s); }
    var isSeason = sum.kind === 'season';
    var html = header(s, isSeason ? '本季总结' : '7 天总结');
    html += '<div class="summary-card">' +
      '<div class="summary-kicker">' + (isSeason ? '第 ' + sum.seasonIndex + ' 季 · ' + esc(sum.seasonName) : '7 天小店总结') + '</div>' +
      '<div class="summary-title">' + esc(sum.title) + '</div>' +
      '<div class="summary-shop">' + esc(sum.shopName) + ' · 第 ' + (sum.year || 1) + ' 年 · DAY 1–7</div>' +
      '<div class="summary-level">店铺等级 ' + sum.level + ' · ' + esc(sum.levelName) + '</div>' +
      '<div class="summary-grid">' +
      '<div class="summary-stat"><div class="k">总营业额</div><div class="v">' + money(sum.totalRevenue) + '</div></div>' +
      '<div class="summary-stat"><div class="k">总利润</div><div class="v">' + money(sum.totalProfit) + '</div></div>' +
      '<div class="summary-stat"><div class="k">成交单数</div><div class="v">' + sum.totalSales + ' 单</div></div>' +
      '<div class="summary-stat"><div class="k">最佳搭配</div><div class="v">' + sum.bestScore + ' 分</div></div>' +
      '<div class="summary-stat"><div class="k">口碑</div><div class="v">' + sum.finalReputation + '</div></div>' +
      '<div class="summary-stat"><div class="k">粉丝</div><div class="v">' + sum.finalFans + '</div></div>' +
      '</div>' +
      '</div>';

    html += '<div class="card"><div class="section-head"><h3>本季营业额</h3><span class="small">DAY 1–7</span></div>' +
      '<div class="chart">';
    var max = 1;
    var seasonHistory = s.history.slice(-7);
    seasonHistory.forEach(function (h) { if (h.revenue > max) { max = h.revenue; } });
    seasonHistory.forEach(function (h, i) {
      var hPct = Math.max(3, Math.round(h.revenue / max * 100));
      html += '<div class="chart-col"><div class="chart-bar" style="height:' + hPct + '%"></div><div class="chart-day">' + (i + 1) + '</div></div>';
    });
    html += '</div></div>';

    if (sum.bestScore) {
      html += '<div class="card soft"><div class="section-head"><h3>你的最佳搭配</h3><span class="small">' + sum.bestScore + ' 分</span></div>' +
        '<div class="small muted">' + esc(sum.bestCustomer) + ' · ' + (sum.bestItems || []).map(function (id) {
          var it = itemById(id); return it ? esc(it.name) : '';
        }).filter(Boolean).join('、') + '</div></div>';
    }

    if (sum.hadLoan) {
      html += '<div class="hint-box warn">这 7 天你借过一次钱。现金流是开店最真实的压力。</div>';
    }

    if (isSeason) {
      html += '<button type="button" class="btn" data-action="continue-season">继续经营 · 进入' + esc(sum.nextSeasonName || '下一') + '季</button>';
    }
    html += '<button type="button" class="btn' + (isSeason ? ' secondary' : '') + '" data-action="share-card">生成分享卡</button>' +
      '<button type="button" class="btn secondary" data-action="title">回到标题</button>' +
      '<button type="button" class="btn ghost" data-action="replay">再开一家</button>' +
      '<div class="footer-note">分享卡会保存成图片，之后可以发到小红书。</div>';
    return html;
  };

  /* ---------------- 帮助 ---------------- */

  UI.screens.help = function () {
    return header(null, '怎么玩') +
      '<div class="card taped">' +
      '<h2>7 天一个季节，开一家自己的小店</h2>' +
      '<p class="small muted mt6">你有一间小店、一笔启动资金。7 天一个季节，春天过完是夏天，可以一直开下去。</p>' +
      '<div class="help-step"><div class="help-num">1</div><div class="help-body"><strong>开店准备</strong>每天先做四个决定：进货、橱窗主推、营销、定价。进货有两种：散货自选按件买、单款最多 4 件；推荐套装是打包价，约省 15%。橱窗最多主推 3 件，摆得越多客流加成越高（+8% / +13% / +16%）。</div></div>' +
      '<div class="help-step"><div class="help-num">2</div><div class="help-body"><strong>先聊两句</strong>每位顾客进店后先对话。选共情、直接或玩笑，看她吃哪一套。聊对了会加好感，也会套出真正在意的事。</div></div>' +
      '<div class="help-step"><div class="help-num">3</div><div class="help-body"><strong>帮她挑衣服</strong>可以选现成方案，也可以自己搭。自己搭的时候，每放一件她都会当场反应；试穿次数由好感和耐心决定。</div></div>' +
      '<div class="help-step"><div class="help-num">4</div><div class="help-body"><strong>搭配评分</strong>风格 35 + 场合 25 + 配色 20 + 身材 10 + 配饰 5 + 预算 5。缺鞋、缺上下装、超预算都会扣分。好感不影响分数，但影响小费和折扣。</div></div>' +
      '<div class="help-step"><div class="help-num">5</div><div class="help-body"><strong>关店结算</strong>营业额减去商品成本、营销、房租，就是今天的利润。进货是现金支出，不算当天成本。目标达成会有奖励。</div></div>' +
      '<div class="help-step"><div class="help-num">6</div><div class="help-body"><strong>季节与总结</strong>7 天一个季节，每季结束生成小店称号和分享卡；可以继续下一季，也可以重开一家。应季款售价 +10%，过季款 −20%，进货也更便宜。</div></div>' +
      '</div>' +
      '<button type="button" class="btn" data-action="help-back">知道了，去开店</button>';
  };

  UI.stageSpeechText = function (s, key) {
    if (!s) { return ''; }
    var c = E.currentCustomer ? E.currentCustomer() : null;
    if (key === 'chat') {
      if (!c) { return ''; }
      if (s.chatPhase === 'reply' && s.chatReply) { return s.chatReply.text; }
      if (s.chatPhase === 'done') { return '那就麻烦你了。'; }
      var beat = E.getChatBeat();
      return beat ? beat.prompt : '你好，我想看看衣服。';
    }
    if (key === 'service') {
      if (s.itemReaction && s.itemReaction.text) { return s.itemReaction.text; }
      if (s.lastTry && s.lastTry.hint) { return s.lastTry.hint; }
      return '我看看你挑的。';
    }
    if (key === 'result') {
      var pr = s.pendingResult;
      if (!pr) { return ''; }
      var d = c ? E.getDialogue(c) : null;
      if (pr.extras && pr.extras.wish && pr.extras.wish.done && pr.result && pr.result.score >= 70) {
        return '你居然记得我说过……';
      }
      if (pr.outcome !== 'expensive' && d && pr.result && pr.result.score >= 70 && d.reaction) { return d.reaction; }
      if (pr.outcome === 'perfect') { return '就是这套，我明天就穿它！'; }
      if (pr.outcome === 'happy') { return '挺好看的，我拿走啦。'; }
      if (pr.outcome === 'hesitant') { return '我再想想……真的好看吗？'; }
      if (pr.outcome === 'expensive') { return '超出预算了，有点可惜。'; }
      if (pr.outcome === 'discount') { return '九折的话，我就拿下。'; }
      if (pr.outcome === 'single') { return '我先带走这一件吧。'; }
      return '谢谢，我再逛逛。';
    }
    return '';
  };

  UI.stageChoicesHtml = function (s, key) {
    if (!s || key !== 'chat') { return ''; }
    var c = E.currentCustomer();
    if (!c) { return ''; }
    var d = E.getDialogue(c);
    var kicker = '<div class="iso-choices-kicker"><span>' + esc(c.name) + ' · ' + esc(c.occasion) +
      '</span><span>预算 ' + money(c.budget) + '</span></div>';
    if (s.chatPhase === 'done') {
      return kicker +
        '<div class="iso-choice-hint">她愿意试穿 ' + Math.max(1, s.patience) + ' 次。好感越高，越容易听到真话。</div>' +
        '<button type="button" class="iso-choice primary" data-action="start-service">开始帮她挑衣服</button>';
    }
    if (s.chatPhase === 'reply' && s.chatReply) {
      var lastBeat = s.chatStep + 1 >= d.beats.length;
      return kicker +
        '<div class="iso-choice-meta">' +
        '<span class="tone-tag ' + s.chatReply.tone + '">' + esc(D.TONE_LABELS[s.chatReply.tone] || '') + '</span>' +
        (s.chatReply.match ? '<span class="affinity-gain">说对了 · 好感 +' + s.chatReply.delta + '</span>' :
          '<span class="affinity-loss">不太对味 · 好感 ' + s.chatReply.delta + '</span>') +
        '</div>' +
        '<button type="button" class="iso-choice primary" data-action="' + (lastBeat ? 'start-service' : 'chat-next') + '">' +
        (lastBeat ? '好，开始帮她挑衣服' : '继续聊') + '</button>';
    }
    var beat = E.getChatBeat();
    var html = kicker + '<div class="iso-choices-list">';
    (beat ? beat.choices : []).forEach(function (choice, index) {
      html += '<button type="button" class="iso-choice" data-action="chat-choice" data-id="' + index + '">' +
        '<span class="tone-tag ' + choice.tone + '">' + esc(D.TONE_LABELS[choice.tone] || '') + '</span>' +
        '<span class="iso-choice-text">' + esc(choice.text) + '</span>' +
        '</button>';
    });
    html += '</div>';
    return html;
  };

  /* ---------------- 渲染 ---------------- */

  UI.bindStageParallax = function () {
    var stage = document.getElementById('stage-root');
    if (!stage || stage.getAttribute('data-parallax') === '1') { return; }
    stage.setAttribute('data-parallax', '1');
    stage.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') { return; }
      var r = stage.getBoundingClientRect();
      if (!r.width || !r.height) { return; }
      var x = ((e.clientX - r.left) / r.width - .5) * 16;
      var y = ((e.clientY - r.top) / r.height - .5) * 10;
      stage.style.setProperty('--stage-px', x.toFixed(2) + 'px');
      stage.style.setProperty('--stage-py', y.toFixed(2) + 'px');
    });
    stage.addEventListener('pointerleave', function () {
      stage.style.setProperty('--stage-px', '0px');
      stage.style.setProperty('--stage-py', '0px');
    });
  };

  UI.bindStageDrag = function () {
    var stage = document.getElementById('stage-root');
    if (!stage) { return; }
    var cards = document.querySelectorAll('[data-action="toggle-item"]');
    for (var i = 0; i < cards.length; i++) {
      (function (card) {
        card.style.touchAction = 'none';
        card.addEventListener('pointerdown', function (e) {
          if (e.button !== undefined && e.button !== 0) { return; }
          var id = card.getAttribute('data-id');
          var item = itemById(id);
          if (!item) { return; }
          var startX = e.clientX;
          var startY = e.clientY;
          var moved = false;
          var ghost = document.createElement('div');
          ghost.className = 'shop2-ghost';
          ghost.innerHTML = UI.itemSvg(item);
          document.body.appendChild(ghost);

          function move(ev) {
            if (!moved && (Math.abs(ev.clientX - startX) > 7 || Math.abs(ev.clientY - startY) > 7)) {
              moved = true;
              ghost.classList.add('show');
              stage.classList.add('is-dragging');
            }
            if (moved) {
              ghost.style.left = ev.clientX + 'px';
              ghost.style.top = ev.clientY + 'px';
              if (ev.cancelable) { ev.preventDefault(); }
            }
          }
          function cleanup() {
            document.removeEventListener('pointermove', move);
            document.removeEventListener('pointerup', up);
            document.removeEventListener('pointercancel', cleanup);
            ghost.classList.remove('show');
            stage.classList.remove('is-dragging');
            if (ghost.parentNode) { ghost.parentNode.removeChild(ghost); }
          }
          function up(ev) {
            var rect = stage.getBoundingClientRect();
            var over = ev.clientX >= rect.left && ev.clientX <= rect.right && ev.clientY >= rect.top && ev.clientY <= rect.bottom;
            cleanup();
            if (!moved) { return; }
            UI._suppressToggleUntil = Date.now() + 350;
            if (!over) { return; }
            var r = E.toggleItem(id);
            if (r && !r.ok && r.message) { UI.toast(r.message); }
            UI.render();
            if (window.Scene && r && r.ok) {
              Scene.play('cloth');
              Scene.pulse('reach');
              Scene.gesture('point');
            }
          }
          document.addEventListener('pointermove', move);
          document.addEventListener('pointerup', up);
          document.addEventListener('pointercancel', cleanup);
        });
      })(cards[i]);
    }
  };

  UI.render = function () {
    var s = E.state;
    var key = UI.overrideScreen || (s ? s.screen : 'title');
    if (!s && key !== 'title' && key !== 'help') { key = 'title'; }
    if (key === 'result' && (!s || !s.pendingResult)) {
      key = s && s.customerIndex < s.customersToday.length ? 'chat' : (s ? 'settle' : 'title');
    }
    if (key === 'service' && (!s || !E.currentCustomer())) {
      key = s && s.customerIndex >= s.customersToday.length ? 'settle' : 'title';
    }
    if (key === 'chat' && (!s || !E.currentCustomer())) {
      key = s && s.dayStats ? 'settle' : 'title';
    }
    if (key === 'summary' && (!s || !s.summary)) { key = 'title'; }
    if (!UI.screens[key]) { key = 'title'; }

    if (key === 'title' && window.Iso && Iso.tex && Iso.tex.dropCharacter) {
      Iso.tex.dropCharacter();
    }
    var lookRoot = document.getElementById('look-root');
    if (lookRoot) {
      var showLook = (key === 'service' || key === 'fitting' || key === 'result') && !!E.currentCustomer();
      lookRoot.innerHTML = showLook ? lookFab() : '';
    }
    document.body.classList.toggle('prep-active', key === 'prep');
    var stageScreens = { brief: 1, prep: 1, chat: 1, service: 1, fitting: 1, result: 1, settle: 1 };
    var app = document.getElementById('app');
    var stageRoot = document.getElementById('stage-root');
    if (stageRoot && window.Scene && stageScreens[key] && s) {
      var sig = [
        key, s.shopName, s.day, s.customerIndex, s.chatStep, s.chatPhase, s.affinity, s.patience,
        s.tryOnCount, s.expression, s.careUsed ? 1 : 0, s.previewPose || 'stand', s.servingCustomerId || '',
        (s.queue || []).map(function (r) { return r.id + ':' + r.status + ':' + (r.itemIds || []).join(',') + ':' + (r.staffUid || ''); }).join(';'),
        (s.windowItems || []).join(','), s.pendingMarketing || s.marketing || '', s.pricing || '',
        (s.shop && s.shop.layout ? s.shop.layout.map(function (f) {
          return f.uid + ':' + f.id + ':' + f.x + ',' + f.y + ',' + (f.rot ? 1 : 0);
        }).join(';') : ''),
        (s.staff || []).map(function (m) { return m.uid; }).join(','),
        (s.selectedItems || []).join(','),
        s.itemReaction ? s.itemReaction.text : '',
        s.pendingResult ? (s.pendingResult.outcome + ':' + s.pendingResult.resolved + ':' + (s.pendingResult.itemIds || []).join(',')) : '',
        Scene.isSoundOn() ? 1 : 0
      ].join('|');
      if (sig !== UI._stageSig) {
        Scene.mount(stageRoot, s, key);
        UI._stageSig = sig;
      }
      stageRoot.classList.add('active');
      stageRoot.classList.toggle('iso-stage', !!(window.Scene && Scene._isoOn));
      if (app) {
        var chatNow = key === 'chat' && !!(window.Scene && Scene._isoOn);
        var chatWas = app.classList.contains('is-chat');
        app.classList.add('has-stage');
        app.classList.toggle('is-chat', chatNow);
        if (chatNow !== chatWas && window.Iso && Iso.resize) { Iso.resize(); }
      }
      UI.bindStageParallax();
    } else if (stageRoot) {
      if (Scene.unmount) { Scene.unmount(stageRoot); } else { stageRoot.innerHTML = ''; }
      stageRoot.classList.remove('active');
      stageRoot.classList.remove('iso-stage');
      if (app) { app.classList.remove('has-stage'); app.classList.remove('is-chat'); }
      UI._stageSig = '';
    }

    var screen = document.getElementById('screen-' + key) || document.getElementById('screen-title');
    var active = document.querySelector('.screen.active');
    if (active && active !== screen) { active.classList.remove('active'); }
    var sameState = (s === UI._lastStateObj);
    var screenSig = key + '|' + (s ? (s.rev || 0) : 0) +
      (key === 'prep' ? '|' + (UI._prepTab || 'today') : '');
    if (!sameState || screenSig !== UI._screenSig) {
      screen.innerHTML = UI.screens[key](s);
      UI._screenSig = screenSig;
      if (key === 'title') { UI.bindTitle(); }
      if (key === 'prep' && (UI._prepTab || 'today') === 'decor') { UI.bindDecorGrid(); }
      if (key === 'design') {
        if (UI._board) { UI.bindDesignBoard(); } else { UI.bindDesignScreen(); }
      }
    }
    UI._lastStateObj = s;
    screen.classList.add('active');
    if (window.Scene && Scene._isoOn && window.Iso && Iso.setSpeech) {
      Iso.setSpeech(UI.stageSpeechText(s, key));
      if (Iso.setChoices) { Iso.setChoices(UI.stageChoicesHtml(s, key)); }
    }
    if (key === 'service' && s && s.serviceMode === 'styling') { UI.bindStageDrag(); }
    if (UI._lastKey !== key) {
      var scroller = document.getElementById('screens');
      if (scroller) { scroller.scrollTop = 0; }
      else { window.scrollTo(0, 0); }
    }
    UI._lastKey = key;
    UI.ensureDebug();
    var sizeEl = document.getElementById('debug-save-size');
    if (sizeEl && E.lastSaveBytes) {
      sizeEl.textContent = '存档 ' + (E.lastSaveBytes / 1024).toFixed(1) + ' KB';
    }
    if (E.saveError && !UI._saveWarned) {
      UI._saveWarned = true;
      UI.toast('浏览器存档空间不足，请到标题页导出存档');
    } else if (!E.saveError) {
      UI._saveWarned = false;
    }
  };

  UI.toast = function (msg) {
    var t = document.getElementById('toast');
    if (!t) { return; }
    t.textContent = msg;
    t.classList.add('show');
    if (toastTimer) { clearTimeout(toastTimer); }
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2400);
  };

  UI.floatText = function (text, cls) {
    var stage = document.getElementById('stage-root');
    if (!stage) { return; }
    var el = document.createElement('div');
    el.className = 'float-text ' + (cls || '');
    el.textContent = text;
    stage.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) { el.parentNode.removeChild(el); }
    }, 1400);
  };

  UI.scrollToEl = function (selector) {
    try {
      var el = document.querySelector(selector);
      if (el && el.scrollIntoView) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    } catch (e) {
      try {
        var el2 = document.querySelector(selector);
        if (el2 && el2.scrollIntoView) { el2.scrollIntoView(); }
      } catch (e2) {}
    }
  };

  UI.scrollTop = function () {
    var scroller = document.getElementById('screens');
    if (scroller) { scroller.scrollTop = 0; }
    else { window.scrollTo(0, 0); }
  };

  UI.modal = function (html) {
    var root = document.getElementById('modal-root');
    if (!root) { return; }
    root.innerHTML = '<div class="modal" data-action="close-modal">' +
      '<div class="modal-card" data-action="noop">' + html + '</div></div>';
  };

  UI.closeModal = function () {
    UI._lookOpen = false;
    var lookRoot = document.getElementById('look-root');
    if (lookRoot) { lookRoot.style.visibility = ''; }
    var root = document.getElementById('modal-root');
    if (root) { root.innerHTML = ''; }
  };

  UI.openLook = function () {
    var s = E.state;
    var c = E.currentCustomer();
    if (!s || !c) { return; }
    var ids = lookIdsFor(s);
    var names = ids.map(function (id) {
      var it = itemById(id);
      return it ? it.name : '';
    }).filter(Boolean);
    var html = '<div class="modal-title">整体效果</div>' +
      '<div class="look-modal-figure">' + lookFigure(c, ids, s.previewPose || 'stand', 'calm') + '</div>' +
      '<div class="look-modal-name">' + esc(c.name) + (names.length ? ' · ' + names.map(esc).join(' + ') : '') + '</div>' +
      poseButtonsHtml(s) +
      '<button type="button" class="btn ghost mt10" data-action="close-modal">关上</button>';
    UI._lookOpen = true;
    var lookRoot = document.getElementById('look-root');
    if (lookRoot) { lookRoot.style.visibility = 'hidden'; }
    UI.modal(html);
  };

  /* ---------------- 调试 ---------------- */

  UI.ensureDebug = function () {
    if (!DEBUG) { return; }
    var root = document.getElementById('debug-root');
    if (!root) { return; }
    if (root.innerHTML) { return; }
    root.innerHTML = '<button type="button" class="debug-fab" data-action="debug-toggle" title="测试工具">⚙</button>' +
      '<div id="debug-panel" class="debug-panel hidden">' +
      '<div class="debug-title">测试工具</div>' +
      '<div id="debug-save-size" class="debug-note"></div>' +
      '<button type="button" data-action="debug-cash">+ ¥5,000 现金</button>' +
      '<button type="button" data-action="debug-affinity">当前顾客好感 +20</button>' +
      '<button type="button" data-action="debug-complete">直接结算当天</button>' +
      '<button type="button" data-action="debug-skip">跳到下一天</button>' +
      '<button type="button" data-action="debug-export">导出测试数据</button>' +
      '<button type="button" data-action="debug-reset">重置存档</button>' +
      '</div>';
  };

  UI.toggleDebug = function () {
    var panel = document.getElementById('debug-panel');
    if (panel) { panel.classList.toggle('hidden'); }
  };

  /* ---------------- 存档导出 / 导入 ---------------- */

  UI.downloadBlob = function (blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    return true;
  };

  UI.exportSaveFile = function () {
    var text = E.exportSave ? E.exportSave() : null;
    if (!text) {
      UI.toast('还没有可导出的存档');
      return;
    }
    var day = new Date();
    var stamp = day.getFullYear() + String(day.getMonth() + 1).padStart(2, '0') + String(day.getDate()).padStart(2, '0');
    var filename = 'yijian-xiaorizi-save-' + stamp + '.json';
    try {
      UI.downloadBlob(new Blob([text], { type: 'application/json' }), filename);
      UI.toast('存档已导出 · ' + Math.max(1, Math.round(text.length / 1024)) + 'KB');
    } catch (e) {
      // 老 WebView 不支持 Blob 下载时，至少把 JSON 打开给用户复制/长按保存
      try {
        var w = window.open('', '_blank');
        if (w) {
          w.document.write('<meta charset="utf-8"><title>存档</title><pre style="white-space:pre-wrap;word-break:break-all;font:12px/1.5 monospace">' +
            text.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</pre>');
          w.document.close();
          UI.toast('已打开存档文本，长按或全选复制保存');
        } else {
          UI.toast('当前环境不支持下载，请换浏览器打开');
        }
      } catch (e2) {
        UI.toast('当前环境不支持导出');
      }
    }
  };

  UI.pickSaveFile = function () {
    var input = document.getElementById('save-import-file');
    if (!input) {
      UI.toast('当前页面不支持导入');
      return;
    }
    input.value = '';
    input.click();
  };

  UI.handleSaveFile = function (file) {
    if (!file) { return; }
    if (file.size > 8 * 1024 * 1024) {
      UI.toast('文件超过 8MB，可能不是存档');
      return;
    }
    if ((E.state || E.hasSave()) && !window.confirm('导入会覆盖当前存档（旧存档会备份一份），继续？')) {
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      var res = E.importSave(String(reader.result || ''));
      if (!res.ok) {
        UI.toast(res.error || '存档导入失败');
        return;
      }
      UI.overrideScreen = null;
      UI._lastStateObj = null;
      UI._screenSig = '';
      UI._stageSig = '';
      UI.render();
      UI.toast(res.migrated ? '存档已导入（已从旧版本升级）' : '存档已导入');
    };
    reader.onerror = function () {
      UI.toast('读取文件失败');
    };
    reader.readAsText(file);
  };

  UI.bindTitle = function () {
    var input = document.getElementById('save-import-file');
    if (!input || input.__saveBound) { return; }
    input.__saveBound = true;
    input.addEventListener('change', function () {
      UI.handleSaveFile(this.files && this.files[0]);
    });
  };

  UI.exportLog = function () {
    var data = E.exportData();
    var text = JSON.stringify(data, null, 2);
    try {
      var blob = new Blob([text], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'yijian-xiaorizi-test-' + Date.now() + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1200);
      UI.toast('测试数据已导出');
    } catch (e) {
      UI.toast('当前环境不支持导出');
    }
  };

  /* ---------------- 分享卡 ---------------- */

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawStoreOnCanvas(ctx, x, y, w, h) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#F1E3D3';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#D8B89B';
    ctx.fillRect(0, h * 0.68, w, h * 0.32);
    ctx.strokeStyle = '#C9A57E';
    ctx.lineWidth = 2;
    for (var i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(0, h * 0.68 + i * h * 0.08);
      ctx.lineTo(w, h * 0.68 + i * h * 0.08);
      ctx.stroke();
    }
    // window
    ctx.fillStyle = '#CFE3E8';
    ctx.strokeStyle = '#5B4636';
    ctx.lineWidth = 5;
    ctx.fillRect(w * 0.08, h * 0.12, w * 0.3, h * 0.4);
    ctx.strokeRect(w * 0.08, h * 0.12, w * 0.3, h * 0.4);
    ctx.fillStyle = '#E3B23C';
    ctx.beginPath();
    ctx.arc(w * 0.2, h * 0.27, w * 0.045, 0, Math.PI * 2);
    ctx.fill();
    // sign
    ctx.fillStyle = '#FFF9EF';
    ctx.fillRect(w * 0.45, h * 0.08, w * 0.32, h * 0.12);
    ctx.strokeRect(w * 0.45, h * 0.08, w * 0.32, h * 0.12);
    // rack
    ctx.strokeStyle = '#6B4F3A';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(w * 0.45, h * 0.32);
    ctx.lineTo(w * 0.76, h * 0.32);
    ctx.moveTo(w * 0.48, h * 0.32);
    ctx.lineTo(w * 0.48, h * 0.62);
    ctx.moveTo(w * 0.73, h * 0.32);
    ctx.lineTo(w * 0.73, h * 0.62);
    ctx.stroke();
    // garments
    var cols = ['#D99A9A', '#8A9A7B', '#E3B23C'];
    for (var j = 0; j < 3; j++) {
      ctx.fillStyle = cols[j];
      ctx.strokeStyle = '#5B4636';
      ctx.lineWidth = 3;
      var gx = w * (0.49 + j * 0.08);
      ctx.fillRect(gx, h * 0.36, w * 0.06, h * 0.2);
      ctx.strokeRect(gx, h * 0.36, w * 0.06, h * 0.2);
    }
    // counter
    ctx.fillStyle = '#C9A57E';
    ctx.fillRect(w * 0.82, h * 0.55, w * 0.14, h * 0.18);
    ctx.strokeRect(w * 0.82, h * 0.55, w * 0.14, h * 0.18);
    // plant
    ctx.fillStyle = '#C97B63';
    ctx.fillRect(w * 0.04, h * 0.7, w * 0.08, h * 0.12);
    ctx.fillStyle = '#8A9A7B';
    ctx.beginPath();
    ctx.arc(w * 0.08, h * 0.64, w * 0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  UI.shareCard = function () {
    var s = E.state;
    if (!s || !s.summary) { UI.toast('还没有总结可以分享'); return; }
    var sum = s.summary;
    var canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1440;
    var ctx = canvas.getContext('2d');
    if (!ctx) { UI.toast('当前环境不支持生成图片'); return; }

    ctx.fillStyle = '#F7F1E8';
    ctx.fillRect(0, 0, 1080, 1440);

    // paper dots
    ctx.fillStyle = 'rgba(91,70,54,.07)';
    for (var x = 0; x < 1080; x += 36) {
      for (var y = 0; y < 1440; y += 36) {
        ctx.beginPath();
        ctx.arc(x, y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // card
    ctx.fillStyle = '#FFFDF8';
    ctx.strokeStyle = '#5B4636';
    ctx.lineWidth = 6;
    roundRect(ctx, 54, 54, 972, 1332, 36);
    ctx.fill();
    ctx.stroke();

    // tape
    ctx.save();
    ctx.translate(190, 52);
    ctx.rotate(-0.05);
    ctx.fillStyle = 'rgba(227,178,60,.62)';
    ctx.fillRect(0, 0, 200, 44);
    ctx.restore();
    ctx.save();
    ctx.translate(760, 52);
    ctx.rotate(0.04);
    ctx.fillStyle = 'rgba(201,123,99,.5)';
    ctx.fillRect(0, 0, 160, 40);
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#8B7B6C';
    ctx.font = 'bold 30px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillText('7 天开店挑战', 540, 152);

    ctx.fillStyle = '#5B4636';
    ctx.font = 'bold 82px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillText('衣间小日子', 540, 248);

    ctx.fillStyle = '#C97B63';
    ctx.font = 'bold 44px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillText(sum.title, 540, 330);

    ctx.fillStyle = '#8B7B6C';
    ctx.font = '30px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillText('「' + sum.shopName + '」· ' + (sum.seasonName ? sum.seasonName + '季' : '第 7 天'), 540, 384);

    // level pill
    ctx.fillStyle = '#E3B23C';
    roundRect(ctx, 390, 416, 300, 54, 27);
    ctx.fill();
    ctx.fillStyle = '#5B4636';
    ctx.font = 'bold 26px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillText('店铺等级 ' + sum.level + ' · ' + sum.levelName, 540, 452);

    // stats
    var stats = [
      ['总营业额', money(sum.totalRevenue)],
      ['总利润', money(sum.totalProfit)],
      ['成交单数', sum.totalSales + ' 单'],
      ['最佳搭配', sum.bestScore + ' 分'],
      ['口碑', String(sum.finalReputation)],
      ['粉丝', String(sum.finalFans)]
    ];
    var startX = 130;
    var startY = 520;
    var cellW = 400;
    var cellH = 130;
    for (var i = 0; i < stats.length; i++) {
      var col = i % 2;
      var row = Math.floor(i / 2);
      var sx = startX + col * (cellW + 30);
      var sy = startY + row * (cellH + 18);
      ctx.fillStyle = '#FFF9EF';
      ctx.strokeStyle = '#D8C9B8';
      ctx.lineWidth = 3;
      roundRect(ctx, sx, sy, cellW, cellH, 18);
      ctx.fill();
      ctx.stroke();
      ctx.textAlign = 'left';
      ctx.fillStyle = '#8B7B6C';
      ctx.font = '24px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.fillText(stats[i][0], sx + 24, sy + 44);
      ctx.fillStyle = '#5B4636';
      ctx.font = 'bold 44px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.fillText(stats[i][1], sx + 24, sy + 96);
    }

    // store illustration
    drawStoreOnCanvas(ctx, 120, 950, 840, 270);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#5B4636';
    ctx.font = 'bold 34px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillText('「' + sum.shopName + '」', 540, 1268);

    ctx.fillStyle = '#8B7B6C';
    ctx.font = '24px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillText('我在小红书开了一家小店 · 搜索「衣间小日子」', 540, 1320);

    var dataUrl;
    try {
      dataUrl = canvas.toDataURL('image/png');
    } catch (e) {
      UI.toast('图片生成失败');
      return;
    }
    UI.lastShareDataUrl = dataUrl;
    UI.modal('<div class="modal-title">你的小店总结</div>' +
      '<div class="modal-body">保存这张卡片，发到小红书时可以用。</div>' +
      '<img src="' + dataUrl + '" alt="小店分享卡" style="width:100%;margin-top:10px;border:2px solid #5B4636;border-radius:12px">' +
      '<div class="small muted" style="text-align:center;margin-top:6px">手机上也可以长按图片保存</div>' +
      '<button type="button" class="btn mt14" data-action="download-share">保存图片</button>' +
      (canShareImage() ? '<button type="button" class="btn secondary mt10" data-action="share-share">分享给朋友</button>' : '') +
      '<button type="button" class="btn ghost" data-action="close-modal">先不保存</button>');
  };

  function canShareImage() {
    return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  }

  function dataUrlToBlob(dataUrl) {
    var parts = String(dataUrl).split(',');
    var mime = 'image/png';
    var m = /data:([^;]+)/.exec(parts[0]);
    if (m) { mime = m[1]; }
    var bin = atob(parts[1]);
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) { arr[i] = bin.charCodeAt(i); }
    return new Blob([arr], { type: mime });
  }

  UI.shareShareImage = function () {
    if (!UI.lastShareDataUrl) { return; }
    if (!canShareImage() || typeof File !== 'function') {
      UI.downloadShareImage();
      return;
    }
    var filename = 'yijian-xiaorizi-share-' + Date.now() + '.png';
    try {
      var file = new File([dataUrlToBlob(UI.lastShareDataUrl)], filename, { type: 'image/png' });
      if (navigator.canShare && !navigator.canShare({ files: [file] })) {
        UI.downloadShareImage();
        return;
      }
      navigator.share({ files: [file], title: '衣间小日子', text: '我在衣间小日子开了一家店' })
        .then(function () { UI.toast('已打开分享'); UI.closeModal(); })
        .catch(function (err) {
          if (err && err.name === 'AbortError') { return; }
          UI.downloadShareImage();
        });
    } catch (e) {
      UI.downloadShareImage();
    }
  };

  UI.saveShareImage = function () {
    if (!UI.lastShareDataUrl) { return; }
    var xhs = window.xhs && (window.xhs.miniTool || window.xhs);
    if (xhs && typeof xhs.saveImageToPhotosAlbum === 'function') {
      xhs.saveImageToPhotosAlbum({
        data: UI.lastShareDataUrl,
        success: function () { UI.toast('已保存到相册'); },
        fail: function () { UI.toast('保存失败，请用浏览器下载'); UI.downloadShareImage(); }
      });
      return;
    }
    UI.downloadShareImage();
  };

  UI.downloadShareImage = function () {
    if (!UI.lastShareDataUrl) { return; }
    var filename = 'yijian-xiaorizi-' + Date.now() + '.png';
    try {
      var a = document.createElement('a');
      if (typeof a.download === 'undefined') {
        // 老 WebView 不支持 download：打开图片让用户长按保存
        var w = window.open(UI.lastShareDataUrl, '_blank');
        if (w) { UI.toast('长按图片保存'); return; }
      }
      a.href = UI.lastShareDataUrl;
      a.download = filename;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      UI.toast('分享卡已下载');
      UI.closeModal();
    } catch (e) {
      UI.toast('下载失败，可以长按图片保存');
    }
  };

  /* ---------------- 事件分发 ---------------- */

  UI.handle = function (action, id) {
    var s = E.state;

    switch (action) {
      case 'start': {
        var nameInput = document.getElementById('shop-name');
        var name = nameInput ? nameInput.value.trim() : '衣间小日子';
        if (!name) { name = '衣间小日子'; }
        if (E.hasSave()) {
          UI.modal('<div class="modal-title">已经有存档了</div>' +
            '<div class="modal-body">重新开始会覆盖现在的进度。确定要开一家新店吗？</div>' +
            '<button type="button" class="btn mt14" data-action="start-confirm">重新开始</button>' +
            '<button type="button" class="btn ghost" data-action="close-modal">取消</button>');
        } else {
          E.startNew(name);
          UI.overrideScreen = null;
          UI.render();
        }
        break;
      }
      case 'start-confirm': {
        var input2 = document.getElementById('shop-name');
        var name2 = input2 ? input2.value.trim() : '衣间小日子';
        if (!name2) { name2 = '衣间小日子'; }
        E.reset();
        E.startNew(name2);
        UI.closeModal();
        UI.overrideScreen = null;
        UI.render();
        break;
      }
      case 'continue': {
        if (E.load()) {
          UI.overrideScreen = null;
          UI.render();
        } else {
          UI.toast('存档读取失败，开一家新店吧');
        }
        break;
      }
      case 'help':
        UI.helpReturn = UI.overrideScreen || (E.state ? E.state.screen : 'title');
        UI.overrideScreen = 'help';
        UI.render();
        break;
      case 'save-export':
        UI.exportSaveFile();
        break;
      case 'save-import':
        UI.pickSaveFile();
        break;
      case 'help-back':
        UI.overrideScreen = UI.helpReturn === 'title' ? 'title' : null;
        UI.render();
        break;
      case 'title':
        UI.overrideScreen = 'title';
        UI.render();
        break;
      case 'to-prep':
        E.toPrep();
        UI.render();
        break;
      case 'weather-prep': {
        var wres = E.prepareWeather();
        if (!wres.ok) { UI.toast(wres.message || '现在没法准备'); }
        else {
          UI.toast('已应对 ' + wres.weather.event.title + '：' + wres.response.label);
        }
        UI.render();
        break;
      }
      case 'select-lot':
        E.selectLot(id);
        UI.render();
        break;
      case 'select-window': {
        var winRes = E.toggleWindow(id);
        if (winRes && !winRes.ok && winRes.message) { UI.toast(winRes.message); }
        UI.render();
        break;
      }
      case 'supply-category':
        E.setCartCategory(id);
        UI.render();
        break;
      case 'supply-slot':
        E.setAccessorySlot(id);
        UI.render();
        break;
      case 'supply-style':
        E.setStyleFilter(id);
        UI.render();
        break;
      case 'cart-plus': {
        var addRes = E.addToCart(id, 1);
        if (addRes && !addRes.ok && addRes.message) { UI.toast(addRes.message); }
        UI.render();
        break;
      }
      case 'cart-minus':
        E.addToCart(id, -1);
        UI.render();
        break;
      case 'cart-clear':
        E.clearCart();
        UI.render();
        break;
      case 'open-wardrobe':
        UI.openWardrobe();
        break;
      case 'restock': {
        var moved = E.restockShelf();
        UI.toast(moved ? '从仓库补了 ' + moved + ' 件' : '仓库没有可补的货');
        UI.render();
        break;
      }
      case 'upgrade-store': {
        var upRes = E.upgradeStore();
        if (!upRes.ok) { UI.toast(upRes.message || '升级失败'); }
        else { UI.toast('仓库升级到 Lv.' + upRes.level + '，容量 ' + E.getStoreCap()); }
        UI.render();
        UI.openWarehouse();
        break;
      }
      case 'open-warehouse':
        UI.openWarehouse();
        break;
      case 'open-decor':
        UI.openDecor();
        break;
      case 'open-design':
        UI.openDesign();
        break;
      case 'design-order':
        UI.openDesign(id);
        break;
      case 'design-back':
        UI.closeDesign();
        break;
      case 'design-step':
        UI._designStep = id || 'shape';
        UI.renderDesign();
        break;
      case 'design-model':
        UI._designModel = id === 'model' ? 'model' : 'mannequin';
        UI.renderDesign();
        break;
      case 'design-side':
        UI._designSide = id === 'back' ? 'back' : 'front';
        UI.renderDesign();
        break;
      case 'design-pose':
        UI._designPose = id || 'stand';
        UI.renderDesign();
        break;
      case 'design-cat': {
        UI._design.cat = id;
        var silList = (D.DESIGN.silhouettes && D.DESIGN.silhouettes[id]) || [];
        UI._design.silhouette = silList.length ? silList[0].id : '';
        UI._design.custom = null;
        UI._designStep = 'shape';
        E.saveDesignDraft(UI._design);
        UI.renderDesign();
        break;
      }
      case 'design-sil':
        UI._design.silhouette = id;
        E.saveDesignDraft(UI._design);
        UI.renderDesign();
        break;
      case 'design-fabric':
        UI._design.fabric = id;
        var fb = (D.DESIGN.fabricLook && D.DESIGN.fabricLook[id]) || {};
        if (UI._design.pattern === 'none' && fb.p) { UI._design.pattern = fb.p; }
        E.saveDesignDraft(UI._design);
        UI.renderDesign();
        break;
      case 'design-pattern':
        UI._design.pattern = id;
        E.saveDesignDraft(UI._design);
        UI.renderDesign();
        break;
      case 'design-color':
        UI._design.color = id;
        E.saveDesignDraft(UI._design);
        UI.renderDesign();
        break;
      case 'design-deco': {
        var deco = UI._design.deco || [];
        var idx = deco.indexOf(id);
        if (idx >= 0) { deco.splice(idx, 1); }
        else if (deco.length < D.DESIGN.maxDecorations) { deco.push(id); }
        else { UI.toast('最多 ' + D.DESIGN.maxDecorations + ' 个装饰'); }
        E.saveDesignDraft(UI._design);
        UI.renderDesign();
        break;
      }
      case 'design-price':
        UI._design.priceMode = id;
        E.saveDesignDraft(UI._design);
        UI.renderDesign();
        break;
      case 'design-create': {
        var designRes = E.createDesign(UI._design, UI._designOrderId);
        if (!designRes.ok) {
          UI.toast(designRes.message || '设计失败');
        } else {
          UI.designResult(designRes);
          UI._screenSig = '';
          UI.render();
        }
        break;
      }
      case 'design-result-close':
        UI.closeModal();
        UI.closeDesign();
        break;
      case 'design-gallery':
        UI.designGallery();
        break;
      case 'design-gallery-open':
        UI.showDesign(id);
        break;
      case 'design-share':
        UI.designShare(id);
        break;
      case 'design-print-clear':
        UI._design.print = null;
        E.saveDesignDraft(UI._design);
        UI.renderDesign();
        break;
      case 'design-board-draw':
        designBoardStart('draw', 'front');
        break;
      case 'design-board-print':
        designBoardStart('print');
        break;
      case 'design-board-clear':
        UI._design.custom = null;
        E.saveDesignDraft(UI._design);
        UI.renderDesign();
        break;
      case 'design-board-cancel':
        UI._board = null;
        UI.renderDesign();
        break;
      case 'board-side':
        UI._board.side = id === 'back' ? 'back' : 'front';
        UI.renderDesign();
        break;
      case 'board-undo':
        if (UI._board.mode === 'print') {
          if (UI._board.history && UI._board.history.length) { UI._board.grid = UI._board.history.pop(); }
        } else {
          UI._board.points[UI._board.side] = [];
        }
        UI.renderDesign();
        break;
      case 'board-clear':
        if (UI._board.mode === 'print') {
          UI._board.history = UI._board.history || [];
          UI._board.history.push(UI._board.grid.slice());
          UI._board.grid = Array.from({ length: 32 }, function () { return Array(32).fill('.').join(''); });
        } else {
          UI._board.points[UI._board.side] = [];
        }
        UI.renderDesign();
        break;
      case 'board-symmetry':
        UI._board.symmetry = !UI._board.symmetry;
        UI.renderDesign();
        break;
      case 'board-tool':
        UI._board.tool = id || 'brush';
        UI.renderDesign();
        break;
      case 'board-color':
        UI._board.color = parseInt(id, 10) || 0;
        UI.renderDesign();
        break;
      case 'board-generate': {
        if (UI._board.mode === 'print') {
          var grid = UI._board.grid.slice();
          var has = grid.some(function (row) { return /[0-7]/.test(row); });
          UI._design.print = has ? { grid: grid, palette: UI._board.palette.slice() } : null;
          UI._board = null;
          E.saveDesignDraft(UI._design);
          UI.renderDesign();
        } else {
          var path = designPointsToPath(UI._board.points[UI._board.side] || []);
          if (!path) {
            UI.toast('画得再完整一点：轮廓要围住衣身，面积别太小');
            break;
          }
          UI._design.custom = UI._design.custom || {};
          UI._design.custom[UI._board.side] = path;
          UI._design.side = UI._board.side;
          UI._board = null;
          E.saveDesignDraft(UI._design);
          UI.renderDesign();
        }
        break;
      }
      case 'order-deliver': {
        var delRes = E.deliverOrder(id);
        if (!delRes.ok) { UI.toast(delRes.message || '交付失败'); }
        else { UI.toast('订单交付，收入 ' + money(delRes.price)); }
        UI.render();
        break;
      }
      case 'staff-detail':
      case 'staff-hire':
        UI.openApplicant(id);
        break;
      case 'staff-hire-confirm': {
        var hireRes = E.hireStaff(id);
        if (!hireRes.ok) { UI.toast(hireRes.message || '招不了'); }
        else { UI.toast('招到新员工了，去店里看看'); UI.closeModal(); }
        UI.render();
        break;
      }
      case 'staff-train-menu':
        UI.openTraining(id);
        break;
      case 'staff-train-course': {
        var parts = String(id || '').split('|');
        var trainRes = E.trainStaff(parts[0], parts[1]);
        if (!trainRes.ok) { UI.toast(trainRes.message || '培训失败'); }
        else { UI.toast('送去培训，明天 ' + E.getStaffSkillLabel(trainRes.skill) + ' +1'); UI.closeModal(); }
        UI.render();
        break;
      }
      case 'staff-role-menu':
        UI.openRoleMenu(id);
        break;
      case 'staff-role-set': {
        var rparts = String(id || '').split('|');
        var roleRes = E.setStaffRole(rparts[0], rparts[1] === 'none' ? null : rparts[1]);
        if (!roleRes.ok) { UI.toast(roleRes.message || '换岗失败'); }
        else { UI.toast(rparts[1] === 'none' ? '已取消岗位' : '岗位已调整'); UI.closeModal(); }
        UI.render();
        break;
      }
      case 'staff-bonus': {
        var bonusRes = E.staffBonus(id);
        if (!bonusRes.ok) { UI.toast(bonusRes.message || '发不了奖金'); }
        else { UI.toast('士气 +' + (bonusRes.gain || 15)); }
        UI.render();
        break;
      }
      case 'staff-manager': {
        var mgrRes = E.appointManager(id);
        if (!mgrRes.ok) { UI.toast(mgrRes.message || '任命失败'); }
        else { UI.toast('任命为店长，技能 +20%'); }
        UI.render();
        break;
      }
      case 'staff-fire':
        E.fireStaff(id);
        UI.toast('已解雇，赔了一天工资');
        UI.render();
        break;
      case 'decor-place':
        UI._placeId = UI._placeId === id ? null : id;
        UI.refreshDecor();
        break;
      case 'decor-rotate': {
        if (!UI._decorSel) { break; }
        var beforeRot = E.getDecorAudit();
        var rotRes = E.rotateFurniture(UI._decorSel);
        if (!rotRes.ok) { UI.toast(rotRes.message || '转不过来'); }
        UI.refreshDecor();
        if (rotRes.ok) {
          var afterRot = E.getDecorAudit();
          if (afterRot.score !== beforeRot.score) {
            UI.toast('装修分 ' + beforeRot.score + ' → ' + afterRot.score + ' · ' + afterRot.taste.label);
          }
        }
        break;
      }
      case 'decor-store': {
        var beforeStore = E.getDecorAudit();
        if (UI._decorSel) { E.storeFurniture(UI._decorSel); UI._decorSel = null; }
        UI.refreshDecor();
        var afterStore = E.getDecorAudit();
        if (afterStore.score !== beforeStore.score) {
          UI.toast('收起后装修分 ' + beforeStore.score + ' → ' + afterStore.score);
        }
        break;
      }
      case 'decor-buy': {
        var buyRes = E.buyFurniture(id);
        if (!buyRes.ok) { UI.toast(buyRes.message || '买不了'); }
        else { UI.toast('买好了，记得摆出来'); }
        UI.refreshDecor();
        break;
      }
      case 'decor-done':
        UI._placeId = null;
        UI._decorSel = null;
        UI._prepTab = 'today';
        UI._screenSig = '';
        UI.closeModal();
        UI.render();
        UI.scrollTop();
        break;
      case 'warehouse-toggle':
        UI._clearSel[id] = !UI._clearSel[id];
        UI.openWarehouse();
        break;
      case 'warehouse-clear': {
        var ids = Object.keys(UI._clearSel).filter(function (k) { return UI._clearSel[k]; });
        var clearRes = E.clearanceSell(ids);
        if (clearRes.ok) {
          UI._clearSel = {};
  UI._decorSel = null;
  UI._placeId = null;
          UI.toast('清仓 ' + clearRes.sold + ' 件，回款 ' + money(clearRes.cash));
        } else {
          UI.toast(clearRes.message || '没有可清仓的商品');
        }
        UI.render();
        UI.openWarehouse();
        break;
      }
      case 'wardrobe-category':
        E.setInventoryCategory(id);
        UI.openWardrobe();
        break;
      case 'wardrobe-slot':
        E.setAccessorySlot(id);
        UI.openWardrobe();
        break;
      case 'wardrobe-style':
        E.setStyleFilter(id);
        UI.openWardrobe();
        break;
      case 'select-marketing':
        E.selectMarketing(id);
        UI.render();
        break;
      case 'select-pricing':
        E.selectPricing(id);
        UI.render();
        break;
      case 'open-shop': {
        var res = E.openShop();
        if (!res.ok) { UI.toast(res.message); }
        else {
          if (window.Scene) { Scene.play('bell'); }
          UI.render();
          if (window.Scene) { Scene.talk(900); }
        }
        break;
      }
      case 'serve-customer':
        E.serveCustomer();
        UI.render();
        break;
      case 'chat-choice': {
        var chatRes = E.chooseReply(parseInt(id, 10));
        if (window.Scene) { Scene.play(chatRes && chatRes.match ? 'heart' : 'pop'); }
        if (chatRes && chatRes.match) { UI.floatText('好感 +' + chatRes.delta, 'good'); }
        UI.render();
        if (window.Scene) {
          var tone = s && s.chatReply ? s.chatReply.tone : '';
          Scene.gesture(tone === 'warm' ? 'lean' : tone === 'direct' ? 'point' : 'joke');
          Scene.talk(1050);
        }
        break;
      }
      case 'chat-next':
        E.continueChat();
        if (window.Scene) { Scene.play('page'); }
        UI.render();
        if (window.Scene && s && s.chatPhase !== 'done') { Scene.talk(900); }
        break;
      case 'start-service':
        E.serveCustomer();
        if (window.Scene) { Scene.play('page'); }
        UI.render();
        break;
      case 'skip-chat':
        E.serveCustomer();
        if (window.Scene) { Scene.play('page'); }
        UI.render();
        break;
      case 'care-water': {
        var care = E.careAction();
        if (care && care.ok) {
          if (window.Scene) { Scene.play('water'); }
          UI.floatText('好感 +6', 'good');
          UI.toast('她放松了一点');
        }
        UI.render();
        if (window.Scene) { Scene.gesture('lean'); Scene.talk(850); }
        break;
      }
      case 'pet-cat': {
        var petted = window.Scene && Scene.petCat ? Scene.petCat() : false;
        if (window.Scene) { Scene.play(petted ? 'purr' : 'heart'); }
        UI.floatText('呼噜呼噜', 'heart');
        break;
      }
      case 'toggle-sound': {
        var on = window.Scene ? Scene.toggleSound() : false;
        UI._stageSig = '';
        UI.render();
        UI.toast(on ? '音效已打开' : '音效已关闭');
        break;
      }
      case 'try-on': {
        var tryRes = E.tryOn();
        if (!tryRes.ok) {
          UI.toast(tryRes.message);
        } else {
          if (window.Scene) { Scene.play('pop'); }
          UI.toast('她试了试：' + tryRes.hint);
          UI.render();
          setTimeout(function () { UI.scrollToEl('.try-feedback'); }, 60);
        }
        break;
      }
      case 'choose-option': {
        var idx = parseInt(id, 10);
        if (s && s.quickOptions && s.quickOptions[idx]) {
          E.previewOption(idx);
          if (window.Scene) { Scene.play('cloth'); }
          UI.toast('方案已上身，可以微调，也可以直接看结果');
          UI.render();
        }
        break;
      }
      case 'open-styling':
        E.openStyling();
        UI.render();
        UI.scrollTop();
        break;
      case 'back-to-options':
        E.serveCustomer();
        UI.render();
        UI.scrollTop();
        break;
      case 'set-category':
        E.setCategory(id);
        UI.render();
        break;
      case 'set-accessory-slot':
        E.setAccessorySlot(id);
        UI.render();
        break;
      case 'set-style':
        E.setStyleFilter(id);
        UI.render();
        break;
      case 'toggle-item': {
        if (UI._suppressToggleUntil && Date.now() < UI._suppressToggleUntil) {
          UI._suppressToggleUntil = 0;
          break;
        }
        var r = E.toggleItem(id);
        if (r && !r.ok && r.message) { UI.toast(r.message); }
        UI.render();
        if (window.Scene && r && r.ok && s && s.selectedItems.indexOf(id) >= 0) {
          Scene.play('cloth');
          Scene.pulse('reach');
          Scene.gesture('point');
          UI.floatText('递给她', 'good');
        }
        break;
      }
      case 'clear-selection':
        E.clearSelection();
        UI.render();
        break;
      case 'try-outfit': {
        if (!s || !s.selectedItems.length) {
          UI.toast('先选几件衣服再试穿');
        } else {
          var fitRes = E.startTryOn(s.selectedItems);
          if (window.Scene) { Scene.play('cloth'); }
          if (fitRes && fitRes.waiting) { UI.toast('试衣间满了，先排个队'); }
          UI.render();
          UI.scrollTop();
        }
        break;
      }
      case 'set-pose':
        E.setPreviewPose(id);
        UI.render();
        if (UI._lookOpen) { UI.openLook(); }
        break;
      case 'open-look':
        UI.openLook();
        break;
      case 'wait-fitting': {
        var waitRes = E.waitForFitting();
        if (!waitRes.ok) { UI.toast(waitRes.message || '还没轮到你'); }
        else { UI.toast(waitRes.noRoom ? '没有试衣间，拉上帘子换吧' : '前一位出来了，轮到她了'); }
        UI.render();
        break;
      }
      case 'complete-fitting':
        E.completeFitting();
        if (window.Scene) { Scene.play('stamp'); }
        UI.render();
        UI.scrollTop();
        break;
      case 'resolve-empty':
        E.resolveCustomer([]);
        UI.render();
        break;
      case 'accept-discount':
        E.acceptDiscount();
        if (window.Scene) { Scene.play('coin'); }
        UI.render();
        break;
      case 'decline-discount':
        E.declineDiscount();
        UI.render();
        break;
      case 'next-customer': {
        var logBefore = E.getStaffLog().length;
        E.nextCustomer();
        var newLogs = E.getStaffLog().slice(logBefore);
        var saleLog = newLogs.filter(function (l) { return l.type === 'staffSale'; })[0];
        if (saleLog) {
          UI.toast((saleLog.staffName || '店员') + '接待 ' + saleLog.customerName + '，成交 ¥' + saleLog.revenue);
        } else {
          var leftLog = newLogs.filter(function (l) { return l.type === 'queueLeft'; })[0];
          if (leftLog) { UI.toast(leftLog.customerName + ' 等太久走了'); }
        }
        if (window.Scene) { Scene.play('page'); }
        UI.render();
        break;
      }
      case 'prep-tab':
        if (UI._prepTab === 'decor' && id !== 'decor') {
          UI._placeId = null;
          UI._decorSel = null;
        }
        UI._prepTab = id || 'today';
        UI.render();
        UI.scrollTop();
        break;
      case 'next-day':
        E.nextDay();
        UI._prepTab = 'today';
        if (window.Scene) { Scene.play('page'); }
        UI.render();
        break;
      case 'finish-season':
        E.finishSeason();
        UI._prepTab = 'today';
        UI.render();
        break;
      case 'continue-season':
        E.continueSeason();
        if (window.Scene) { Scene.play('page'); }
        UI.render();
        break;
      case 'share-card':
        UI.shareCard();
        break;
      case 'download-share':
        UI.saveShareImage();
        break;
      case 'share-share':
        UI.shareShareImage();
        break;
      case 'replay':
        E.reset();
        UI.overrideScreen = null;
        UI.render();
        break;
      case 'debug-toggle':
        UI.toggleDebug();
        break;
      case 'debug-cash':
        E.debugAddCash(5000);
        UI.render();
        UI.toast('现金 +¥5,000');
        break;
      case 'debug-affinity':
        if (E.state) {
          E.state.affinity = Math.min(100, (E.state.affinity || 45) + 20);
          E.recomputePatience();
          E.save();
          UI._stageSig = '';
          UI.render();
          UI.toast('好感 +20 · ' + E.getAffinityLabel());
        }
        break;
      case 'debug-complete':
        E.debugCompleteDay();
        UI.render();
        break;
      case 'debug-skip':
        E.debugSkipDay();
        UI.render();
        break;
      case 'debug-export':
        UI.exportLog();
        break;
      case 'debug-reset':
        if (window.confirm('确定重置存档？')) {
          E.reset();
          UI.overrideScreen = null;
          UI.render();
        }
        break;
      case 'close-modal':
        UI.closeModal();
        break;
      case 'noop':
        break;
      default:
        break;
    }
  };

  UI.itemSvg = itemSvg;
  UI.avatarSvg = avatarSvg;
  UI.storeSvg = storeSvg;
  window.UI = UI;
})();
