/* fig3.js — 图 11-3：作业车间的析取图。选定每台机器上的作业顺序，求最长路（= C_max），检测环 */
(function () {
  var jobs = D.jobshop, nj = jobs.length, nm = 3, opt = Core.jsOpt(jobs), lb = Core.jsLowerBound(jobs);
  var PRESET = {
    same: { 0: [0, 1, 2], 1: [0, 1, 2], 2: [0, 1, 2] },
    best: opt.orders,
    cycle: { 0: [0, 1, 2], 1: [0, 1, 2], 2: [2, 1, 0] }
  };
  var S = { orders: JSON.parse(JSON.stringify(PRESET.same)), preset: "same" };
  var NX = [90, 300, 510], NY = [50, 130, 210], R = 17;
  function nodeXY(j, k) { return { x: NX[k], y: NY[j] }; }
  function markers(svg) {
    var defs = sv("defs", {}, svg);
    [["mk0", "var(--muted)"], ["mk1", MCOL[0]], ["mk2", MCOL[1]], ["mk3", MCOL[2]], ["mkb", "var(--bad)"]].forEach(function (m) {
      var mk = sv("marker", { id: m[0], viewBox: "0 0 10 10", refX: 9, refY: 5, markerUnits: "userSpaceOnUse", markerWidth: 10, markerHeight: 10, orient: "auto-start-reverse" }, defs);
      sv("path", { d: "M0 0 L10 5 L0 10 z", fill: m[1] }, mk);
    });
  }
  function drawGraph(r, cyc) {
    var svg = clear($("jgGraph")); svg.setAttribute("viewBox", "0 0 680 260"); markers(svg);
    var inCyc = {}; if (cyc) for (var i = 0; i < cyc.length; i++) inCyc[cyc[i] + ">" + cyc[(i + 1) % cyc.length]] = true;
    var crit = {}; if (r.feasible) r.critical.forEach(function (o) { crit[o] = true; });
    var ops = r.ops;
    for (var j = 0; j < nj; j++) sv("text", { x: 4, y: NY[j] + 4, cls: "lb", text: jn(j) }, svg);
    r.arcs.forEach(function (a) {
      var A = ops[a.from], B = ops[a.to], p = nodeXY(A.job, A.k), q = nodeXY(B.job, B.k), dx = q.x - p.x, dy = q.y - p.y, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
      var bad = inCyc[a.from + ">" + a.to], col = bad ? "var(--bad)" : a.kind === "route" ? "var(--muted)" : MCOL[A.machine], mk = bad ? "mkb" : a.kind === "route" ? "mk0" : "mk" + (A.machine + 1);
      var x1 = p.x + ux * R, y1 = p.y + uy * R, x2 = q.x - ux * (R + 4), y2 = q.y - uy * (R + 4), onCrit = crit[a.from] && crit[a.to] && r.critical.indexOf(a.to) === r.critical.indexOf(a.from) + 1;
      var d;
      if (a.kind === "route") d = "M" + x1 + " " + y1 + " L" + x2 + " " + y2;
      else { var off = 16 + 10 * A.machine, cx = (x1 + x2) / 2 - uy * off * (dx >= 0 ? 1 : -1), cy = (y1 + y2) / 2 + ux * off * (dx >= 0 ? 1 : -1); d = "M" + x1 + " " + y1 + " Q" + cx + " " + cy + " " + x2 + " " + y2; }
      sv("path", { d: d, fill: "none", stroke: col, "stroke-width": bad ? 3 : onCrit ? 3.2 : a.kind === "route" ? 1.6 : 1.8, opacity: a.kind === "route" ? 0.7 : 0.9, "marker-end": "url(#" + mk + ")", "stroke-dasharray": a.kind === "route" ? "" : onCrit || bad ? "" : "5 3" }, svg);
    });
    ops.forEach(function (o, i) {
      var p = nodeXY(o.job, o.k);
      sv("circle", { cx: p.x, cy: p.y, r: R, fill: MCOL[o.machine], stroke: crit[i] ? "var(--ink)" : "none", "stroke-width": crit[i] ? 3.5 : 0 }, svg);
      sv("text", { x: p.x, y: p.y + 4, "text-anchor": "middle", cls: "nd", text: mn(o.machine) }, svg);
      sv("text", { x: p.x, y: p.y + R + 13, "text-anchor": "middle", cls: "nt", text: "p=" + o.dur + (r.feasible ? "，开始 " + r.start[i] : "") }, svg);
    });
  }
  function render() {
    var r = Core.jsEval(jobs, S.orders), fl = clear($("jgFlags")), cyc = null;
    if (!r.feasible) cyc = findCycle(r.ops.length, r.arcs);
    drawGraph(r, cyc);
    var g = $("jgGantt");
    if (r.feasible) {
      var rows = []; for (var m = 0; m < nm; m++) rows.push(S.orders[m].map(function (j) { var k = jobs[j].findIndex(function (op) { return op[0] === m; }), i = r.idx[j + "," + k]; return { job: j, start: r.start[i], end: r.start[i] + r.ops[i].dur, hl: r.critical.indexOf(i) >= 0, label: jn(j) }; }));
      drawRows(g, rows, { span: 25, mark: r.makespan });
    } else { clear(g); g.setAttribute("viewBox", "0 0 680 60"); sv("text", { x: 10, y: 34, cls: "tk", text: "顺序里有环，没有可行的调度，画不出甘特图" }, g); }
    fl.appendChild(el("span", { cls: r.feasible ? "ok" : "no", text: r.feasible ? "可行（析取图无环）" : "不可行（析取图有环）" }));
    if (r.feasible) fl.appendChild(el("span", { cls: r.makespan === opt.value ? "ok" : "hot", text: r.makespan === opt.value ? "达到最优 " + opt.value : "比最优 " + opt.value + " 多 " + (r.makespan - opt.value) }));
    var st = clear($("jgStats"));
    st.appendChild(stat("C_max（最长路）", r.feasible ? String(r.makespan) : "无", r.feasible ? "黑框的工序是关键路径" : "机器顺序互相矛盾", true));
    st.appendChild(stat("下界（最忙的机器或最长的作业）", String(lb), "最优值 " + opt.value + " 比它大 " + (opt.value - lb)));
    st.appendChild(stat("可行的机器顺序", opt.feasibleCount + " / " + opt.total, "每台机器 3! = 6 种，共 6³ = 216 种"));
    var say;
    if (r.feasible) {
      say = "<p>关键路径（最长路）：" + r.critical.map(function (i) { return jn(r.ops[i].job) + "·" + mn(r.ops[i].machine); }).join(" → ") + "，长度 <b class=\"key\">" + r.makespan + "</b>。缩短不在关键路径上的工序不会改变 C<sub>max</sub>。</p>";
    } else {
      say = "<p><b class=\"no\">有环：</b>" + cyc.map(function (i) { return jn(r.ops[i].job) + "·" + mn(r.ops[i].machine); }).concat([jn(r.ops[cyc[0]].job) + "·" + mn(r.ops[cyc[0]].machine)]).join(" → ") + "。环上每一步都要求“前一个先做完”，转回来就是自己要等自己，所以这组机器顺序不对应任何调度。</p>";
    }
    $("jgSay").innerHTML = say;
    var mc = clear($("jgOrders"));
    for (var m2 = 0; m2 < nm; m2++) (function (m) {
      var row = el("div", { cls: "mrow" }, [el("span", { cls: "mn", text: mn(m) })]);
      S.orders[m].forEach(function (j, pos) {
        row.appendChild(el("span", { cls: "chipj" }, [
          el("button", { type: "button", "aria-label": mn(m) + " 上 " + jn(j) + " 前移", disabled: pos === 0 ? "" : null, text: "◀", onclick: function () { swap(m, pos, pos - 1); } }),
          el("b", { text: jn(j), style: "color:" + JCOL[j % 8] }),
          el("button", { type: "button", "aria-label": mn(m) + " 上 " + jn(j) + " 后移", disabled: pos === nj - 1 ? "" : null, text: "▶", onclick: function () { swap(m, pos, pos + 1); } })
        ]));
      });
      mc.appendChild(row);
    })(m2);
    sync();
  }
  function swap(m, a, b) { var t = S.orders[m][a]; S.orders[m][a] = S.orders[m][b]; S.orders[m][b] = t; S.preset = null; render(); }
  var sync = buildSeg($("jgPre"), [{ key: "same", label: "每台机器 J1→J2→J3" }, { key: "best", label: "最优" }, { key: "cycle", label: "有环的例子" }], function () { return S.preset; }, function (k) { S.preset = k; S.orders = JSON.parse(JSON.stringify(PRESET[k])); render(); });
  $("jgRand").addEventListener("click", function () {
    for (var m = 0; m < nm; m++) { var a = S.orders[m]; for (var i = a.length - 1; i > 0; i--) { var k = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[k]; a[k] = t; } }
    S.preset = null; render();
  });
  render();
  window.__fig3 = S;
})();
