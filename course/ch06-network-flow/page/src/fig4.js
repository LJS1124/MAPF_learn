/* fig4.js — 图 6-4：点弧关联矩阵的全单模检查，以及加一行“共用限额”以后 LP 与整数最优的差 */
(function () {
  var NET = D.net, NAMES = NET.names, E = NET.edges, EX = D.extras;
  var S = { ex: "none", k: 1, cache: {} };
  var view = NetView($("net4"), { names: NAMES, pos: NET.pos, edges: E });
  function exOf(key) { return EX.filter(function (x) { return x.key === key; })[0]; }
  function colName(k) { return NAMES[E[k].u] + "→" + NAMES[E[k].v]; }

  function matrix(ex) {
    var nm = Core.nodeArcMatrix(NAMES, E), A = nm.A.map(function (r) { return r.slice(); }), rows = NAMES.slice();
    if (ex.arcs.length) { var r = E.map(function () { return 0; }); ex.arcs.forEach(function (a) { r[a] = 1; }); A.push(r); rows.push("限额"); }
    return { A: A, rows: rows, cols: nm.cols };
  }
  function subTable(mx, v) {
    var t = el("table", { cls: "subm" }), head = el("tr", {}, [el("th")]);
    v.cols.forEach(function (c) { head.appendChild(el("td", { cls: "h", text: mx.cols[c] })); });
    t.appendChild(head);
    v.rows.forEach(function (r, ri) {
      var tr = el("tr", {}, [el("th", { text: mx.rows[r] })]);
      v.sub[ri].forEach(function (x) { tr.appendChild(el("td", { text: mnum(x) })); });
      t.appendChild(tr);
    });
    return t;
  }
  function drawHist(svg, an) {
    clear(svg);
    var keys = Object.keys(an.hist).map(Number).sort(function (a, b) { return a - b; }), RH = 27, W = 440, H = keys.length * RH + 10, mx = 0;
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    keys.forEach(function (k) { mx = Math.max(mx, an.hist[k]); });
    keys.forEach(function (k, r) {
      var y = 6 + r * RH, w = Math.max(2, an.hist[k] / mx * 260), bad = Math.abs(k) >= 2;
      sv("text", { cls: "bl", x: 0, y: y + 16, text: "det = " + (k > 0 ? "+" : k < 0 ? "−" : "") + Math.abs(k) }, svg);
      sv("rect", { cls: "bar" + (bad ? " bad" : ""), x: 74, y: y + 3, width: w, height: 16, rx: 3 }, svg);
      sv("text", { cls: "bv", x: 74 + w + 8, y: y + 16, text: commas(an.hist[k]) }, svg);
    });
  }

  function renderMatrix() {
    var ex = exOf(S.ex), mx = matrix(ex), an = S.cache[S.ex] || (S.cache[S.ex] = Core.tuAnalyze(mx.A)), v = an.viol;
    var tbl = clear($("nmMtx")), head = el("tr", {}, [el("th")]);
    mx.cols.forEach(function (c, ci) { var p = c.split("→"); head.appendChild(el("th", { cls: v && v.cols.indexOf(ci) >= 0 ? "hi" : "", html: p[0] + "<br>" + p[1] })); });
    tbl.appendChild(el("thead", {}, [head]));
    var tb = el("tbody");
    mx.A.forEach(function (row, ri) {
      var extra = ri >= NAMES.length, tr = el("tr", { cls: (extra ? "extra sep" : "") });
      tr.appendChild(el("th", { cls: "rl" + (v && v.rows.indexOf(ri) >= 0 ? " hi" : ""), text: mx.rows[ri] }));
      row.forEach(function (x, ci) {
        var inV = v && v.rows.indexOf(ri) >= 0 && v.cols.indexOf(ci) >= 0;
        tr.appendChild(el("td", { cls: (x ? "one" : "") + (inV ? " vr" : ""), text: x ? (x > 0 ? "1" : "−1") : "·" }));
      });
      tb.appendChild(tr);
    });
    tbl.appendChild(tb);
    $("nmNote").textContent = ex.note;
    var keys = Object.keys(an.hist).map(Number).sort(function (a, b) { return a - b; }), big = 0;
    keys.forEach(function (k) { if (Math.abs(k) >= 2) big += an.hist[k]; });
    $("nmHead").innerHTML = "方子式共 <b>" + commas(an.total) + "</b> 个，行列式取值 <b>{" + keys.map(function (k) { return k < 0 ? "−" + (-k) : String(k); }).join(", ") + "}</b>" + (big ? "，其中 |det| ≥ 2 的有 <b>" + commas(big) + "</b> 个" : "");
    drawHist($("nmHist"), an);
    var msg = clear($("nmMsg"));
    if (!v) msg.appendChild(el("span", { cls: "ok", html: "<b>全单模。</b>每一个方子式的行列式都在 {−1, 0, 1} 里。对任何整数容量和需求量，LP 的顶点都是整数，网络流不需要分支。" }));
    else {
      var sp = el("span", { cls: "bad" });
      sp.appendChild(el("b", { text: "不是全单模。" }));
      sp.appendChild(document.createTextNode(" 最小的反例是一个 " + v.rows.length + "×" + v.rows.length + " 的子式，行列式 " + (v.det > 0 ? "+" : "−") + Math.abs(v.det) + "（橙色标出的行和列）："));
      msg.appendChild(sp);
      msg.appendChild(subTable(mx, v));
    }
  }

  function renderLP() {
    var ex = exOf(S.ex), k = S.k;
    var lp = Core.flowLP(NAMES, E, 0, 5, k, { extras: ex.arcs.length ? [{ arcs: ex.arcs, b: ex.b }] : [] });
    var ipv = ex.ip[k], lpv = ex.lp[k];
    var ec = [], et = [], nc = [], nt = [];
    var frac = false;
    E.forEach(function (e, i) {
      var f = lp.status === "optimal" ? lp.x[i] : 0, isf = !near(f, Math.round(f));
      if (isf) frac = true;
      ec.push(f > 1e-9 ? (isf ? "hot" : "on") : "");
      if (ex.arcs.indexOf(i) >= 0) ec[i] += " neg";
      et.push(lp.status === "optimal" ? ufrac(f) + "/" + e.cap : "");
    });
    NAMES.forEach(function (_, i) { nc.push(i === 0 ? "src" : ""); nt.push(""); });
    view.draw({ edgeCls: ec, edgeText: et, nodeCls: nc, nodeText: nt });
    var st = clear($("nmStats"));
    st.appendChild(stat("流量 k", String(k), ex.arcs.length ? "限额行：" + ex.arcs.map(colName).join(" + ") + " ≤ " + ex.b : "没有附加行"));
    st.appendChild(stat("LP 最优值", lp.status === "optimal" ? n0(Math.round(lp.value * 1000) / 1000) : "无解", "页面内置单纯形"));
    var gap = lp.status === "optimal" && ipv != null ? ipv - lp.value : null;
    st.appendChild(stat("整数最优值", ipv == null ? (lp.status === "optimal" ? "无整数解" : "无解") : n0(ipv), "HiGHS（MIP）", gap != null && gap > 1e-7));
    var say;
    if (lp.status !== "optimal") say = "<p>在这个限额下，送 " + k + " 个单位是不可行的（LP 也无解）。</p>";
    else if (!frac) say = "<p>LP 的解是整数点，值与整数最优相同（" + n0(lp.value) + "）。这次没有出问题" + (ex.arcs.length && S.ex !== "nodec" ? "；但矩阵已经不是全单模，换一个 k 试试：" + fracHint(ex) : "") + "。</p>";
    else if (gap != null && gap < 1e-7) say = "<p>求解器返回的顶点里有分数流（橙色的弧），但值 " + n0(lp.value) + " 恰好等于整数最优。这个 k 下整数方案一样好，只是 LP 给出的最优顶点不一定是整数的，这就是“失去保证”的意思。" + fracHint(ex) + "。</p>";
    else say = "<p><b class=\"key\">LP 的解有分数（橙色的弧）。</b>LP 值 " + n0(Math.round(lp.value * 1000) / 1000) + "，整数最优 " + (ipv == null ? "无解" : n0(ipv)) + "，差 " + (ipv == null ? "—" : n0(Math.round((ipv - lp.value) * 1000) / 1000)) + "。限额行把两条首尾相接的弧绑在一起，一条走 " + colName(ex.arcs[0]) + " 再走 " + colName(ex.arcs[1]) + " 的路占了两次限额；LP 把一个单位劈成两半，各走一半，绕开了这个代价。整数流做不到，只能分支。</p>";
    $("nmSay").innerHTML = say;
    $("nmKv").textContent = String(k);
  }
  function fracHint(ex) {
    var ks = [];
    ex.lp.forEach(function (v, k) { if (v != null && ex.ip[k] != null && ex.ip[k] - v > 1e-7) ks.push(k); });
    return ks.length ? "只有 k = " + ks.join("、") + " 时 LP 值与整数最优不同" : "本表的每个 k 都相同";
  }
  buildSeg($("nmSeg"), EX.map(function (x) { return { key: x.key, label: x.label }; }), function () { return S.ex; }, function (k) { S.ex = k; renderMatrix(); renderLP(); });
  var slider = $("nmK");
  slider.addEventListener("input", function () { S.k = Number(slider.value); renderLP(); });
  renderMatrix(); renderLP();
  window.__fig4 = S;
})();
