/* fig1.js — 图 7-1：背包的 LP 上界。按价值/重量排序，装到装不下的那个装一部分；对比整数最优 */
(function () {
  var K = D.knap, n = K.v.length, S = { cap: K.cap }, svg = $("kbSvg");
  function nm(j) { return "T" + (j + 1); }

  function draw() {
    var cap = S.cap, lp = Core.knapLP(K.v, K.w, cap), dp = Core.knapDP(K.v, K.w, cap), order = lp.order;
    var W = 660, ml = 76, mr = 14, tot = sum(K.w), scale = (W - ml - mr) / Math.max(tot, cap), H = 196;
    clear(svg); svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    function block(x, y, w, h, cls, j, extra) {
      sv("rect", { cls: "blk " + cls, x: x, y: y, width: Math.max(w, 1), height: h, rx: 4 }, svg);
      if (w > 30) {
        sv("text", { cls: "lab", x: x + w / 2, y: y + h / 2 - 2, "text-anchor": "middle", text: nm(j) }, svg);
        sv("text", { x: x + w / 2, y: y + h / 2 + 12, "text-anchor": "middle", text: K.v[j] + " / " + K.w[j] + (extra || "") }, svg);
      }
    }
    sv("text", { cls: "row", x: 0, y: 28, text: "LP 解" }, svg);
    sv("text", { cls: "row", x: 0, y: 116, text: "整数最优" }, svg);
    var x0 = ml, used = 0;
    order.forEach(function (j) {
      var w = K.w[j], fullIn = used + w <= cap, cls = fullIn ? "" : (used < cap ? "frac" : "out");
      if (fullIn) block(ml + used * scale, 34, w * scale, 50, "", j);
      else if (used < cap) {           // 被截断的那一个：里面的一部分是 LP 装进去的，外面是装不下的
        var inw = (cap - used) * scale;
        block(ml + used * scale, 34, inw, 50, "frac", j, "");
        sv("rect", { cls: "blk out", x: ml + cap * scale, y: 34, width: (w - (cap - used)) * scale, height: 50, rx: 4 }, svg);
        sv("text", { x: ml + used * scale + inw / 2, y: 100, "text-anchor": "middle", text: "装 " + f2((cap - used) / w) }, svg);
      } else block(ml + used * scale, 34, w * scale, 50, "out", j);
      used += w;
    });
    sv("line", { cls: "capline", x1: ml + cap * scale, x2: ml + cap * scale, y1: 26, y2: 92 }, svg);
    sv("text", { cls: "cap", x: ml + cap * scale, y: 20, "text-anchor": "middle", text: "载重 " + cap }, svg);
    // 整数最优：被选中的按同一顺序排开
    used = 0;
    order.forEach(function (j) {
      if (!dp.take[j]) return;
      block(ml + used * scale, 122, K.w[j] * scale, 50, "opt", j);
      used += K.w[j];
    });
    sv("line", { cls: "capline", x1: ml + cap * scale, x2: ml + cap * scale, y1: 116, y2: 178 }, svg);
    sv("text", { x: ml + used * scale + 8, y: 152, text: used < cap ? "空 " + (cap - used) : "" }, svg);

    var st = clear($("kbStats"));
    st.appendChild(stat("LP 上界", f2(lp.bound), "装到装不下为止，再装一部分"));
    st.appendChild(stat("整数最优（DP）", String(dp.value), "重量 " + used + " / " + cap));
    st.appendChild(stat("差", f2(lp.bound - dp.value), "上界向下取整 = " + Math.floor(lp.bound + 1e-9), lp.bound - dp.value > 1e-9));
    var tb = clear($("kbTable")), body = el("tbody");
    tb.appendChild(el("thead", {}, [el("tr", {}, ["物品", "价值", "重量", "价值/重量", "LP", "最优"].map(function (t) { return el("th", { text: t }); }))]));
    order.forEach(function (j) {
      var isF = lp.x[j] > 1e-9 && lp.x[j] < 1 - 1e-9;
      body.appendChild(el("tr", { cls: (isF ? "frac " : "") + (dp.take[j] ? "take" : "") }, [
        el("td", { text: nm(j) }), el("td", { text: String(K.v[j]) }), el("td", { text: String(K.w[j]) }), el("td", { text: f2(K.v[j] / K.w[j]) }),
        el("td", { text: isF ? f2(lp.x[j]) : String(Math.round(lp.x[j])) }), el("td", { text: dp.take[j] ? "选" : "" })]));
    });
    tb.appendChild(body);
    var frac = lp.frac >= 0, say;
    if (!frac) say = "<p>这个载重下，LP 恰好装满，没有分数变量，上界等于整数最优。</p>";
    else say = "<p>按价值/重量从大到小装，装到 <b>" + nm(lp.frac) + "</b> 时装不下，LP 只装了它的 <b class=\"key\">" + f2(lp.x[lp.frac]) + "</b>。至多一个变量是分数，其余都是 0 或 1。</p>" +
      "<p>LP 上界 " + f2(lp.bound) + "，整数最优 " + dp.value + "。整数最优要另外选：" + order.filter(function (j) { return dp.take[j]; }).map(nm).join("、") + "。整数解装不了 " + nm(lp.frac) + " 的一部分，剩下的空间要用别的物品凑。" + (dp.value < Math.floor(lp.bound + 1e-9) ? "上界向下取整（" + Math.floor(lp.bound + 1e-9) + "）也比最优大，说明取整不能直接当答案。" : "") + "</p>";
    $("kbSay").innerHTML = say;
    $("kbCapV").textContent = String(cap);
  }
  var sl = $("kbCap");
  sl.addEventListener("input", function () { S.cap = Number(sl.value); draw(); });
  draw();
  window.__fig1 = S;
})();
