/* core9.js — 第 9 章页面的计算内核（无 DOM 依赖）
 * - evaluate：单机上一个顺序的各项指标；bestBy：枚举全部顺序，找各指标的最优顺序；rules：SPT/EDD/WSPT/FIFO/Moore
 * - listSchedule / optCmax：并行机（P、Q、R）的列表调度与枚举最优
 * - 三段式记号：parse / format；复杂度地图：BASE 表 + 沿“更一般”的方向传播（classify）
 */
(function (root) {
  "use strict";
  var Core = typeof module !== "undefined" && module.exports ? {} : (root.Core = root.Core || {});
  function range(n) { var o = []; for (var i = 0; i < n; i++) o.push(i); return o; }
  function fill(n, x) { return new Array(n).fill(x); }

  // ------------------------------------------------------------ 单机
  // J = { p, w, d, r }：加工时间、权重、交货期、释放时间。seq 是作业下标的顺序。
  function evaluate(J, seq) {
    var t = 0, C = fill(J.p.length, 0), out = { Cmax: 0, sumC: 0, sumwC: 0, Lmax: -Infinity, sumT: 0, sumU: 0, sumwU: 0, C: C, start: fill(J.p.length, 0) };
    seq.forEach(function (j) {
      t = Math.max(t, J.r ? J.r[j] : 0); out.start[j] = t; t += J.p[j]; C[j] = t;
      out.sumC += t; out.sumwC += J.w[j] * t;
      var L = t - J.d[j]; out.Lmax = Math.max(out.Lmax, L); out.sumT += Math.max(0, L);
      if (L > 0) { out.sumU += 1; out.sumwU += J.w[j]; }
    });
    out.Cmax = t;
    return out;
  }
  function permutations(n) {
    var out = [], a = range(n);
    (function go(k) { if (k === n) { out.push(a.slice()); return; } for (var i = k; i < n; i++) { var t = a[k]; a[k] = a[i]; a[i] = t; go(k + 1); t = a[k]; a[k] = a[i]; a[i] = t; } })(0);
    return out;
  }
  var KEYS = ["Cmax", "sumC", "sumwC", "Lmax", "sumT", "sumU", "sumwU"];
  // 各指标的最小值及取得最小值的全部顺序（枚举，n <= 8）
  function bestBy(J) {
    var best = {}, n = J.p.length;
    KEYS.forEach(function (k) { best[k] = { value: Infinity, seqs: [] }; });
    permutations(n).forEach(function (s) {
      var e = evaluate(J, s);
      KEYS.forEach(function (k) {
        if (e[k] < best[k].value - 1e-9) best[k] = { value: e[k], seqs: [s] };
        else if (Math.abs(e[k] - best[k].value) < 1e-9) best[k].seqs.push(s);
      });
    });
    return best;
  }
  var RULES = {
    FIFO: function (J) { return range(J.p.length); },
    SPT: function (J) { return range(J.p.length).sort(function (a, b) { return J.p[a] - J.p[b] || a - b; }); },
    EDD: function (J) { return range(J.p.length).sort(function (a, b) { return J.d[a] - J.d[b] || a - b; }); },
    WSPT: function (J) { return range(J.p.length).sort(function (a, b) { return J.p[a] * J.w[b] - J.p[b] * J.w[a] || a - b; }); }
  };
  // Moore–Hodgson：最少的延误作业数（1||ΣUj）。返回顺序：按期的作业按 EDD 在前，被舍弃的在最后。
  function moore(J) {
    var order = RULES.EDD(J), on = [], late = [], t = 0;
    order.forEach(function (j) {
      on.push(j); t += J.p[j];
      if (t > J.d[j]) {
        var big = on.reduce(function (b, x) { return J.p[x] > J.p[b] ? x : b; }, on[0]);
        on.splice(on.indexOf(big), 1); t -= J.p[big]; late.push(big);
      }
    });
    return on.concat(late);
  }
  // ΣC 与 Lmax 的帕累托前沿（枚举）
  function pareto(J) {
    var pts = {};
    permutations(J.p.length).forEach(function (s) { var e = evaluate(J, s), k = e.sumC + "," + e.Lmax; if (!pts[k]) pts[k] = { sumC: e.sumC, Lmax: e.Lmax, seq: s }; });
    var list = Object.keys(pts).map(function (k) { return pts[k]; }).sort(function (a, b) { return a.Lmax - b.Lmax || a.sumC - b.sumC; }), front = [], bestC = Infinity;
    list.forEach(function (q) { if (q.sumC < bestC) { front.push(q); bestC = q.sumC; } });
    return front;
  }

  // ------------------------------------------------------------ 并行机：P（相同）、Q（速度不同）、R（每台机器加工时间各不相同）
  // P[i][j]：作业 j 在机器 i 上的加工时间。listSchedule：按 order 依次把作业放到“完工最早”的机器（并列取编号小的）。
  function listSchedule(P, order) {
    var m = P.length, load = fill(m, 0), assign = [], slots = range(m).map(function () { return []; });
    order.forEach(function (j) {
      var bi = 0, bv = Infinity;
      for (var i = 0; i < m; i++) if (load[i] + P[i][j] < bv - 1e-9) { bv = load[i] + P[i][j]; bi = i; }
      slots[bi].push({ job: j, start: load[bi], end: bv }); load[bi] = bv; assign[j] = bi;
    });
    return { Cmax: Math.max.apply(null, load), load: load, assign: assign, slots: slots };
  }
  // 最优 Cmax：枚举“每个作业去哪台机器”（同一台机器上的顺序不影响 Cmax）
  function optCmax(P) {
    var m = P.length, n = P[0].length, best = { Cmax: Infinity, assign: null }, load = fill(m, 0), cur = fill(n, -1);
    (function go(j) {
      if (j === n) { var c = Math.max.apply(null, load); if (c < best.Cmax) best = { Cmax: c, assign: cur.slice() }; return; }
      for (var i = 0; i < m; i++) { load[i] += P[i][j]; cur[j] = i; if (Math.max.apply(null, load) < best.Cmax) go(j + 1); load[i] -= P[i][j]; }
    })(0);
    return best;
  }

  // ------------------------------------------------------------ 三段式记号
  var ALPHAS = ["1", "P2", "P", "Q", "R", "F2", "F", "J2", "J", "O2", "O"];
  var BETAS = ["r", "prec", "prmp", "d", "s"];        // r_j、先后约束、可中断、交货期约束、准备时间
  var GAMMAS = ["Cmax", "sumC", "sumwC", "Lmax", "sumT", "sumwT", "sumU", "sumwU"];
  var G_TEXT = { Cmax: "C_max", sumC: "ΣC_j", sumwC: "Σw_jC_j", Lmax: "L_max", sumT: "ΣT_j", sumwT: "Σw_jT_j", sumU: "ΣU_j", sumwU: "Σw_jU_j" };
  var B_TEXT = { r: "r_j", prec: "prec", prmp: "prmp", d: "d_j", s: "s_jk" };
  function format(alpha, beta, gamma) { return alpha + " | " + beta.map(function (b) { return B_TEXT[b]; }).join(", ") + " | " + G_TEXT[gamma]; }
  function parse(str) {
    var parts = str.split("|").map(function (s) { return s.trim(); });
    if (parts.length !== 3) return null;
    var a = parts[0].replace(/\s+/g, "");
    if (/^[PQRFJO]m$/.test(a)) a = a[0];
    if (ALPHAS.indexOf(a) < 0) return null;
    var beta = [];
    parts[1].split(/[,\s]+/).filter(Boolean).forEach(function (t) {
      t = t.replace(/[_{}]/g, "").toLowerCase();
      var m = { rj: "r", r: "r", prec: "prec", prmp: "prmp", dj: "d", d: "d", sjk: "s", s: "s" }[t];
      if (m && beta.indexOf(m) < 0) beta.push(m);
    });
    var g = parts[2].replace(/[_{}\s]/g, "").replace(/∑/g, "Σ").toLowerCase(), gm = { cmax: "Cmax", "σcj": "sumC", "σwjcj": "sumwC", lmax: "Lmax", "σtj": "sumT", "σwjtj": "sumwT", "σuj": "sumU", "σwjuj": "sumwU", sumc: "sumC" }[g];
    if (!gm) return null;
    return { alpha: a, beta: beta.sort(BETAS_ORDER), gamma: gm };
  }
  function BETAS_ORDER(a, b) { return BETAS.indexOf(a) - BETAS.indexOf(b); }

  // ------------------------------------------------------------ 复杂度地图
  // 已知结果（经典结果，Brucker、Pinedo 的教材有完整表）。状态：P 多项式、NP 是 NP 难（含强 NP 难）、W 弱 NP 难（伪多项式算法）
  var BASE = [
    ["1", "", "Cmax", "P", "任意顺序，O(n)"],
    ["1", "", "sumC", "P", "SPT（最短加工时间优先）"],
    ["1", "", "sumwC", "P", "WSPT（Smith 规则）"],
    ["1", "", "Lmax", "P", "EDD（最早交货期优先，Jackson）"],
    ["1", "", "sumU", "P", "Moore–Hodgson，O(n log n)"],
    ["1", "", "sumwU", "W", "背包问题的推广，伪多项式动态规划"],
    ["1", "", "sumT", "W", "Du–Leung 1990；Lawler 的伪多项式动态规划"],
    ["1", "", "sumwT", "NP", "强 NP 难（Lawler 1977；Lenstra 等 1977）"],
    ["1", "r", "Cmax", "P", "按释放时间排序"],
    ["1", "r", "Lmax", "NP", "强 NP 难"],
    ["1", "r", "sumC", "NP", "强 NP 难"],
    ["1", "prec", "Lmax", "P", "Lawler 的从后往前排"],
    ["1", "prec", "sumwC", "NP", "强 NP 难"],
    ["1", "prmp,r", "sumC", "P", "SRPT（剩余加工时间最短优先）"],
    ["1", "prmp,r", "Lmax", "P", "可中断的 EDD"],
    ["P2", "", "Cmax", "W", "由划分问题推出；伪多项式动态规划"],
    ["P", "", "Cmax", "NP", "强 NP 难（3-划分）；LPT 有 4/3 的近似比"],
    ["P", "", "sumC", "P", "SPT 轮流派"],
    ["P", "", "sumwC", "NP", "NP 难"],
    ["P", "prmp", "Cmax", "P", "McNaughton 的绕圈法"],
    ["P", "prec", "Cmax", "NP", "强 NP 难"],
    ["Q", "", "sumC", "P", "Horn 1973，化成指派问题"],
    ["R", "", "sumC", "P", "化成指派问题（第 5 章）"],
    ["R", "", "Cmax", "NP", "强 NP 难；Lenstra–Shmoys–Tardos 的 2 倍近似"],
    ["F2", "", "Cmax", "P", "Johnson 规则（第 11 章）"],
    ["F2", "", "sumC", "NP", "强 NP 难"],
    ["F", "", "Cmax", "NP", "m ≥ 3 强 NP 难（Garey 等 1976）"],
    ["J2", "", "Cmax", "P", "Jackson 规则"],
    ["J", "", "Cmax", "NP", "m ≥ 3 强 NP 难"],
    ["O2", "", "Cmax", "P", "Gonzalez–Sahni"],
    ["O", "", "Cmax", "NP", "m ≥ 3 NP 难"]
  ];
  // “A 是 B 的特例”的边（沿边向“更一般”的方向，难度只增不减）
  var A_EDGES = [["1", "P2"], ["P2", "P"], ["P", "Q"], ["Q", "R"], ["1", "F2"], ["F2", "F"], ["F2", "J2"], ["J2", "J"], ["F", "J"], ["1", "O2"], ["O2", "O"]];
  var G_EDGES = [["Cmax", "Lmax"], ["sumC", "sumwC"], ["sumC", "sumT"], ["sumT", "sumwT"], ["sumwC", "sumwT"], ["sumU", "sumwU"], ["sumU", "sumT"] /* 见下 */];
  G_EDGES.pop();                       // ΣU 与 ΣT 之间没有这样的关系
  function closure(edges) {
    var reach = {};
    function add(a, b) { (reach[a] = reach[a] || {})[b] = true; }
    edges.forEach(function (e) { add(e[0], e[1]); });
    var keys = {}; edges.forEach(function (e) { keys[e[0]] = keys[e[1]] = true; });
    Object.keys(keys).forEach(function (k) { Object.keys(keys).forEach(function (i) { Object.keys(keys).forEach(function (j) { if (reach[i] && reach[i][k] && reach[k] && reach[k][j]) add(i, j); }); }); });
    return function (a, b) { return a === b || !!(reach[a] && reach[a][b]); };
  }
  var aLE = closure(A_EDGES), gLE = closure(G_EDGES);
  // 约束集合的包含：β 中出现 r、prec、d、s 越多越一般；prmp 改变问题的性质，只在两边都一样时才比较
  function bLE(b1, b2) {
    if ((b1.indexOf("prmp") >= 0) !== (b2.indexOf("prmp") >= 0)) return false;
    return b1.every(function (x) { return b2.indexOf(x) >= 0; });
  }
  function leq(p1, p2) { return aLE(p1.alpha, p2.alpha) && bLE(p1.beta, p2.beta) && gLE(p1.gamma, p2.gamma); }   // p1 是 p2 的特例
  function baseProblems() {
    return BASE.map(function (r) { return { alpha: r[0], beta: r[1] ? r[1].split(",").sort(BETAS_ORDER) : [], gamma: r[2], status: r[3], note: r[4] }; });
  }
  // 分类：先看表里有没有；再从表里找“比它更特例且 NP 难”的（它至少一样难）或“比它更一般且多项式”的（它至多一样容易）
  function classify(prob) {
    var base = baseProblems(), hit = null;
    base.forEach(function (b) { if (b.alpha === prob.alpha && b.gamma === prob.gamma && b.beta.join() === prob.beta.join()) hit = b; });
    if (hit) return { status: hit.status, why: "表中的已知结果：" + hit.note, source: hit };
    var hard = base.filter(function (b) { return (b.status === "NP" || b.status === "W") && leq(b, prob); });
    if (hard.length) { var strong = hard.filter(function (b) { return b.status === "NP"; }); var src = (strong[0] || hard[0]); return { status: strong.length ? "NP" : "W", why: "它至少和 " + format(src.alpha, src.beta, src.gamma) + " 一样难（那是它的特例）", source: src }; }
    var easy = base.filter(function (b) { return b.status === "P" && leq(prob, b); });
    if (easy.length) return { status: "P", why: "它是 " + format(easy[0].alpha, easy[0].beta, easy[0].gamma) + " 的特例，那个问题已有多项式算法", source: easy[0] };
    return { status: "?", why: "表里没有足够的信息推出结论", source: null };
  }

  var add = { evaluate: evaluate, permutations: permutations, bestBy: bestBy, RULES: RULES, moore: moore, pareto: pareto, listSchedule: listSchedule, optCmax: optCmax,
    parse: parse, format: format, ALPHAS: ALPHAS, BETAS: BETAS, GAMMAS: GAMMAS, G_TEXT: G_TEXT, B_TEXT: B_TEXT, BASE: BASE, A_EDGES: A_EDGES, G_EDGES: G_EDGES, baseProblems: baseProblems, classify: classify, leq: leq, KEYS: KEYS };
  for (var key in add) Core[key] = add[key];
  if (typeof module !== "undefined" && module.exports) module.exports = Core;
})(this);
