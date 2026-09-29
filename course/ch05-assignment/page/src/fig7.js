/* fig7.js — 图 5-7：阈值加匹配、Hall 证书与（最晚到达，总时间）帕累托阶梯 */
(function () {
  var C = D.C, SC = D.scenario, IT = SC.tasks, IV = SC.vehicles, m = IV.length, n = IT.length;
  var VALS = Core.distinct(C), PAR = Core.pareto(C);
  var FREE_TAU = PAR.front[PAR.front.length - 1].tau;
  var S = { idx: VALS.indexOf(FREE_TAU) };
  function VN(i) { return IV[i].id; }
  function TN(j) { return IT[j].id; }
  function maxOf(a) { var mx = 0; a.forEach(function (i, j) { mx = Math.max(mx, C[i][j]); }); return mx; }

  function render() {
    var tau = VALS[S.idx], al = Core.allowedLE(C, tau), res = Core.dispatch(C, { allowed: al }), i, j;
    $("bnTauV").textContent = "τ = " + tau + " s";
    $("bnTau").value = String(S.idx);
    var hallS = {}, hallN = {};
    if (!res.feasible && res.hall) { res.hall.S.forEach(function (x) { hallS[x] = true; }); res.hall.N.forEach(function (x) { hallN[x] = true; }); }
    var mxj = -1;
    if (res.feasible) { var mv = -1; res.a.forEach(function (iv, jj) { if (C[iv][jj] > mv) { mv = C[iv][jj]; mxj = jj; } }); }
    var tbl = clear($("bnMtx")), head = el("tr", {}, [el("th")]);
    IT.forEach(function (t, jj) { head.appendChild(el("th", { cls: hallS[jj] ? "hi" : "", html: t.id + "<small>" + t.floor + "F</small>" })); });
    tbl.appendChild(el("thead", {}, [head]));
    var tb = el("tbody");
    for (i = 0; i < m; i++) {
      var tr = el("tr", {}, [el("th", { cls: hallN[i] ? "hi" : "", html: VN(i) + "<small>" + IV[i].floor + "F</small>" })]);
      for (j = 0; j < n; j++) {
        var used = res.feasible && res.a[j] === i, no = !al[i][j];
        tr.appendChild(el("td", { cls: (no ? "no " : "") + (used ? "on " : "") + (used && j === mxj ? "mx " : "") + (hallS[j] && hallN[i] ? "hallc" : ""), text: String(C[i][j]) }));
      }
      tb.appendChild(tr);
    }
    tbl.appendChild(tb);

    var st = clear($("bnStats")), opt = D.opt;
    st.appendChild(stat("状态", res.feasible ? "配得满" : "配不满", res.feasible ? "每个任务都有车" : "无可行派法", !res.feasible));
    st.appendChild(stat("最小总时间", res.feasible ? res.total + " s" : "—", res.feasible ? (res.total > opt ? "比总时间最优多 " + (res.total - opt) + " s" : "总时间最优") : ""));
    st.appendChild(stat("实际最晚到达", res.feasible ? maxOf(res.a) + " s" : "—", res.feasible ? (maxOf(res.a) < tau ? "没被 τ 卡住" : "恰好被 τ 卡住") : ""));
    var say = clear($("bnSay"));
    if (res.feasible) {
      var fp = PAR.front.filter(function (f) { return f.max === maxOf(res.a) && f.total === res.total; })[0];
      say.appendChild(el("p", { html: "<b class=\"good\">τ = " + tau + " s：配得满。</b>在只保留 c ≤ " + tau + " 的边里，总时间最小的派法是 " + assignText(res.a, SC) + "，总时间 <b>" + res.total + " s</b>，最晚到达 <b>" + maxOf(res.a) + " s</b>（橙框）。" }));
      say.appendChild(el("p", { text: fp ? "这一点在帕累托阶梯上：想再压低最晚到达，总时间就必须付出更多。" : "这一点不在阶梯的拐角上：τ 比实际最晚到达大，放宽 τ 并没有换来更省的总时间，同一级台阶上的点。" }));
    } else {
      var Sn = res.hall.S.map(TN).join("、"), Nn = res.hall.N.map(VN).join("、");
      say.appendChild(el("p", { html: "<b class=\"bad\">τ = " + tau + " s：无解。</b>Hall 证书：任务 <b>{" + Sn + "}</b> 在 " + tau + " s 内只能用车 <b>{" + (Nn || "无") + "}</b>，" + res.hall.S.length + " 个任务抢 " + res.hall.N.length + " 辆车（橙色的行和列）。" }));
      say.appendChild(el("p", { text: "这是一份可以直接检查的证明：把 τ 放大到 " + PAR.tau + " s，出现第一条能救场的边，才配得满。所以最晚到达不可能小于 " + PAR.tau + " s。" }));
    }
    drawChart(tau, res);
    drawTable(tau, res);
  }

  function drawChart(tau, res) {
    var svg = $("bnChart"), lo = VALS[0], hi = VALS[VALS.length - 1], ys = PAR.all.map(function (p) { return p.total; });
    var y0 = Math.floor(Math.min.apply(null, ys) / 5) * 5 - 5, y1 = Math.ceil(Math.max.apply(null, ys) / 5) * 5 + 5, yt = [], t;
    for (t = y0; t <= y1; t += 5) yt.push([t, String(t)]);
    var ch = lineChart(svg, { W: 480, H: 280, x: [lo, hi], y: [y0, y1], ml: 44, mr: 24, mt: 26, xticks: [10, 20, 30, 40, 50, 60, 70, 80, 90].filter(function (v) { return v >= lo && v <= hi; }).map(function (v) { return [v, String(v)]; }), yticks: yt, xlabel: "最晚到达上限 τ（s）", ylabel: "最小总时间（s）" });
    // 无解区
    sv("rect", { cls: "nofeas", x: ch.X(lo), y: ch.mt, width: ch.X(PAR.tau) - ch.X(lo), height: ch.H - ch.mt - ch.mb }, svg);
    sv("text", { cls: "lab-n", x: ch.X(lo) + 8, y: ch.mt + 16, text: "τ < " + PAR.tau + "：无解" }, svg);
    // 阶梯
    var path = "", all = PAR.all;
    all.forEach(function (p, k) {
      var x = ch.X(p.tau), y = ch.Y(p.total), xn = k + 1 < all.length ? ch.X(all[k + 1].tau) : ch.X(hi);
      path += (k === 0 ? "M" : "L") + x.toFixed(1) + "," + y.toFixed(1) + "L" + xn.toFixed(1) + "," + y.toFixed(1);
    });
    sv("path", { cls: "stepline", d: path }, svg);
    PAR.front.forEach(function (f, k) {
      sv("circle", { cls: "dotf", cx: ch.X(f.max), cy: ch.Y(f.total), r: 5.5 }, svg);
      sv("text", { cls: "lab-f", x: ch.X(f.max) + (k === 0 ? 8 : 8), y: ch.Y(f.total) - 9, text: "(" + f.max + ", " + f.total + ")" }, svg);
    });
    sv("line", { cls: "curv", x1: ch.X(tau), x2: ch.X(tau), y1: ch.mt, y2: ch.H - ch.mb }, svg);
    if (res.feasible) sv("circle", { cx: ch.X(tau), cy: ch.Y(res.total), r: 4.5, style: "fill:var(--ink);stroke:var(--surface);stroke-width:2" }, svg);
  }

  function drawTable(tau, res) {
    var tbl = clear($("bnTable"));
    tbl.appendChild(el("thead", {}, [el("tr", {}, ["最晚到达", "总时间", "比最优多", "派法"].map(function (h) { return el("th", { text: h }); }))]));
    var tb = el("tbody");
    PAR.front.forEach(function (f, k) {
      var next = PAR.front[k + 1], on = tau >= f.tau && (!next || tau < next.tau);
      var r = el("tr", { style: on ? "background:var(--accent-wash)" : "" }, [
        el("td", { cls: "num", text: f.max + " s" }), el("td", { cls: "num", text: String(f.total) }), el("td", { cls: "num", text: f.total > D.opt ? "+" + (f.total - D.opt) : "0" }),
        el("td", { cls: "perm", text: f.a.map(function (i, j) { return TN(j).slice(1) + "←" + VN(i).slice(1); }).join(" ") })]);
      tb.appendChild(r);
    });
    tbl.appendChild(tb);
  }

  $("bnTau").max = String(VALS.length - 1);
  $("bnTau").value = String(S.idx);
  $("bnTau").addEventListener("input", function () { S.idx = parseInt(this.value, 10); render(); });
  $("bnBest").addEventListener("click", function () { S.idx = VALS.indexOf(PAR.tau); render(); });
  $("bnFree").addEventListener("click", function () { S.idx = VALS.indexOf(FREE_TAU); render(); });
  render();
  window.__fig7 = { state: S, PAR: PAR };
})();
