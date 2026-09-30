/* fig2.js — 图 8-2：子回路消除的割平面循环。每轮解 LP，用最大流找被违反的子回路约束，加入，再解 */
(function () {
  var P = D.tsp.P, DM = Core.dist(P), cl = Core.cutLoop(DM), R = cl.rounds, hk = Core.heldKarp(DM), S = { r: 0 };
  function nm(v) { return v === 0 ? "仓" : String(v); }
  function draw() {
    var r = R[S.r], arcs = [], nodeCls = [], n = P.length;
    for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) if (r.x[i][j] > 1e-6) arcs.push({ u: i, v: j, cls: "c0" + (r.x[i][j] < 1 - 1e-6 ? " frac" : ""), off: r.x[j][i] > 1e-6 ? 5 : 0, label: r.x[i][j] < 1 - 1e-6 ? ufrac(r.x[i][j]) : null });
    r.added.forEach(function (Sx) { Sx.forEach(function (v) { nodeCls[v] = "ring"; }); });
    drawMap($("secMap"), P, { arcs: arcs, nodeCls: nodeCls, hulls: r.added });
    var say = "<p>第 " + (S.r + 1) + " 轮的 LP：<b>" + num2(r.value) + "</b>，" + (S.r === 0 ? "只有出入度约束。" : "带着已加入的 " + r.ncuts + " 条子回路约束。") + "</p>";
    if (r.added.length) {
      say += "<p>对每个点 <span class=\"mn\">t</span>，用 LP 的弧流量当容量，求仓库到 t 的最大流。流量小于 1 就说明有一组点被孤立在外面，这一组就是被违反的子回路约束的点集 <span class=\"mn\">S</span>（橙色圈住）。这一轮找到 <b class=\"key\">" + r.added.length + "</b> 个：</p><ul class=\"cutlist\">" +
        r.added.map(function (Sx) { return "<li><span class=\"mn\">S</span> = {" + Sx.map(nm).join(", ") + "}：里面的弧至多 " + (Sx.length - 1) + " 条，LP 里有 " + Sx.length + " 条</li>"; }).join("") + "</ul>";
    } else say += "<p><b class=\"ok\">仓库到每个点的最大流都是 1</b>，再没有被违反的子回路约束。LP 的解是一条完整的回路，值 " + n0(r.value) + " = 最优值 " + hk.value + "。总共只加了 " + cl.secs.length + " 条约束，完整的子回路约束有 " + (Math.pow(2, n - 1) - n) + " 条。</p>";
    $("secSay").innerHTML = say;
    $("secTxt").textContent = "第 " + (S.r + 1) + " / " + R.length + " 轮";
    $("secPrev").disabled = S.r === 0; $("secNext").disabled = S.r >= R.length - 1;
    // 下界的变化
    var svg = $("secChart"), vals = R.map(function (q) { return q.value; }).concat([hk.value]), c = lineChart(svg, { W: 420, H: 200, ml: 46, mr: 14, mt: 20, mb: 44, x: [-0.5, vals.length - 0.5], y: [180, 265], yticks: [200, 220, 240, 260].map(function (t) { return [t, String(t)]; }), xticks: [] });
    vals.forEach(function (v, k) {
      var x = c.X(k), y = c.Y(v), last = k === vals.length - 1;
      sv("rect", { cls: "barfill" + (last ? " hot" : ""), x: x - 30, y: y, width: 60, height: (c.H - c.mb) - y, opacity: !last && k > S.r ? 0.25 : 1 }, svg);
      sv("text", { x: x, y: y - 5, "text-anchor": "middle", cls: "val", text: num2(v) }, svg);
      sv("text", { x: x, y: c.H - c.mb + 14, "text-anchor": "middle", cls: "val2", text: last ? "最优回路" : "第 " + (k + 1) + " 轮" }, svg);
    });
  }
  $("secPrev").addEventListener("click", function () { if (S.r > 0) { S.r--; draw(); } });
  $("secNext").addEventListener("click", function () { if (S.r < R.length - 1) { S.r++; draw(); } });
  $("secAll").addEventListener("click", function () { S.r = R.length - 1; draw(); });
  $("secReset").addEventListener("click", function () { S.r = 0; draw(); });
  draw();
  window.__fig2 = { cl: cl };
})();
