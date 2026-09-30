/* fig1.js — 图 8-1：只保留出入度约束的指派松弛：一堆互不相连的小回路；对照最优回路 */
(function () {
  var P = D.tsp.P, DM = Core.dist(P), S = { mode: "assign" };
  var hk = Core.heldKarp(DM), as = Core.assignLP(DM), subs = Core.subtours(as.x);
  function render() {
    var arcs = [], nodeCls = [], say;
    if (S.mode === "assign") {
      subs.forEach(function (c, k) { arcs = arcs.concat(cycleArcs(c, "c" + k)); c.forEach(function (v) { nodeCls[v] = "s" + k; }); });
      say = "<p>指派松弛的最优解，总长 <b class=\"key\">" + as.value + "</b>，把 9 个点分成了 <b class=\"key\">" + subs.length + "</b> 个互不相连的回路：" + subs.map(function (c) { return "{" + c.map(function (v) { return v === 0 ? "仓" : v; }).join(", ") + "}"; }).join("、") +
        "。每个点都有一条出弧和一条入弧，约束都满足，但它不是一条走遍所有点的回路。</p><p>这就是第 5 章的指派问题：“点 i 的后继是谁”，每个点选一个后继，后继不重复，不许选自己。它没有规定“连成一个圈”，所以最优解自然偏向短小的圈。</p>";
    } else {
      arcs = cycleArcs(hk.tour, "c0"); hk.tour.forEach(function (v) { nodeCls[v] = "s0"; });
      say = "<p>最优回路，总长 <b class=\"key\">" + hk.value + "</b>（Held–Karp 动态规划）：" + hk.tour.map(function (v) { return v === 0 ? "仓" : v; }).join(" → ") + " → 仓。它满足出入度约束，还连成了一个圈。</p><p>比松弛的 " + as.value + " 多了 " + (hk.value - as.value) + "，这个差就是“必须连成一个圈”的代价。</p>";
    }
    drawMap($("tspMap"), P, { arcs: arcs, nodeCls: nodeCls });
    var st = clear($("tspStats"));
    st.appendChild(stat("指派松弛", String(as.value), "只有出入度约束（下界）"));
    st.appendChild(stat("最优回路", String(hk.value), "Held–Karp 精确解"));
    st.appendChild(stat(S.mode === "assign" ? "回路个数" : "差", S.mode === "assign" ? String(subs.length) : String(hk.value - as.value), S.mode === "assign" ? "应当是 1" : "最优 − 松弛", true));
    $("tspSay").innerHTML = say;
  }
  buildSeg($("tspMode"), [{ key: "assign", label: "指派松弛的解" }, { key: "opt", label: "最优回路" }], function () { return S.mode; }, function (k) { S.mode = k; render(); });
  render();
  window.__fig1 = S;
})();
