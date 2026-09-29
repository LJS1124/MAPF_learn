/* core.js — 第 1 章页面的计算内核（无 DOM 依赖，可在 Node 中单独验证）
 * - 仓库几何与行驶时间（与 Lab 的 warehouse.py 逐项一致）
 * - 枚举全部派法：贪心、最优（总时间 / 最晚到达）
 * - 稠密两阶段单纯形（Bland 规则）：求 LP 松弛
 * - Birkhoff 分解：把分数派法拆成若干真实派法的加权平均
 */
(function (root) {
  "use strict";

  var LIFT_X = -1;

  // ------------------------------------------------------------ 行驶时间
  function sameFloor(x1, y1, x2, y2, p) {
    if (x1 === x2) {
      if (y1 === y2) return [];
      if (y1 === 0) return [["换向", p.turn_s], ["进货道 " + y2 + " 格", y2 * p.lane_s]];
      if (y2 === 0) return [["出货道 " + y1 + " 格", y1 * p.lane_s]];
      var d = Math.abs(y1 - y2);
      return [["货道内 " + d + " 格", d * p.lane_s]];
    }
    var segs = [];
    if (y1 > 0) { segs.push(["出货道 " + y1 + " 格", y1 * p.lane_s]); segs.push(["换向", p.turn_s]); }
    var dx = Math.abs(x1 - x2);
    segs.push(["主巷道 " + dx + " 格", dx * p.aisle_s]);
    if (y2 > 0) { segs.push(["换向", p.turn_s]); segs.push(["进货道 " + y2 + " 格", y2 * p.lane_s]); }
    return segs;
  }

  function breakdown(v, t, p) {
    if (v.floor === t.floor) return sameFloor(v.x, v.y, t.x, t.y, p);
    var segs = sameFloor(v.x, v.y, LIFT_X, 0, p);
    segs.push(["提升机 F" + v.floor + "→F" + t.floor, Math.abs(v.floor - t.floor) * p.lift_s]);
    return segs.concat(sameFloor(LIFT_X, 0, t.x, t.y, p));
  }

  function sum(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s; }

  function travelTime(v, t, p) { return sum(breakdown(v, t, p).map(function (s) { return s[1]; })); }

  function costMatrix(sc) {
    return sc.vehicles.map(function (v) { return sc.tasks.map(function (t) { return travelTime(v, t, sc.params); }); });
  }
  function liftMatrix(sc) {
    return sc.vehicles.map(function (v) { return sc.tasks.map(function (t) { return v.floor !== t.floor ? 1 : 0; }); });
  }

  // ------------------------------------------------------------ 枚举
  // 所有单射 a：任务 j -> 车 a[j]，按字典序生成（与 Python itertools.permutations 相同顺序）
  var permCache = {};
  function assignments(nV, nT) {
    var key = nV + "x" + nT;
    if (permCache[key]) return permCache[key];
    var out = [], cur = [], used = new Array(nV).fill(false);
    (function rec(j) {
      if (j === nT) { out.push(cur.slice()); return; }
      for (var i = 0; i < nV; i++) {
        if (used[i]) continue;
        used[i] = true; cur.push(i);
        rec(j + 1);
        cur.pop(); used[i] = false;
      }
    })(0);
    permCache[key] = out;
    return out;
  }

  function evaluate(a, C, L) {
    var total = 0, mx = -Infinity, lift = 0;
    for (var j = 0; j < a.length; j++) {
      var c = C[a[j]][j];
      total += c; if (c > mx) mx = c;
      if (L) lift += L[a[j]][j];
    }
    return { total: total, max: mx, lift: lift };
  }

  function optSum(C, L) {
    var all = assignments(C.length, C[0].length), best = null, bv = Infinity;
    for (var k = 0; k < all.length; k++) {
      var e = evaluate(all[k], C, L);
      if (e.total < bv) { bv = e.total; best = all[k]; }
    }
    return { a: best.slice(), count: all.length };
  }

  // 字典序：先最晚到达最小，并列时总时间最小
  function optMax(C, L) {
    var all = assignments(C.length, C[0].length), best = null, bm = Infinity, bt = Infinity;
    for (var k = 0; k < all.length; k++) {
      var e = evaluate(all[k], C, L);
      if (e.max < bm || (e.max === bm && e.total < bt)) { bm = e.max; bt = e.total; best = all[k]; }
    }
    return { a: best.slice(), count: all.length };
  }

  function fifoGreedy(C) {
    var nV = C.length, nT = C[0].length, free = [], a = [], steps = [];
    for (var i = 0; i < nV; i++) free.push(i);
    for (var j = 0; j < nT; j++) {
      var cands = free.map(function (i) { return { i: i, c: C[i][j] }; });
      cands.sort(function (p, q) { return p.c - q.c || p.i - q.i; });
      var pick = cands[0].i;
      a[j] = pick;
      free.splice(free.indexOf(pick), 1);
      steps.push({ task: j, vehicle: pick, cost: C[pick][j], candidates: cands });
    }
    return { a: a, steps: steps };
  }

  function globalGreedy(C) {
    var nV = C.length, nT = C[0].length, fv = {}, ft = {}, a = new Array(nT), steps = [];
    for (var i = 0; i < nV; i++) fv[i] = true;
    for (var j = 0; j < nT; j++) ft[j] = true;
    for (var s = 0; s < nT; s++) {
      var best = null;
      for (i = 0; i < nV; i++) {
        if (!fv[i]) continue;
        for (j = 0; j < nT; j++) {
          if (!ft[j]) continue;
          var c = C[i][j];
          if (!best || c < best.c || (c === best.c && (i < best.i || (i === best.i && j < best.j)))) best = { c: c, i: i, j: j };
        }
      }
      a[best.j] = best.i; fv[best.i] = false; ft[best.j] = false;
      steps.push({ task: best.j, vehicle: best.i, cost: best.c });
    }
    return { a: a, steps: steps };
  }

  function assignmentToX(a, nV, nT) {
    var x = [];
    for (var i = 0; i < nV; i++) x.push(new Array(nT).fill(0));
    for (var j = 0; j < nT; j++) x[a[j]][j] = 1;
    return x;
  }

  // ------------------------------------------------------------ 单纯形
  // min c·x  s.t.  Aeq x = beq,  Aub x <= bub,  x >= 0   （要求 beq, bub >= 0）
  // 两阶段、Bland 规则防循环。返回 {status, x, value, iterations}
  function simplex(prob) {
    var EPS = 1e-9;
    var c = prob.c, n = c.length;
    var Aeq = prob.Aeq || [], beq = prob.beq || [], Aub = prob.Aub || [], bub = prob.bub || [];
    var mE = Aeq.length, mU = Aub.length, m = mE + mU;
    var nS = mU, nA = mE;                 // 松弛变量给 <= 行，人工变量给 = 行
    var N = n + nS + nA;                  // 列数（不含右端）
    var T = [], basis = [], r, j;
    for (r = 0; r < m; r++) {
      var row = new Array(N + 1).fill(0);
      if (r < mE) {
        for (j = 0; j < n; j++) row[j] = Aeq[r][j];
        row[n + nS + r] = 1; row[N] = beq[r]; basis.push(n + nS + r);
      } else {
        var u = r - mE;
        for (j = 0; j < n; j++) row[j] = Aub[u][j];
        row[n + u] = 1; row[N] = bub[u]; basis.push(n + u);
      }
      T.push(row);
    }
    var iters = 0;

    function pivot(pr, pc) {
      var pv = T[pr][pc], k, rr;
      for (k = 0; k <= N; k++) T[pr][k] /= pv;
      for (rr = 0; rr < T.length; rr++) {
        if (rr === pr) continue;
        var f = T[rr][pc];
        if (Math.abs(f) < 1e-15) continue;
        for (k = 0; k <= N; k++) T[rr][k] -= f * T[pr][k];
      }
      basis[pr] = pc;
      iters++;
    }

    // 以 cost 向量为目标跑单纯形；allowed(col) 控制哪些列可以进基
    function run(cost, allowed) {
      for (var guard = 0; guard < 5000; guard++) {
        // 计算约化成本 d_j = c_j - c_B B^-1 A_j（表中已是 B^-1 A）
        var enter = -1;
        for (var col = 0; col < N; col++) {
          if (!allowed(col) || basis.indexOf(col) >= 0) continue;
          var d = cost[col];
          for (var rr = 0; rr < T.length; rr++) d -= cost[basis[rr]] * T[rr][col];
          if (d < -EPS) { enter = col; break; }          // Bland：最小下标
        }
        if (enter < 0) return "optimal";
        var leave = -1, best = Infinity;
        for (rr = 0; rr < T.length; rr++) {
          var a = T[rr][enter];
          if (a > EPS) {
            var ratio = T[rr][N] / a;
            if (ratio < best - EPS || (Math.abs(ratio - best) <= EPS && basis[rr] < basis[leave])) { best = ratio; leave = rr; }
          }
        }
        if (leave < 0) return "unbounded";
        pivot(leave, enter);
      }
      return "iteration_limit";
    }

    // 阶段一：最小化人工变量之和
    var cost1 = new Array(N).fill(0);
    for (j = n + nS; j < N; j++) cost1[j] = 1;
    if (nA > 0) {
      run(cost1, function () { return true; });
      var infeas = 0;
      for (r = 0; r < T.length; r++) if (basis[r] >= n + nS) infeas += T[r][N];
      if (infeas > 1e-7) return { status: "infeasible", iterations: iters };
      // 把仍在基里的人工变量换出；换不出的行是冗余约束，删掉
      for (r = T.length - 1; r >= 0; r--) {
        if (basis[r] < n + nS) continue;
        var pc = -1;
        for (j = 0; j < n + nS; j++) if (Math.abs(T[r][j]) > 1e-9) { pc = j; break; }
        if (pc >= 0) pivot(r, pc);
        else { T.splice(r, 1); basis.splice(r, 1); }
      }
    }
    // 阶段二
    var cost2 = new Array(N).fill(0);
    for (j = 0; j < n; j++) cost2[j] = c[j];
    var st = run(cost2, function (col) { return col < n + nS; });
    if (st !== "optimal") return { status: st, iterations: iters };
    var x = new Array(n).fill(0);
    for (r = 0; r < T.length; r++) if (basis[r] < n) x[basis[r]] = T[r][N];
    var value = 0;
    for (j = 0; j < n; j++) value += c[j] * x[j];
    return { status: "optimal", x: x, value: value, iterations: iters };
  }

  // 指派 LP：变量按行展开 x[i][j] -> i*nT + j
  function assignmentRows(nV, nT, extraCols) {
    var n = nV * nT + (extraCols || 0), Aeq = [], Aveh = [], i, j, row;
    for (j = 0; j < nT; j++) {
      row = new Array(n).fill(0);
      for (i = 0; i < nV; i++) row[i * nT + j] = 1;
      Aeq.push(row);
    }
    for (i = 0; i < nV; i++) {
      row = new Array(n).fill(0);
      for (j = 0; j < nT; j++) row[i * nT + j] = 1;
      Aveh.push(row);
    }
    return { Aeq: Aeq, Aveh: Aveh, n: n };
  }

  function reshape(v, nV, nT) {
    var x = [];
    for (var i = 0; i < nV; i++) {
      var row = [];
      for (var j = 0; j < nT; j++) { var t = v[i * nT + j]; row.push(Math.abs(t) < 1e-12 ? 0 : t); }
      x.push(row);
    }
    return x;
  }

  function lpSum(C) {
    var nV = C.length, nT = C[0].length, R = assignmentRows(nV, nT, 0), c = [];
    for (var i = 0; i < nV; i++) for (var j = 0; j < nT; j++) c.push(C[i][j]);
    var res = simplex({ c: c, Aeq: R.Aeq, beq: new Array(nT).fill(1), Aub: R.Aveh, bub: new Array(nV).fill(1) });
    if (res.status !== "optimal") return res;
    return { status: "optimal", value: res.value, x: reshape(res.x, nV, nT), iterations: res.iterations };
  }

  function lpMinMax(C) {
    var nV = C.length, nT = C[0].length, R = assignmentRows(nV, nT, 1), n = R.n, i, j;
    var c = new Array(n).fill(0); c[n - 1] = 1;
    var Aub = R.Aveh.slice(), bub = new Array(nV).fill(1);
    for (i = 0; i < nV; i++) {
      var row = new Array(n).fill(0);
      for (j = 0; j < nT; j++) row[i * nT + j] = C[i][j];
      row[n - 1] = -1;
      Aub.push(row); bub.push(0);
    }
    var res = simplex({ c: c, Aeq: R.Aeq, beq: new Array(nT).fill(1), Aub: Aub, bub: bub });
    if (res.status !== "optimal") return res;
    return { status: "optimal", value: res.value, x: reshape(res.x.slice(0, n - 1), nV, nT), iterations: res.iterations };
  }

  function isIntegral(x, tol) {
    tol = tol || 1e-6;
    for (var i = 0; i < x.length; i++) for (var j = 0; j < x[i].length; j++)
      if (Math.abs(x[i][j] - Math.round(x[i][j])) > tol) return false;
    return true;
  }

  function rowTimes(C, x) {
    return C.map(function (row, i) { var s = 0; for (var j = 0; j < row.length; j++) s += row[j] * x[i][j]; return s; });
  }

  // ------------------------------------------------------------ Birkhoff 分解（方阵）
  function birkhoff(x0, tol) {
    tol = tol || 1e-7;
    var n = x0.length, x = x0.map(function (r) { return r.slice(); }), out = [];
    for (var round = 0; round < n * n; round++) {
      var mx = 0, i, j;
      for (i = 0; i < n; i++) for (j = 0; j < n; j++) if (x[i][j] > mx) mx = x[i][j];
      if (mx <= tol) break;
      var match = new Array(n).fill(-1); // 车 -> 任务
      var augment = function (jj, seen) {
        for (var ii = 0; ii < n; ii++) {
          if (x[ii][jj] > tol && !seen[ii]) {
            seen[ii] = true;
            if (match[ii] === -1 || augment(match[ii], seen)) { match[ii] = jj; return true; }
          }
        }
        return false;
      };
      for (j = 0; j < n; j++) if (!augment(j, new Array(n).fill(false))) return null;
      var a = new Array(n);
      for (i = 0; i < n; i++) a[match[i]] = i;
      var w = Infinity;
      for (j = 0; j < n; j++) w = Math.min(w, x[a[j]][j]);
      for (j = 0; j < n; j++) x[a[j]][j] -= w;
      out.push({ w: w, a: a });
    }
    return out;
  }

  // ------------------------------------------------------------ 二维 LP 几何（图 1-3）
  // 约束 a·x <= b 的列表；返回可行多边形顶点（逆时针）
  function polygon(cons) {
    var pts = [], k, l;
    for (k = 0; k < cons.length; k++) for (l = k + 1; l < cons.length; l++) {
      var A = cons[k], B = cons[l];
      var det = A.a[0] * B.a[1] - A.a[1] * B.a[0];
      if (Math.abs(det) < 1e-12) continue;
      var px = (A.b * B.a[1] - A.a[1] * B.b) / det, py = (A.a[0] * B.b - A.b * B.a[0]) / det;
      var ok = cons.every(function (c) { return c.a[0] * px + c.a[1] * py <= c.b + 1e-9; });
      if (ok && !pts.some(function (p) { return Math.abs(p[0] - px) < 1e-9 && Math.abs(p[1] - py) < 1e-9; })) pts.push([px, py]);
    }
    var cx = sum(pts.map(function (p) { return p[0]; })) / pts.length, cy = sum(pts.map(function (p) { return p[1]; })) / pts.length;
    pts.sort(function (p, q) { return Math.atan2(p[1] - cy, p[0] - cx) - Math.atan2(q[1] - cy, q[0] - cx); });
    return pts;
  }

  function latticeIn(cons, xmax, ymax) {
    var out = [];
    for (var x = 0; x <= xmax; x++) for (var y = 0; y <= ymax; y++)
      if (cons.every(function (c) { return c.a[0] * x + c.a[1] * y <= c.b + 1e-9; })) out.push([x, y]);
    return out;
  }

  // 沿方向 d 最大化 d·p；返回所有并列最优点
  function argmaxAll(points, d) {
    var best = -Infinity, out = [];
    points.forEach(function (p) {
      var v = d[0] * p[0] + d[1] * p[1];
      if (v > best + 1e-9) { best = v; out = [p]; }
      else if (Math.abs(v - best) <= 1e-9) out.push(p);
    });
    return { value: best, points: out };
  }

  // ------------------------------------------------------------ 随机场景（可复现）
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function randomScenario(seed, params, nV, nT) {
    var rnd = mulberry32(seed), used = {}, V = [], T = [];
    function place(isTask) {
      for (;;) {
        var f = rnd() < 0.5 ? 1 : 2;
        var x = Math.floor(rnd() * params.width);
        var y = isTask || rnd() < 0.6 ? 1 + Math.floor(rnd() * params.depth) : 0;
        var key = f + ":" + x + ":" + y;
        if (!used[key]) { used[key] = true; return { floor: f, x: x, y: y }; }
      }
    }
    for (var i = 0; i < nV; i++) { var p = place(false); V.push({ id: "V" + (i + 1), floor: p.floor, x: p.x, y: p.y }); }
    for (var j = 0; j < nT; j++) { var q = place(true); T.push({ id: "T" + (j + 1), floor: q.floor, x: q.x, y: q.y }); }
    return { name: "随机场景 #" + seed, params: params, vehicles: V, tasks: T };
  }

  var Core = {
    LIFT_X: LIFT_X, breakdown: breakdown, travelTime: travelTime, costMatrix: costMatrix,
    liftMatrix: liftMatrix, assignments: assignments, evaluate: evaluate, optSum: optSum,
    optMax: optMax, fifoGreedy: fifoGreedy, globalGreedy: globalGreedy, assignmentToX: assignmentToX,
    simplex: simplex, lpSum: lpSum, lpMinMax: lpMinMax, isIntegral: isIntegral, rowTimes: rowTimes,
    birkhoff: birkhoff, polygon: polygon, latticeIn: latticeIn, argmaxAll: argmaxAll,
    mulberry32: mulberry32, randomScenario: randomScenario
  };
  if (typeof module !== "undefined" && module.exports) module.exports = Core;
  else root.Core = Core;
})(this);
