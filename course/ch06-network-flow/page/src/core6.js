/* core6.js — 第 6 章页面的计算内核（无 DOM 依赖，可在 Node 中单独验证）
 * 依赖 core.js 的单纯形；网络用 { nodes: ["S", ...], edges: [{u, v, cap, cost}] } 表示，节点用下标。
 *
 * - dijkstra / bellmanFord / johnson：最短路、负权、势（重新赋权）
 * - maxflow：Ford–Fulkerson 家族（rule = "bfs" 最短增广路，"dfs" 随手选），记录每次增广与回退边、最小割
 * - minCostFlow：逐次最短路（带势的 Dijkstra），记录每次增广，给出费用曲线
 * - flowLP：最小费用流与多商品流的 LP 形式（用来验证整数性和演示失效）
 * - nodeArcMatrix：点–弧关联矩阵（喂给 core5.js 的 tuAnalyze）
 */
(function (root) {
  "use strict";
  var Core = typeof module !== "undefined" && module.exports ? require("../../../ch05-assignment/page/src/core5.js") : root.Core;
  var INF = 1e18;

  function fill(n, x) { return new Array(n).fill(x); }
  function range(n) { var o = []; for (var i = 0; i < n; i++) o.push(i); return o; }

  // ------------------------------------------------------------ Dijkstra（数组版；已确定的点不再改）
  function dijkstra(N, edges, s, opts) {
    var n = N.length, d = fill(n, INF), pred = fill(n, -1), done = fill(n, false), order = [], events = [];
    d[s] = 0;
    for (var it = 0; it < n; it++) {
      var u = -1;
      for (var i = 0; i < n; i++) if (!done[i] && d[i] < INF && (u < 0 || d[i] < d[u])) u = i;
      if (u < 0) break;
      done[u] = true; order.push(u);
      var ev = { node: u, dist: d[u], relaxed: [], skipped: [] };
      edges.forEach(function (e, k) {
        if (e.u !== u) return;
        var nd = d[u] + e.cost;
        if (done[e.v]) { if (nd < d[e.v] - 1e-12) ev.skipped.push({ edge: k, to: e.v, cand: nd, had: d[e.v] }); return; }
        if (nd < d[e.v]) { ev.relaxed.push({ edge: k, to: e.v, from: d[e.v], to_: nd }); d[e.v] = nd; pred[e.v] = k; }
      });
      ev.d = d.slice(); ev.pred = pred.slice();
      events.push(ev);
    }
    return { dist: d, pred: pred, order: order, events: events };
  }

  // ------------------------------------------------------------ Bellman–Ford（轮数 = 点数 - 1；再多一轮还能松弛 = 有负环）
  function bellmanFord(N, edges, s) {
    var n = N.length, d = fill(n, INF), pred = fill(n, -1), rounds = [], r, k;
    d[s] = 0;
    for (r = 0; r < n - 1; r++) {
      var upd = [];
      edges.forEach(function (e, ek) {
        if (d[e.u] < INF && d[e.u] + e.cost < d[e.v] - 1e-12) { upd.push({ edge: ek, to: e.v, from: d[e.v], to_: d[e.u] + e.cost }); d[e.v] = d[e.u] + e.cost; pred[e.v] = ek; }
      });
      rounds.push({ updates: upd, d: d.slice() });
      if (!upd.length) break;
    }
    var neg = null;
    for (k = 0; k < edges.length; k++) {
      var e = edges[k];
      if (d[e.u] < INF && d[e.u] + e.cost < d[e.v] - 1e-12) { pred[e.v] = k; neg = walkCycle(e.v, pred, edges, n); break; }
    }
    return { dist: d, pred: pred, rounds: rounds, negCycle: neg };
  }
  function walkCycle(v, pred, edges, n) {
    for (var i = 0; i < n; i++) v = edges[pred[v]].u;         // 走 n 步一定落在环上
    var cyc = [v], x = edges[pred[v]].u;
    while (x !== v) { cyc.push(x); x = edges[pred[x]].u; }
    return cyc.reverse();
  }

  // ------------------------------------------------------------ Johnson：用 Bellman–Ford 算势，重新赋权后 Dijkstra
  function johnson(N, edges, s) {
    var n = N.length, ext = edges.slice(), i;
    for (i = 0; i < n; i++) ext.push({ u: n, v: i, cap: 0, cost: 0 });
    var bf = bellmanFord(N.concat(["*"]), ext, n);
    if (bf.negCycle) return { negCycle: bf.negCycle };
    var h = bf.dist.slice(0, n);
    var red = edges.map(function (e) { return { u: e.u, v: e.v, cap: e.cap, cost: e.cost + h[e.u] - h[e.v] }; });
    var dj = dijkstra(N, red, s);
    var dist = dj.dist.map(function (x, v) { return x >= INF ? INF : x - h[s] + h[v]; });
    return { h: h, reduced: red, dijkstra: dj, dist: dist, pred: dj.pred };
  }

  function pathTo(edges, pred, t) {
    var p = [], v = t, guard = 0;
    while (pred[v] >= 0 && guard++ < 1000) { p.push(pred[v]); v = edges[pred[v]].u; }
    return p.reverse();
  }

  // ------------------------------------------------------------ 最大流
  // 残量图：弧 2k 是原弧，2k+1 是回退弧
  function residual(N, edges) {
    var n = N.length, arcs = [], adj = range(n).map(function () { return []; });
    edges.forEach(function (e, k) {
      arcs.push({ u: e.u, v: e.v, cap: e.cap, edge: k, back: false });
      arcs.push({ u: e.v, v: e.u, cap: 0, edge: k, back: true });
      adj[e.u].push(2 * k); adj[e.v].push(2 * k + 1);
    });
    return { arcs: arcs, adj: adj };
  }
  function maxflow(N, edges, s, t, rule, limit) {
    var R = residual(N, edges), n = N.length, steps = [], total = 0, guard = 0;
    function find() {
      var par = fill(n, -1), seen = fill(n, false);
      seen[s] = true;
      if (rule === "dfs") {
        (function dfs(u) {
          if (u === t) return true;
          var order = R.adj[u].slice().sort(function (a, b) { return R.arcs[a].v - R.arcs[b].v; });
          for (var q = 0; q < order.length; q++) {
            var a = order[q], v = R.arcs[a].v;
            if (R.arcs[a].cap > 0 && !seen[v]) { seen[v] = true; par[v] = a; if (dfs(v)) return true; }
          }
          return false;
        })(s);
      } else {
        var queue = [s];
        for (var qi = 0; qi < queue.length; qi++) {
          var u = queue[qi];
          R.adj[u].forEach(function (a) { var v = R.arcs[a].v; if (R.arcs[a].cap > 0 && !seen[v]) { seen[v] = true; par[v] = a; queue.push(v); } });
        }
      }
      if (!seen[t]) return null;
      var p = [], v = t;
      while (v !== s) { p.push(par[v]); v = R.arcs[par[v]].u; }
      return p.reverse();
    }
    while (guard++ < 10000) {
      var p = find();
      if (!p) break;
      var b = Infinity;
      p.forEach(function (a) { b = Math.min(b, R.arcs[a].cap); });
      if (limit != null) b = Math.min(b, limit - total);
      if (b <= 0) break;
      p.forEach(function (a) { R.arcs[a].cap -= b; R.arcs[a ^ 1].cap += b; });
      total += b;
      steps.push({ arcs: p.slice(), nodes: [s].concat(p.map(function (a) { return R.arcs[a].v; })), bottleneck: b,
        backArcs: p.filter(function (a) { return R.arcs[a].back; }), total: total, flow: flowOf(R, edges) });
    }
    // 最小割：残量图里从 s 可达的点
    var reach = fill(n, false), q2 = [s]; reach[s] = true;
    for (var i = 0; i < q2.length; i++) R.adj[q2[i]].forEach(function (a) { var v = R.arcs[a].v; if (R.arcs[a].cap > 0 && !reach[v]) { reach[v] = true; q2.push(v); } });
    var cutEdges = [], cutCap = 0;
    edges.forEach(function (e, k) { if (reach[e.u] && !reach[e.v]) { cutEdges.push(k); cutCap += e.cap; } });
    return { value: total, flow: flowOf(R, edges), steps: steps, reach: reach, cutEdges: cutEdges, cutCap: cutCap };
  }
  function flowOf(R, edges) { return edges.map(function (e, k) { return R.arcs[2 * k + 1].cap; }); }

  // ------------------------------------------------------------ 最小费用流：逐次最短路（势 + Dijkstra）
  // 输入的费用需 >= 0（否则先用 Bellman–Ford 算初始势，这里从简：允许负费用时用 Bellman–Ford 求最短路）
  function minCostFlow(N, edges, s, t, kmax) {
    var R = residual(N, edges), n = N.length, h = fill(n, 0), flow = 0, cost = 0, steps = [], guard = 0, useBF = edges.some(function (e) { return e.cost < 0; });
    function arcCost(a) { var ar = R.arcs[a]; return ar.back ? -edges[ar.edge].cost : edges[ar.edge].cost; }
    while (guard++ < 10000 && (kmax == null || flow < kmax)) {
      var d = fill(n, INF), par = fill(n, -1), done = fill(n, false), order = [];
      d[s] = 0;
      if (useBF) {
        for (var r = 0; r < n; r++) {
          var ch = false;
          for (var a0 = 0; a0 < R.arcs.length; a0++) { var A = R.arcs[a0]; if (A.cap > 0 && d[A.u] < INF && d[A.u] + arcCost(a0) < d[A.v] - 1e-12) { d[A.v] = d[A.u] + arcCost(a0); par[A.v] = a0; ch = true; } }
          if (!ch) break;
        }
      } else {
        for (var it = 0; it < n; it++) {
          var u = -1;
          for (var i = 0; i < n; i++) if (!done[i] && d[i] < INF && (u < 0 || d[i] < d[u])) u = i;
          if (u < 0) break;
          done[u] = true; order.push(u);
          R.adj[u].forEach(function (a) {
            var ar = R.arcs[a];
            if (ar.cap <= 0 || done[ar.v]) return;
            var nd = d[u] + arcCost(a) + h[u] - h[ar.v];        // 约化成本 >= 0
            if (nd < d[ar.v] - 1e-12) { d[ar.v] = nd; par[ar.v] = a; }
          });
        }
      }
      if (d[t] >= INF) break;
      var len = useBF ? d[t] : d[t] - h[s] + h[t];
      if (!useBF) for (var v = 0; v < n; v++) if (d[v] < INF) h[v] += d[v];
      var p = [], x = t;
      while (x !== s) { p.push(par[x]); x = R.arcs[par[x]].u; }
      p.reverse();
      var b = Infinity;
      p.forEach(function (a) { b = Math.min(b, R.arcs[a].cap); });
      if (kmax != null) b = Math.min(b, kmax - flow);
      p.forEach(function (a) { R.arcs[a].cap -= b; R.arcs[a ^ 1].cap += b; });
      flow += b; cost += b * len;
      steps.push({ arcs: p.slice(), nodes: [s].concat(p.map(function (a) { return R.arcs[a].v; })), bottleneck: b, length: len,
        backArcs: p.filter(function (a) { return R.arcs[a].back; }), flow: flow, cost: cost, h: h.slice(), flowVec: flowOf(R, edges) });
    }
    return { flow: flow, cost: cost, steps: steps, flowVec: flowOf(R, edges), h: h.slice() };
  }
  // 费用曲线：整数流量 k 对应的最小费用（由各次增广的“长度”分段线性拼出）
  function costCurve(steps, kmax) {
    var out = [0], f = 0, c = 0;
    steps.forEach(function (st) { for (var q = 0; q < st.bottleneck; q++) { f++; c += st.length; out.push(c); } });
    return out.slice(0, kmax == null ? out.length : kmax + 1);
  }

  // ------------------------------------------------------------ LP 形式（单纯形要求右端 >= 0：等式行按需取负）
  function flowLP(N, edges, s, t, k, opts) {
    opts = opts || {};
    var n = N.length, m = edges.length, Aeq = [], beq = [], Aub = [], bub = [], i, j;
    for (i = 0; i < n; i++) {
      var row = fill(m, 0), rhs = i === s ? k : i === t ? -k : 0;
      edges.forEach(function (e, ek) { if (e.u === i) row[ek] += 1; if (e.v === i) row[ek] -= 1; });
      if (rhs < 0) { row = row.map(function (x) { return -x; }); rhs = -rhs; }
      Aeq.push(row); beq.push(rhs);
    }
    edges.forEach(function (e, ek) { var row = fill(m, 0); row[ek] = 1; Aub.push(row); bub.push(e.cap); });
    (opts.extras || []).forEach(function (ex) { var row = fill(m, 0); ex.arcs.forEach(function (a) { row[a] += 1; }); Aub.push(row); bub.push(ex.b); });
    var res = Core.simplex({ c: edges.map(function (e) { return e.cost; }), Aeq: Aeq, beq: beq, Aub: Aub, bub: bub });
    return res.status === "optimal" ? { status: "optimal", value: res.value, x: res.x.map(function (v) { return Math.abs(v) < 1e-12 ? 0 : v; }) } : { status: res.status };
  }
  // 两种商品共用弧容量的多商品流 LP：commodities = [{s, t, d}]，变量按商品分块
  function multiFlowLP(N, edges, coms, integral) {
    var n = N.length, m = edges.length, K = coms.length, nv = m * K, Aeq = [], beq = [], Aub = [], bub = [];
    coms.forEach(function (c, kk) {
      for (var i = 0; i < n; i++) {
        var row = fill(nv, 0), rhs = i === c.s ? c.d : i === c.t ? -c.d : 0;
        edges.forEach(function (e, ek) { if (e.u === i) row[kk * m + ek] += 1; if (e.v === i) row[kk * m + ek] -= 1; });
        if (rhs < 0) { row = row.map(function (x) { return -x; }); rhs = -rhs; }
        Aeq.push(row); beq.push(rhs);
      }
    });
    edges.forEach(function (e, ek) { var row = fill(nv, 0); for (var kk = 0; kk < K; kk++) row[kk * m + ek] = 1; Aub.push(row); bub.push(e.cap); });
    var c = []; for (var kk2 = 0; kk2 < K; kk2++) edges.forEach(function (e) { c.push(e.cost); });
    var res = Core.simplex({ c: c, Aeq: Aeq, beq: beq, Aub: Aub, bub: bub });
    return res.status === "optimal" ? { status: "optimal", value: res.value, x: res.x.map(function (v) { return Math.abs(v) < 1e-12 ? 0 : v; }) } : { status: res.status };
  }

  function nodeArcMatrix(N, edges) {
    var A = N.map(function () { return fill(edges.length, 0); });
    edges.forEach(function (e, k) { A[e.u][k] += 1; A[e.v][k] -= 1; });
    return { rows: N.slice(), cols: edges.map(function (e) { return N[e.u] + "→" + N[e.v]; }), A: A };
  }


  // ------------------------------------------------------------ 多商品流：三角形算例与整数（每个商品选一条路）枚举
  // 点：S1..S3 = 0..2，v1..v3 = 3..5，w1..w3 = 6..8，T1..T3 = 9..11。两个三角形各有 3 条容量 1、费用 1 的弧。
  // 商品 k 可以从 S_k 进入任一三角形的 v_k（或 w_k），绕两步到 v_{k+2}（或 w_{k+2}），再去 T_k。
  function triangleNet() {
    var N = ["S1", "S2", "S3", "v1", "v2", "v3", "w1", "w2", "w3", "T1", "T2", "T3"], E = [], k;
    function add(u, v, cap, cost) { E.push({ u: u, v: v, cap: cap, cost: cost }); }
    for (k = 0; k < 3; k++) add(3 + k, 3 + (k + 1) % 3, 1, 1);
    for (k = 0; k < 3; k++) add(6 + k, 6 + (k + 1) % 3, 1, 1);
    for (k = 0; k < 3; k++) { add(k, 3 + k, 1, 0); add(k, 6 + k, 1, 0); add(3 + (k + 2) % 3, 9 + k, 1, 0); add(6 + (k + 2) % 3, 9 + k, 1, 0); }
    return { N: N, edges: E, coms: [0, 1, 2].map(function (k) { return { s: k, t: 9 + k, d: 1 }; }) };
  }
  function simplePaths(N, edges, s, t) {
    var out = [], seen = fill(N.length, false), cur = [];
    (function go(u) {
      if (u === t) { out.push(cur.slice()); return; }
      seen[u] = true;
      edges.forEach(function (e, k) { if (e.u === u && !seen[e.v]) { cur.push(k); go(e.v); cur.pop(); } });
      seen[u] = false;
    })(s);
    return out;
  }
  // 每个商品恰好走一条路（单位需求）：枚举所有组合，返回最小费用（无解时 value = null）
  function multiIntegerBest(N, edges, coms) {
    var sets = coms.map(function (c) { return simplePaths(N, edges, c.s, c.t); }), best = null, bestPick = null, pick = [];
    (function go(k, used, cost) {
      if (k === coms.length) { if (best === null || cost < best) { best = cost; bestPick = pick.slice(); } return; }
      sets[k].forEach(function (p) {
        var ok = true; p.forEach(function (e) { if (used[e] + 1 > edges[e].cap) ok = false; });
        if (!ok) return;
        p.forEach(function (e) { used[e]++; }); pick.push(p);
        go(k + 1, used, cost + p.reduce(function (a, e) { return a + edges[e].cost; }, 0));
        pick.pop(); p.forEach(function (e) { used[e]--; });
      });
    })(0, fill(edges.length, 0), 0);
    return { value: best, pick: bestPick, counts: sets.map(function (x) { return x.length; }) };
  }

  var add = { triangleNet: triangleNet, simplePaths: simplePaths, multiIntegerBest: multiIntegerBest, dijkstra: dijkstra, bellmanFord: bellmanFord, johnson: johnson, pathTo: pathTo, maxflow: maxflow, minCostFlow: minCostFlow,
    costCurve: costCurve, flowLP: flowLP, multiFlowLP: multiFlowLP, nodeArcMatrix: nodeArcMatrix };
  for (var key in add) Core[key] = add[key];
  if (typeof module !== "undefined" && module.exports) module.exports = Core;
  else root.Core = Core;
})(this);
