/* core8.js — 第 8 章页面的计算内核（无 DOM 依赖，可在 Node 中单独验证）
 * 依赖 core.js 的单纯形（Core.simplex）。点 0 是仓库，距离是取整的欧氏距离。
 *
 * - dist / tourLength / heldKarp：距离矩阵、路线长度、动态规划精确解
 * - assignLP：只有出入度约束（加上若干子回路消除约束 SEC）的 LP；subtours：把整数解拆成回路
 * - separateSEC / cutLoop：用最大流分离被违反的子回路约束，根节点割平面循环
 * - mtzLP：MTZ 紧凑模型的 LP 松弛值
 * - nearestNeighbor / twoOpt：最近邻与 2-opt 局部搜索（记录每一步）
 * - cvrpOpt / sweep：带载重的多车路线（子集动态规划）与扫描法
 */
(function (root) {
  "use strict";
  var Core = typeof module !== "undefined" && module.exports ? require("../../../ch05-assignment/page/src/core.js") : root.Core;

  function fill(n, x) { return new Array(n).fill(x); }
  function range(n) { var o = []; for (var i = 0; i < n; i++) o.push(i); return o; }

  function dist(P) {
    return P.map(function (a, i) { return P.map(function (b, j) { return i === j ? 0 : Math.round(Math.hypot(a[0] - b[0], a[1] - b[1])); }); });
  }
  function tourLength(D, tour) {
    var s = 0;
    for (var i = 0; i < tour.length; i++) s += D[tour[i]][tour[(i + 1) % tour.length]];
    return s;
  }

  // Held–Karp：从点 0 出发访问 nodes（默认全部其余点）再回到 0 的最短路线
  function heldKarp(D, nodes) {
    nodes = nodes || range(D.length).slice(1);
    var m = nodes.length;
    if (m === 0) return { value: 0, tour: [0] };
    var full = (1 << m) - 1, dp = [], par = [], mask, k, j;
    for (mask = 0; mask <= full; mask++) { dp.push(fill(m, Infinity)); par.push(fill(m, -1)); }
    for (k = 0; k < m; k++) dp[1 << k][k] = D[0][nodes[k]];
    for (mask = 1; mask <= full; mask++) for (k = 0; k < m; k++) {
      if (!(mask & (1 << k)) || dp[mask][k] === Infinity) continue;
      for (j = 0; j < m; j++) {
        if (mask & (1 << j)) continue;
        var nm = mask | (1 << j), v = dp[mask][k] + D[nodes[k]][nodes[j]];
        if (v < dp[nm][j]) { dp[nm][j] = v; par[nm][j] = k; }
      }
    }
    var best = Infinity, bk = -1;
    for (k = 0; k < m; k++) { var t = dp[full][k] + D[nodes[k]][0]; if (t < best) { best = t; bk = k; } }
    var tour = [], cur = bk; mask = full;
    while (cur >= 0) { tour.push(nodes[cur]); var pk = par[mask][cur]; mask ^= 1 << cur; cur = pk; }
    tour.push(0);
    return { value: best, tour: tour.reverse() };
  }

  // ------------------------------------------------------------ LP：出入度 + SEC（S 里的弧至多 |S|−1 条）
  function arcIndex(n) {
    var idx = {}, list = [], i, j;
    for (i = 0; i < n; i++) for (j = 0; j < n; j++) if (i !== j) { idx[i + "," + j] = list.length; list.push([i, j]); }
    return { idx: idx, list: list };
  }
  function assignLP(D, secs) {
    var n = D.length, A = arcIndex(n), nv = A.list.length, Aeq = [], beq = [], Aub = [], bub = [], i, r;
    for (i = 0; i < n; i++) {
      r = fill(nv, 0); for (var j = 0; j < n; j++) if (j !== i) r[A.idx[i + "," + j]] = 1; Aeq.push(r); beq.push(1);
      r = fill(nv, 0); for (j = 0; j < n; j++) if (j !== i) r[A.idx[j + "," + i]] = 1; Aeq.push(r); beq.push(1);
    }
    (secs || []).forEach(function (S) {
      var q = fill(nv, 0); S.forEach(function (a) { S.forEach(function (b) { if (a !== b) q[A.idx[a + "," + b]] = 1; }); });
      Aub.push(q); bub.push(S.length - 1);
    });
    var res = Core.simplex({ c: A.list.map(function (p) { return D[p[0]][p[1]]; }), Aeq: Aeq, beq: beq, Aub: Aub, bub: bub });
    if (res.status !== "optimal") return { status: res.status };
    var x = range(n).map(function () { return fill(n, 0); });
    A.list.forEach(function (p, k) { var v = res.x[k]; x[p[0]][p[1]] = Math.abs(v) < 1e-9 ? 0 : Math.abs(v - 1) < 1e-9 ? 1 : v; });
    return { status: "optimal", value: res.value, x: x };
  }
  // 整数解拆成回路（每个点恰一条出弧）
  function subtours(x) {
    var n = x.length, seen = fill(n, false), out = [];
    for (var s = 0; s < n; s++) {
      if (seen[s]) continue;
      var cyc = [], v = s;
      while (!seen[v]) { seen[v] = true; cyc.push(v); var nx = -1; for (var j = 0; j < n; j++) if (x[v][j] > 0.5) nx = j; if (nx < 0) break; v = nx; }
      out.push(cyc);
    }
    return out;
  }

  // 最大流（Edmonds–Karp，浮点容量）：返回流量，以及在残量图里能到达汇点 t 的点集（最小的汇侧最小割）
  function maxflowTo(cap, s, t) {
    var n = cap.length, r = cap.map(function (row) { return row.slice(); }), flow = 0, EPS = 1e-9;
    for (var guard = 0; guard < 5000; guard++) {
      var par = fill(n, -1), q = [s]; par[s] = s;
      for (var qi = 0; qi < q.length && par[t] < 0; qi++) for (var v = 0; v < n; v++) if (par[v] < 0 && r[q[qi]][v] > EPS) { par[v] = q[qi]; q.push(v); }
      if (par[t] < 0) break;
      var b = Infinity, x;
      for (x = t; x !== s; x = par[x]) b = Math.min(b, r[par[x]][x]);
      for (x = t; x !== s; x = par[x]) { r[par[x]][x] -= b; r[x][par[x]] += b; }
      flow += b;
    }
    var reach = fill(n, false), stack = [t]; reach[t] = true;
    while (stack.length) { var y = stack.pop(); for (var u = 0; u < n; u++) if (!reach[u] && r[u][y] > EPS) { reach[u] = true; stack.push(u); } }
    return { value: flow, sinkSide: range(n).filter(function (v) { return reach[v]; }) };
  }
  // 分离：对每个 t ≠ 0，仓库到 t 的最大流 < 1 说明有被违反的子回路约束，S = 汇侧的最小割
  function separateSEC(x) {
    var n = x.length, out = [], seen = {};
    for (var t = 1; t < n; t++) {
      var f = maxflowTo(x, 0, t);
      if (f.value < 1 - 1e-6) {
        var S = f.sinkSide.filter(function (v) { return v !== 0; }), key = S.join(",");
        if (S.length >= 2 && !seen[key]) { seen[key] = true; out.push(S); }
      }
    }
    return out.sort(function (a, b) { return a.length - b.length || (a.join(",") < b.join(",") ? -1 : 1); });
  }
  function cutLoop(D, maxRounds) {
    var secs = [], rounds = [];
    for (var r = 0; r < (maxRounds || 30); r++) {
      var lp = assignLP(D, secs);
      if (lp.status !== "optimal") break;
      var found = separateSEC(lp.x).filter(function (S) { return !secs.some(function (T) { return T.join(",") === S.join(","); }); });
      rounds.push({ value: lp.value, x: lp.x, ncuts: secs.length, added: found });
      if (!found.length) break;
      secs = secs.concat(found);
    }
    return { rounds: rounds, secs: secs, final: rounds[rounds.length - 1] };
  }

  // ------------------------------------------------------------ MTZ：u_i − u_j + (n−1) x_ij ≤ n − 2，0 ≤ u_i ≤ n − 2（点 1..n−1）
  function mtzLP(D) {
    var n = D.length, A = arcIndex(n), nx = A.list.length, nv = nx + n, Aeq = [], beq = [], Aub = [], bub = [], i, j, r;
    for (i = 0; i < n; i++) {
      r = fill(nv, 0); for (j = 0; j < n; j++) if (j !== i) r[A.idx[i + "," + j]] = 1; Aeq.push(r); beq.push(1);
      r = fill(nv, 0); for (j = 0; j < n; j++) if (j !== i) r[A.idx[j + "," + i]] = 1; Aeq.push(r); beq.push(1);
    }
    for (i = 1; i < n; i++) for (j = 1; j < n; j++) if (i !== j) { r = fill(nv, 0); r[A.idx[i + "," + j]] = n - 1; r[nx + i] = 1; r[nx + j] = -1; Aub.push(r); bub.push(n - 2); }
    for (i = 0; i < n; i++) { r = fill(nv, 0); r[nx + i] = 1; Aub.push(r); bub.push(n - 2); }
    var c = A.list.map(function (p) { return D[p[0]][p[1]]; }).concat(fill(n, 0));
    var res = Core.simplex({ c: c, Aeq: Aeq, beq: beq, Aub: Aub, bub: bub });
    return res.status === "optimal" ? { status: "optimal", value: res.value } : { status: res.status };
  }

  // ------------------------------------------------------------ 启发式
  function nearestNeighbor(D) {
    var n = D.length, tour = [0], used = fill(n, false); used[0] = true;
    while (tour.length < n) {
      var cur = tour[tour.length - 1], best = -1;
      for (var j = 0; j < n; j++) if (!used[j] && (best < 0 || D[cur][j] < D[cur][best])) best = j;
      used[best] = true; tour.push(best);
    }
    return tour;
  }
  // 2-opt：反复找第一个能缩短路线的“反转一段”，直到没有。返回每一步 { i, j, delta, tour }
  function twoOpt(D, tour0) {
    var tour = tour0.slice(), n = tour.length, steps = [], improved = true;
    while (improved) {
      improved = false;
      for (var i = 1; i < n - 1 && !improved; i++) for (var j = i + 1; j < n && !improved; j++) {
        var a = tour[i - 1], b = tour[i], c = tour[j], d = tour[(j + 1) % n];
        var delta = D[a][c] + D[b][d] - D[a][b] - D[c][d];
        if (delta < 0) {
          tour = tour.slice(0, i).concat(tour.slice(i, j + 1).reverse(), tour.slice(j + 1));
          steps.push({ i: i, j: j, delta: delta, tour: tour.slice(), len: tourLength(D, tour) });
          improved = true;
        }
      }
    }
    return { tour: tour, steps: steps };
  }

  // ------------------------------------------------------------ 带载重的多车路线（客户 1..m）
  // 子集动态规划：先算每个客户子集的最短单车路线（需求不超载重），再把全部客户划分成至多 K 组
  function cvrpOpt(D, dem, Q, K) {
    var m = D.length - 1, full = (1 << m) - 1, cost = [], mask, i;
    for (mask = 0; mask <= full; mask++) {
      var nodes = [], d = 0;
      for (i = 0; i < m; i++) if (mask & (1 << i)) { nodes.push(i + 1); d += dem[i]; }
      cost.push(d > Q ? Infinity : (mask === 0 ? 0 : heldKarp(D, nodes).value));
    }
    var dp = [], choice = [];
    for (var k = 0; k <= K; k++) { dp.push(fill(full + 1, Infinity)); choice.push(fill(full + 1, 0)); }
    dp[0][0] = 0;
    for (k = 1; k <= K; k++) for (mask = 0; mask <= full; mask++) {
      dp[k][mask] = dp[k - 1][mask]; choice[k][mask] = 0;
      if (mask === 0) continue;
      var low = mask & -mask;                          // 含最低位客户的那一组，避免重复
      for (var sub = mask; sub > 0; sub = (sub - 1) & mask) {
        if (!(sub & low) || cost[sub] === Infinity) continue;
        var v = dp[k - 1][mask ^ sub] + cost[sub];
        if (v < dp[k][mask]) { dp[k][mask] = v; choice[k][mask] = sub; }
      }
    }
    if (dp[K][full] === Infinity) return { value: null, routes: [] };
    var routes = [], cur = full;
    for (k = K; k >= 1 && cur; k--) {
      var s2 = choice[k][cur];
      if (s2) { var nds = []; for (i = 0; i < m; i++) if (s2 & (1 << i)) nds.push(i + 1); routes.push(heldKarp(D, nds).tour); cur ^= s2; }
    }
    return { value: dp[K][full], routes: routes };
  }
  // 扫描法：客户按相对仓库的极角排序，依次装车，装不下就换新车；每组再用精确算法排路线
  function sweep(P, D, dem, Q) {
    var m = P.length - 1, ang = range(m).map(function (i) { return { c: i + 1, a: Math.atan2(P[i + 1][1] - P[0][1], P[i + 1][0] - P[0][0]) }; }).sort(function (u, v) { return u.a - v.a || u.c - v.c; });
    var groups = [[]], load = 0;
    ang.forEach(function (o) {
      if (load + dem[o.c - 1] > Q) { groups.push([]); load = 0; }
      groups[groups.length - 1].push(o.c); load += dem[o.c - 1];
    });
    var routes = groups.map(function (g) { return heldKarp(D, g).tour; });
    return { groups: groups, routes: routes, value: routes.reduce(function (s, t) { return s + tourLength(D, t); }, 0) };
  }

  var add = { dist: dist, tourLength: tourLength, heldKarp: heldKarp, assignLP: assignLP, subtours: subtours, maxflowTo: maxflowTo,
    separateSEC: separateSEC, cutLoop: cutLoop, mtzLP: mtzLP, nearestNeighbor: nearestNeighbor, twoOpt: twoOpt, cvrpOpt: cvrpOpt, sweep: sweep };
  for (var key in add) Core[key] = add[key];
  if (typeof module !== "undefined" && module.exports) module.exports = Core;
  else root.Core = Core;
})(this);
