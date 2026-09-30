/* fig3.js — 图 10-3：并行机。列表调度与 LPT 的最坏实例（近似比），可中断时的绕圈法 */
(function () {
  var S = { mode: "list", m: 4 };
  function render() {
    var m = S.mode === "pmtn" ? 3 : S.m, svg = $("pmGantt"), say, st = clear($("pmStats"));
    clear(svg);
    if (S.mode === "pmtn") {
      var p = [9, 9, 9, 3], r = Core.mcnaughton(p, 3), slots = r.slots.map(function (sl) { return sl.map(function (x) { return x; }); });
      drawMachines(svg, slots, p, { span: 12 });
      st.appendChild(stat("C_max（可中断）", n0(r.Cmax), "= max(最长作业 9, 总量 30 ÷ 3)"));
      st.appendChild(stat("下界", "10", "任何排法都不可能更小"));
      st.appendChild(stat("不可中断时的最优", String(Core.optCmax(Core.identical(p, 3)).Cmax), "4 个作业、3 台机器，枚举得到"));
      say = "<p>McNaughton 绕圈法：把作业排成一行，第 1 台机器装到 10 就换下一台，装不下的作业断开。J2 被拆成 9 = 1 + 8：1 个单位在机器 1 的最后（时刻 9–10），8 个单位在机器 2 的开头（时刻 0–8）；J3 被拆成 2 + 7。同一个作业的两段在时间上不重叠，所以是合法的。</p><p>允许中断时，C_max 恰好等于下界 max(最长作业, 总量 ÷ m)，所以 P | prmp | C_max 是多项式可解的；不可中断的 P | | C_max 是 NP 难的。</p>";
    } else {
      var inst = S.mode === "list" ? Core.worstListInstance(m) : Core.lptWorstInstance(m), P = Core.identical(inst.p, m), ls = Core.listSchedule(P, inst.order), optS = S.mode === "list" ? Core.worstListOptSlots(m) : Core.lptWorstOptSlots(m);
      var span = Math.max(ls.Cmax, inst.opt) + 1, top = 26;
      var g1 = drawMachines(svg, ls.slots, inst.p, { span: span, short: true, top: top });
      // 最优排法画在下面：另开一个 svg 区域
      var svg2 = $("pmGantt2"); clear(svg2);
      drawMachines(svg2, optS, inst.p, { span: span, short: true, top: 8 });
      var ratio = ls.Cmax / inst.opt, bound = S.mode === "list" ? 2 - 1 / m : 4 / 3 - 1 / (3 * m);
      st.appendChild(stat(S.mode === "list" ? "列表调度的 C_max" : "LPT 的 C_max", String(ls.Cmax), S.mode === "list" ? "先排 " + m * (m - 1) + " 个单位作业，最后来长度 " + m + " 的" : "按 LPT（从大到小）", true));
      st.appendChild(stat("最优 C_max", String(inst.opt), "下面这张图给出构造出来的最优排法"));
      st.appendChild(stat("比值", f2(ratio), "理论上界 " + (S.mode === "list" ? "2 − 1/m" : "4/3 − 1/(3m)") + " = " + f2(bound)));
      say = S.mode === "list"
        ? "<p>前面的 " + m * (m - 1) + " 个单位作业把每台机器都平均地铺到 " + (m - 1) + "，最后来的长作业（长度 " + m + "）落在任意一台上，完工时间 " + (m - 1) + " + " + m + " = <b>" + (2 * m - 1) + "</b>。最优是让长作业独占一台，其余 " + m * (m - 1) + " 个单位作业平分到剩下 " + (m - 1) + " 台机器，每台 " + m + "，C_max = <b>" + m + "</b>。比值 (2m − 1)/m = 2 − 1/m，刚好等于 Graham 的上界。这个界是紧的。</p>"
        : "<p>这组作业有 " + (2 * m + 1) + " 个：" + "大小 " + (2 * m - 1) + "、" + (2 * m - 1) + "、" + (2 * m - 2) + "、" + (2 * m - 2) + "……直到 " + (m + 1) + "、" + (m + 1) + "（各两个），再加 3 个 " + m + "。LPT 先把大的均匀铺开，最后的 3 个 " + m + " 有一个被迫接在已经很满的机器后面，C_max = <b>" + (4 * m - 1) + "</b>。最优把大小相加为 " + 3 * m + " 的两个配成一台，最后三个 " + m + " 合成一台，C_max = <b>" + 3 * m + "</b>。比值 (4m − 1)/(3m) = 4/3 − 1/(3m)，正是 LPT 的上界。</p>";
      $("pmM").textContent = String(m);
    }
    $("pmSay").innerHTML = say;
    $("pmOptWrap").hidden = S.mode === "pmtn";
    $("pmMWrap").hidden = S.mode === "pmtn";
  }
  buildSeg($("pmMode"), [{ key: "list", label: "列表调度的最坏实例" }, { key: "lpt", label: "LPT 的最坏实例" }, { key: "pmtn", label: "可中断：绕圈法" }], function () { return S.mode; }, function (k) { S.mode = k; render(); });
  var sl = $("pmMs"); sl.addEventListener("input", function () { S.m = Number(sl.value); render(); });
  render();
  window.__fig3 = S;
})();
