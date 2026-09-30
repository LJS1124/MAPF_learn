/* fig3.js — 图 7-3：广义指派。载重 Q 加减 Δ：LP 与整数最优的差；载重不起作用时回到第 5 章的整数性 */
(function () {
  var G = D.gap, S = { d: 0 };
  function draw() {
    var Q = G.Q.map(function (q) { return q + S.d; }), lp = Core.gapLP(G.C, G.w, Q), en = Core.gapEnum(G.C, G.w, Q);
    var ok = lp.status === "optimal";
    drawGap($("gapTbl"), G.C, G.w, Q, ok ? lp.x : null, en.assign);
    var st = clear($("gapStats"));
    st.appendChild(stat("载重", Q.join(" / "), "默认 " + G.Q.join(" / ") + (S.d ? "，每辆车" + (S.d > 0 ? "加 " : "减 ") + Math.abs(S.d) : "")));
    st.appendChild(stat("LP 值", ok ? n0(Math.round(lp.value * 100) / 100) : "无解", "页面内置单纯形"));
    var gap = ok && en.value != null ? en.value - lp.value : null;
    st.appendChild(stat("整数最优", en.value == null ? "无解" : String(en.value), "枚举全部可行派法（" + commas(en.feasibleCount) + " 种）", gap != null && gap > 1e-7));
    var fr = ok ? gapFracTasks(lp.x, G.w) : [], say;
    if (!ok) say = "<p>载重太小，10 个任务一共 " + sum(G.w) + " 个托盘，三辆车合计只能载 " + sum(Q) + "，装不下。LP 也无解。</p>";
    else if (gap > 1e-7) say = "<p><b class=\"key\">LP " + n0(Math.round(lp.value * 100) / 100) + "，整数最优 " + en.value + "，差 " + n0(Math.round(gap * 100) / 100) + "。</b>橙色的格子是分数：" + fr.map(function (t) { return "T" + (t + 1); }).join("、") + " 被劈给了几辆车。绿框是整数最优的派法。</p><p>这就是载重的代价：一辆车装不下一个完整的托盘，LP 就让另一辆车装它的剩下部分，现实里做不到。</p>";
    else if (fr.length === 0) say = "<p>LP 的解是整数，值 " + en.value + " 与整数最优相同。" + (Math.min.apply(null, Q) >= Math.max.apply(null, G.w) && sum(Q) >= 0 && S.d >= 2 ? "载重已经大到不起作用：每个任务都拿走最便宜的车，这就是第 5 章去掉“每车一个任务”限制之后的问题，整数性回来了。" : "") + "</p>";
    else say = "<p>LP 的值 " + en.value + " 恰好等于整数最优，但求解器返回的最优顶点里 " + fr.map(function (t) { return "T" + (t + 1); }).join("、") + " 仍是分数（另有整数的最优解）。整数性没有保证，这一次运气好。</p>";
    $("gapSay").innerHTML = say;
    $("gapDv").textContent = (S.d > 0 ? "+" : S.d < 0 ? "−" : "") + Math.abs(S.d);
  }
  var sl = $("gapD");
  sl.addEventListener("input", function () { S.d = Number(sl.value); draw(); });
  draw();
  window.__fig3 = S;
})();
