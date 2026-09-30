/* fig4.js — 图 8-4：带载重的多车路线（CVRP）。最优（子集动态规划）与扫描法 */
(function () {
  var P = D.tsp.P, C = D.cvrp, DM = Core.dist(P), S = { mode: "opt" };
  var opt = Core.cvrpOpt(DM, C.dem, C.Q, C.K), sw = Core.sweep(P, DM, C.dem, C.Q), single = Core.heldKarp(DM).value;
  var tot = C.dem.reduce(function (a, b) { return a + b; }, 0), lb = Math.ceil(tot / C.Q);
  function render() {
    var routes = S.mode === "opt" ? opt.routes : sw.routes, val = S.mode === "opt" ? opt.value : sw.value, arcs = [], nodeCls = [], note = [];
    routes.forEach(function (r, k) { arcs = arcs.concat(cycleArcs(r, "c" + k)); r.forEach(function (v) { if (v) nodeCls[v] = "s" + k; }); });
    C.dem.forEach(function (d, i) { note[i + 1] = String(d); });
    drawMap($("vrpMap"), P, { arcs: arcs, nodeCls: nodeCls, nodeNote: note });
    var st = clear($("vrpStats"));
    st.appendChild(stat("总行驶距离", String(val), S.mode === "opt" ? "最优（子集动态规划）" : "扫描法分组 + 每组最优路线", S.mode !== "opt"));
    st.appendChild(stat("路线数", String(routes.length), "至少 ⌈" + tot + " ÷ " + C.Q + "⌉ = " + lb));
    st.appendChild(stat("对比：不限载重的单车回路", String(single), "同一批点，一辆车走完"));
    var rows = routes.map(function (r, k) { var load = r.reduce(function (a, v) { return a + (v ? C.dem[v - 1] : 0); }, 0); return "<li>车 " + (k + 1) + "：仓 → " + r.slice(1).join(" → ") + " → 仓　距离 " + Core.tourLength(DM, r) + "，托盘 " + load + " / " + C.Q + "</li>"; });
    var say = "<ul class=\"cutlist\">" + rows.join("") + "</ul>";
    say += S.mode === "opt" ? "<p>最优的分组把相近的客户放在一起，三条路线的托盘数是 " + routes.map(function (r) { return r.reduce(function (a, v) { return a + (v ? C.dem[v - 1] : 0); }, 0); }).join("、") + "，都不超载重。</p>" : "<p><b class=\"key\">扫描法比最优多 " + (sw.value - opt.value) + "（+" + f1((sw.value / opt.value - 1) * 100) + "%）。</b>它只看角度，按顺序装满一辆车再换下一辆：前两辆都装满 9 个托盘，最后一辆只装了 " + sw.groups[2].reduce(function (a, v) { return a + C.dem[v - 1]; }, 0) + " 个，路线的负荷不平衡，分组只看角度，不看距离。</p>";
    $("vrpSay").innerHTML = say;
  }
  buildSeg($("vrpMode"), [{ key: "opt", label: "最优" }, { key: "sweep", label: "扫描法" }], function () { return S.mode; }, function (k) { S.mode = k; render(); });
  render();
  window.__fig4 = S;
})();
