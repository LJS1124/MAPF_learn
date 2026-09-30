/* core11.js — 第 11 章页面的计算内核（无 DOM 依赖）
 * - flowSchedule / johnson / neh / enumFlow：流水车间（P[j][k] = 作业 j 在第 k 台机器上的加工时间；所有作业按同一顺序经过各机器）
 * - jsEval / jsOpt：作业车间的析取图求值（给定每台机器上的作业顺序，求最长路 = 最大完工时间，检测环）与枚举最优
 *   jobs[j] = [[机器, 加工时间], ...]（每个作业依次经过的机器，机器从 0 编号）
 */
(function (root) {
  "use strict";
  var Core = typeof module !== "undefined" && module.exports ? {} : (root.Core = root.Core || {});
  function range(n) { var o = []; for (var i = 0; i < n; i++) o.push(i); return o; }

  // ------------------------------------------------------------ 流水车间
  // perm 是作业的顺序（每台机器上都按这个顺序）。返回每个作业在每台机器上的开始/完工时间与 C_max。
  function flowSchedule(P, perm) {
    var m = P[0].length, free = new Array(m).fill(0), start = {}, end = {};
    perm.forEach(function (j) {
      start[j] = []; end[j] = [];
      for (var k = 0; k < m; k++) {
        var s = Math.max(free[k], k ? end[j][k - 1] : 0);
        start[j].push(s); end[j].push(s + P[j][k]); free[k] = s + P[j][k];
      }
    });
    return { Cmax: Math.max.apply(null, free), start: start, end: end };
  }
  // Johnson 规则（F2 | | C_max）：a ≤ b 的作业按 a 从小到大放前面，a > b 的按 b 从大到小放后面（并列取下标小的）
  function johnson(P) {
    var idx = range(P.length), s1 = idx.filter(function (j) { return P[j][0] <= P[j][1]; }).sort(function (x, y) { return P[x][0] - P[y][0] || x - y; }),
      s2 = idx.filter(function (j) { return P[j][0] > P[j][1]; }).sort(function (x, y) { return P[y][1] - P[x][1] || x - y; });
    return { order: s1.concat(s2), set1: s1, set2: s2 };
  }
  // NEH 启发式：作业按总加工时间从大到小依次插入，每次插到使当前部分序列 C_max 最小的位置（并列取靠前的位置）
  function neh(P) {
    var n = P.length, order = range(n).sort(function (a, b) { var sa = P[a].reduce(function (x, y) { return x + y; }, 0), sb = P[b].reduce(function (x, y) { return x + y; }, 0); return sb - sa || a - b; }), seq = [], steps = [];
    order.forEach(function (j) {
      var opts = [], best = null;
      for (var pos = 0; pos <= seq.length; pos++) {
        var s = seq.slice(0, pos).concat([j], seq.slice(pos)), c = flowSchedule(P, s).Cmax;
        opts.push({ pos: pos, seq: s, cmax: c });
        if (best === null || c < best.cmax) best = opts[opts.length - 1];
      }
      seq = best.seq; steps.push({ job: j, options: opts, chosen: best.pos, cmax: best.cmax });
    });
    return { start: order, order: seq, steps: steps };
  }
  function permutations(n) {
    var out = [], a = range(n);
    (function go(k) { if (k === n) { out.push(a.slice()); return; } for (var i = k; i < n; i++) { var t = a[k]; a[k] = a[i]; a[i] = t; go(k + 1); t = a[k]; a[k] = a[i]; a[i] = t; } })(0);
    return out;
  }
  function enumFlow(P) {
    var best = { value: Infinity, perm: null };
    permutations(P.length).forEach(function (p) { var c = flowSchedule(P, p).Cmax; if (c < best.value) best = { value: c, perm: p }; });
    return best;
  }

  // ------------------------------------------------------------ 作业车间的析取图
  // 工序编号：按作业、再按作业里的第几道排。orders[m] = 机器 m 上的作业顺序（每个作业在一台机器上只出现一次）。
  function jsOps(jobs) {
    var ops = [], idx = {};
    jobs.forEach(function (job, j) { job.forEach(function (op, k) { idx[j + "," + k] = ops.length; ops.push({ job: j, k: k, machine: op[0], dur: op[1] }); }); });
    return { ops: ops, idx: idx };
  }
  function jsEval(jobs, orders) {
    var G = jsOps(jobs), ops = G.ops, n = ops.length, succ = ops.map(function () { return []; }), indeg = new Array(n).fill(0), arcs = [];
    function arc(a, b, kind) { succ[a].push(b); indeg[b]++; arcs.push({ from: a, to: b, kind: kind }); }
    jobs.forEach(function (job, j) { for (var k = 0; k + 1 < job.length; k++) arc(G.idx[j + "," + k], G.idx[j + "," + (k + 1)], "route"); });
    Object.keys(orders).forEach(function (m) {
      var seq = orders[m].map(function (j) { var k = jobs[j].findIndex(function (op) { return op[0] === Number(m); }); return G.idx[j + "," + k]; });
      for (var i = 0; i + 1 < seq.length; i++) arc(seq[i], seq[i + 1], "machine");
    });
    var start = new Array(n).fill(0), pred = new Array(n).fill(-1), q = [], seen = 0, i;
    for (i = 0; i < n; i++) if (indeg[i] === 0) q.push(i);
    while (q.length) {
      var u = q.shift(); seen++;
      succ[u].forEach(function (v) { if (start[u] + ops[u].dur > start[v] || (start[u] + ops[u].dur === start[v] && pred[v] < 0)) { start[v] = start[u] + ops[u].dur; pred[v] = u; } if (--indeg[v] === 0) q.push(v); });
    }
    if (seen < n) return { feasible: false, ops: ops, arcs: arcs };
    var last = 0; for (i = 0; i < n; i++) if (start[i] + ops[i].dur > start[last] + ops[last].dur) last = i;
    var crit = [], x = last; while (x >= 0) { crit.push(x); x = pred[x]; }
    return { feasible: true, makespan: start[last] + ops[last].dur, start: start, ops: ops, idx: G.idx, arcs: arcs, critical: crit.reverse() };
  }
  // 每台机器上的作业顺序：枚举全部组合（作业数 ≤ 4 时用）
  function jsOpt(jobs) {
    var nm = 0; jobs.forEach(function (job) { job.forEach(function (op) { nm = Math.max(nm, op[0] + 1); }); });
    var perms = permutations(jobs.length), best = { value: Infinity, orders: null }, count = 0, feasible = 0, cur = {};
    (function go(m) {
      if (m === nm) { count++; var r = jsEval(jobs, cur); if (r.feasible) { feasible++; if (r.makespan < best.value) best = { value: r.makespan, orders: JSON.parse(JSON.stringify(cur)) }; } return; }
      perms.forEach(function (p) { cur[m] = p; go(m + 1); });
    })(0);
    best.total = count; best.feasibleCount = feasible;
    return best;
  }
  function jsLowerBound(jobs) {
    var load = {}, jl = 0;
    jobs.forEach(function (job) { var s = 0; job.forEach(function (op) { s += op[1]; load[op[0]] = (load[op[0]] || 0) + op[1]; }); jl = Math.max(jl, s); });
    return Math.max(jl, Math.max.apply(null, Object.keys(load).map(function (k) { return load[k]; })));
  }

  var add = { flowSchedule: flowSchedule, johnson: johnson, neh: neh, enumFlow: enumFlow, permutations: permutations, jsEval: jsEval, jsOpt: jsOpt, jsLowerBound: jsLowerBound };
  for (var key in add) Core[key] = add[key];
  if (typeof module !== "undefined" && module.exports) module.exports = Core;
})(this);
