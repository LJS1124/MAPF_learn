/* fig5.js — 图 6-5：多商品流。三个商品、两个三角形：LP 每个商品各走一半，整数无解 */
(function () {
  var T = Core.triangleNet(), N = T.N, E = T.edges, m = E.length;
  var COLORS = ["var(--accent)", "var(--hot)", "var(--good)"];
  var POS = [[36, 55], [36, 165], [36, 275], [190, 115], [285, 30], [380, 115], [190, 282], [285, 197], [380, 282], [530, 55], [530, 165], [530, 275]];
  var S = { mode: "lp", two: false, pick: [0, 0, 1] };
  var svg = $("xcSvg");
  var R = 14;

  function seg(a, b, off) {
    var dx = POS[b][0] - POS[a][0], dy = POS[b][1] - POS[a][1], len = Math.sqrt(dx * dx + dy * dy), ux = dx / len, uy = dy / len;
    var nx = -uy, ny = ux;
    return { x1: POS[a][0] + ux * R + nx * off, y1: POS[a][1] + uy * R + ny * off, x2: POS[b][0] - ux * (R + 4) + nx * off, y2: POS[b][1] - uy * (R + 4) + ny * off, ux: ux, uy: uy, nx: nx, ny: ny };
  }
  function comOf(k) { return T.coms.slice(0, S.two ? 2 : 3); }

  // 每个商品在每条弧上的流量 [commodity][edge]
  function flows() {
    var K = comOf().length, out = [];
    if (S.mode === "lp") {
      var lp = Core.multiFlowLP(N, E, comOf());
      for (var c = 0; c < K; c++) out.push(E.map(function (_, e) { return lp.status === "optimal" ? lp.x[c * m + e] : 0; }));
      return { x: out, lp: lp };
    }
    for (var c2 = 0; c2 < K; c2++) {
      var tri = S.pick[c2], x = E.map(function () { return 0; });
      // 商品 c2 走三角形 tri：S→v_c、v_c→v_{c+1}→v_{c+2}、v_{c+2}→T
      var base = 6 + 4 * c2, arcTri = tri === 0 ? [c2, (c2 + 1) % 3] : [3 + c2, 3 + (c2 + 1) % 3];
      x[base + (tri === 0 ? 0 : 1)] = 1; x[base + (tri === 0 ? 2 : 3)] = 1;
      arcTri.forEach(function (a) { x[a] = 1; });
      out.push(x);
    }
    return { x: out, lp: null };
  }

  function render() {
    var F = flows(), K = F.x.length, load = E.map(function (_, e) { var s = 0; F.x.forEach(function (x) { s += x[e]; }); return s; });
    clear(svg); svg.setAttribute("viewBox", "0 0 566 314");
    sv("text", { cls: "tri-t", x: 285, y: 14, "text-anchor": "middle", text: "三角形 1（v）" }, svg);
    sv("text", { cls: "tri-t", x: 285, y: 309, "text-anchor": "middle", text: "三角形 2（w）" }, svg);
    var over = 0;
    E.forEach(function (e, k) {
      var used = F.x.map(function (x, c) { return x[k] > 1e-9 ? c : -1; }).filter(function (c) { return c >= 0; });
      var isOver = load[k] > e.cap + 1e-9;
      if (isOver) over++;
      var base = seg(e.u, e.v, 0), g = sv("g", { cls: "mE" + (isOver ? " over" : "") }, svg);
      sv("line", { x1: base.x1, y1: base.y1, x2: base.x2, y2: base.y2, stroke: "var(--line-2)", "stroke-width": 1.6 }, g);
      used.forEach(function (c, i) {
        var off = (i - (used.length - 1) / 2) * 5.5, s = seg(e.u, e.v, off), frac = !near(F.x[c][k], Math.round(F.x[c][k]));
        sv("line", { x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2, stroke: COLORS[c], "stroke-width": 3.2, "stroke-dasharray": frac ? "6 4" : "none", "stroke-linecap": "round" }, g);
      });
      var hx = base.x2, hy = base.y2;
      sv("polygon", { points: (hx + base.ux * 2).toFixed(1) + "," + (hy + base.uy * 2).toFixed(1) + " " + (hx - base.ux * 7 + base.nx * 4).toFixed(1) + "," + (hy - base.uy * 7 + base.ny * 4).toFixed(1) + " " + (hx - base.ux * 7 - base.nx * 4).toFixed(1) + "," + (hy - base.uy * 7 - base.ny * 4).toFixed(1), fill: isOver ? "var(--bad)" : "var(--line-2)" }, g);
      if (k < 6) {           // 三角形的弧：在三角形内侧标 载荷/容量
        var tri = k < 3 ? [3, 4, 5] : [6, 7, 8], gx = (POS[tri[0]][0] + POS[tri[1]][0] + POS[tri[2]][0]) / 3, gy = (POS[tri[0]][1] + POS[tri[1]][1] + POS[tri[2]][1]) / 3;
        var mx0 = (base.x1 + base.x2) / 2, my0 = (base.y1 + base.y2) / 2, dx0 = gx - mx0, dy0 = gy - my0, dl = Math.sqrt(dx0 * dx0 + dy0 * dy0) || 1;
        sv("text", { cls: "mL", x: mx0 + dx0 / dl * 15, y: my0 + dy0 / dl * 15 + 3.5, "text-anchor": "middle", text: ufrac(load[k]) + "/" + e.cap, style: isOver ? "fill:var(--bad);font-weight:600" : "" }, svg);
      }
    });
    N.forEach(function (nm, i) {
      var cls = i < 3 ? "s" : i >= 9 ? "t" : "", g = sv("g", { cls: "mN " + cls }, svg);
      sv("circle", { cx: POS[i][0], cy: POS[i][1], r: R }, g);
      sv("text", { x: POS[i][0], y: POS[i][1] + 4, "text-anchor": "middle", text: nm }, g);
      if ((i < 3 || i >= 9) && (S.two && (i === 2 || i === 11))) g.style.opacity = "0.3";
    });
    // 右侧
    var st = clear($("xcStats"));
    var lpv = F.lp && F.lp.status === "optimal" ? Math.round(F.lp.value * 1000) / 1000 : null;
    var lpAll = Core.multiFlowLP(N, E, comOf());
    var ip = Core.multiIntegerBest(N, E, comOf());
    st.appendChild(stat("LP 最优值", lpAll.status === "optimal" ? n0(lpAll.value) : "无解", "每个商品 2 个费用，共 " + K + " 个商品"));
    st.appendChild(stat("整数最优值", ip.value == null ? "无解" : n0(ip.value), "每个商品选一条路", ip.value == null));
    st.appendChild(stat("超载的弧", S.mode === "int" ? String(over) : "—", S.mode === "int" ? "载荷 > 容量 1" : "LP 里没有超载"));
    var say;
    if (S.mode === "lp") {
      say = "<p>LP 的最优解里，每个商品在两个三角形里各走 ½（虚线）。每条三角形的弧上恰好有两个商品，各占 ½，载荷 1/1，刚好满。</p>" +
        (S.two ? "<p>只有两个商品时，LP 也可以让它们各占一个三角形，整数解存在，LP 值 = 整数最优 = 4。</p>" : "<p>三个商品、两个三角形，每个三角形里任意两个商品的路径都要共用一条弧（每两条路各占两条弧，共三条弧），所以一个三角形里至多容纳一个商品。三个商品放不下，整数无解。LP 却可以把每个商品劈成两半。</p>");
    } else {
      var used = [0, 0]; S.pick.slice(0, K).forEach(function (t) { used[t]++; });
      say = "<p>你给每个商品选了一个三角形。" + (over ? "<b class=\"no\">有 " + over + " 条弧超载</b>（红色）：同一个三角形里放了 " + Math.max(used[0], used[1]) + " 个商品。" : "<b class=\"ok\">没有弧超载，这是一个可行的整数方案。</b>") + "</p>";
    }
    $("xcSay").innerHTML = say;
    var tb = clear($("xcPick")), head = el("tr", {}, [el("th", { text: "商品 1" }), el("th", { text: "商品 2" }), K > 2 ? el("th", { text: "商品 3" }) : null, el("th", { text: "结果" })]);
    tb.appendChild(el("thead", {}, [head]));
    var body = el("tbody"), ncombo = 1 << K;
    for (var mask = 0; mask < ncombo; mask++) {
      var ch = []; for (var c = 0; c < K; c++) ch.push((mask >> c) & 1);
      var cnt = [0, 0]; ch.forEach(function (t) { cnt[t]++; });
      var ok = cnt[0] <= 1 && cnt[1] <= 1;
      body.appendChild(el("tr", {}, [].concat(ch.map(function (t) { return el("td", { text: t ? "三角形 2" : "三角形 1" }); }), [el("td", { cls: ok ? "ok" : "no", text: ok ? "可行" : "共用一条弧" })])));
    }
    tb.appendChild(body);
    var sel = clear($("xcSel"));
    for (var c3 = 0; c3 < K; c3++) (function (c) {
      var row = el("div", { cls: "chips" });
      row.appendChild(el("span", { style: "color:var(--muted);font-size:12.5px;margin-right:6px;min-width:4em;display:inline-block", text: "商品 " + (c + 1) }));
      [0, 1].forEach(function (t) { row.appendChild(el("button", { type: "button", text: "三角形 " + (t + 1), "aria-pressed": S.pick[c] === t ? "true" : "false", onclick: function () { S.pick[c] = t; S.mode = "int"; sync(); render(); } })); });
      sel.appendChild(row);
    })(c3);
  }
  var syncMode;
  function sync() { if (syncMode) syncMode(); }
  syncMode = buildSeg($("xcMode"), [{ key: "lp", label: "LP 的解" }, { key: "int", label: "自己选整数方案" }], function () { return S.mode; }, function (k) { S.mode = k; render(); });
  $("xcTwo").addEventListener("change", function () { S.two = $("xcTwo").checked; render(); });
  render();
  window.__fig5 = S;
})();
