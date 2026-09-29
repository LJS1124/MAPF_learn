/* core5.js — 第 5 章页面的计算内核（无 DOM 依赖，可在 Node 中单独验证）
 * 在第 1、2 章 core.js / core2.js 的基础上增加：
 * - incremental：一次加一个任务的匈牙利算法（Dijkstra 版）。记录每次插入的扫描过程、改派链、价格变化
 * - greedyFifo：不改派的贪心（对照）
 * - tuMatrix / tuAnalyze：全单模检查，枚举全部方子式的行列式并找反例
 * - lpExtra / ipExtra / decompose：带附加约束行的指派 LP、整数最优，以及把 LP 解拆成真实派法
 * - lagrangeEdges：冲突对的拉格朗日下界 L(λ)
 * - matchTasks / hallSet / bottleneck / pareto：瓶颈指派与 Hall 证书
 * - dispatch / naiveBigM：长方形、禁行、延后罚金的通用包装，以及“1e6 写法”的对照
 * - triangleLP：奇圈（车队两两组队）的 LP 与奇集割
 * - randomMatrix / productMatrix / scanStats：复杂度实验（计数扫描与松弛次数）
 *
 * 记号与第 2 章一致：C[i][j] = 车 i 到任务 j 的代价（m 行车，n 列任务，m >= n）
 *   任务价格 u[j]（自由变量），车价格 v[i] >= 0，约化成本 r[i][j] = C[i][j] + v[i] - u[j] >= 0
 */
