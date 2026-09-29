/* fig3.js — 图 6-3：最小费用流。滑块选流量 k；逐次最短路；势；费用曲线 */
(function () {
  var NET = D.net, NAMES = NET.names, E = NET.edges;
  var S = { k: 5, showH: false };
  var view = NetView($("net3"), { names: NAMES, pos: NET.pos, edges: E });
  var full = Core.minCostFlow(NAMES, E, 0, 5), curve = Core.costCurve(full.steps);
  var KMAX = full.flow;
  function pname(nodes) { return nodes.map(function (i) { return NAMES[i]; }).join("→"); }

  function drawCurve() {
    var svg = $("mcCurve"), c = lineChart(svg, { W: 360, H: 210, ml: 44, mr: 14, mt: 16, mb: 38, x: [0, KMAX], y: [0, 105],
      xticks: range(KMAX + 1).filter(function (k) { return k % 2 === 0; }).map(function (k) { return [k, String(k)]; }),
      yticks: [0, 25, 50, 75, 100].map(function (v) { return [v, String(v)]; }), xlabel: "流量 k", ylabel: "总费用" });
    var pts = curve.map(function (v, k) { return c.X(k).toFixed(1) + "," + c.Y(v).toFixed(1); }).join(" ");
    sv("polyline", { cls: "curline", points: pts }, svg);
    // 每一段的斜率 = 该单位的边际成本
    curve.forEach(function (v, k) {
      if (k === 0) return;
      var m = v - curve[k - 1];
      sv("rect", { cls: "marg" + (k === S.k ? " now" : ""), x: c.X(k - 1) + 2, y: c.Y(m) , width: c.X(1) - c.X(0) - 4, height: (c.H - c.mb) - c.Y(m) }, svg);
      sv("text", { x: (c.X(k - 1) + c.X(k)) / 2, y: c.Y(m) - 3, "text-anchor": "middle", cls: "val2", text: String(m) }, svg);
    });
    sv("circle", { cls: "dotk", cx: c.X(S.k), cy: c.Y(curve[S.k]), r: 5.5 }, svg);
    sv("text", { x: c.X(S.k) + (S.k > 8 ? -8 : 9), y: c.Y(curve[S.k]) - 8, "text-anchor": S.k > 8 ? "end" : "start", cls: "val", text: "f(" + S.k + ") = " + curve[S.k] }, svg);
  }

  function render() {
    var k = S.k, r = Core.minCostFlow(NAMES, E, 0, 5, k), lp = Core.flowLP(NAMES, E, 0, 5, k);
    var last = r.steps.length ? r.steps[r.steps.length - 1] : null;
    var ec = [], et = [], nc = [], nt = [];
    E.forEach(function (e, i) { var f = r.flowVec[i]; ec.push(f > 0 ? "on" + (f === e.cap ? " full" : "") : ""); et.push(f + "/" + e.cap + "·" + e.cost); });
    if (last) last.arcs.forEach(function (a) { var i = a >> 1; ec[i] = ec[i].replace(/ ?on/g, "") + (a & 1 ? " back" : " hot on"); });
    NAMES.forEach(function (_, i) { nc.push(i === 0 ? "src" : ""); nt.push(S.showH ? "h=" + mnum(r.h[i]) : ""); });
    if (last) last.nodes.forEach(function (i) { nc[i] = "cur"; });
    view.draw({ edgeCls: ec, edgeText: et, nodeCls: nc, nodeText: nt });
    var st = clear($("mcStats"));
    st.appendChild(stat("流量 k", String(k), "最大 " + KMAX));
    st.appendChild(stat("总费用", String(r.cost), "逐次最短路"));
    st.appendChild(stat("第 k 个单位的价格", k ? String(curve[k] - curve[k - 1]) : "—", "= 最新一条增广路的长度", true));
    var integral = lp.status === "optimal" && lp.x.every(function (v) { return near(v, Math.round(v)); });
    var flags = clear($("mcFlags"));
    flags.appendChild(el("span", { cls: lp.status === "optimal" && near(lp.value, r.cost) ? "ok" : "no", text: "单纯形（LP）：" + (lp.status === "optimal" ? n0(lp.value) : "无解") }));
    flags.appendChild(el("span", { cls: integral ? "ok" : "no", text: integral ? "LP 的解全是整数" : "LP 的解有分数" }));
    var tb = clear($("mcTable")), body = el("tbody"), cum = 0;
    tb.appendChild(el("thead", {}, [el("tr", {}, [el("th", { text: "#" }), el("th", { text: "最短路" }), el("th", { text: "长度" }), el("th", { text: "推" }), el("th", { text: "累计" })])]));
    full.steps.forEach(function (s, i) {
      var from = cum, to = cum + s.bottleneck; cum = to;
      var now = k > from && k <= to;
      body.appendChild(el("tr", { cls: now ? "cur" : "" }, [el("td", { text: String(i + 1) }), el("td", { text: pname(s.nodes) }), el("td", { text: String(s.length) }), el("td", { text: String(s.bottleneck) }), el("td", { text: String(to) })]));
    });
    tb.appendChild(body);
    var say = "";
    if (k === 0) say = "<p>流量为 0，费用 0。</p>";
    else {
      say = "<p>再送第 " + k + " 个单位的价格是 <b class=\"key\">" + (curve[k] - curve[k - 1]) + "</b>：在残量图上找到的最短路长度。" +
        (last && last.backArcs.length ? "这条路用了回退弧。" : "") + "</p>";
      if (k >= 2 && curve[k] - curve[k - 1] > curve[k - 1] - curve[k - 2]) say += "<p>价格比上一个单位涨了：便宜的通道已经满了，只能走更贵的。费用曲线是<b>凸</b>的：边际成本只升不降，这是最短路逐次变长的必然结果。</p>";
    }
    if (S.showH) say += "<p>图中每个点旁边的 <span class=\"mn\">h</span> 是当前的势（到这个点的累计最短距离）。残量图里每条弧的约化成本 <span class=\"mn\">c + h(u) − h(v)</span> 都 ≥ 0，这就是最优性的证书，与第 5 章“价格”是同一个东西。</p>";
    $("mcSay").innerHTML = say;
    $("mcKv").textContent = String(k);
    drawCurve();
  }
  var slider = $("mcK");
  slider.max = String(KMAX); slider.value = String(S.k);
  slider.addEventListener("input", function () { S.k = Number(slider.value); render(); });
  $("mcH").addEventListener("change", function () { S.showH = $("mcH").checked; render(); });
  view.onEdge(function (i, ev) { var e = E[i]; showTip(ev, [el("div", { html: "<b>" + NAMES[e.u] + "→" + NAMES[e.v] + "</b>　容量 " + e.cap + "　单价 " + e.cost })]); });
  render();
  window.__fig3 = { S: S, curve: curve };
})();
