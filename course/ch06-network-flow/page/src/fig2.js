/* fig2.js — 图 6-2：最大流。增广路一步步推流；残量图（含回退弧）；最小割 */
(function () {
  var NET = D.net, NAMES = NET.names, E = NET.edges;
  var S = { rule: "bfs", view: "flow", step: 0, runs: {} };
  var view = NetView($("net2"), { names: NAMES, pos: NET.pos, edges: E });
  function run(rule) { return S.runs[rule] || (S.runs[rule] = Core.maxflow(NAMES, E, 0, 5, rule)); }
  function pname(nodes) { return nodes.map(function (i) { return NAMES[i]; }).join("→"); }

  function render() {
    var r = run(S.rule), n = r.steps.length;
    var atEnd = S.step > n, cur = S.step >= 1 && S.step <= n ? r.steps[S.step - 1] : null;
    var flow = S.step === 0 ? E.map(function () { return 0; }) : (S.step <= n ? r.steps[S.step - 1].flow : r.flow);
    var ec = [], et = [], nc = [], nt = [];
    E.forEach(function (e, k) {
      var f = flow[k], cls = f > 0 ? "on" : "";
      if (f === e.cap) cls += " full";
      et.push(S.view === "flow" ? f + "/" + e.cap : "→" + (e.cap - f) + (f > 0 ? " ←" + f : ""));
      ec.push(cls);
    });
    if (cur) cur.arcs.forEach(function (a) {
      var k = a >> 1;
      ec[k] = ec[k].replace(/ ?(on|full)/g, "") + (a & 1 ? " back" : " hot on");
    });
    NAMES.forEach(function (_, i) { nc.push(i === 0 ? "src" : ""); nt.push(""); });
    if (cur) cur.nodes.forEach(function (i) { nc[i] = "cur"; });
    if (atEnd) {
      E.forEach(function (e, k) { ec[k] = ec[k].replace(/ ?(hot|back)/g, ""); if (r.cutEdges.indexOf(k) >= 0) ec[k] += " cut"; });
      NAMES.forEach(function (_, i) { nc[i] = r.reach[i] ? "cutS" : "cutT"; });
    }
    view.draw({ edgeCls: ec, edgeText: et, nodeCls: nc, nodeText: nt });
    var total = S.step === 0 ? 0 : (S.step <= n ? cur.total : r.value);
    var say;
    if (S.step === 0) {
      say = "<p>初始流量为 0，残量图就是原图。每一步：在残量图里找一条 S 到 T 的路（" + (S.rule === "bfs" ? "边数最少的" : "深度优先随手找的，同一个点的出弧按编号顺序") + "），沿路推它的瓶颈流量。</p>";
    } else if (!atEnd) {
      var backs = cur.backArcs.map(function (a) { var e = E[a >> 1]; return NAMES[e.v] + "→" + NAMES[e.u]; });
      say = "<p>第 " + S.step + " 次增广：<span class=\"mn\">" + pname(cur.nodes) + "</span>，瓶颈 <b class=\"key\">" + cur.bottleneck + "</b>，流量 " + (total - cur.bottleneck) + " → <b>" + total + "</b>。</p>" +
        (backs.length ? "<p><b class=\"key\">这条路用了回退弧 " + backs.join("、") + "</b>（橙色虚线）：它把原弧 " + backs.map(function (b) { var p = b.split("→"); return p[1] + "→" + p[0]; }).join("、") + " 上已经送出的流量收回一部分，改走别处。</p>" : "");
    } else {
      var reachN = NAMES.filter(function (_, i) { return r.reach[i]; });
      say = "<p><b class=\"ok\">残量图里再没有 S 到 T 的路。</b>从 S 还能到达的点是 {" + reachN.join(", ") + "}（蓝色），其余（橙色）到不了。</p><p>连接两侧的原弧（红色）全部饱和：" + r.cutEdges.map(function (k) { return NAMES[E[k].u] + "→" + NAMES[E[k].v] + "（" + E[k].cap + "）"; }).join("、") + "，容量之和 <b>" + r.cutCap + "</b> = 流量 <b>" + r.value + "</b>。这个割就是证书：任何流都得穿过它，所以不可能超过 " + r.cutCap + "。</p>";
    }
    $("mfSay").innerHTML = say;
    $("mfTxt").textContent = atEnd ? "结束：找不到增广路" : "第 " + S.step + " / " + n + " 次增广";
    $("mfPrev").disabled = S.step === 0; $("mfNext").disabled = atEnd;
    var tb = clear($("mfTable")), body = el("tbody");
    tb.appendChild(el("thead", {}, [el("tr", {}, [el("th", { text: "#" }), el("th", { text: "增广路" }), el("th", { text: "瓶颈" }), el("th", { text: "累计" })])]));
    r.steps.forEach(function (st, i) {
      body.appendChild(el("tr", { cls: "sel" + (S.step === i + 1 ? " cur" : ""), onclick: function () { S.step = i + 1; render(); } }, [
        el("td", { text: String(i + 1) }),
        el("td", { html: pname(st.nodes) + (st.backArcs.length ? " <span style=\"color:var(--hot-strong)\">↩</span>" : "") }),
        el("td", { text: String(st.bottleneck) }), el("td", { text: String(st.total) })]));
    });
    body.appendChild(el("tr", { cls: "sel tot" + (atEnd ? " cur" : ""), onclick: function () { S.step = n + 1; render(); } }, [
      el("td", { text: "" }), el("td", { text: "无增广路，最大流 = 最小割" }), el("td", { text: "" }), el("td", { text: String(r.value) })]));
    tb.appendChild(body);
    var fl = clear($("mfFlags"));
    ["bfs", "dfs"].forEach(function (rule) {
      var rr = run(rule), backN = rr.steps.filter(function (s) { return s.backArcs.length; }).length;
      fl.appendChild(el("span", { cls: rule === S.rule ? "hot" : "", text: (rule === "bfs" ? "最短增广路" : "随手选") + "：" + rr.steps.length + " 次增广" + (backN ? "，其中 " + backN + " 次用回退弧" : "") }));
    });
  }
  buildSeg($("mfRule"), [{ key: "bfs", label: "最短增广路（BFS）" }, { key: "dfs", label: "随手选（DFS）" }], function () { return S.rule; }, function (k) { S.rule = k; S.step = 0; render(); });
  buildSeg($("mfView"), [{ key: "flow", label: "流量 / 容量" }, { key: "resid", label: "残量：→可推 ←可退" }], function () { return S.view; }, function (k) { S.view = k; render(); });
  $("mfPrev").addEventListener("click", function () { if (S.step > 0) { S.step--; render(); } });
  $("mfNext").addEventListener("click", function () { if (S.step <= run(S.rule).steps.length) { S.step++; render(); } });
  $("mfAll").addEventListener("click", function () { S.step = run(S.rule).steps.length + 1; render(); });
  $("mfReset").addEventListener("click", function () { S.step = 0; render(); });
  view.onEdge(function (k, ev) { var e = E[k]; showTip(ev, [el("div", { html: "<b>" + NAMES[e.u] + "→" + NAMES[e.v] + "</b>　容量 " + e.cap })]); });
  render();
  window.__fig2 = S;
})();
