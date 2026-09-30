/* fig3.js — 图 8-3：三种模型的下界。客户数从 4 到 8：指派松弛、MTZ 的 LP、子回路约束的 LP（割平面循环）与最优 */
(function () {
  var P = D.tsp.P, S = { m: 8 }, cache = {};
  function calc(m) {
    if (cache[m]) return cache[m];
    var sub = P.slice(0, m + 1), DM = Core.dist(sub), t0 = performance.now();
    var a = Core.assignLP(DM).value, mt = Core.mtzLP(DM).value, cl = Core.cutLoop(DM), hk = Core.heldKarp(DM).value;
    var n = m + 1;
    return (cache[m] = { assign: a, mtz: mt, sec: cl.final.value, opt: hk, cuts: cl.secs.length, rounds: cl.rounds.length, n: n, nSEC: Math.pow(2, m) - 1 - m });
  }
  function draw() {
    var r = calc(S.m), svg = $("bndChart"), vals = [r.assign, r.mtz, r.sec, r.opt], labs = ["指派松弛", "MTZ 的 LP", "子回路约束（割）", "最优"];
    var lo = 0, hi = Math.ceil(r.opt / 20) * 20 + 20;
    var c = lineChart(svg, { W: 440, H: 210, ml: 46, mr: 14, mt: 20, mb: 44, x: [-0.5, 3.5], y: [Math.max(0, lo), hi], yticks: range(5).map(function (i) { var v = Math.max(0, lo) + i * (hi - Math.max(0, lo)) / 4; return [v, String(Math.round(v))]; }), xticks: [] });
    vals.forEach(function (v, k) {
      var x = c.X(k), y = c.Y(v);
      sv("rect", { cls: "barfill" + (k === 3 ? " hot" : ""), x: x - 32, y: y, width: 64, height: (c.H - c.mb) - y }, svg);
      sv("text", { x: x, y: y - 5, "text-anchor": "middle", cls: "val", text: num2(v) }, svg);
      sv("text", { x: x, y: c.H - c.mb + 14, "text-anchor": "middle", cls: "val2", text: labs[k] }, svg);
    });
    var tb = clear($("bndTable")), body = el("tbody");
    tb.appendChild(el("thead", {}, [el("tr", {}, ["模型", "变量", "约束", "下界", "差"].map(function (t) { return el("th", { text: t }); }))]));
    var nx = r.n * (r.n - 1);
    [["指派松弛", nx, 2 * r.n, r.assign], ["MTZ", nx + r.n, 2 * r.n + (r.n - 1) * (r.n - 2) + r.n, r.mtz], ["子回路（惰性）", nx, 2 * r.n + " + " + r.cuts, r.sec]].forEach(function (row) {
      body.appendChild(el("tr", {}, [el("td", { text: row[0] }), el("td", { text: String(row[1]) }), el("td", { text: String(row[2]) }), el("td", { text: num2(row[3]) }), el("td", { text: num2((r.opt - row[3])) })]));
    });
    tb.appendChild(body);
    $("bndSay").innerHTML = "<p>" + r.n + " 个点（仓库 + " + S.m + " 个客户）。最优 " + r.opt + "。指派松弛 " + num2(r.assign) + "，MTZ 的 LP " + num2(r.mtz) + "，子回路约束的 LP " + num2(r.sec) + "（割平面循环 " + r.rounds + " 轮，共 " + r.cuts + " 条）。</p><p>下界的顺序总是：指派松弛 ≤ MTZ ≤ 子回路约束 ≤ 最优。MTZ 的约束数是 <span class=\"mn\">n</span> 的平方级，但 LP 很弱；完整的子回路约束有 " + r.nSEC + " 条，实际只加了 " + r.cuts + " 条（表里“18 + 6”是出入度约束加惰性加入的约束）。</p>";
    $("bndMv").textContent = String(S.m);
  }
  var sl = $("bndM");
  sl.addEventListener("input", function () { S.m = Number(sl.value); draw(); });
  draw();
  window.__fig3 = { S: S, calc: calc };
})();
