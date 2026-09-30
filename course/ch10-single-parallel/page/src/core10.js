/* core10.js — 第 10 章页面的计算内核（无 DOM 依赖）。在第 9 章的 core9.js（evaluate、RULES、moore、listSchedule、optCmax）之上扩展。
 * - bubblePath：按“相邻两个作业，前一个应当排在后一个之后就交换”的规则，一步步把顺序换成规则顺序（交换论证的动画）
 * - mooreTrace：Moore–Hodgson 的逐步过程
 * - worstListInstance / lptWorstInstance：列表调度、LPT 的最坏实例；lptOrder；mcnaughton：可中断时的绕圈法；p2Opt：P2||Cmax 的子集和动态规划
 */
(function (root) {
  "use strict";
  var Core = typeof module !== "undefined" && module.exports ? require("../../../ch09-scheduling-language/page/src/core9.js") : root.Core;
  function range(n) { var o = []; for (var i = 0; i < n; i++) o.push(i); return o; }

  // ------------------------------------------------------------ 交换论证
  // 规则 rule：SPT（按 p）、WSPT（按 p/w）、EDD（按 d）。a 应当排在 b 前面（严格）吗？
  function before(rule, J, a, b) {
    if (rule === "SPT") return J.p[a] < J.p[b];
    if (rule === "WSPT") return J.p[a] * J.w[b] < J.p[b] * J.w[a];
    return J.d[a] < J.d[b];
  }
  // 从 seq0 出发，每一步找第一个“后一个应当排在前一个之前”的相邻对，交换。返回 { steps: [{ pos, pair, seq }], final }
  function bubblePath(J, seq0, rule) {
    var seq = seq0.slice(), steps = [], moved = true;
    while (moved) {
      moved = false;
      for (var i = 0; i + 1 < seq.length; i++) {
        if (before(rule, J, seq[i + 1], seq[i])) {
          var pair = [seq[i], seq[i + 1]], t = seq[i]; seq[i] = seq[i + 1]; seq[i + 1] = t;
          steps.push({ pos: i, pair: pair, seq: seq.slice() }); moved = true; break;
        }
      }
    }
    return { steps: steps, final: seq };
  }

  // ------------------------------------------------------------ Moore–Hodgson 的过程
  function mooreTrace(J) {
    var order = Core.RULES.EDD(J), on = [], t = 0, frames = [];
    order.forEach(function (j) {
      on.push(j); t += J.p[j];
      var late = t > J.d[j], removed = null;
      var f = { job: j, t: t, late: late, on: on.slice(), removed: null, tAfter: t };
      if (late) {
        removed = on.reduce(function (b, x) { return J.p[x] > J.p[b] ? x : b; }, on[0]);
        on.splice(on.indexOf(removed), 1); t -= J.p[removed];
        f.removed = removed; f.tAfter = t; f.onAfter = on.slice();
      } else f.onAfter = on.slice();
      frames.push(f);
    });
    var removedAll = frames.filter(function (f) { return f.removed !== null; }).map(function (f) { return f.removed; });
    return { frames: frames, onTime: on.slice(), late: removedAll, sequence: on.concat(removedAll) };
  }

  // ------------------------------------------------------------ 并行机
  function lptOrder(p) { return range(p.length).sort(function (a, b) { return p[b] - p[a] || a - b; }); }
  // 列表调度的最坏实例：m(m−1) 个单位作业排在前面，最后来一个长度为 m 的作业。最优 = m（长作业独占一台）
  function worstListInstance(m) {
    var p = []; for (var i = 0; i < m * (m - 1); i++) p.push(1); p.push(m);
    return { p: p, order: range(p.length), opt: m };
  }
  // LPT 的最坏实例：大小 2m−1, 2m−1, 2m−2, 2m−2, …, m+1, m+1 各两个，再加 3 个 m。最优 = 3m
  function lptWorstInstance(m) {
    var p = []; for (var v = 2 * m - 1; v >= m + 1; v--) { p.push(v); p.push(v); } p.push(m, m, m);
    return { p: p, order: lptOrder(p), opt: 3 * m };
  }
  function identical(p, m) { var P = []; for (var i = 0; i < m; i++) P.push(p.slice()); return P; }
  // McNaughton：可中断时，C = max(最长作业, 总量/m) 总能达到。把作业排成一行，每台机器装满 C 再换下一台，装不下的作业断开。
  function mcnaughton(p, m) {
    var tot = p.reduce(function (a, b) { return a + b; }, 0), C = Math.max(Math.max.apply(null, p), tot / m), slots = range(m).map(function () { return []; }), i = 0, t = 0;
    p.forEach(function (x, j) {
      var rest = x;
      while (rest > 1e-9) {
        var take = Math.min(rest, C - t);
        slots[i].push({ job: j, start: t, end: t + take }); t += take; rest -= take;
        if (C - t < 1e-9 && i < m - 1) { i++; t = 0; }
      }
    });
    return { Cmax: C, slots: slots };
  }
  // P2||Cmax：子集和动态规划（伪多项式）：最接近总量一半的可达子集和
  function p2Opt(p) {
    var tot = p.reduce(function (a, b) { return a + b; }, 0), half = Math.floor(tot / 2), reach = new Array(half + 1).fill(false); reach[0] = true;
    p.forEach(function (x) { for (var s = half; s >= x; s--) if (reach[s - x]) reach[s] = true; });
    for (var s = half; s >= 0; s--) if (reach[s]) return { Cmax: tot - s, half: s };
    return { Cmax: tot, half: 0 };
  }


  // 最坏实例的最优排法（构造出来的，不靠搜索）：返回每台机器上的 [{ job, start, end }]
  function packSlots(groups, p) { return groups.map(function (g) { var t = 0; return g.map(function (j) { var s = { job: j, start: t, end: t + p[j] }; t += p[j]; return s; }); }); }
  function worstListOptSlots(m) {
    var inst = worstListInstance(m), p = inst.p, longJob = p.length - 1, groups = [[longJob]], k = 0;
    for (var i = 1; i < m; i++) { var g = []; for (var t = 0; t < m; t++) g.push(k++); groups.push(g); }
    return packSlots(groups, p);
  }
  function lptWorstOptSlots(m) {
    var p = lptWorstInstance(m).p, byVal = {}, groups = [], used = {};
    p.forEach(function (x, j) { (byVal[x] = byVal[x] || []).push(j); });
    for (var a = 2 * m - 1; a >= m + 1; a--) { if (used[a]) continue; var b = 3 * m - a; groups.push([byVal[a].shift(), byVal[b].shift()]); }
    // 上面把每个大小的两个作业都配对掉：a 与 3m−a 各取一个
    groups.push(byVal[m].slice(0, 3));
    return packSlots(groups, p);
  }

  var add = { worstListOptSlots: worstListOptSlots, lptWorstOptSlots: lptWorstOptSlots, before: before, bubblePath: bubblePath, mooreTrace: mooreTrace, lptOrder: lptOrder, worstListInstance: worstListInstance, lptWorstInstance: lptWorstInstance, identical: identical, mcnaughton: mcnaughton, p2Opt: p2Opt };
  for (var key in add) Core[key] = add[key];
  if (typeof module !== "undefined" && module.exports) module.exports = Core;
})(this);
