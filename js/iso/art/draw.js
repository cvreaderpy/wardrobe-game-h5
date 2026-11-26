/* 衣间小日子 — 等距矢量绘制小工具 */
(function () {
  var Iso = window.Iso;

  var D = Iso.draw = {};

  D.p = function (gx, gy, z) {
    var q = Iso.P(gx, gy, z);
    return [q.x, q.y];
  };

  function pts(list) {
    var out = [];
    for (var i = 0; i < list.length; i++) {
      out.push(list[i][0].toFixed(1) + ',' + list[i][1].toFixed(1));
    }
    return out.join(' ');
  }

  D.poly = function (list, fill, opt) {
    opt = opt || {};
    var s = ' stroke="' + (opt.stroke || Iso.C.line) + '" stroke-width="' + (opt.sw == null ? 1.3 : opt.sw) + '" stroke-linejoin="round"';
    if (opt.stroke === null) { s = ''; }
    var op = opt.opacity == null ? '' : ' opacity="' + opt.opacity + '"';
    return '<polygon points="' + pts(list) + '" fill="' + fill + '"' + s + op + '/>';
  };

  D.line = function (a, b, opt) {
    opt = opt || {};
    return '<path d="M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + 'L' + b[0].toFixed(1) + ' ' + b[1].toFixed(1) +
      '" fill="none" stroke="' + (opt.stroke || Iso.C.line) + '" stroke-width="' + (opt.sw == null ? 1.2 : opt.sw) + '"' +
      (opt.opacity == null ? '' : ' opacity="' + opt.opacity + '"') +
      (opt.cap ? ' stroke-linecap="' + opt.cap + '"' : '') + '/>';
  };

  D.prism = function (x, y, w, d, h, color, z0, opt) {
    z0 = z0 || 0;
    opt = opt || {};
    var zt = z0 + h;
    var top = [D.p(x, y, zt), D.p(x + w, y, zt), D.p(x + w, y + d, zt), D.p(x, y + d, zt)];
    var left = [D.p(x, y + d, zt), D.p(x + w, y + d, zt), D.p(x + w, y + d, z0), D.p(x, y + d, z0)];
    var right = [D.p(x + w, y, zt), D.p(x + w, y + d, zt), D.p(x + w, y + d, z0), D.p(x + w, y, z0)];
    var sw = opt.sw == null ? 1.3 : opt.sw;
    return D.poly(left, opt.left || color, { sw: sw })
      + D.poly(right, opt.right || Iso.shade(color, 0.8), { sw: sw })
      + D.poly(top, opt.top || Iso.shade(color, 1.16), { sw: sw });
  };

  D.shadow = function (x, y, w, d, op) {
    var c = Iso.P(x + w / 2, y + d / 2, 0);
    var rx = (w + d) * 12;
    var ry = (w + d) * 5.2;
    return '<ellipse cx="' + c.x.toFixed(1) + '" cy="' + (c.y + 1).toFixed(1) + '" rx="' + rx.toFixed(1) + '" ry="' + ry.toFixed(1) +
      '" fill="#3F332B" opacity="' + (op == null ? 0.15 : op) + '" filter="url(#soft)"/>';
  };

  D.defs = '<defs><filter id="soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.6"/></filter></defs>';

  D.svg = function (vb, body, scale) {
    scale = scale || 2;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + (vb.w * scale) + '" height="' + (vb.h * scale) +
      '" viewBox="' + vb.x + ' ' + vb.y + ' ' + vb.w + ' ' + vb.h + '">' + body + '</svg>';
  };
})();
