/* fig3.js — 图 5-3：复杂度实验（扫描次数与松弛次数，双对数）与实测耗时表 */
(function () {
  var NS = [10, 20, 40, 80, 160, 320];
  var S = { metric: "relax", seed: 1 };
  var data = D.cx;
  var SUP = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];

  function log10(x) { return Math.log(x) / Math.LN10; }
  function randSeries(seed) {
    var out = { scans: [], relax: [] };
    NS.forEach(function (n) { var r = Core.scanStats(Core.randomMatrix(n, seed * 1000 + n, 1000000)); out.scans.push(r.scans); out.relax.push(r.relax); });
    return out;
  }
  if (!data) {
    var prod = { scans: [], relax: [] };
    NS.forEach(function (n) { var p = Core.scanStats(Core.productMatrix(n)); prod.scans.push(p.scans); prod.relax.push(p.relax); });
    data = { ns: NS, rand: randSeries(1), prod: prod };
  }
  function slope(xs, ys) {
    var lx = xs.map(log10), ly = ys.map(log10), k = lx.length, mx = sum(lx) / k, my = sum(ly) / k, num = 0, den = 0;
    for (var i = 0; i < k; i++) { num += (lx[i] - mx) * (ly[i] - my); den += (lx[i] - mx) * (lx[i] - mx); }
    return num / den;
  }
  function expLabel(e) { return "10" + String(e).split("").map(function (c) { return SUP[+c]; }).join(""); }

  function draw() {
    var svg = $("cxChart"), key = S.metric, W = 620, H = 360, ml = 64, mr = 120, mt = 18, mb = 50;
    clear(svg); svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    var ns = data.ns, ser = { r: data.rand[key], p: data.prod[key] };
    var lo = Math.min(Math.min.apply(null, ser.r), Math.min.apply(null, ser.p)), hi = Math.max(Math.max.apply(null, ser.r), Math.max.apply(null, ser.p));
    var e0 = Math.floor(log10(lo)), e1 = Math.ceil(log10(hi)), y0 = Math.pow(10, e0), y1 = Math.pow(10, e1);
    function X(v) { return ml + (log10(v) - log10(ns[0])) / (log10(ns[ns.length - 1]) - log10(ns[0])) * (W - ml - mr); }
    function Y(v) { return mt + (1 - (log10(v) - e0) / (e1 - e0)) * (H - mt - mb); }
    for (var e = e0; e <= e1; e++) {
      sv("line", { cls: "gridline", x1: ml, x2: W - mr, y1: Y(Math.pow(10, e)), y2: Y(Math.pow(10, e)) }, svg);
      sv("text", { x: ml - 6, y: Y(Math.pow(10, e)) + 3.5, "text-anchor": "end", text: expLabel(e) }, svg);
    }
    sv("line", { cls: "axisline", x1: ml, x2: W - mr, y1: H - mb, y2: H - mb }, svg);
    ns.forEach(function (n) {
      sv("line", { cls: "axisline", x1: X(n), x2: X(n), y1: H - mb, y2: H - mb + 4 }, svg);
      sv("text", { x: X(n), y: H - mb + 17, "text-anchor": "middle", text: String(n) }, svg);
    });
    sv("text", { x: (ml + W - mr) / 2, y: H - 6, "text-anchor": "middle", cls: "val2", text: "规模 n（n 辆车 × n 个任务）" }, svg);
    sv("text", { x: 4, y: 11, cls: "val2", text: key === "relax" ? "松弛次数（次）" : "扫描次数（次）" }, svg);
    var labels = [];
    // 参照斜率：过乘积矩阵的第一个点
    var slopes = key === "relax" ? [2, 3] : [1, 2], a0 = ser.p[0], n0v = ns[0];
    slopes.forEach(function (s) {
      var pts = [], last = null;
      for (var q = 0; q <= 40; q++) {
        var nn = n0v * Math.pow(ns[ns.length - 1] / n0v, q / 40), yy = a0 * Math.pow(nn / n0v, s);
        if (yy < y0 || yy > y1) continue;
        pts.push(X(nn).toFixed(1) + "," + Y(yy).toFixed(1)); last = { x: X(nn), y: Y(yy) };
      }
      sv("polyline", { cls: "ref", points: pts.join(" ") }, svg);
      if (last) labels.push({ x: last.x + 6, y: last.y, text: "∝ n" + SUP[s], cls: "lab-ref" });
    });
    [["r", "ser-r", "dot-r", "随机矩阵", "lab-r"], ["p", "ser-p", "dot-p", "乘积矩阵", "lab-p"]].forEach(function (s) {
      var vals = ser[s[0]];
      sv("polyline", { cls: s[1], points: ns.map(function (n, i) { return X(n).toFixed(1) + "," + Y(vals[i]).toFixed(1); }).join(" ") }, svg);
      ns.forEach(function (n, i) {
        var c = sv("circle", { cls: s[2], cx: X(n), cy: Y(vals[i]), r: 4.5 }, svg);
        c.addEventListener("pointerenter", function (evt) { showTip(evt, [el("div", { cls: "tv", text: commas(vals[i]) }), el("div", { cls: "tl", text: s[3] + " · n = " + n + " · " + (key === "relax" ? "松弛" : "扫描") + "次数" })]); });
        c.addEventListener("pointerleave", hideTip);
      });
      labels.push({ x: X(ns[ns.length - 1]) + 8, y: Y(vals[vals.length - 1]), text: s[3], cls: s[4] });
    });
    labels.sort(function (a, b) { return a.y - b.y; });
    for (var i = 1; i < labels.length; i++) if (labels[i].y - labels[i - 1].y < 14) labels[i].y = labels[i - 1].y + 14;
    labels.forEach(function (l) { sv("text", { cls: l.cls, x: l.x, y: l.y + 4, text: l.text }, svg); });
  }

  function note() {
    var i = data.ns.length - 1, box = clear($("cxNote")), nmax = data.ns[i];
    var sp = slope(data.ns, data.prod.relax), sr = slope(data.ns, data.rand.relax);
    box.appendChild(el("p", { html: "<b class=\"p\">乘积矩阵</b> <span class=\"m\">c</span><sub class=\"m\">ij</sub> = <span class=\"m\">i</span>·<span class=\"m\">j</span>：<span class=\"m\">n</span> = " + nmax + " 时扫描 " + commas(data.prod.scans[i]) + " 次（= <span class=\"m\">n</span>(<span class=\"m\">n</span>+1)/2），松弛 " + commas(data.prod.relax[i]) + " 次，松弛次数的拟合指数 ≈ <b>" + sp.toFixed(2) + "</b>。" }));
    var per = data.rand.scans[i] / nmax;
    box.appendChild(el("p", { html: "<b class=\"r\">随机矩阵</b>（代价 1 到 10⁶）：<span class=\"m\">n</span> = " + nmax + " 时扫描 " + commas(data.rand.scans[i]) + " 次，平均每次插入 " + per.toFixed(1) + " 辆车，只占全部车的 " + (100 * per / nmax).toFixed(0) + "%，松弛次数的拟合指数 ≈ <b>" + sr.toFixed(2) + "</b>。" }));
    box.appendChild(el("p", { text: "在这组数据里，每次插入扫描的车数大致按 √n 增长，所以总松弛次数的指数落在 2 和 3 之间，没有到最坏情形的 3。" }));
    box.appendChild(el("p", { text: "随机矩阵每个规模是一个独立样本，曲线不会完全光滑。代价范围如果窄到 1 到 100，并列变多，扫描会明显增加。" }));
    box.appendChild(el("p", { text: "点圆点可以看具体数字。" }));
  }
  function render() { draw(); note(); }

  buildSeg($("cxMetric"), [{ key: "relax", label: "松弛次数" }, { key: "scans", label: "扫描次数" }], function () { return S.metric; }, function (k) { S.metric = k; render(); });
  $("cxRerun").addEventListener("click", function () { S.seed++; data = { ns: data.ns, prod: data.prod, rand: randSeries(S.seed) }; render(); });
  render();

  // ------------------------------------------------------------ 实测耗时表
  var T = D.timing, tbl = clear($("timeTable"));
  tbl.appendChild(el("thead", {}, [el("tr", {}, ["n × n", "手写 Python 增量版", "linear_sum_assignment", "LP（HiGHS 对偶单纯形）", "MIP（HiGHS）"].map(function (h) { return el("th", { text: h }); }))]));
  var tb = el("tbody");
  function ms(v) { return v == null ? "—" : v < 1 ? v.toFixed(2) + " ms" : v < 100 ? v.toFixed(1) + " ms" : Math.round(v).toLocaleString("en-US") + " ms"; }
  T.rows.forEach(function (r) { tb.appendChild(el("tr", {}, [el("td", { text: r.n + " × " + r.n }), el("td", { text: ms(r.py) }), el("td", { text: ms(r.lsa) }), el("td", { text: ms(r.lp) }), el("td", { text: ms(r.milp) })])); });
  tbl.appendChild(tb);
  window.__fig3 = { data: function () { return data; } };
})();
