/* fig1.js — 图 10-1：交换论证。每次交换相邻的两个作业，看目标怎么变；规则与目标匹配时从不变差 */
(function () {
  var J = D.job, n = J.p.length, S = { rule: "SPT", obj: "sumC", start: "fifo", step: 0, path: null, seqs: [] };
  var OBJ = { sumC: "ΣC_j", sumwC: "Σw_jC_j", Lmax: "L_max" }, MATCH = { SPT: "sumC", WSPT: "sumwC", EDD: "Lmax" };
  function startSeq() { var s = []; for (var i = 0; i < n; i++) s.push(i); return S.start === "rev" ? s.reverse() : s; }
  function build() {
    var s0 = startSeq(), b = Core.bubblePath(J, s0, S.rule);
    S.path = b; S.seqs = [s0].concat(b.steps.map(function (x) { return x.seq; }));
    S.vals = S.seqs.map(function (q) { return Core.evaluate(J, q)[S.obj]; });
    if (S.step > b.steps.length) S.step = b.steps.length;
  }
  function render() {
    var k = S.step, seq = S.seqs[k], st = k > 0 ? S.path.steps[k - 1] : null;
    drawGantt($("xcGantt"), J, seq, { hl: st ? st.pair : null, total: 30 });
    var say, cur = S.vals[k], prev = k > 0 ? S.vals[k - 1] : null;
    if (!st) say = "<p>起点：" + seq.map(jn).join(" → ") + "，" + subs(OBJ[S.obj]) + " = <b>" + n0(cur) + "</b>。规则 <b>" + S.rule + "</b>：从左往右找第一个“后一个按规则应当排在前一个之前”的相邻对，交换它们。</p>";
    else {
      var a = st.pair[0], b = st.pair[1], d = cur - prev;
      say = "<p>第 " + k + " 步：交换 " + jn(a) + " 和 " + jn(b) + "（原来 " + jn(a) + " 在前）。" + subs(OBJ[S.obj]) + " " + n0(prev) + " → <b class=\"" + (d > 0 ? "no" : d < 0 ? "ok" : "") + "\">" + n0(cur) + "</b>（" + (d > 0 ? "+" : d < 0 ? "−" : "±") + n0(Math.abs(d)) + "）。</p>";
      if (S.obj === "sumC") say += "<p>公式：交换相邻的 a、b 后，ΣC 的变化 = <span class=\"mn\">p<sub>b</sub> − p<sub>a</sub></span> = " + J.p[b] + " − " + J.p[a] + " = " + (J.p[b] - J.p[a]) + "。前面的作业不受影响，后面的也不受影响，只有这两个的完工时间变了。</p>";
      if (S.obj === "sumwC") say += "<p>公式：变化 = <span class=\"mn\">w<sub>a</sub>p<sub>b</sub> − w<sub>b</sub>p<sub>a</sub></span> = " + J.w[a] + "×" + J.p[b] + " − " + J.w[b] + "×" + J.p[a] + " = " + (J.w[a] * J.p[b] - J.w[b] * J.p[a]) + "。</p>";
    }
    var worse = -1; for (var i = 1; i < S.vals.length; i++) if (S.vals[i] > S.vals[i - 1]) { worse = i; break; }
    $("xcSay").innerHTML = say;
    var fl = clear($("xcFlags"));
    var matched = MATCH[S.rule] === S.obj;
    fl.appendChild(el("span", { cls: matched ? "ok" : "hot", text: matched ? "规则与目标匹配" : "规则与目标不匹配" }));
    fl.appendChild(el("span", { cls: worse < 0 ? "ok" : "no", text: worse < 0 ? "整个过程 " + subs(OBJ[S.obj]).replace(/<[^>]+>/g, "") + " 从不变差" : "第 " + worse + " 步开始变差" }));
    fl.appendChild(el("span", { text: "共 " + S.path.steps.length + " 次交换" }));
    var tb = clear($("xcTable")), body = el("tbody");
    tb.appendChild(el("thead", {}, [el("tr", {}, ["步", "交换", "目标", "变化"].map(function (t) { return el("th", { text: t }); }))]));
    S.vals.forEach(function (v, j) {
      var d = j ? v - S.vals[j - 1] : 0, pr = j ? S.path.steps[j - 1].pair : null;
      body.appendChild(el("tr", { cls: (j === k ? "cur " : "") + (d > 0 ? "worse" : ""), onclick: function () { S.step = j; render(); } }, [el("td", { text: String(j) }), el("td", { text: pr ? jn(pr[0]) + "↔" + jn(pr[1]) : "起点" }), el("td", { text: n0(v) }), el("td", { text: j ? (d > 0 ? "+" : d < 0 ? "−" : "±") + n0(Math.abs(d)) : "" })]));
    });
    tb.appendChild(body);
    $("xcTxt").textContent = "第 " + k + " / " + S.path.steps.length + " 步";
    $("xcPrev").disabled = k === 0; $("xcNext").disabled = k >= S.path.steps.length;
  }
  function rebuild() { S.step = 0; build(); render(); }
  buildSeg($("xcRule"), [{ key: "SPT", label: "SPT（p 小的先）" }, { key: "WSPT", label: "WSPT（p/w 小的先）" }, { key: "EDD", label: "EDD（d 早的先）" }], function () { return S.rule; }, function (k) { S.rule = k; S.obj = MATCH[k]; syncObj(); rebuild(); });
  var syncObj = buildSeg($("xcObj"), Object.keys(OBJ).map(function (k) { return { key: k, label: subs(OBJ[k]).replace(/<[^>]+>/g, "") }; }), function () { return S.obj; }, function (k) { S.obj = k; rebuild(); });
  buildSeg($("xcStart"), [{ key: "fifo", label: "J1…J6" }, { key: "rev", label: "J6…J1" }], function () { return S.start; }, function (k) { S.start = k; rebuild(); });
  $("xcPrev").addEventListener("click", function () { if (S.step > 0) { S.step--; render(); } });
  $("xcNext").addEventListener("click", function () { if (S.step < S.path.steps.length) { S.step++; render(); } });
  $("xcAll").addEventListener("click", function () { S.step = S.path.steps.length; render(); });
  $("xcReset").addEventListener("click", function () { S.step = 0; render(); });
  build(); render();
  window.__fig1 = S;
})();
