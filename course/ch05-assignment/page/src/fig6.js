/* fig6.js — 图 5-6：变形工坊（延后罚金与虚拟车；禁行、Hall 证书与“1e6 写法”） */
(function () {
  var C = D.C, SC = D.scenario, IT = SC.tasks, IV = SC.vehicles, m = IV.length, n = IT.length;
  var LIFT = [[0, 1, 0, 1, 1], [0, 1, 0, 1, 1], [0, 1, 0, 1, 1], [1, 0, 1, 0, 0], [1, 0, 1, 0, 0], [0, 1, 0, 1, 1]];
  function allTrue() { return C.map(function (r) { return r.map(function () { return true; }); }); }
  var FB_PRE = [
    { key: "none", label: "无禁行", make: allTrue },
    { key: "lift", label: "不许换层（提升机停用）", make: function () { return LIFT.map(function (r) { return r.map(function (x) { return x === 0; }); }); } },
    { key: "v5", label: "V5 电量不足：不去 T2、T5", make: function () { var a = allTrue(); a[4][1] = false; a[4][4] = false; return a; } }
  ];
  var S = { tab: "pen", on: fill(m, true), p: 60, allowed: allTrue(), fb: "none" };
  function VN(i) { return IV[i].id; }
  function TN(j) { return IT[j].id; }

  // ------------------------------------------------------------ 延后罚金
  function penRun(p) {
    var idx = range(m).filter(function (i) { return S.on[i]; });
    if (!idx.length) return { idx: idx, res: null };
    return { idx: idx, res: Core.dispatch(idx.map(function (i) { return C[i]; }), { penalty: p }) };
  }
  function renderPen() {
    var run = penRun(S.p), res = run.res, idx = run.idx, i, j;
    $("wkPV").textContent = String(S.p);
    var tbl = clear($("wkMtx")), head = el("tr", {}, [el("th")]);
    IT.forEach(function (t) { head.appendChild(el("th", { html: t.id + "<small>" + t.floor + "F</small>" })); });
    tbl.appendChild(el("thead", {}, [head]));
    var tb = el("tbody"), realOf = function (j) { return res && res.a[j] >= 0 ? idx[res.a[j]] : -1; };
    for (i = 0; i < m; i++) {
      var tr = el("tr", {}, [el("th", { cls: S.on[i] ? "" : "off", html: VN(i) + "<small>" + IV[i].floor + "F</small>" })]);
      for (j = 0; j < n; j++) tr.appendChild(el("td", { cls: (S.on[i] ? "" : "off ") + (realOf(j) === i ? "on" : ""), text: String(C[i][j]) }));
      tb.appendChild(tr);
    }
    var dr = el("tr", {}, [el("th", { cls: "dl", text: "虚拟车 ×" + n })]);
    for (j = 0; j < n; j++) dr.appendChild(el("td", { cls: "dummy" + (res && res.a[j] < 0 ? " on" : ""), text: String(S.p) }));
    tb.appendChild(dr);
    tbl.appendChild(tb);
    $("wkMtxNote").textContent = idx.length ? "灰色的行是没有开的车。最下面一行是虚拟车：每个任务一辆，去这个任务的代价是延后罚金 p。蓝底是当前的最优派法。" : "所有车都关了：每个任务只能延后。";
    var st = clear($("wkStats")), def = res ? res.deferred.length : n;
    st.appendChild(stat("派出去", (n - def) + " 个", idx.length + " 辆车可用"));
    st.appendChild(stat("延后", def + " 个", def ? "每个付 " + S.p + " s" : "没有任务被延后", def > 0));
    st.appendChild(stat("总时间", (res ? res.total : n * S.p) + " s", res ? "行驶 " + res.cost + " + 罚金 " + res.penaltyTotal : "罚金 " + n * S.p));
    var tt = clear($("wkTable"));
    tt.appendChild(el("thead", {}, [el("tr", {}, ["任务", "结果", "成本", "价格 u"].map(function (h, k) { return el("th", { text: h, style: k >= 2 ? "text-align:right" : "" }); }))]));
    var tb2 = el("tbody");
    for (j = 0; j < n; j++) {
      var iv = realOf(j), deferred = !res || res.a[j] < 0;
      tb2.appendChild(el("tr", {}, [el("td", { text: TN(j) }), el("td", { text: deferred ? "延后" : VN(iv) }), el("td", { cls: "num", text: (deferred ? S.p : C[iv][j]) + " s" }),
        el("td", { cls: "num", text: res ? n0(res.u[j]) + (deferred ? "（= p）" : "") : "—" })]));
    }
    tt.appendChild(tb2);
    renderPenChart();
  }
  function renderPenChart() {
    var svg = $("wkChart"), pts = [], last = -1, changes = [], p;
    for (p = 0; p <= 120; p++) {
      var r = penRun(p), c = r.res ? r.res.deferred.length : n;
      pts.push([p, c]);
      if (last >= 0 && c < last) changes.push(p);
      last = c;
    }
    var ch = lineChart(svg, { W: 420, H: 200, x: [0, 120], y: [0, n + 0.5], ml: 34, mr: 16, xticks: [0, 20, 40, 60, 80, 100, 120].map(function (v) { return [v, String(v)]; }), yticks: range(n + 1).map(function (v) { return [v, String(v)]; }), xlabel: "延后罚金 p（s）", ylabel: "被延后的任务数" });
    var path = "";
    pts.forEach(function (q, k) { path += (k === 0 ? "M" : "L") + ch.X(q[0]).toFixed(1) + "," + ch.Y(q[1]).toFixed(1); if (k + 1 < pts.length) path += "L" + ch.X(pts[k + 1][0]).toFixed(1) + "," + ch.Y(q[1]).toFixed(1); });
    sv("path", { cls: "step", d: path }, svg);
    sv("line", { cls: "cur", x1: ch.X(S.p), x2: ch.X(S.p), y1: ch.mt, y2: ch.H - ch.mb }, svg);
    var cur = pts[S.p][1];
    sv("circle", { cls: "dotc", cx: ch.X(S.p), cy: ch.Y(cur), r: 5 }, svg);
    var note = clear($("wkChartNote"));
    note.appendChild(el("p", { text: "罚金从 0 往上调：p 越过某个任务的边际成本，它就从“延后”变成“派出去”。" + (changes.length ? "被延后的任务数在 p = " + changes.join("、") + " s 处依次减少。" : "在这组车下，p 到 120 s 以内被延后的任务数不再变化。") }));
    note.appendChild(el("p", { text: "拖动上面的滑块，看竖线走到哪一级台阶。关掉几辆车，台阶会整体右移：车少了，每个任务的边际成本更高，要更高的罚金才值得派出去。" }));
  }
  function renderVeh() {
    var host = clear($("wkVeh"));
    IV.forEach(function (v, i) {
      host.appendChild(el("button", { type: "button", "aria-pressed": S.on[i] ? "true" : "false", text: v.id + "（" + v.floor + "F）", onclick: function () { S.on[i] = !S.on[i]; renderVeh(); renderPen(); } }));
    });
  }

  // ------------------------------------------------------------ 禁行与无解
  function renderForb() {
    var al = S.allowed, good = Core.dispatch(C, { allowed: al }), naive = Core.naiveBigM(C, al, 1e6), i, j;
    var hallS = {}, hallN = {};
    if (!good.feasible && good.hall) { good.hall.S.forEach(function (x) { hallS[x] = true; }); good.hall.N.forEach(function (x) { hallN[x] = true; }); }
    var shown = good.feasible ? good.a : naive.a;
    var tbl = clear($("fbMtx")), head = el("tr", {}, [el("th")]);
    IT.forEach(function (t, jj) { head.appendChild(el("th", { cls: hallS[jj] ? "hi" : "", html: t.id + "<small>" + t.floor + "F</small>" })); });
    tbl.appendChild(el("thead", {}, [head]));
    var tb = el("tbody");
    for (i = 0; i < m; i++) {
      var tr = el("tr", {}, [el("th", { cls: hallN[i] ? "hi" : "", html: VN(i) + "<small>" + IV[i].floor + "F</small>" })]);
      for (j = 0; j < n; j++) (function (ii, jj) {
        var isUsed = shown[jj] === ii, forb = !al[ii][jj];
        var cls = (forb ? "forb " : "") + (isUsed && !forb ? "on " : "") + (isUsed && forb ? "used " : "") + (hallS[jj] && hallN[ii] ? "hallc " : "");
        tr.appendChild(el("td", { cls: cls.trim(), title: "点击切换允许 / 禁行", onclick: function () { S.allowed[ii][jj] = !S.allowed[ii][jj]; S.fb = ""; renderForb(); } }, [String(C[ii][jj])]));
      })(i, j);
      tb.appendChild(tr);
    }
    tbl.appendChild(tb);
    buildSeg($("fbPre"), FB_PRE.concat(S.fb ? [] : [{ key: "", label: "自选" }]), function () { return S.fb; }, function (k) {
      var p = FB_PRE.filter(function (q) { return q.key === k; })[0]; if (p) { S.allowed = p.make(); S.fb = k; renderForb(); }
    });
    var gb = clear($("fbGood")), nb = clear($("fbNaive"));
    gb.appendChild(el("h5", { text: "正确做法：M = 1 + n × 最大合法代价 = " + commas(good.M) + "，事后检查" }));
    if (good.feasible) gb.appendChild(el("p", { html: "<span class=\"okk\">有解</span>，总时间 <b>" + good.total + " s</b>：" + assignText(good.a, SC) + "。" }));
    else {
      var S2 = good.hall.S.map(TN).join("、"), N2 = good.hall.N.map(VN).join("、");
      gb.appendChild(el("p", { html: "<span class=\"warn\">无解</span>，并且给出证据。Hall 证书：任务 <b>{" + S2 + "}</b> 只能用车 <b>{" + (N2 || "无") + "}</b>，" + good.hall.S.length + " 个任务抢 " + good.hall.N.length + " 辆车。在矩阵里橙色框出的就是这一块。" }));
    }
    nb.appendChild(el("h5", { text: "常见写法：禁行边写成 1e6，不检查" }));
    nb.appendChild(el("pre", { text: "total  = " + commas(naive.total) + "\nassign = " + assignText(naive.a, SC) }));
    if (naive.usedForbidden) nb.appendChild(el("p", { html: "<span class=\"warn\">用到了 " + naive.usedForbidden + " 条禁行边</span>，却照样返回了“最优解”，总时间里含 1e6。调用方如果不检查，就会把它当成一个可执行的派车单。" }));
    else nb.appendChild(el("p", { html: "没有用到禁行边，结果与正确做法一致。<b>有解的时候两种写法看不出差别，差别只出现在无解的时候。</b>" }));
  }

  function tab(k) {
    S.tab = k; $("wkPen").hidden = k !== "pen"; $("wkForb").hidden = k !== "forb";
    if (k === "forb") renderForb(); else renderPen();
  }
  buildSeg($("wkTabs"), [{ key: "pen", label: "延后罚金与虚拟车" }, { key: "forb", label: "禁行与无解" }], function () { return S.tab; }, tab);
  $("wkP").addEventListener("input", function () { S.p = parseInt(this.value, 10); renderPen(); });
  renderVeh(); renderPen(); renderForb();
  window.__fig6 = { state: S };
})();