(function (root) {
  "use strict";
  var Core = typeof module !== "undefined" && module.exports ? require("./core2.js") : root.Core;

  function range(n) { var o = []; for (var i = 0; i < n; i++) o.push(i); return o; }
  function fill(n, x) { return new Array(n).fill(x); }
  function copyM(C) { return C.map(function (r) { return r.slice(); }); }
  function flat(C) { var o = []; C.forEach(function (r) { r.forEach(function (x) { o.push(x); }); }); return o; }

  // ------------------------------------------------------------ 增量匈牙利（Dijkstra 版）
  // 行 = 车（m），列 = 任务（n，m >= n）。任务按 order 一个个到达。
  // 每次插入：给新任务标价 -> 在约化成本上做 Dijkstra（d[i] = 要让新任务的价格再涨多少，车 i 才会变成紧边）
  //          -> 扫到第一辆空闲车为止 -> 涨价 -> 沿前驱翻转出一条改派链。
  // opts.trace = false 时不记录每步快照（复杂度实验用）。
  function incremental(C, order, opts) {
    var m = C.length, n = C[0].length, i, trace = !(opts && opts.trace === false);
    if (m < n) throw new Error("incremental: 车数必须不少于任务数");
    order = order ? order.slice() : range(n);
    var u = fill(n, 0), v = fill(m, 0), mt = fill(n, -1), mv = fill(m, -1);
    var events = [], scans = 0, relax = 0, total = 0, inserted = [];

    order.forEach(function (j0, k) {
      var uBefore = u.slice(), vBefore = v.slice(), aBefore = mt.slice(), totBefore = total;
      var u0 = Infinity;
      for (i = 0; i < m; i++) if (C[i][j0] + v[i] < u0) u0 = C[i][j0] + v[i];
      u[j0] = u0;
      var d = new Array(m), pred = fill(m, j0), done = fill(m, false);
      for (i = 0; i < m; i++) d[i] = C[i][j0] + v[i] - u0;
      var d0 = trace ? d.slice() : null, scanList = [], iStar = -1;
      for (;;) {
        var best = -1;
        for (i = 0; i < m; i++) if (!done[i] && (best < 0 || d[i] < d[best])) best = i;
        iStar = best;
        var radius = d[iStar], jp = mv[iStar];
        done[iStar] = true; scans++;
        var sc = { veh: iStar, radius: radius, task: jp, free: jp === -1, relaxed: [] };
        if (jp !== -1) {
          for (i = 0; i < m; i++) {
            if (done[i]) continue;
            relax++;
            var cand = radius + (C[i][jp] + v[i] - u[jp]);
            if (cand < d[i]) {
              if (trace) sc.relaxed.push({ veh: i, from: d[i], to: cand, via: jp });
              d[i] = cand; pred[i] = jp;
            }
          }
        }
        if (trace) { sc.d = d.slice(); sc.pred = pred.slice(); }
        scanList.push(sc);
        if (jp === -1) break;
      }
      var D = d[iStar];
      // 涨价：扫描过的车（除终点）涨 D - radius，它们当前的任务同涨；新任务涨 D
      scanList.forEach(function (s) {
        if (s.free) return;
        var inc = D - s.radius;
        v[s.veh] += inc; u[s.task] += inc;
      });
      u[j0] += D;
      // 沿前驱翻转
      var chain = [], ii = iStar;
      for (;;) {
        var jj = pred[ii], prev = mt[jj];
        chain.push({ task: jj, from: prev, to: ii });
        mt[jj] = ii; mv[ii] = jj;
        if (jj === j0) break;
        ii = prev;
      }
      chain.reverse();
      inserted.push(j0);
      total = 0; inserted.forEach(function (j) { total += C[mt[j]][j]; });
      if (trace) {
        events.push({ k: k, task: j0, u0: u0, d0: d0, scans: scanList, D: D, chain: chain,
          uBefore: uBefore, vBefore: vBefore, uAfter: u.slice(), vAfter: v.slice(),
          aBefore: aBefore, aAfter: mt.slice(), marginal: total - totBefore, total: total });
      }
    });
    return { order: order, events: events, a: mt.slice(), u: u.slice(), v: v.slice(), scans: scans, relax: relax, total: total };
  }

  // 不改派的贪心：每个任务到达时，从空闲车里挑最便宜的
  function greedyFifo(C, order) {
    var m = C.length, n = C[0].length, free = range(m), a = fill(n, -1), steps = [], total = 0;
    order = order || range(n);
    order.forEach(function (j) {
      var pick = -1;
      free.forEach(function (i) { if (pick < 0 || C[i][j] < C[pick][j]) pick = i; });
      a[j] = pick; free.splice(free.indexOf(pick), 1); total += C[pick][j];
      steps.push({ task: j, vehicle: pick, cost: C[pick][j], total: total });
    });
    return { a: a, steps: steps, total: total };
  }

  // ------------------------------------------------------------ 二部匹配、Hall 证书、瓶颈指派
  // allowed[i][j]：车 i 能不能做任务 j。让每个任务都配一辆不同的车。
  function matchTasks(allowed, m, n) {
    var mt = fill(n, -1), mv = fill(m, -1), size = 0;
    function aug(j, seen) {
      for (var i = 0; i < m; i++) {
        if (!allowed[i][j] || seen[i]) continue;
        seen[i] = true;
        if (mv[i] === -1 || aug(mv[i], seen)) { mv[i] = j; mt[j] = i; return true; }
      }
      return false;
    }
    for (var j = 0; j < n; j++) if (aug(j, fill(m, false))) size++;
    return { mt: mt, mv: mv, size: size, perfect: size === n };
  }

  // 没有完美匹配时，给出违反 Hall 条件的任务集合 S 及其邻居 N(S)，|N(S)| < |S|
  function hallSet(allowed, m, n) {
    var r = matchTasks(allowed, m, n), j0 = r.mt.indexOf(-1);
    if (j0 < 0) return null;
    var seenT = {}, seenV = {}, queue = [j0], qi = 0;
    seenT[j0] = true;
    while (qi < queue.length) {
      var j = queue[qi++];
      for (var i = 0; i < m; i++) {
        if (!allowed[i][j] || seenV[i]) continue;
        seenV[i] = true;
        var jn = r.mv[i];
        if (jn !== -1 && !seenT[jn]) { seenT[jn] = true; queue.push(jn); }
      }
    }
    return { S: Object.keys(seenT).map(Number).sort(function (a, b) { return a - b; }),
             N: Object.keys(seenV).map(Number).sort(function (a, b) { return a - b; }), failed: j0 };
  }

  function distinct(C) {
    var s = {}, out = [];
    C.forEach(function (r) { r.forEach(function (c) { if (!s[c]) { s[c] = true; out.push(c); } }); });
    return out.sort(function (a, b) { return a - b; });
  }
  function allowedLE(C, tau) { return C.map(function (r) { return r.map(function (c) { return c <= tau; }); }); }

  // 最晚到达最短：对所有代价从小到大二分阈值，看每个任务能不能配上不同的车
  function bottleneck(C) {
    var m = C.length, n = C[0].length, vals = distinct(C), lo = 0, hi = vals.length - 1;
    if (!matchTasks(allowedLE(C, vals[hi]), m, n).perfect) return null;
    while (lo < hi) {
      var mid = (lo + hi) >> 1;
      if (matchTasks(allowedLE(C, vals[mid]), m, n).perfect) hi = mid; else lo = mid + 1;
    }
    var r = matchTasks(allowedLE(C, vals[lo]), m, n);
    return { tau: vals[lo], a: r.mt };
  }

  // ------------------------------------------------------------ 通用包装：长方形、禁行、延后罚金
  // opts.allowed: m×n 布尔（缺省全允许）；opts.penalty: 数或长度 n 的数组（缺省 = 不允许延后）
  // 关键点：M 取 1 + n × 最大可行代价，任何用到禁行边的派法一定比任何合法派法更贵，事后再检查。
  function dispatch(C, opts) {
    opts = opts || {};
    var m = C.length, n = C[0].length, i, j;
    var allowed = opts.allowed || C.map(function (r) { return r.map(function () { return true; }); });
    var pen = opts.penalty == null ? null : (Array.isArray(opts.penalty) ? opts.penalty : fill(n, opts.penalty));
    var mx = 0;
    for (i = 0; i < m; i++) for (j = 0; j < n; j++) if (allowed[i][j] && C[i][j] > mx) mx = C[i][j];
    if (pen) pen.forEach(function (p) { if (p > mx) mx = p; });
    var M = 1 + n * mx, P = [];
    for (i = 0; i < m; i++) P.push(C[i].map(function (c, jj) { return allowed[i][jj] ? c : M; }));
    if (pen) for (i = 0; i < n; i++) P.push(pen.slice());
    var out = { M: M, padded: P, feasible: false, a: fill(n, -1), deferred: [], total: 0, cost: 0, penaltyTotal: 0, hall: null, u: null, v: null };
    if (P.length < n) { out.hall = hallSet(allowed, m, n); return out; }
    var h = Core.hungarian(P), bad = false;
    for (j = 0; j < n; j++) { var iv = h.a[j]; if (iv < m && !allowed[iv][j]) bad = true; }
    if (bad) { out.hall = hallSet(allowed, m, n); return out; }
    out.feasible = true; out.u = h.u; out.v = h.v;
    for (j = 0; j < n; j++) {
      var iv2 = h.a[j];
      if (iv2 >= m) { out.deferred.push(j); out.penaltyTotal += pen[j]; } else { out.a[j] = iv2; out.cost += C[iv2][j]; }
    }
    out.total = out.cost + out.penaltyTotal;
    return out;
  }

  // 常见的错误写法：禁行边写成 big，不检查结果。无解时仍会返回一个“最优解”。
  function naiveBigM(C, allowed, big) {
    var m = C.length, n = C[0].length, P = C.map(function (r, i) { return r.map(function (c, j) { return allowed[i][j] ? c : big; }); });
    var h = Core.hungarian(P), used = 0;
    h.a.forEach(function (i, j) { if (!allowed[i][j]) used++; });
    return { a: h.a, total: h.value, usedForbidden: used };
  }

  // ------------------------------------------------------------ 帕累托：最晚到达上限 τ 与最小总时间
  function pareto(C) {
    var b = bottleneck(C);
    if (!b) return null;
    var vals = distinct(C).filter(function (x) { return x >= b.tau; }), best = Infinity, front = [], all = [];
    vals.forEach(function (tau) {
      var r = dispatch(C, { allowed: allowedLE(C, tau) });
      if (!r.feasible) return;
      var mx = 0; r.a.forEach(function (i, j) { mx = Math.max(mx, C[i][j]); });
      all.push({ tau: tau, total: r.total, max: mx, a: r.a });
      if (r.total < best - 1e-9) { best = r.total; front.push({ tau: tau, total: r.total, max: mx, a: r.a }); }
    });
    return { tau: b.tau, front: front, all: all };
  }

  // ------------------------------------------------------------ 全单模：枚举方子式的行列式
  // 列按 (车 i, 任务 j) 的 i 优先次序：k = i * n + j。行：先 n 个任务，再 m 辆车，再附加行。
  function tuMatrix(kind) {
    var m = 3, n = 3, i, j, rows = [], cols = [], A = [];
    for (j = 0; j < n; j++) rows.push("T" + (j + 1));
    for (i = 0; i < m; i++) rows.push("V" + (i + 1));
    for (i = 0; i < m; i++) for (j = 0; j < n; j++) cols.push("V" + (i + 1) + "→T" + (j + 1));
    for (j = 0; j < n; j++) { var r = fill(m * n, 0); for (i = 0; i < m; i++) r[i * n + j] = 1; A.push(r); }
    for (i = 0; i < m; i++) { var r2 = fill(m * n, 0); for (j = 0; j < n; j++) r2[i * n + j] = 1; A.push(r2); }
    function vehRow(S) { var q = fill(m * n, 0); S.forEach(function (ii) { for (var jj = 0; jj < n; jj++) q[ii * n + jj] = 1; }); return q; }
    function edgeRow(E) { var q = fill(m * n, 0); E.forEach(function (e) { q[e[0] * n + e[1]] = 1; }); return q; }
    var extra = [];
    if (kind === "group12") extra = [["V1+V2 ≤ 1", vehRow([0, 1])]];
    else if (kind === "group12_23") extra = [["V1+V2 ≤ 1", vehRow([0, 1])], ["V2+V3 ≤ 1", vehRow([1, 2])]];
    else if (kind === "conflict") extra = [["V1→T1 + V2→T2 ≤ 1", edgeRow([[0, 0], [1, 1]])]];
    else if (kind === "conflictSame") extra = [["V1→T1 + V1→T2 ≤ 1", edgeRow([[0, 0], [0, 1]])]];
    else if (kind === "conflict3") extra = [["V1→T1 + V2→T2 + V3→T3 ≤ 1", edgeRow([[0, 0], [1, 1], [2, 2]])]];
    else if (kind === "triangle") {
      return { rows: ["A", "B", "C"], cols: ["AB", "BC", "AC"], A: [[1, 0, 1], [1, 1, 0], [0, 1, 1]], nTask: 0, nVeh: 0, extraRows: 0 };
    }
    extra.forEach(function (e) { rows.push(e[0]); A.push(e[1]); });
    return { rows: rows, cols: cols, A: A, nTask: n, nVeh: m, extraRows: extra.length };
  }

  function det(M) {           // Bareiss 无分数消元，小整数矩阵下精确
    var n = M.length, A = M.map(function (r) { return r.slice(); }), sign = 1, prev = 1, i, j, k;
    for (k = 0; k < n - 1; k++) {
      if (A[k][k] === 0) {
        var sw = -1;
        for (i = k + 1; i < n; i++) if (A[i][k] !== 0) { sw = i; break; }
        if (sw < 0) return 0;
        var t = A[k]; A[k] = A[sw]; A[sw] = t; sign = -sign;
      }
      for (i = k + 1; i < n; i++) for (j = k + 1; j < n; j++)
        A[i][j] = Math.round((A[i][j] * A[k][k] - A[i][k] * A[k][j]) / prev);
      prev = A[k][k];
    }
    return sign * A[n - 1][n - 1];
  }

  function combos(n, k) {
    var out = [], cur = [];
    (function rec(s) {
      if (cur.length === k) { out.push(cur.slice()); return; }
      for (var x = s; x < n; x++) { cur.push(x); rec(x + 1); cur.pop(); }
    })(0);
    return out;
  }

  // 解 B x = 1（列满秩的方阵），用分数消元的浮点版；用来展示 |det| = 2 时的分数点
  function solveOnes(B) {
    var n = B.length, M = B.map(function (r) { return r.concat([1]); }), i, j, k;
    for (k = 0; k < n; k++) {
      var p = k;
      for (i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i;
      if (Math.abs(M[p][k]) < 1e-12) return null;
      var t = M[k]; M[k] = M[p]; M[p] = t;
      for (i = 0; i < n; i++) {
        if (i === k) continue;
        var f = M[i][k] / M[k][k];
        for (j = k; j <= n; j++) M[i][j] -= f * M[k][j];
      }
    }
    return range(n).map(function (q) { return M[q][n] / M[q][q]; });
  }

  // 返回 { total, hist: {det: 个数}, viol: {rows, cols, det, sub, sol} | null }
  function tuAnalyze(A) {
    var R = A.length, Cn = A[0].length, hist = {}, total = 0, viol = null, k, ri, ci;
    for (k = 1; k <= Math.min(R, Cn); k++) {
      var rc = combos(R, k), cc = combos(Cn, k);
      for (ri = 0; ri < rc.length; ri++) {
        var sub = rc[ri].map(function (r) { return A[r]; });
        for (ci = 0; ci < cc.length; ci++) {
          var B = sub.map(function (row) { return cc[ci].map(function (c) { return row[c]; }); });
          var d = det(B);
          hist[d] = (hist[d] || 0) + 1; total++;
          if (!viol && Math.abs(d) > 1) viol = { rows: rc[ri].slice(), cols: cc[ci].slice(), det: d, sub: B, sol: solveOnes(B) };
        }
      }
    }
    return { total: total, hist: hist, viol: viol };
  }

  // ------------------------------------------------------------ 带附加约束行的指派：LP、整数最优、拆成真实派法
  // extras: [{ cells: [[i, j, coef], ...], b }]，含义 sum coef * x_ij <= b
  function extraRow(ex, m, n) {
    var r = fill(m * n, 0);
    ex.cells.forEach(function (c) { r[c[0] * n + c[1]] += c[2]; });
    return r;
  }
  // 指派 LP 的基本行：每个任务恰好一辆车（等式），每辆车至多一个任务（不等式）；变量 x[i][j] -> i*n + j
  function baseRows(m, n) {
    var Aeq = [], Aveh = [], i, j, row;
    for (j = 0; j < n; j++) { row = fill(m * n, 0); for (i = 0; i < m; i++) row[i * n + j] = 1; Aeq.push(row); }
    for (i = 0; i < m; i++) { row = fill(m * n, 0); for (j = 0; j < n; j++) row[i * n + j] = 1; Aveh.push(row); }
    return { Aeq: Aeq, Aveh: Aveh };
  }
  function reshapeX(v, m, n) {
    var x = [];
    for (var i = 0; i < m; i++) { var row = []; for (var j = 0; j < n; j++) { var t = v[i * n + j]; row.push(Math.abs(t) < 1e-12 ? 0 : t); } x.push(row); }
    return x;
  }
  function lpExtra(C, extras) {
    var m = C.length, n = C[0].length, R = baseRows(m, n);
    var Aub = R.Aveh.slice(), bub = fill(m, 1);
    (extras || []).forEach(function (ex) { Aub.push(extraRow(ex, m, n)); bub.push(ex.b); });
    var res = Core.simplex({ c: flat(C), Aeq: R.Aeq, beq: fill(n, 1), Aub: Aub, bub: bub });
    if (res.status !== "optimal") return { status: res.status };
    return { status: "optimal", value: res.value, x: reshapeX(res.x, m, n) };
  }
  function ipExtra(C, extras) {
    var m = C.length, n = C[0].length, all = Core.assignments(m, n), best = null, bv = Infinity, second = Infinity, feas = 0;
    var rows = (extras || []).map(function (ex) { return { ex: ex }; });
    all.forEach(function (a) {
      var ok = rows.every(function (r) {
        var s = 0; r.ex.cells.forEach(function (c) { if (a[c[1]] === c[0]) s += c[2]; });
        return s <= r.ex.b + 1e-9;
      });
      if (!ok) return;
      feas++;
      var t = 0; a.forEach(function (i, j) { t += C[i][j]; });
      if (t < bv - 1e-9) { second = bv; bv = t; best = a.slice(); } else if (t < second && t > bv + 1e-9) second = t;
    });
    return best ? { value: bv, a: best, second: second, feasible: feas } : { value: Infinity, a: null, feasible: 0 };
  }
  // 把 LP 解 x 拆成若干真实派法的加权和：每次在支撑上找一个匹配，减去最小权重
  function decompose(x, m, n) {
    var X = copyM(x), out = [], tol = 1e-7;
    for (var round = 0; round < m * n + 2; round++) {
      var allowed = X.map(function (r) { return r.map(function (t) { return t > tol; }); });
      var mass = 0; for (var i = 0; i < m; i++) mass = Math.max(mass, 0);
      var left = 0; for (var j = 0; j < n; j++) { var s = 0; for (i = 0; i < m; i++) s += X[i][j]; left = Math.max(left, s); }
      if (left <= tol) break;
      var r = matchTasks(allowed, m, n);
      if (!r.perfect) return null;
      var w = Infinity; r.mt.forEach(function (iv, jv) { w = Math.min(w, X[iv][jv]); });
      r.mt.forEach(function (iv, jv) { X[iv][jv] -= w; });
      out.push({ w: w, a: r.mt.slice() });
    }
    return out.sort(function (p, q) { return q.w - p.w; });
  }

  // ------------------------------------------------------------ 冲突对的拉格朗日下界
  // 冲突：x_e1 + x_e2 <= 1。给两条边各加 λ 的罚金，再解一个普通指派，减去 λ。
  function lagrangeEdges(C, e1, e2, lam) {
    var C2 = copyM(C); C2[e1[0]][e1[1]] += lam; C2[e2[0]][e2[1]] += lam;
    var h = Core.hungarian(C2), both = (h.a[e1[1]] === e1[0] ? 1 : 0) + (h.a[e2[1]] === e2[0] ? 1 : 0);
    return { L: h.value - lam, a: h.a, both: both };
  }
  // L(λ) 是凹的分段线性函数：三分搜索找最大值，返回 { lam, L }
  function lagrangeBest(C, e1, e2, hi) {
    var lo = 0; hi = hi || 200;
    for (var it = 0; it < 80; it++) {
      var a = lo + (hi - lo) / 3, b = hi - (hi - lo) / 3;
      if (lagrangeEdges(C, e1, e2, a).L < lagrangeEdges(C, e1, e2, b).L) lo = a; else hi = b;
    }
    var lam = (lo + hi) / 2;
    return { lam: lam, L: lagrangeEdges(C, e1, e2, lam).L };
  }

  // ------------------------------------------------------------ 奇圈：三辆车两两组队（一般图匹配）
  // s = [s_AB, s_BC, s_AC] 是各组队的收益；每辆车至多进一个组。cut = true 时加奇集割 x_AB + x_BC + x_AC <= 1。
  function triangleLP(s, cut) {
    var Aub = [[1, 0, 1], [1, 1, 0], [0, 1, 1]], bub = [1, 1, 1];
    if (cut) { Aub.push([1, 1, 1]); bub.push(1); }
    var r = Core.simplex({ c: [-s[0], -s[1], -s[2]], Aub: Aub, bub: bub });
    var ip = Math.max(0, s[0], s[1], s[2]);
    return { x: r.x.map(function (t) { return Math.abs(t) < 1e-12 ? 0 : t; }), lp: -r.value, ip: ip };
  }

  // ------------------------------------------------------------ 复杂度实验
  function randomMatrix(n, seed, hi) {
    var rnd = Core.mulberry32(seed), C = [], i, j;
    for (i = 0; i < n; i++) { var r = []; for (j = 0; j < n; j++) r.push(1 + Math.floor(rnd() * hi)); C.push(r); }
    return C;
  }
  function productMatrix(n) {
    var C = [], i, j;
    for (i = 0; i < n; i++) { var r = []; for (j = 0; j < n; j++) r.push((i + 1) * (j + 1)); C.push(r); }
    return C;
  }
  function scanStats(C) {
    var r = incremental(C, null, { trace: false });
    return { n: C.length, scans: r.scans, relax: r.relax, total: r.total };
  }

  // 分数的显示：把 0.5 显示成 1/2
  function frac(x, maxDen) {
    maxDen = maxDen || 12;
    if (Math.abs(x - Math.round(x)) < 1e-9) return String(Math.round(x));
    for (var d = 2; d <= maxDen; d++) {
      var nu = Math.round(x * d);
      if (Math.abs(x - nu / d) < 1e-7) return nu + "/" + d;
    }
    return String(Math.round(x * 1000) / 1000);
  }

  var add = {
    incremental: incremental, greedyFifo: greedyFifo, matchTasks: matchTasks, hallSet: hallSet,
    bottleneck: bottleneck, allowedLE: allowedLE, distinct: distinct, dispatch: dispatch, naiveBigM: naiveBigM,
    pareto: pareto, tuMatrix: tuMatrix, tuAnalyze: tuAnalyze, det: det, combos: combos, solveOnes: solveOnes,
    lpExtra: lpExtra, ipExtra: ipExtra, decompose: decompose, lagrangeEdges: lagrangeEdges, lagrangeBest: lagrangeBest,
    triangleLP: triangleLP, randomMatrix: randomMatrix, productMatrix: productMatrix, scanStats: scanStats, frac: frac
  };
  for (var key in add) Core[key] = add[key];
  if (typeof module !== "undefined" && module.exports) module.exports = Core;
  else root.Core = Core;
})(this);
