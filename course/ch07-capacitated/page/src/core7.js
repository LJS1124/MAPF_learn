/* core7.js — 第 7 章页面的计算内核（无 DOM 依赖，可在 Node 中单独验证）
 * 依赖 core.js 的单纯形（Core.simplex）。
 *
 * - knapLP / knapDP / knapBB：0-1 背包的 LP 上界（Dantzig）、动态规划、带 LP 上界的分支定界（记录整棵搜索树）
 * - gapLP / gapEnum / gapCutLoop / gapBB：广义指派（车有载重上限）的 LP、枚举、覆盖割循环、分支定界
 * - ffd / binOpt / binLB：装载（装箱）的首次适应递减、最优、下界
 */
(function (root) {
  "use strict";
  var Core = typeof module !== "undefined" && module.exports ? require("../../../ch05-assignment/page/src/core.js") : root.Core;
  var EPS = 1e-9;

  function fill(n, x) { return new Array(n).fill(x); }
  function range(n) { var o = []; for (var i = 0; i < n; i++) o.push(i); return o; }

  // ------------------------------------------------------------ 背包
  // 按价值/重量从大到小排序的下标
  function ratioOrder(v, w) {
    return range(v.length).sort(function (a, b) { return v[b] * w[a] - v[a] * w[b] || a - b; });
  }
  // fixed[j] = 1 必选，0 必不选，-1 未定。返回 { bound, x, frac, base, room, feasible }
  function knapLP(v, w, cap, fixed) {
    var n = v.length, x = fill(n, 0), room = cap, base = 0, j;
    fixed = fixed || fill(n, -1);
    for (j = 0; j < n; j++) if (fixed[j] === 1) { x[j] = 1; room -= w[j]; base += v[j]; }
    if (room < 0) return { feasible: false, bound: -Infinity, x: x, frac: -1 };
    var order = ratioOrder(v, w), frac = -1, bound = base, k;
    for (k = 0; k < n; k++) {
      j = order[k];
      if (fixed[j] !== -1) continue;
      if (w[j] <= room) { x[j] = 1; room -= w[j]; bound += v[j]; }
      else { x[j] = room / w[j]; bound += v[j] * room / w[j]; frac = room > 0 ? j : -1; room = 0; break; }
    }
    return { feasible: true, bound: bound, x: x, frac: frac, base: base, order: order };
  }

  function knapDP(v, w, cap) {
    var n = v.length, dp = [], i, c;
    for (i = 0; i <= n; i++) dp.push(fill(cap + 1, 0));
    for (i = 1; i <= n; i++) for (c = 0; c <= cap; c++) {
      dp[i][c] = dp[i - 1][c];
      if (w[i - 1] <= c && dp[i - 1][c - w[i - 1]] + v[i - 1] > dp[i][c]) dp[i][c] = dp[i - 1][c - w[i - 1]] + v[i - 1];
    }
    var take = fill(n, 0); c = cap;
    for (i = n; i >= 1; i--) if (dp[i][c] !== dp[i - 1][c]) { take[i - 1] = 1; c -= w[i - 1]; }
    return { value: dp[n][cap], take: take };
  }

  // 分支定界：深度优先，先“选”后“不选”，在 LP 解的分数变量上分支；价值为整数，bound < incumbent + 1 时剪枝。
  // 返回 { nodes: [...], best, take }，节点按创建（访问）顺序排列。
  function knapBB(v, w, cap) {
    var n = v.length, nodes = [], best = 0, take = fill(n, 0);
    function visit(parent, item, choice, fixed, depth) {
      var lp = knapLP(v, w, cap, fixed), node = { id: nodes.length, parent: parent, item: item, choice: choice, depth: depth, bound: lp.bound, status: "", x: lp.x, fixed: fixed.slice() };
      nodes.push(node);
      if (!lp.feasible) { node.status = "infeasible"; return; }
      if (Math.floor(lp.bound + 1e-9) <= best) { node.status = "pruned"; return; }
      if (lp.frac < 0) {              // LP 解是整数：新的最优
        best = Math.round(lp.bound); take = lp.x.map(function (t) { return Math.round(t); });
        node.status = "integer"; node.value = best; return;
      }
      node.status = "branch"; node.frac = lp.frac;
      var f1 = fixed.slice(); f1[lp.frac] = 1; visit(node.id, lp.frac, 1, f1, depth + 1);
      var f0 = fixed.slice(); f0[lp.frac] = 0; visit(node.id, lp.frac, 0, f0, depth + 1);
    }
    visit(-1, -1, null, fill(n, -1), 0);
    return { nodes: nodes, best: best, take: take };
  }

  // ------------------------------------------------------------ 广义指派：m 辆车 × n 个任务，任务 j 重 w[j]，车 i 载重 Q[i]
  // opts.cuts = [{ i, S: [任务下标], k }]：车 i 上 S 里的任务至多选 k 个
  // opts.fixes = [{ i, j, val }]：val = 1 把任务 j 指给车 i；val = 0 禁止
  function gapLP(C, w, Q, opts) {
    opts = opts || {};
    var m = C.length, n = w.length, nv = m * n, Aeq = [], beq = [], Aub = [], bub = [], i, j, r;
    for (j = 0; j < n; j++) { r = fill(nv, 0); for (i = 0; i < m; i++) r[i * n + j] = 1; Aeq.push(r); beq.push(1); }
    for (i = 0; i < m; i++) { r = fill(nv, 0); for (j = 0; j < n; j++) r[i * n + j] = w[j]; Aub.push(r); bub.push(Q[i]); }
    (opts.cuts || []).forEach(function (c) { var q = fill(nv, 0); c.S.forEach(function (t) { q[c.i * n + t] = 1; }); Aub.push(q); bub.push(c.k); });
    (opts.fixes || []).forEach(function (f) {
      var q = fill(nv, 0); q[f.i * n + f.j] = 1;
      if (f.val === 1) { Aeq.push(q); beq.push(1); } else { Aub.push(q); bub.push(0); }
    });
    var res = Core.simplex({ c: [].concat.apply([], C), Aeq: Aeq, beq: beq, Aub: Aub, bub: bub });
    if (res.status !== "optimal") return { status: res.status };
    var x = range(m).map(function (a) { return range(n).map(function (b) { var t = res.x[a * n + b]; return Math.abs(t) < 1e-9 ? 0 : Math.abs(t - 1) < 1e-9 ? 1 : t; }); });
    return { status: "optimal", value: res.value, x: x };
  }

  // 枚举：每个任务选一辆车，载重可行。返回 { value, assign, feasibleCount }；无解时 value = null
  function gapEnum(C, w, Q) {
    var m = C.length, n = w.length, load = fill(m, 0), cur = fill(n, -1), best = null, bestA = null, count = 0;
    (function go(j, cost) {
      if (j === n) { count++; if (best === null || cost < best) { best = cost; bestA = cur.slice(); } return; }
      for (var i = 0; i < m; i++) {
        if (load[i] + w[j] > Q[i]) continue;
        load[i] += w[j]; cur[j] = i; go(j + 1, cost + C[i][j]); load[i] -= w[j]; cur[j] = -1;
      }
    })(0, 0);
    return { value: best, assign: bestA, feasibleCount: count };
  }

  // 覆盖割的分离：对车 i，按 x 从大到小取任务，直到总重量超过载重，得到一个“覆盖”；去掉多余的任务使之极小；
  // 若 Σx 超过 |S| − 1，就得到一条被违反的割 Σ_{j∈S} x_ij ≤ |S| − 1。
  function separateCovers(x, w, Q) {
    var out = [];
    x.forEach(function (row, i) {
      var order = range(row.length).sort(function (a, b) { return row[b] - row[a] || w[a] - w[b] || a - b; }), S = [], tot = 0, t;
      for (t = 0; t < order.length; t++) {
        var j = order[t];
        if (row[j] < 1e-6) break;
        S.push(j); tot += w[j];
        if (tot > Q[i]) break;
      }
      if (tot <= Q[i]) return;
      S.slice().sort(function (a, b) { return row[a] - row[b] || a - b; }).forEach(function (j) {
        if (tot - w[j] > Q[i]) { S.splice(S.indexOf(j), 1); tot -= w[j]; }
      });
      var s = 0; S.forEach(function (j) { s += row[j]; });
      if (s > S.length - 1 + 1e-6) out.push({ i: i, S: S.slice().sort(function (a, b) { return a - b; }), k: S.length - 1, lhs: s });
    });
    return out;
  }
  function sameCut(a, b) { return a.i === b.i && a.k === b.k && a.S.join(",") === b.S.join(","); }

  // 根节点上反复：解 LP → 分离覆盖割 → 加入 → 再解
  function gapCutLoop(C, w, Q, maxRounds) {
    var cuts = [], rounds = [], r, lp, x;
    for (r = 0; r < (maxRounds || 12); r++) {
      lp = gapLP(C, w, Q, { cuts: cuts });
      if (lp.status !== "optimal") break;
      var found = separateCovers(lp.x, w, Q).filter(function (c) { return !cuts.some(function (d) { return sameCut(c, d); }); });
      rounds.push({ value: lp.value, x: lp.x, ncuts: cuts.length, added: found });
      if (!found.length) break;
      cuts = cuts.concat(found);
    }
    return { rounds: rounds, cuts: cuts, final: rounds.length ? rounds[rounds.length - 1] : null };
  }

  // 分支定界（用 LP）：在“最不确定”的任务上分支——它的最大 x 最小；先试把它指给 x 最大的车，再试禁止这一对。
  // 费用为整数：lp > incumbent − 1 时剪枝。返回 { nodes, best, assign, lpSolves }
  function gapBB(C, w, Q, opts) {
    opts = opts || {};
    var m = C.length, n = w.length, cuts = opts.cuts || [], nodes = 0, best = Infinity, bestA = null, limit = opts.limit || 20000;
    function go(fixes) {
      if (nodes >= limit) return;
      nodes++;
      var lp = gapLP(C, w, Q, { cuts: cuts, fixes: fixes });
      if (lp.status !== "optimal" || lp.value > best - 1 + 1e-6) return;
      var bj = -1, bm = 2, j, i;
      for (j = 0; j < n; j++) {
        var mx = 0; for (i = 0; i < m; i++) mx = Math.max(mx, lp.x[i][j]);
        if (mx < 1 - 1e-6 && mx < bm) { bm = mx; bj = j; }
      }
      if (bj < 0) {
        if (lp.value < best) { best = lp.value; bestA = range(n).map(function (t) { for (var a = 0; a < m; a++) if (lp.x[a][t] > 0.5) return a; return -1; }); }
        return;
      }
      var bi = 0; for (i = 1; i < m; i++) if (lp.x[i][bj] > lp.x[bi][bj]) bi = i;
      go(fixes.concat([{ i: bi, j: bj, val: 1 }]));
      go(fixes.concat([{ i: bi, j: bj, val: 0 }]));
    }
    go([]);
    return { nodes: nodes, best: best === Infinity ? null : Math.round(best), assign: bestA, hitLimit: nodes >= limit };
  }

  // ------------------------------------------------------------ 装载（装箱）：把重量为 w 的托盘装进容量为 Q 的车次，车次数最少
  function ffd(w, Q) {
    var order = range(w.length).sort(function (a, b) { return w[b] - w[a] || a - b; }), bins = [];
    order.forEach(function (j) {
      for (var b = 0; b < bins.length; b++) if (bins[b].load + w[j] <= Q) { bins[b].items.push(j); bins[b].load += w[j]; return; }
      bins.push({ items: [j], load: w[j] });
    });
    return bins;
  }
  function binLB(w, Q) { var s = 0; w.forEach(function (x) { s += x; }); return Math.ceil(s / Q - 1e-9); }
  // 最优车次数（回溯 + 对称剪枝；托盘数不大时可用）
  function binOpt(w, Q) {
    var order = range(w.length).sort(function (a, b) { return w[b] - w[a] || a - b; }), best = ffd(w, Q), bestBins = best.map(function (b) { return b.items.slice(); }), lb = binLB(w, Q), nb = best.length;
    var loads = [], items = [];
    (function go(k) {
      if (nb <= lb) return;
      if (k === order.length) { if (loads.length < nb) { nb = loads.length; bestBins = items.map(function (a) { return a.slice(); }); } return; }
      var j = order[k], seen = {}, b;
      for (b = 0; b < loads.length; b++) {
        if (loads[b] + w[j] > Q || seen[loads[b]]) continue;
        seen[loads[b]] = true; loads[b] += w[j]; items[b].push(j); go(k + 1); items[b].pop(); loads[b] -= w[j];
      }
      if (loads.length + 1 < nb) { loads.push(w[j]); items.push([j]); go(k + 1); loads.pop(); items.pop(); }
    })(0);
    return { bins: nb, assign: bestBins };
  }

  var add = { ratioOrder: ratioOrder, knapLP: knapLP, knapDP: knapDP, knapBB: knapBB, gapLP: gapLP, gapEnum: gapEnum,
    separateCovers: separateCovers, gapCutLoop: gapCutLoop, gapBB: gapBB, ffd: ffd, binLB: binLB, binOpt: binOpt };
  for (var key in add) Core[key] = add[key];
  if (typeof module !== "undefined" && module.exports) module.exports = Core;
  else root.Core = Core;
})(this);
