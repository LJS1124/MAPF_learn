/* fig4.js — 图 5-4：全单模检查器（枚举全部方子式，统计行列式，找反例） */
(function () {
  var KINDS = [
    { key: "base", label: "不加", note: "3 任务 × 3 车的指派约束。前 3 行：每个任务恰好一辆车；中间 3 行：每辆车至多一个任务。每一列是一个变量（车→任务），恰好有两个 1，一个在任务行，一个在车行。" },
    { key: "group12", label: "共享名额", note: "多一行：V1 和 V2 合计至多接 1 个任务。这一行等于 V1 行加 V2 行。" },
    { key: "group12_23", label: "重叠名额", note: "多两行：V1 + V2 ≤ 1，V2 + V3 ≤ 1。两个车组共用了 V2，不再“嵌套或不相交”。" },
    { key: "conflict", label: "冲突对", note: "多一行：V1→T1 与 V2→T2 不能同时出现。两条边的车和任务都互不相同。" },
    { key: "conflictSame", label: "同车冲突", note: "多一行：V1→T1 与 V1→T2 不能同时出现。两条边属于同一辆车，已被“V1 至多一个任务”蕴含。" },
    { key: "conflict3", label: "三边冲突", note: "多一行：V1→T1、V2→T2、V3→T3 三条互不相干的边至多出现一条。" },
    { key: "triangle", label: "奇圈", note: "换一种矩阵：三辆车 A、B、C 两两之间都可以组队，是 3 个顶点 × 3 条边（AB、BC、AC）的关联矩阵。三角形不是二部图。" }
  ];
  var S = { kind: "base", cache: {} };
  function kindOf(k) { return KINDS.filter(function (x) { return x.key === k; })[0]; }

  function fracText(sol) { return "(" + sol.map(function (x) { return Core.frac(x); }).join(", ") + ")"; }

  function drawHist(svg, an) {
    clear(svg);
    var keys = Object.keys(an.hist).map(Number).sort(function (a, b) { return a - b; }), RH = 27, W = 440, H = keys.length * RH + 10;
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    var mx = 0; keys.forEach(function (k) { mx = Math.max(mx, an.hist[k]); });
    keys.forEach(function (k, r) {
      var y = 6 + r * RH, w = Math.max(2, an.hist[k] / mx * 260), bad = Math.abs(k) >= 2;
      sv("text", { cls: "bl", x: 0, y: y + 16, text: "det = " + (k > 0 ? "+" : k < 0 ? "−" : "") + Math.abs(k) }, svg);
      sv("rect", { cls: "bar" + (bad ? " bad" : ""), x: 74, y: y + 3, width: w, height: 16, rx: 3 }, svg);
      sv("text", { cls: "bv", x: 74 + w + 8, y: y + 16, text: commas(an.hist[k]) }, svg);
    });
  }

  function subTable(mx, v) {
    var t = el("table", { cls: "subm" });
    var head = el("tr", {}, [el("th")]);
    v.cols.forEach(function (c) { head.appendChild(el("td", { cls: "h", text: mx.cols[c] })); });
    t.appendChild(head);
    v.rows.forEach(function (r, ri) {
      var tr = el("tr", {}, [el("th", { text: mx.rows[r] })]);
      v.sub[ri].forEach(function (x) { tr.appendChild(el("td", { text: String(x) })); });
      t.appendChild(tr);
    });
    return t;
  }

  function render() {
    var kind = S.kind, mx = Core.tuMatrix(kind);
    var an = S.cache[kind] || (S.cache[kind] = Core.tuAnalyze(mx.A)), v = an.viol;
    var tbl = clear($("tuMtx")), head = el("tr", {}, [el("th")]);
    mx.cols.forEach(function (c, ci) {
      var parts = c.split("→");
      head.appendChild(el("th", { cls: v && v.cols.indexOf(ci) >= 0 ? "hi" : "", html: parts.length === 2 ? parts[0] + "<br>" + parts[1] : c }));
    });
    tbl.appendChild(el("thead", {}, [head]));
    var tb = el("tbody");
    mx.A.forEach(function (row, ri) {
      var extra = mx.nTask > 0 && ri >= mx.nTask + mx.nVeh, sep = mx.nTask > 0 && (ri === mx.nTask || ri === mx.nTask + mx.nVeh);
      var tr = el("tr", { cls: (extra ? "extra " : "") + (sep ? "sep" : "") });
      tr.appendChild(el("th", { cls: "rl" + (v && v.rows.indexOf(ri) >= 0 ? " hi" : ""), text: mx.rows[ri] }));
      row.forEach(function (x, ci) {
        var inVr = v && v.rows.indexOf(ri) >= 0 && v.cols.indexOf(ci) >= 0;
        tr.appendChild(el("td", { cls: (x ? "one" : "") + (inVr ? " vr" : ""), text: x ? "1" : "·" }));
      });
      tb.appendChild(tr);
    });
    tbl.appendChild(tb);
    $("tuMtxNote").textContent = kindOf(kind).note;

    var keys = Object.keys(an.hist).map(Number).sort(function (a, b) { return a - b; });
    var big = 0; keys.forEach(function (k) { if (Math.abs(k) >= 2) big += an.hist[k]; });
    $("tuHead").innerHTML = "方子式共 <b>" + commas(an.total) + "</b> 个，行列式取值 <b>{" + keys.map(function (k) { return k < 0 ? "−" + (-k) : String(k); }).join(", ") + "}</b>" + (big ? "，其中 |det| ≥ 2 的有 <b>" + commas(big) + "</b> 个" : "");
    drawHist($("tuHist"), an);
    var msg = clear($("tuMsg"));
    if (!v) msg.appendChild(el("span", { cls: "ok", html: "<b>全单模。</b>每一个方子式的行列式都在 {−1, 0, 1} 里。配上任何整数右端项，LP 的顶点都是整数点，LP 值 = 整数最优。" }));
    else {
      var sp = el("span", { cls: "bad" });
      sp.appendChild(el("b", { text: "不是全单模。" }));
      sp.appendChild(document.createTextNode(" 最小的反例是一个 " + v.rows.length + "×" + v.rows.length + " 的子式，行列式 " + (v.det > 0 ? "+" : "−") + Math.abs(v.det) + "（橙色标出的行和列）："));
      msg.appendChild(sp);
      msg.appendChild(subTable(mx, v));
      if (v.sol) msg.appendChild(el("p", { html: "解 <i>Bx</i> = 1 得 <span class=\"mn\">x = " + fracText(v.sol) + "</span>：这三个约束同时取等号的点是分数点，分母就是 |det| = " + Math.abs(v.det) + "。" }));
    }
  }
  buildSeg($("tuSeg"), KINDS, function () { return S.kind; }, function (k) { S.kind = k; render(); });
  render();

  // 段末的提示：默认场景加两个重叠名额，LP 与整数最优
  (function () {
    var C = D.C, cells = function (set) { var c = []; set.forEach(function (i) { for (var j = 0; j < 5; j++) c.push([i, j, 1]); }); return c; };
    var ex = [{ cells: cells([0, 1]), b: 1 }, { cells: cells([1, 2]), b: 1 }];
    var lp = Core.lpExtra(C, ex), ip = Core.ipExtra(C, ex);
    $("tuNoteLp").textContent = n0(lp.value) + " s"; $("tuNoteIp").textContent = n0(ip.value) + " s";
  })();
  window.__fig4 = { cache: S.cache };
})();
