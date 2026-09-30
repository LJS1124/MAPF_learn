/* fig2.js — 图 9-2：机器环境。同一批作业在单机、相同并行机 P、速度不同的并行机 Q、不相关并行机 R 上，列表调度与最优 */
(function () {
  var J = D.job, n = J.p.length, S = { env: "P", ord: "FIFO" }, COL = ["#2a78d6", "#eb6834", "#0f7a2e", "#8b5cc8", "#c08a1e", "#3a9ab5"];
  var ENV = {
    "1": { name: "单机 1", P: [J.p], note: "只有一台机器：所有作业排成一队。" },
    "P": { name: "2 台相同机 P2", P: [J.p, J.p], note: "两台一样的机器，同一个作业在哪台机器上加工时间都是 p_j。" },
    "Q": { name: "2 台速度不同 Q2", P: [J.p, J.p.map(function (x) { return x / 2; })], note: "第二台的速度是第一台的 2 倍：加工时间是 p_j / 2。" },
    "R": { name: "2 台不相关 R2", P: D.R, note: "每个作业在每台机器上的加工时间各不相同，由一张表给出（比如不同的车做同一个任务的行驶时间）。" }
  };
  function nm(j) { return "J" + (j + 1); }
  function render() {
    var E = ENV[S.env], P = E.P, order = S.ord === "FIFO" ? J.p.map(function (_, j) { return j; }) : J.p.map(function (_, j) { return j; }).sort(function (a, b) { return J.p[b] - J.p[a] || a - b; });
    var ls = Core.listSchedule(P, order), opt = Core.optCmax(P), m = P.length;
    var svg = $("envGantt"), W = 660, rowH = 46, H = 40 + m * rowH + 30, ml = 50, scale = (W - ml - 16) / Math.max(ls.Cmax, opt.Cmax, 10);
    clear(svg); svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    for (var t = 0; t <= Math.max(ls.Cmax, opt.Cmax, 10); t += 5) { sv("line", { x1: ml + t * scale, x2: ml + t * scale, y1: 20, y2: 20 + m * rowH, stroke: "var(--line)" }, svg); sv("text", { x: ml + t * scale, y: 34 + m * rowH, "text-anchor": "middle", cls: "tk", text: String(t) }, svg); }
    ls.slots.forEach(function (sl, i) {
      sv("text", { x: 4, y: 20 + i * rowH + 26, cls: "tk", text: "机器 " + (i + 1) }, svg);
      sl.forEach(function (s) {
        sv("rect", { x: ml + s.start * scale, y: 24 + i * rowH, width: (s.end - s.start) * scale - 1.5, height: rowH - 10, rx: 5, fill: COL[s.job % 6], opacity: 0.88 }, svg);
        sv("text", { x: ml + (s.start + s.end) / 2 * scale, y: 24 + i * rowH + 20, "text-anchor": "middle", cls: "gl", text: nm(s.job) }, svg);
        sv("text", { x: ml + (s.start + s.end) / 2 * scale, y: 24 + i * rowH + 33, "text-anchor": "middle", cls: "gs", text: n0(s.end - s.start) }, svg);
      });
    });
    sv("line", { x1: ml + ls.Cmax * scale, x2: ml + ls.Cmax * scale, y1: 16, y2: 22 + m * rowH, stroke: "var(--hot)", "stroke-width": 2, "stroke-dasharray": "4 3" }, svg);
    var sum = J.p.reduce(function (a, b) { return a + b; }, 0), lb = S.env === "P" ? Math.max(Math.max.apply(null, J.p), sum / m) : S.env === "1" ? sum : null;
    var st = clear($("envStats"));
    st.appendChild(stat("列表调度的 C_max", n0(ls.Cmax), "按" + (S.ord === "FIFO" ? "编号" : "加工时间从长到短") + "，依次放到完工最早的机器", ls.Cmax > opt.Cmax + 1e-9));
    st.appendChild(stat("最优 C_max", n0(opt.Cmax), "枚举全部 " + m + "^" + n + " 种分配"));
    st.appendChild(stat("下界", lb == null ? "—" : n0(Math.round(lb * 100) / 100), S.env === "P" ? "max(最长作业, 总量 ÷ 机器数)" : S.env === "1" ? "总加工时间" : "这一类没有这么简单的下界"));
    var say = "<p>" + E.note + "</p>";
    if (ls.Cmax > opt.Cmax + 1e-9) say += "<p><b class=\"key\">列表调度比最优多 " + n0(ls.Cmax - opt.Cmax) + "。</b>最优的分配是：" + opt.assign.map(function (i, j) { return nm(j) + "→机器" + (i + 1); }).join("，") + "。贪心每一步只看“现在放哪里完工最早”，看不到后面。</p>";
    else say += "<p>这一次列表调度恰好是最优。</p>";
    $("envSay").innerHTML = say;
  }
  buildSeg($("envSeg"), Object.keys(ENV).map(function (k) { return { key: k, label: ENV[k].name }; }), function () { return S.env; }, function (k) { S.env = k; render(); });
  buildSeg($("ordSeg"), [{ key: "FIFO", label: "按编号" }, { key: "LPT", label: "最长的先放（LPT）" }], function () { return S.ord; }, function (k) { S.ord = k; render(); });
  render();
  window.__fig2 = S;
})();
