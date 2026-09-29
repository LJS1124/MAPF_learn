/* core2.js — 第 2 章页面的计算内核（无 DOM 依赖，可在 Node 中单独验证）
 * 在第 1 章 core.js 的基础上增加：
 * - hungarian：O(n³) 匈牙利算法（势函数版），同时给出 LP 对偶解 (u, v)
 * - trace：涨价拍卖版的逐步轨迹（页面里的单步回放）
 * - dualRanges / maxMarginDual：最优对偶面上每个价格的取值范围、最稳健的一组价格（用 core.js 的单纯形求解）
 * - regretMatrix / marginals：约化成本对应的"遗憾值"、去车/加车/去任务/加任务的精确边际值
 * - certificate：不依赖任何求解器的最优性证书检查
 * - weightedOpt：min-max 的拉格朗日权重 λ 下的加权指派
 *
 * 记号：C[i][j] = 车 i 到任务 j 的代价（m 行车，n 列任务，m >= n）
 *      任务价格 u[j]（自由变量），车价格 v[i] >= 0
 *      对偶可行：约化成本 r[i][j] = C[i][j] + v[i] - u[j] >= 0
 *      对偶目标：sum(u) - sum(v)
 */
(function (root) {
  "use strict";
  var Core = typeof module !== "undefined" && module.exports ? require("./core.js") : root.Core;

  function zeros(m, n) { var o = []; for (var i = 0; i < m; i++) o.push(new Array(n).fill(0)); return o; }
  function sum(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s; }

  // ------------------------------------------------------------ 匈牙利算法（势函数版）
  // 行 = 任务（n），列 = 车（m >= n）。返回 a[j] = 任务 j 的车，以及 LP 对偶 (u, v)：
  //   u[j] = 任务价格；v[i] = 车价格（>= 0，空闲车恰为 0）。
  function hungarian(C) {
    var m = C.length, n = C[0].length, INF = 1e18, i, j;
    if (m < n) throw new Error("hungarian: 车数必须不少于任务数");
    var U = new Array(n + 1).fill(0), Vv = new Array(m + 1).fill(0), p = new Array(m + 1).fill(0), way = new Array(m + 1).fill(0);
    for (i = 1; i <= n; i++) {
      p[0] = i;
      var j0 = 0, minv = new Array(m + 1).fill(INF), used = new Array(m + 1).fill(false);
      do {
        used[j0] = true;
        var i0 = p[j0], delta = INF, j1 = 0;
        for (j = 1; j <= m; j++) if (!used[j]) {
          var cur = C[j - 1][i0 - 1] - U[i0] - Vv[j];
          if (cur < minv[j]) { minv[j] = cur; way[j] = j0; }
          if (minv[j] < delta) { delta = minv[j]; j1 = j; }
        }
        for (j = 0; j <= m; j++) {
          if (used[j]) { U[p[j]] += delta; Vv[j] -= delta; } else minv[j] -= delta;
        }
        j0 = j1;
      } while (p[j0] !== 0);
      do { var jb = way[j0]; p[j0] = p[jb]; j0 = jb; } while (j0);
    }
    var a = new Array(n), value = 0;
    for (j = 1; j <= m; j++) if (p[j]) a[p[j] - 1] = j - 1;
    for (j = 0; j < n; j++) value += C[a[j]][j];
    var u = [], v = [];
    for (j = 1; j <= n; j++) u.push(U[j]);
    for (i = 1; i <= m; i++) v.push(Vv[i] === 0 ? 0 : -Vv[i]);
    return { a: a, value: value, u: u, v: v };
  }

  function optValue(C) { return C.length && C[0].length ? hungarian(C).value : 0; }

  // ------------------------------------------------------------ 涨价拍卖版轨迹（页面的单步回放）
  // 初始：任务价格 = 列最小值，车价格 = 0；每步要么沿"紧边"增广，要么给"被争抢的一组车"涨价。
  function trace(C) {
    var m = C.length, n = C[0].length, i, j;
    var u = [], v = new Array(m).fill(0), mt = new Array(n).fill(-1), mv = new Array(m).fill(-1), steps = [];
    for (j = 0; j < n; j++) { var mn = Infinity; for (i = 0; i < m; i++) mn = Math.min(mn, C[i][j]); u.push(mn); }
    function tight(ii, jj) { return Math.abs(C[ii][jj] + v[ii] - u[jj]) < 1e-9; }
    function snap(kind, extra) {
      var d = { kind: kind, u: u.slice(), v: v.slice(), bound: sum(u) - sum(v), match: mt.slice() };
      for (var k in extra) d[k] = extra[k];
      steps.push(d);
    }
    snap("init", {});
    while (mt.indexOf(-1) >= 0) {
      var j0 = mt.indexOf(-1);
      for (;;) {
        var seenT = {}, seenV = {}, queue = [j0], found = -1, qi = 0;
        seenT[j0] = true;
        while (qi < queue.length && found < 0) {
          var jj = queue[qi++];
          for (i = 0; i < m; i++) {
            if (seenV[i] !== undefined || !tight(i, jj)) continue;
            seenV[i] = jj;
            if (mv[i] === -1) { found = i; break; }
            var jn = mv[i];
            if (!seenT[jn]) { seenT[jn] = true; queue.push(jn); }
          }
        }
        if (found >= 0) {
          var path = [], ii = found;
          for (;;) {
            var jc = seenV[ii];
            path.push([ii, jc]);
            var prev = mt[jc];
            mt[jc] = ii; mv[ii] = jc;
            if (jc === j0) break;
            ii = prev;
          }
          path.reverse();
          snap("augment", { start: j0, path: path });
          break;
        }
        var Tc = Object.keys(seenT).map(Number).sort(function (x, y) { return x - y; });
        var Sr = Object.keys(seenV).map(Number).sort(function (x, y) { return x - y; });
        var delta = Infinity;
        Tc.forEach(function (jt) { for (var ir = 0; ir < m; ir++) if (seenV[ir] === undefined) delta = Math.min(delta, C[ir][jt] + v[ir] - u[jt]); });
        Tc.forEach(function (jt) { u[jt] += delta; });
        Sr.forEach(function (ir) { v[ir] += delta; });
        snap("raise", { start: j0, tasks: Tc, vehicles: Sr, delta: delta });
      }
    }
    return { a: mt.slice(), steps: steps };
  }

  // ------------------------------------------------------------ 对偶最优面上的 LP
  function dualBase(C, opt) {
    var m = C.length, n = C[0].length, nz = n + m, Aub = [], bub = [], i, j;
    for (i = 0; i < m; i++) for (j = 0; j < n; j++) {
      var row = new Array(nz).fill(0); row[j] = 1; row[n + i] = -1;
      Aub.push(row); bub.push(C[i][j]);
    }
    var eq = new Array(nz).fill(0);
    for (j = 0; j < n; j++) eq[j] = 1;
    for (i = 0; i < m; i++) eq[n + i] = -1;
    return { n: n, m: m, nz: nz, Aub: Aub, bub: bub, Aeq: [eq], beq: [opt] };
  }

  // 最优对偶面：每个价格的 [最小, 最大]。u 在最优面上必 >= 0（u_j = c + v），所以放心用 x >= 0 的单纯形。
  function dualRanges(C, opt) {
    var B = dualBase(C, opt), out = { u: [], v: [] }, k;
    function solve(k, sign) {
      var c = new Array(B.nz).fill(0); c[k] = sign;
      var r = Core.simplex({ c: c, Aeq: B.Aeq, beq: B.beq, Aub: B.Aub, bub: B.bub });
      if (r.status === "unbounded") return sign > 0 ? -Infinity : Infinity;
      return r.value * sign;
    }
    for (k = 0; k < B.n; k++) out.u.push([solve(k, 1), solve(k, -1)]);
    for (k = 0; k < B.m; k++) out.v.push([solve(B.n + k, 1), solve(B.n + k, -1)]);
    return out;
  }

  // 让"非最优派法的边"的最小约化成本尽量大的那一组最优价格
  function maxMarginDual(C, a, opt) {
    var B = dualBase(C, opt), m = B.m, n = B.n, nz = n + m + 1, i, j;
    var Aub = [], bub = [], Aeq = [], beq = [];
    for (i = 0; i < m; i++) for (j = 0; j < n; j++) {
      var row = new Array(nz).fill(0); row[j] = 1; row[n + i] = -1;
      if (a[j] === i) { Aeq.push(row.slice()); beq.push(C[i][j]); }
      else { row[nz - 1] = 1; Aub.push(row); bub.push(C[i][j]); }
    }
    var eq = new Array(nz).fill(0);
    for (j = 0; j < n; j++) eq[j] = 1;
    for (i = 0; i < m; i++) eq[n + i] = -1;
    Aeq.push(eq); beq.push(opt);
    var c = new Array(nz).fill(0); c[nz - 1] = -1;
    var r = Core.simplex({ c: c, Aeq: Aeq, beq: beq, Aub: Aub, bub: bub });
    if (r.status !== "optimal") return null;
    return { u: r.x.slice(0, n), v: r.x.slice(n, n + m), margin: r.x[nz - 1] };
  }

  // ------------------------------------------------------------ 约化成本、遗憾值、边际值
  function reduced(C, u, v) {
    return C.map(function (row, i) { return row.map(function (c, j) { return c + v[i] - u[j]; }); });
  }

  function minor(C, dropRow, dropCol) {
    var out = [];
    for (var i = 0; i < C.length; i++) {
      if (i === dropRow) continue;
      var r = [];
      for (var j = 0; j < C[i].length; j++) if (j !== dropCol) r.push(C[i][j]);
      out.push(r);
    }
    return out;
  }

  // regret[i][j] = 强制 x_ij = 1 的最优总时间 - 最优总时间（精确）
  function regretMatrix(C, opt) {
    var m = C.length, n = C[0].length, R = zeros(m, n);
    for (var i = 0; i < m; i++) for (var j = 0; j < n; j++) {
      var sub = minor(C, i, j);
      R[i][j] = C[i][j] + (sub.length && sub[0].length ? optValue(sub) : 0) - opt;
    }
    return R;
  }

  // 精确的整数边际（同时给出新派法，用于在地图上标出变化）
  function marginals(C) {
    var m = C.length, n = C[0].length, base = hungarian(C), opt = base.value, i, j, out = { opt: opt, base: base.a, vehicle: [], task: [] };
    function remapRows(a, drop) { return a.map(function (i2) { return i2 >= drop ? i2 + 1 : i2; }); }
    for (i = 0; i < m; i++) {
      var rem = null, add;
      if (m - 1 >= n) { var sub = minor(C, i, -1), hr = hungarian(sub); rem = { delta: hr.value - opt, a: remapRows(hr.a, i) }; }
      var dup = C.concat([C[i].slice()]), ha = hungarian(dup);
      add = { delta: ha.value - opt, a: ha.a.map(function (i2) { return i2 === m ? i : i2; }) };
      out.vehicle.push({ remove: rem, add: add });
    }
    for (j = 0; j < n; j++) {
      var drop = null, addT = null;
      if (n - 1 >= 1) { var hd = hungarian(minor(C, -1, j)); drop = { delta: hd.value - opt, a: hd.a.map(function (v2) { return v2; }), col: j }; }
      if (m >= n + 1) {
        var C2 = C.map(function (row) { return row.concat([row[j]]); }), hn = hungarian(C2);
        addT = { delta: hn.value - opt, a: hn.a };
      }
      out.task.push({ drop: drop, add: addT });
    }
    return out;
  }

  // 某个格子的代价降低 d 之后的最优值与派法
  function withDelta(C, i, j, d) {
    var C2 = C.map(function (r) { return r.slice(); });
    C2[i][j] -= d;
    return hungarian(C2);
  }

  // ------------------------------------------------------------ 证书检查（不依赖求解器）
  function certificate(C, a, u, v, tol) {
    tol = tol || 1e-7;
    var m = C.length, n = C[0].length, issues = [], i, j;
    var okIdx = a.length === n && a.every(function (x) { return Number.isInteger(x) && x >= 0 && x < m; });
    if (!okIdx) return { issues: ["PRIMAL_INFEASIBLE"], primal: NaN, dual: NaN };
    var used = {}; a.forEach(function (x) { used[x] = true; });
    if (Object.keys(used).length !== n) issues.push("PRIMAL_INFEASIBLE");
    if (v.some(function (x) { return x < -tol; })) issues.push("NEGATIVE_VEHICLE_PRICE");
    var viol = 0;
    for (i = 0; i < m; i++) for (j = 0; j < n; j++) if (C[i][j] + v[i] - u[j] < -tol) viol++;
    if (viol) issues.push("DUAL_INFEASIBLE");
    if (a.some(function (x, jj) { return Math.abs(C[x][jj] + v[x] - u[jj]) > tol; })) issues.push("NOT_TIGHT");
    for (i = 0; i < m; i++) if (!used[i] && v[i] > tol) { issues.push("IDLE_VEHICLE_PRICED"); break; }
    var primal = 0; for (j = 0; j < n; j++) primal += C[a[j]][j];
    var dual = sum(u) - sum(v);
    if (Math.abs(primal - dual) > 1e-6) issues.push("DUALITY_GAP");
    return { issues: issues, primal: primal, dual: dual, violations: viol };
  }

  // ------------------------------------------------------------ min-max 的拉格朗日权重
  // L(λ) = min over 派法 of sum_i λ_i * (车 i 的到达时间) ——对权重后的矩阵做指派
  function weightedOpt(C, lam) {
    var W = C.map(function (row, i) { return row.map(function (c) { return c * lam[i]; }); });
    var h = hungarian(W);
    var times = C.map(function () { return 0; });
    h.a.forEach(function (i, j) { times[i] += C[i][j]; });
    return { value: h.value, a: h.a, times: times, max: Math.max.apply(null, times) };
  }


  // ------------------------------------------------------------ 给定一张价格表：紧边上的最大匹配与"被争抢的一组"
  // 用于图 2-1 的提示。先让所有标了正价的车都有活干（从车一侧增广），再从任务一侧增广；
  // 返回 { match, perfect, idleFail, failed, Tc, Sr, delta }。
  function hall(C, u, v) {
    var m = C.length, n = C[0].length, mt = new Array(n).fill(-1), mv = new Array(m).fill(-1), i, j0, out = null, idleFail = -1;
    function tight(ii, jj) { return Math.abs(C[ii][jj] + v[ii] - u[jj]) < 1e-9; }
    // 阶段一：正价车 -> 交替路（车 -> 紧边任务 -> 该任务当前的车 -> ...）
    for (i = 0; i < m; i++) {
      if (!(v[i] > 1e-9) || mv[i] !== -1) continue;
      var seenV = {}, from = {}, queue = [i], qi = 0, endT = -1;
      seenV[i] = true;
      while (qi < queue.length && endT < 0) {
        var ii = queue[qi++];
        for (var jj = 0; jj < n; jj++) {
          if (from[jj] !== undefined || !tight(ii, jj)) continue;
          from[jj] = ii;
          if (mt[jj] === -1) { endT = jj; break; }
          var iv = mt[jj];
          if (!seenV[iv]) { seenV[iv] = true; queue.push(iv); }
        }
      }
      if (endT < 0) { if (idleFail < 0) idleFail = i; continue; }
      var jc = endT;
      for (;;) { var iv2 = from[jc], prevT = mv[iv2]; mt[jc] = iv2; mv[iv2] = jc; if (iv2 === i) break; jc = prevT; }
    }
    // 阶段二：任务 -> 交替路
    for (j0 = 0; j0 < n; j0++) {
      if (mt[j0] !== -1) continue;
      var seenT = {}, seenV2 = {}, q2 = [j0], qj = 0, found = -1;
      seenT[j0] = true;
      while (qj < q2.length && found < 0) {
        var j1 = q2[qj++];
        for (i = 0; i < m; i++) {
          if (seenV2[i] !== undefined || !tight(i, j1)) continue;
          seenV2[i] = j1;
          if (mv[i] === -1) { found = i; break; }
          var jn = mv[i];
          if (!seenT[jn]) { seenT[jn] = true; q2.push(jn); }
        }
      }
      if (found >= 0) {
        var i3 = found;
        for (;;) { var j3 = seenV2[i3], prev = mt[j3]; mt[j3] = i3; mv[i3] = j3; if (j3 === j0) break; i3 = prev; }
      } else if (!out) {
        var Tc = Object.keys(seenT).map(Number).sort(function (a, b) { return a - b; });
        var Sr = Object.keys(seenV2).map(Number).sort(function (a, b) { return a - b; });
        var delta = Infinity;
        Tc.forEach(function (jt) { for (var ir = 0; ir < m; ir++) if (seenV2[ir] === undefined) delta = Math.min(delta, C[ir][jt] + v[ir] - u[jt]); });
        out = { failed: j0, Tc: Tc, Sr: Sr, delta: delta };
      }
    }
    return { match: mt, perfect: !out, idleFail: idleFail, failed: out ? out.failed : -1, Tc: out ? out.Tc : [], Sr: out ? out.Sr : [], delta: out ? out.delta : 0 };
  }

  Core.hall = hall; Core.hungarian = hungarian; Core.optValue = optValue; Core.trace = trace;
  Core.dualRanges = dualRanges; Core.maxMarginDual = maxMarginDual; Core.reduced = reduced;
  Core.regretMatrix = regretMatrix; Core.marginals = marginals; Core.withDelta = withDelta;
  Core.certificate = certificate; Core.weightedOpt = weightedOpt;
  if (typeof module !== "undefined" && module.exports) module.exports = Core;
  else root.Core = Core;
})(this);
