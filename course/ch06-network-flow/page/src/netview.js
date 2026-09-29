/* netview.js — 网络图的通用画法：点、弧（直线或弯曲）、箭头、标签；每个图只提供“状态”（样式类与文字） */
function mnum(v) { return v < 0 ? "−" + n0(-v) : n0(v); }
var NETLAYOUT = { // 每条弧的弯曲量 bend、标签位置 t 与法向偏移 o（正 = 沿前进方向的右手侧，屏幕上 y 向下）
  0: { t: 0.5, o: -10 }, 1: { t: 0.5, o: 10 }, 2: { t: 0.5, o: 11 }, 3: { t: 0.5, o: -10 },
  4: { t: 0.27, o: 9 }, 5: { t: 0.5, o: 10 }, 6: { t: 0.5, o: -11 }, 7: { t: 0.5, o: -10 },
  8: { t: 0.5, o: 10 }, 9: { t: 0.27, o: -9 }, 10: { bend: -0.3, t: 0.68, o: 9 }
};
function NetView(svg, cfg) {
  var R = 17, W = cfg.W || 540, H = cfg.H || 300, pos = cfg.pos, names = cfg.names, layout = cfg.layout || NETLAYOUT;
  svg.setAttribute("viewBox", "0 0 " + W + " " + H);
  var gEdges, gNodes, edgeEls = [], nodeEls = [], edges = cfg.edges;

  function geom(e, k) {
    var L = layout[k] || {}, p = pos[e.u], q = pos[e.v], dx = q[0] - p[0], dy = q[1] - p[1], len = Math.sqrt(dx * dx + dy * dy);
    var ux = dx / len, uy = dy / len, nx = -uy, ny = ux, bend = (L.bend || 0) * len;
    var x1 = p[0] + ux * R, y1 = p[1] + uy * R, x2 = q[0] - ux * (R + 3), y2 = q[1] - uy * (R + 3);
    var cx = (p[0] + q[0]) / 2 + nx * bend, cy = (p[1] + q[1]) / 2 + ny * bend;
    if (bend) {   // 弯曲弧：端点沿切线方向收缩
      var a1x = cx - p[0], a1y = cy - p[1], l1 = Math.sqrt(a1x * a1x + a1y * a1y), a2x = q[0] - cx, a2y = q[1] - cy, l2 = Math.sqrt(a2x * a2x + a2y * a2y);
      x1 = p[0] + a1x / l1 * R; y1 = p[1] + a1y / l1 * R; x2 = q[0] - a2x / l2 * (R + 3); y2 = q[1] - a2y / l2 * (R + 3);
    }
    var t = L.t == null ? 0.5 : L.t, o = L.o == null ? 10 : L.o;
    var bx = (1 - t) * (1 - t) * p[0] + 2 * (1 - t) * t * cx + t * t * q[0], by = (1 - t) * (1 - t) * p[1] + 2 * (1 - t) * t * cy + t * t * q[1];
    var tx = 2 * (1 - t) * (cx - p[0]) + 2 * t * (q[0] - cx), ty = 2 * (1 - t) * (cy - p[1]) + 2 * t * (q[1] - cy), tl = Math.sqrt(tx * tx + ty * ty) || 1;
    var hx = q[0] - cx, hy = q[1] - cy, hl = Math.sqrt(hx * hx + hy * hy) || 1;
    return { d: "M" + x1.toFixed(1) + " " + y1.toFixed(1) + " Q" + cx.toFixed(1) + " " + cy.toFixed(1) + " " + x2.toFixed(1) + " " + y2.toFixed(1),
      lx: bx - ty / tl * o, ly: by + tx / tl * o, hx: hx / hl, hy: hy / hl, x2: x2, y2: y2 };
  }
  function head(g) {
    var s = 8.5, ax = g.x2 - g.hx * s, ay = g.y2 - g.hy * s, px = -g.hy * 4.4, py = g.hx * 4.4;
    return (g.x2 + 2 * g.hx).toFixed(1) + "," + (g.y2 + 2 * g.hy).toFixed(1) + " " + (ax + px).toFixed(1) + "," + (ay + py).toFixed(1) + " " + (ax - px).toFixed(1) + "," + (ay - py).toFixed(1);
  }
  clear(svg);
  gEdges = sv("g", {}, svg); gNodes = sv("g", {}, svg);
  edges.forEach(function (e, k) {
    var g = geom(e, k), grp = sv("g", { cls: "nvE" }, gEdges);
    var hit = sv("path", { cls: "hit", d: g.d }, grp), ln = sv("path", { cls: "ln", d: g.d }, grp), hd = sv("polygon", { cls: "hd", points: head(g) }, grp);
    var lb = sv("text", { cls: "lb", x: g.lx, y: g.ly + 4, "text-anchor": "middle" }, grp);
    edgeEls.push({ g: grp, ln: ln, hd: hd, lb: lb, hit: hit });
  });
  names.forEach(function (nm, i) {
    var grp = sv("g", { cls: "nvN" }, gNodes);
    sv("circle", { cx: pos[i][0], cy: pos[i][1], r: R }, grp);
    sv("text", { cls: "nm", x: pos[i][0], y: pos[i][1] + 5, "text-anchor": "middle", text: nm }, grp);
    var up = i === 1 || i === 3;
    var note = sv("text", { cls: "nt", x: pos[i][0], y: pos[i][1] + (up ? -26 : 35), "text-anchor": "middle" }, grp);
    nodeEls.push({ g: grp, note: note });
  });

  var api = {
    edgeEls: edgeEls, nodeEls: nodeEls,
    draw: function (st) {
      st = st || {};
      edges.forEach(function (e, k) {
        var el_ = edgeEls[k];
        el_.g.setAttribute("class", "nvE " + ((st.edgeCls && st.edgeCls[k]) || ""));
        el_.lb.textContent = (st.edgeText && st.edgeText[k]) || "";
        el_.g.style.display = st.edgeHide && st.edgeHide[k] ? "none" : "";
      });
      names.forEach(function (nm, i) {
        nodeEls[i].g.setAttribute("class", "nvN " + ((st.nodeCls && st.nodeCls[i]) || ""));
        nodeEls[i].note.textContent = (st.nodeText && st.nodeText[i]) || "";
      });
    },
    onEdge: function (fn) { edgeEls.forEach(function (o, k) { o.hit.addEventListener("mousemove", function (ev) { fn(k, ev); }); o.hit.addEventListener("mouseleave", hideTip); }); }
  };
  return api;
}
