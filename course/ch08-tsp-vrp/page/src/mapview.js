function num2(v) { return String(Math.round(v * 100) / 100); }
/* mapview.js — 点与弧的画法：仓库（方块）、客户（圆），弧带箭头，可按“回路编号”着色 */
var MAPW = 580, MAPH = 350;
function mx(p) { return 40 + p[0] * 4.6; }
function my(p) { return 36 + (70 - p[1]) * 4.0; }
function drawMap(svg, P, o) {
  o = o || {}; clear(svg); svg.setAttribute("viewBox", "0 0 " + MAPW + " " + MAPH);
  var R = 12;
  (o.hulls || []).forEach(function (S) {
    var pts = S.map(function (v) { return [mx(P[v]), my(P[v])]; }), cx = 0, cy = 0;
    pts.forEach(function (q) { cx += q[0]; cy += q[1]; }); cx /= pts.length; cy /= pts.length;
    var rad = 0; pts.forEach(function (q) { rad = Math.max(rad, Math.hypot(q[0] - cx, q[1] - cy)); });
    sv("ellipse", { cls: "hull", cx: cx, cy: cy, rx: rad + 22, ry: rad + 22 }, svg);
  });
  (o.arcs || []).forEach(function (a) {
    var p = P[a.u], q = P[a.v], x1 = mx(p), y1 = my(p), x2 = mx(q), y2 = my(q), dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
    var off = a.off || 0, nx = -uy * off, ny = ux * off;
    var sx = x1 + ux * R + nx, sy = y1 + uy * R + ny, ex = x2 - ux * (R + 3) + nx, ey = y2 - uy * (R + 3) + ny, cls = a.cls || "";
    sv("line", { cls: "arc " + cls, x1: sx, y1: sy, x2: ex, y2: ey, "stroke-width": a.w || null }, svg);
    var hx = ex, hy = ey, s = 8;
    sv("polygon", { cls: "head " + cls, points: (hx + ux * 3).toFixed(1) + "," + (hy + uy * 3).toFixed(1) + " " + (hx - ux * s - uy * 4).toFixed(1) + "," + (hy - uy * s + ux * 4).toFixed(1) + " " + (hx - ux * s + uy * 4).toFixed(1) + "," + (hy - uy * s - ux * 4).toFixed(1) }, svg);
    if (a.label) sv("text", { cls: "lbl", x: (sx + ex) / 2 + nx * 0.8, y: (sy + ey) / 2 + ny * 0.8 - 3, "text-anchor": "middle", text: a.label }, svg);
  });
  P.forEach(function (p, i) {
    var g = sv("g", { cls: "pt" + (i === 0 ? " dep" : "") + (o.nodeCls && o.nodeCls[i] ? " " + o.nodeCls[i] : "") }, svg);
    if (i === 0) sv("rect", { x: mx(p) - 13, y: my(p) - 13, width: 26, height: 26, rx: 5 }, g);
    else sv("circle", { cx: mx(p), cy: my(p), r: R }, g);
    sv("text", { x: mx(p), y: my(p) + 4, "text-anchor": "middle", text: i === 0 ? "仓" : String(i) }, g);
    if (o.nodeNote && o.nodeNote[i]) sv("text", { cls: "dm", x: mx(p), y: my(p) - 17, "text-anchor": "middle", text: o.nodeNote[i] }, g);
  });
}
// 把一个后继数组或回路列表画成弧
function cycleArcs(cyc, cls) {
  var out = [];
  for (var i = 0; i < cyc.length; i++) out.push({ u: cyc[i], v: cyc[(i + 1) % cyc.length], cls: cls, off: cyc.length === 2 ? 5 : 0 });
  return out;
}
