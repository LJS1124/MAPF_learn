/* fig5.js — 图 5-5：加一行以后的 LP（冲突对 + 拉格朗日下界；奇圈组队 + 奇集割） */
(function () {
  var C = D.C, SC = D.scenario, IT = SC.tasks, IV = SC.vehicles, m = IV.length, n = IT.length, A0 = D.a;
  var PRESETS = [
    { key: "p1", label: "V1→T3 + V2→T2", e: [[0, 2], [1, 1]] },
    { key: "p2", label: "V2→T2 + V5→T5", e: [[1, 1], [4, 4]] },
    { key: "p3", label: "V3→T1 + V2→T2", e: [[2, 0], [1, 1]] }
  ];
  var S = { tab: "conf", e: [[0, 2], [1, 1]], lam: 0, s: [10, 10, 10], cut: false };
  var R = {};
  function VN(i) { return IV[i].id; }
  function TN(j) { return IT[j].id; }
  function same(a, b) { return a[0] === b[0] && a[1] === b[1]; }
  function presetKey() {
    for (var i = 0; i < PRESETS.length; i++) {
      var p = PRESETS[i].e;
      if ((same(p[0], S.e[0]) && same(p[1], S.e[1])) || (same(p[0], S.e[1]) && same(p[1], S.e[0]))) return PRESETS[i].key;
    }
    return "";
  }
  function compute() {
    var e1 = S.e[0], e2 = S.e[1];
    var valid = e1[0] !== e2[0] && e1[1] !== e2[1];
    var ex = [{ cells: [[e1[0], e1[1], 1], [e2[0], e2[1], 1]], b: 1 }];
    var lp = Core.lpExtra(C, ex), ip = Core.ipExtra(C, ex);
    var dec = Core.decompose(lp.x, m, n), lag = Core.lagrangeBest(C, e1, e2), curve = [];
    for (var lam = 0; lam <= 12.001; lam += 0.25) curve.push([lam, Core.lagrangeEdges(C, e1, e2, lam).L]);
    R = { valid: valid, lp: lp, ip: ip, dec: dec, lag: lag, curve: curve };
  }
  function isFrac(x) { return x > 1e-9 && x < 1 - 1e-9; }
  function cost(a) { var t = 0; a.forEach(function (i, j) { t += C[i][j]; }); return t; }
  function confCount(a) { var c = 0; S.e.forEach(function (e) { if (a[e[1]] === e[0]) c++; }); return c; }

  // ------------------------------------------------------------ 冲突对
  function renderConf() {
    var e1 = S.e[0], e2 = S.e[1], x = R.lp.x, tbl = clear($("cfMtx")), i, j;
    var head = el("tr", {}, [el("th")]);
    IT.forEach(function (t) { head.appendChild(el("th", { html: t.id + "<small>" + t.floor + "F</small>" })); });
    tbl.appendChild(el("thead", {}, [head]));
    var tb = el("tbody");
    for (i = 0; i < m; i++) {
      var tr = el("tr", {}, [el("th", { html: VN(i) + "<small>" + IV[i].floor + "F</small>" })]);
      for (j = 0; j < n; j++) {
        (function (ii, jj) {
          var isBase = A0[jj] === ii, pick = same([ii, jj], e1) || same([ii, jj], e2), xv = x[ii][jj];
          var cls = (isBase ? "on " : "") + (pick ? "pickE " : "") + (isFrac(xv) ? "frac " : "") + (xv > 1 - 1e-9 && !isBase ? "lp1 " : "");
          var td = el("td", { cls: cls.trim(), title: "点击：把 " + VN(ii) + "→" + TN(jj) + " 设为冲突边", onclick: function () {
            if (pick) return;
            S.e = [S.e[1], [ii, jj]]; refresh();
          } }, [String(C[ii][jj])]);
          if (isFrac(xv)) td.appendChild(el("small", { text: "x = " + ufrac(xv) }));
          tr.appendChild(td);
        })(i, j);
      }
      tb.appendChild(tr);
    }
    tbl.appendChild(tb);
    var pk = presetKey();
    buildSeg($("cfPre"), PRESETS.concat(pk ? [] : [{ key: "", label: "自选" }]), function () { return pk; }, function (k) {
      var p = PRESETS.filter(function (q) { return q.key === k; })[0]; if (p) { S.e = [p.e[0].slice(), p.e[1].slice()]; refresh(); }
    });
    // 统计
    var st = clear($("cfStats")), gap = R.ip.value - R.lp.value, fr = R.dec && R.dec.length > 1;
    st.appendChild(stat("无冲突约束", D.opt + " s", "第 2 章的最优"));
    st.appendChild(stat("LP 值", n0(R.lp.value) + " s", fr ? "分数解" : "整数解"));
    st.appendChild(stat("整数最优", n0(R.ip.value) + " s", gap > 1e-9 ? "比 LP 多 " + n0(gap) + " s" : "= LP", gap > 1e-9));
    // 说明
    var say = clear($("cfSay")), lab = VN(e1[0]) + "→" + TN(e1[1]) + " 与 " + VN(e2[0]) + "→" + TN(e2[1]);
    if (!R.valid) {
      say.appendChild(el("p", { html: "<b>" + lab + "：这一行是多余的。</b>两条边共用了一辆车（或一个任务），“至多选一条”已经被指派约束保证，加不加都一样，矩阵仍是全单模。" }));
    } else if (fr) {
      say.appendChild(el("p", { html: "<b>冲突：" + lab + " 不能同时出现。</b>LP 值 <span class=\"mn\">" + n0(R.lp.value) + " s</span>，整数最优 <span class=\"mn\">" + n0(R.ip.value) + " s</span>，差 " + n0(gap) + " s。LP 的解是几个真实派法的平均：" }));
      R.dec.forEach(function (p) {
        say.appendChild(el("span", { cls: "part", html: "<b>" + Math.round(p.w * 100) + "%</b> × " + assignText(p.a, SC) + " · " + cost(p.a) + " s · 含 " + confCount(p.a) + " 条冲突边" }));
      });
      var xs = S.e.map(function (e) { return x[e[0]][e[1]]; });
      say.appendChild(el("p", { html: "两条冲突边的 <span class=\"m\">x</span> 分别是 " + Core.frac(xs[0]) + "、" + Core.frac(xs[1]) + "，和 " + Core.frac(xs[0] + xs[1]) + " ≤ 1，约束满足。约束只管“平均”：一半时间做冲突的事，一半时间什么也不做。" }));
      say.appendChild(el("p", { html: "冲突的影子价格 <span class=\"m\">λ</span>* = <span class=\"mn\">" + n0(Math.round(R.lag.lam * 100) / 100) + " s</span>：每禁止“这两个同时出现”，系统愿意多付约 " + n0(Math.round(R.lag.lam * 100) / 100) + " s。" }));
    } else {
      var same0 = Math.abs(R.lp.value - D.opt) < 1e-9;
      say.appendChild(el("p", { html: "<b>冲突：" + lab + " 不能同时出现。</b>LP 值 <span class=\"mn\">" + n0(R.lp.value) + " s</span>，整数最优 <span class=\"mn\">" + n0(R.ip.value) + " s</span>：LP 的解已经是整数。" }));
      say.appendChild(el("p", { text: same0 ? "这两条边没有同时出现在最优派法里，这一行没有起作用。" : "这一行确实起作用了（总时间从 " + D.opt + " s 涨到 " + n0(R.lp.value) + " s），但 LP 的最优点碰巧仍是整数顶点。加了一行不等于一定出分数解，只是不再有保证。" }));
    }
    renderLag();
  }

  function renderLag() {
    var svg = $("cfLag"), curve = R.curve, ys = curve.map(function (p) { return p[1]; });
    var top = Math.max(R.ip.value, R.lp.value, Math.max.apply(null, ys)), bot = Math.min.apply(null, ys);
    var y0 = Math.floor(bot - 2), y1 = Math.ceil(top + 3), yt = [], t;
    for (t = Math.ceil(y0 / 4) * 4; t <= y1; t += 4) yt.push([t, String(t)]);
    var ch = lineChart(svg, { W: 420, H: 230, x: [0, 12], y: [y0, y1], ml: 42, mr: 70, xticks: [0, 2, 4, 6, 8, 10, 12].map(function (v) { return [v, String(v)]; }), yticks: yt, xlabel: "冲突罚金 λ（s）", ylabel: "下界 L(λ)（s）" });
    sv("line", { cls: "ref-ip", x1: ch.ml, x2: ch.W - ch.mr, y1: ch.Y(R.ip.value), y2: ch.Y(R.ip.value) }, svg);
    sv("text", { cls: "lab-ip", x: ch.W - ch.mr + 6, y: ch.Y(R.ip.value) + 4, text: "整数最优 " + n0(R.ip.value) }, svg);
    if (Math.abs(R.lp.value - R.ip.value) > 1e-9) {
      sv("line", { cls: "ref-lp", x1: ch.ml, x2: ch.W - ch.mr, y1: ch.Y(R.lp.value), y2: ch.Y(R.lp.value) }, svg);
      sv("text", { cls: "lab-lp", x: ch.W - ch.mr + 6, y: ch.Y(R.lp.value) + 4, text: "LP " + n0(R.lp.value) }, svg);
    }
    sv("polyline", { cls: "cxline", style: "fill:none;stroke:var(--accent);stroke-width:2.4;stroke-linejoin:round", points: curve.map(function (p) { return ch.X(p[0]).toFixed(1) + "," + ch.Y(p[1]).toFixed(1); }).join(" ") }, svg);
    var cur = Core.lagrangeEdges(C, S.e[0], S.e[1], S.lam);
    sv("line", { cls: "cur", x1: ch.X(S.lam), x2: ch.X(S.lam), y1: ch.mt, y2: ch.H - ch.mb }, svg);
    sv("circle", { cx: ch.X(S.lam), cy: ch.Y(cur.L), r: 5, style: "fill:var(--hot);stroke:var(--surface);stroke-width:2" }, svg);
    $("cfLamV").textContent = n0(S.lam);
    var slope = cur.both - 1;
    $("cfLagNote").innerHTML = "<b>L(" + n0(S.lam) + ") = " + n0(Math.round(cur.L * 100) / 100) + " s</b>，是这个带冲突约束的问题的下界。此时解出的指派含 <b>" + cur.both + "</b> 条冲突边，L 的斜率是 " + (slope > 0 ? "+1（还应加大 λ）" : slope < 0 ? "−1（应减小 λ）" : "0（正在最高点的平台上）") + "。最高点 = LP 值 = <b>" + n0(R.lp.value) + " s</b>，在 λ* = " + n0(Math.round(R.lag.lam * 100) / 100) + " 处。";
  }

  // ------------------------------------------------------------ 奇圈
  function renderTri() {
    var s = S.s, tri = Core.triangleLP(s, S.cut), svg = clear($("triSvg")), W = 380, H = 270;
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    var P = { A: [190, 46], B: [66, 214], C: [314, 214] };
    var E = [["A", "B", 0], ["B", "C", 1], ["A", "C", 2]];
    E.forEach(function (e) {
      var p = P[e[0]], q = P[e[1]], xv = tri.x[e[2]];
      var cls = "tedge" + (xv > 1 - 1e-9 ? " on" : xv > 1e-9 ? " half" : "");
      sv("line", { cls: cls, x1: p[0], y1: p[1], x2: q[0], y2: q[1], style: "stroke-width:" + (2 + 6 * xv).toFixed(1) }, svg);
    });
    E.forEach(function (e) {
      var p = P[e[0]], q = P[e[1]], xv = tri.x[e[2]], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
      var dx = e[2] === 0 ? -34 : e[2] === 1 ? 0 : 34, dy = e[2] === 1 ? 24 : -4;
      sv("text", { cls: "tlab", x: mx + dx, y: my + dy, "text-anchor": "middle", text: "收益 " + s[e[2]] }, svg);
      if (xv > 1e-9) sv("text", { cls: "tlab hot", x: mx + dx, y: my + dy + 15, "text-anchor": "middle", text: "x = " + Core.frac(xv) }, svg);
    });
    Object.keys(P).forEach(function (k) {
      var g = sv("g", { cls: "tnode", transform: "translate(" + P[k][0] + "," + P[k][1] + ")" }, svg);
      sv("circle", { r: 20 }, g); sv("text", { "text-anchor": "middle", y: 5, text: k }, g);
    });
    ["triV0", "triV1", "triV2"].forEach(function (id, k) { $(id).textContent = String(s[k]); });
    var st = clear($("triStats")), frac = tri.x.some(isFrac), gap = tri.lp - tri.ip;
    st.appendChild(stat("LP 值", n0(tri.lp), frac ? "分数解" : "整数解"));
    st.appendChild(stat("整数最优", n0(tri.ip), "只能选一组"));
    st.appendChild(stat("间隙", n0(gap), gap > 1e-9 ? "LP 高估了" : "没有间隙", gap > 1e-9));
    var say = clear($("triSay"));
    if (frac) say.appendChild(el("p", { html: "<b>三条边各取 ½。</b>每辆车的总量是 ½ + ½ = 1，约束都满足；总收益是三个收益之和的一半，" + n0(tri.lp) + "，比任何单独一组都高，但真实的组队只能选一组（" + n0(tri.ip) + "）。三个点里最多配成 ⌊3/2⌋ = 1 对，奇集割正是这句话。勾上上面的复选框看它被切掉。" }));
    else if (S.cut) say.appendChild(el("p", { html: "<b>奇集割 <span class=\"m\">x</span><sub>AB</sub> + <span class=\"m\">x</span><sub>BC</sub> + <span class=\"m\">x</span><sub>AC</sub> ≤ 1 生效。</b>½ 的点被切掉，LP 值降回整数最优 " + n0(tri.ip) + "。" }));
    else say.appendChild(el("p", { text: "LP 的最优点是整数：某一个收益不小于另外两个之和，直接选它就是最优。想看分数解，让三个收益接近，比如都设成 10。" }));
  }

  function refresh() { compute(); renderConf(); }
  function tab(k) {
    S.tab = k; $("lpConf").hidden = k !== "conf"; $("lpTri").hidden = k !== "tri";
    if (k === "tri") renderTri();
  }
  buildSeg($("lpTabs"), [{ key: "conf", label: "冲突对（指派 + 一行）" }, { key: "tri", label: "奇圈组队（一般图）" }], function () { return S.tab; }, tab);
  $("cfLam").addEventListener("input", function () { S.lam = parseFloat(this.value); renderLag(); });
  [0, 1, 2].forEach(function (k) { $("triS" + k).addEventListener("input", function () { S.s[k] = parseInt(this.value, 10); renderTri(); }); });
  $("triCut").addEventListener("change", function () { S.cut = this.checked; renderTri(); });
  refresh();
  renderTri();
  window.__fig5 = { state: S, get: function () { return R; } };
})();
