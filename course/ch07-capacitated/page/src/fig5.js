/* fig5.js — 图 7-5：装载（装箱）。首次适应递减（FFD）与最优车次、下界的对比 */
(function () {
  var PRE = [{ key: "bin", label: "例 1：9 个托盘", d: D.bin }, { key: "bin2", label: "例 2：10 个托盘", d: D.bin2 }];
  var S = { ex: "bin", mode: "ffd" }, svg = $("binSvg");
  var COL = ["var(--accent)", "var(--hot)", "var(--good)", "#8b5cc8", "#c08a1e", "#3a9ab5"];
  function render() {
    var d = PRE.filter(function (p) { return p.key === S.ex; })[0].d, w = d.w, Q = d.Q;
    var f = Core.ffd(w, Q), o = Core.binOpt(w, Q), lb = Core.binLB(w, Q), bins = S.mode === "ffd" ? f.map(function (b) { return b.items; }) : o.assign;
    var W = 680, H = 250, colW = 64, gap = 18, ml = 30, top = 16, ch = 190, unit = ch / Q;
    clear(svg); svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    var order = w.map(function (_, j) { return j; }).sort(function (a, b) { return w[b] - w[a] || a - b; });
    bins.forEach(function (items, b) {
      var x = ml + b * (colW + gap), y = top + ch;
      sv("rect", { cls: "col", x: x, y: top, width: colW, height: ch, rx: 4 }, svg);
      var load = 0;
      items.slice().sort(function (a, c) { return w[c] - w[a] || a - c; }).forEach(function (j) {
        var h = w[j] * unit; y -= h; load += w[j];
        sv("rect", { cls: "it", x: x + 2, y: y, width: colW - 4, height: h, rx: 3, fill: COL[order.indexOf(j) % COL.length], opacity: 0.85 }, svg);
        sv("text", { cls: "bt", x: x + colW / 2, y: y + h / 2 + 4, style: "fill:#fff", text: "T" + (j + 1) + "·" + w[j] }, svg);
      });
      sv("text", { cls: "bt", x: x + colW / 2, y: top + ch + 16, text: "车次 " + (b + 1) + "：" + load + "/" + Q }, svg);
    });
    sv("line", { cls: "capl", x1: ml - 8, x2: ml + bins.length * (colW + gap), y1: top, y2: top }, svg);
    var st = clear($("binStats"));
    st.appendChild(stat("FFD 车次", String(f.length), "从大到小，放进第一个放得下的车次", f.length > o.bins));
    st.appendChild(stat("最优车次", String(o.bins), "回溯搜索"));
    st.appendChild(stat("下界", String(lb), "⌈总托盘数 ÷ 容量⌉ = ⌈" + sum(w) + " ÷ " + Q + "⌉"));
    var say = "<p>总共 " + sum(w) + " 个托盘，每个车次装 " + Q + "，至少要 " + lb + " 个车次。</p>";
    if (f.length > o.bins) say += "<p><b class=\"key\">FFD 用了 " + f.length + " 个车次，最优是 " + o.bins + "。</b>FFD 先把大的放好，后面的小托盘补不满前面留下的缝，多开了一个车次。切到“最优”看怎么拼。</p>";
    else say += "<p>这个例子里 FFD 已经是最优。</p>";
    if (o.bins === lb && sum(w) === lb * Q) say += "<p>最优解把每个车次<b>正好装满</b>：没有一点浪费，所以贪心很难恰好拼对。</p>";
    $("binSay").innerHTML = say;
  }
  buildSeg($("binEx"), PRE.map(function (p) { return { key: p.key, label: p.label }; }), function () { return S.ex; }, function (k) { S.ex = k; render(); });
  buildSeg($("binMode"), [{ key: "ffd", label: "首次适应递减（FFD）" }, { key: "opt", label: "最优" }], function () { return S.mode; }, function (k) { S.mode = k; render(); });
  render();
  window.__fig5 = S;
})();
