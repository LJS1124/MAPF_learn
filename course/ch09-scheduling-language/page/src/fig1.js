/* fig1.js — 图 9-1：同一台提升机上的 6 个作业。换顺序，看 7 个目标怎么变；哪一个目标偏好哪种顺序 */
(function () {
  var J = D.job, n = J.p.length, S = { seq: Core.RULES.SPT(J), rule: "SPT" }, best = Core.bestBy(J), COL = ["#2a78d6", "#eb6834", "#0f7a2e", "#8b5cc8", "#c08a1e", "#3a9ab5"];
  function nm(j) { return "J" + (j + 1); }
  var LABEL = { Cmax: ["最大完工时间", "C_max"], sumC: ["完工时间之和", "ΣC_j"], sumwC: ["加权完工时间之和", "Σw_jC_j"], Lmax: ["最大延迟", "L_max"], sumT: ["延误时间之和", "ΣT_j"], sumU: ["延误作业个数", "ΣU_j"], sumwU: ["加权延误作业数", "Σw_jU_j"] };
  function gantt(e) {
    var svg = $("jobGantt"), W = 660, H = 150, ml = 20, tot = e.Cmax, scale = (W - ml - 16) / Math.max(tot, 30);
    clear(svg); svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    for (var t = 0; t <= Math.max(tot, 30); t += 5) { sv("line", { x1: ml + t * scale, x2: ml + t * scale, y1: 30, y2: 96, stroke: "var(--line)" }, svg); sv("text", { x: ml + t * scale, y: 112, "text-anchor": "middle", cls: "tk", text: String(t) }, svg); }
    S.seq.forEach(function (j) {
      var x = ml + e.start[j] * scale, w = J.p[j] * scale, late = e.C[j] > J.d[j];
      sv("rect", { x: x, y: 40, width: w - 1.5, height: 44, rx: 5, fill: COL[j % 6], opacity: 0.88, stroke: late ? "var(--bad)" : "none", "stroke-width": late ? 3 : 0 }, svg);
      sv("text", { x: x + w / 2, y: 60, "text-anchor": "middle", cls: "gl", text: nm(j) }, svg);
      sv("text", { x: x + w / 2, y: 76, "text-anchor": "middle", cls: "gs", text: "p=" + J.p[j] }, svg);
      // 交货期标记
      sv("path", { d: "M" + (ml + J.d[j] * scale) + " 34 l-5 -10 h10 z", fill: late ? "var(--bad)" : COL[j % 6], stroke: "var(--surface)", "stroke-width": 1 }, svg);
      sv("text", { x: ml + J.d[j] * scale, y: 18, "text-anchor": "middle", cls: "gs", text: "d" + (j + 1) }, svg);
    });
    sv("text", { x: W - 8, y: 138, "text-anchor": "end", cls: "tk", text: "三角标 = 交货期；红框 = 这个作业延误" }, svg);
  }
  function render() {
    var e = Core.evaluate(J, S.seq);
    gantt(e);
    var seqEl = clear($("jobSeq"));
    S.seq.forEach(function (j, i) {
      seqEl.appendChild(el("span", { cls: "chipj", style: "border-color:" + COL[j % 6] }, [
        el("button", { type: "button", "aria-label": "前移", text: "◀", disabled: i === 0 ? "" : null, onclick: function () { move(i, -1); } }),
        el("b", { text: nm(j) }),
        el("button", { type: "button", "aria-label": "后移", text: "▶", disabled: i === n - 1 ? "" : null, onclick: function () { move(i, 1); } })]));
    });
    var tb = clear($("jobMetrics")), body = el("tbody");
    tb.appendChild(el("thead", {}, [el("tr", {}, ["目标", "当前", "最优", "取得最优的顺序"].map(function (t) { return el("th", { text: t }); }))]));
    Core.KEYS.forEach(function (k) {
      var isBest = Math.abs(e[k] - best[k].value) < 1e-9, seqTxt = best[k].seqs.length > 3 ? best[k].seqs.length + " 个顺序（如 " : "", first = best[k].seqs[0].map(nm).join(" ");
      body.appendChild(el("tr", { cls: isBest ? "okrow" : "" }, [el("td", { html: LABEL[k][0] + " <span class=\"m\">" + subs(LABEL[k][1]) + "</span>" }), el("td", { text: n0(e[k]) }), el("td", { text: n0(best[k].value) }),
        el("td", { text: best[k].seqs.length === 1 ? first : best[k].seqs.length + " 个顺序，如 " + first, cls: "sq" })]));
    });
    tb.appendChild(body);
    var okKeys = Core.KEYS.filter(function (k) { return Math.abs(e[k] - best[k].value) < 1e-9 && k !== "Cmax"; });
    $("jobSay").innerHTML = "<p>当前顺序：<b>" + S.seq.map(nm).join(" → ") + "</b>。它在 " + (okKeys.length ? "<b class=\"ok\">" + okKeys.map(function (k) { return subs(LABEL[k][1]); }).join("、") + "</b>" : "<b class=\"no\">没有一个</b>") + " 上是最优的（不计 C<sub>max</sub>，因为没有释放时间时 C<sub>max</sub> 与顺序无关）。</p>" +
      "<p>没有一种顺序能让所有目标同时最好：SPT、WSPT、EDD、Moore 各自是一类目标的最优规则，换一个目标就换一种“最好”的顺序。选目标，是在选调度的方向。</p>";
    Object.keys(S.buttons || {}).forEach(function (r) { S.buttons[r].setAttribute("aria-pressed", S.rule === r ? "true" : "false"); });
  }
  function move(i, d) { var t = S.seq[i]; S.seq[i] = S.seq[i + d]; S.seq[i + d] = t; S.rule = "手动"; render(); }
  var RULE = [{ key: "FIFO", label: "先来先做" }, { key: "SPT", label: "SPT 最短优先" }, { key: "WSPT", label: "WSPT 加权最短" }, { key: "EDD", label: "EDD 交货期" }, { key: "Moore", label: "Moore–Hodgson" }];
  var host = $("jobRules"); S.buttons = {};
  RULE.forEach(function (r) { var b = el("button", { type: "button", text: r.label, "aria-pressed": "false", onclick: function () { S.seq = (r.key === "Moore" ? Core.moore(J) : Core.RULES[r.key](J)).slice(); S.rule = r.key; render(); } }); S.buttons[r.key] = b; host.appendChild(b); });
  render();
  window.__fig1 = S;
})();
