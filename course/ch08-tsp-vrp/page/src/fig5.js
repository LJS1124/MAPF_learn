/* fig5.js — 图 8-5：最近邻与 2-opt 局部搜索，对比最优 */
(function () {
  var P = D.tsp.P, DM = Core.dist(P), nn = Core.nearestNeighbor(DM), tw = Core.twoOpt(DM, nn), hk = Core.heldKarp(DM), S = { k: 0 };
  var frames = [{ tour: nn, len: Core.tourLength(DM, nn), txt: "最近邻：从仓库出发，每次去离当前点最近的没去过的点。走到最后被迫回到很远的地方。" }];
  tw.steps.forEach(function (st, i) { frames.push({ tour: st.tour, len: st.len, i: st.i, j: st.j, delta: st.delta, txt: "2-opt 第 " + (i + 1) + " 步：把回路里第 " + st.i + " 到第 " + st.j + " 个位置的一段整个反过来走，路线变化 " + st.delta + "。" }); });
  frames.push({ tour: hk.tour, len: hk.value, opt: true, txt: "最优回路（Held–Karp）。2-opt 停在 " + frames[frames.length - 1].len + "，是局部最优：任何“反转一段”都不能再缩短它，但离全局最优还差 " + (frames[frames.length - 1].len - hk.value) + "。" });
  function render() {
    var f = frames[S.k], prev = S.k > 0 && !f.opt ? frames[S.k - 1].tour : null, arcs = cycleArcs(f.tour, f.opt ? "c2" : "c0");
    if (prev) {
      var oldE = {}; for (var i = 0; i < prev.length; i++) oldE[prev[i] + ">" + prev[(i + 1) % prev.length]] = 1;
      arcs.forEach(function (a) { if (!oldE[a.u + ">" + a.v] && !oldE[a.v + ">" + a.u]) a.cls = "c1"; });
    }
    drawMap($("optMap"), P, { arcs: arcs });
    var st = clear($("optStats"));
    st.appendChild(stat("当前回路", String(f.len), f.opt ? "最优" : S.k === 0 ? "最近邻" : "2-opt 第 " + S.k + " 步"));
    st.appendChild(stat("最优", String(hk.value), "Held–Karp"));
    st.appendChild(stat("比最优长", f1((f.len / hk.value - 1) * 100) + "%", "", f.len > hk.value));
    $("optSay").innerHTML = "<p>" + f.txt + "</p>" + (prev ? "<p>橙色的弧是这一步新换上的。</p>" : "");
    $("optTxt").textContent = "第 " + (S.k + 1) + " / " + frames.length + " 张";
    $("optPrev").disabled = S.k === 0; $("optNext").disabled = S.k >= frames.length - 1;
  }
  $("optPrev").addEventListener("click", function () { if (S.k > 0) { S.k--; render(); } });
  $("optNext").addEventListener("click", function () { if (S.k < frames.length - 1) { S.k++; render(); } });
  $("optReset").addEventListener("click", function () { S.k = 0; render(); });
  render();
  window.__fig5 = S;
})();
