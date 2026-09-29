/* main.js — 先预测、自测、目录高亮、页面启动 */
(function () {
  // ------------------------------------------------------------ 先预测
  var p1 = prediction($("p1"), {
    q: "T1–T4 已按最优派好（T1←V3，T2←V5，T3←V2，T4←V4）。T5 到达，此刻空闲的车只有 V1（82 s）和 V6（74 s）。总时间增量最小的做法是？",
    opts: ["派最便宜的空闲车 V6，不动别人（+74 s）", "V5 改做 T5，T2 改派给空闲的 V6（+62 s）", "V5 改做 T5，T2 改派给 V2，T3 改派给 V1（+54 s）"], ans: 2,
    explain: "不改派要 74 s；让 T2 改给 V6 是 10 + 75 − 23 = 62 s；沿改派链 T5←V5、T2→V2、T3→V1 是 10 + (61 − 23) + (38 − 32) = 54 s。被改动的两个任务都变贵了，但 T5 省得更多。下面的图已经解锁，点“下一个到达”看这条链。"
  });
  p1.onReveal(gate($("fig1").querySelector(".fig-body"), p1));

  var p2 = prediction($("p2"), {
    q: "给 3 任务 × 3 车的指派约束再加一行。下面哪种加法会让矩阵不再全单模？",
    opts: ["“V1、V2 合计至多接 1 个任务”", "“V1→T1 与 V2→T2 不能同时出现”", "两种都会", "两种都不会"], ans: 1,
    explain: "第一种把两辆车当成一个整体来限额，行仍然分成两组，还是全单模。第二种把两条互不相干的边绑在一起，检查器会找到行列式 ±2 的子式。下面的检查器已经解锁。"
  });
  p2.onReveal(gate($("fig4").querySelector(".fig-body"), p2));

  var p3 = prediction($("p3"), {
    q: "总时间最优的派法（124 s）里，最晚到达是 61 s。把最晚到达的上限从 61 s 收紧一秒，到 60 s，总时间最少要多花多少？",
    opts: ["约 1 s", "约 4 s", "12 s", "22 s"], ans: 2,
    explain: "V2 是唯一适合换层的车。上限 60 s 让它不能再去 T2（61 s）：T2 要让给 V5，V5 原来的 T5 转给 V2（60 s），总时间 136 s，多 12 s。再压到 49 s 还要多 10 s，一共 22 s。下面的图已经解锁。"
  });
  p3.onReveal(gate($("fig7").querySelector(".fig-body"), p3));

  // ------------------------------------------------------------ 自测
  var QUIZ = [
    { q: "已经按最优派好前 k 个任务，第 k + 1 个到达。得到新的最优派法，最直接的做法是？",
      o: ["把新任务派给最便宜的空闲车，不动别人", "从新任务出发，在约化成本上找一条通往空闲车的最短交替路，沿路改派", "把 k + 1 个任务重新写成 MIP 解一遍", "把新任务排到队尾，下一个窗口再说"], a: 1,
      w: "最短交替路就是最便宜的改派链，用 Dijkstra 在约化成本上找。“不改派”只是长度为 1 的链，可能比最优多付 20 s（默认场景的 T5）。从头重算也能得到同一个答案，但这一题问的是最直接的做法。" },
    { q: "T5 的边际成本是 54 = 10 + 44。这两个数分别是什么？",
      o: ["10 是直接选最便宜的车的成本 u₀，44 是改派链多付的部分 D", "10 是链的长度，44 是价格", "10 是 V5 的车价，44 是 T5 的价格", "没有含义，只是碰巧加起来"], a: 0,
      w: "边际成本 = u₀ + D。u₀ = min(c + v) 是“直接拿最便宜的车”的成本，D 是交替路上约化成本之和，是为了不让被占用的任务无车可用而多付的部分。它也等于新任务的最终价格。" },
    { q: "涨价之后，已经配对的边为什么仍是紧边？",
      o: ["配对的车和任务同时涨了同样多，约化成本 c + v − u 不变", "配对的边不参与涨价", "涨价量取 0", "最后会重新配对一遍"], a: 0,
      w: "已扫描的车涨 D − d，它当前的任务同涨 D − d。约化成本 c + v − u 里 v 和 u 一个加一个减，差不变，仍是 0。" },
    { q: "指派约束矩阵的方子式，行列式为什么只能是 0、+1、−1？关键的一步是？",
      o: ["矩阵的元素都是 0 或 1", "若子矩阵每列都恰有两个 1（一个在任务行、一个在车行），任务行之和等于车行之和，行线性相关，行列式为 0；否则按只有一个 1 的列展开，用归纳", "任何方阵都可逆", "求解器返回的解总是整数"], a: 1,
      w: "只有 0、1 的元素不足以保证，二部结构才是关键：行分成两组，每列在两组里各有一个 1。冲突对、奇圈都破坏了这一点。" },
    { q: "给指派约束加下面哪一行，会破坏全单模？",
      o: ["V1、V2 合计至多接 1 个任务", "V1→T1 与 V1→T2 不能同时出现（同一辆车）", "V1→T1 与 V2→T2 不能同时出现", "V3 至多接 1 个任务（已有的行）"], a: 2,
      w: "只有第三个把两条互不相干的边绑在一起。第一个是嵌套或不相交的车组名额，第二个被“V1 至多一个任务”蕴含，第四个本来就在。" },
    { q: "三辆车两两组队（每辆车至多一个组），三个收益都是 10。LP 值和整数最优分别是多少？怎么修复？",
      o: ["LP 15，整数 10；加奇集割 x_AB + x_BC + x_AC ≤ 1", "LP 10，整数 15；再加变量", "都是 15，不用修复", "LP 30，整数 10；换整数求解器"], a: 0,
      w: "三条边各取 ½，每辆车的总量是 1，总收益 15；真实组队只能选一组，收益 10。三个点里至多配成 ⌊3/2⌋ = 1 对，奇集割把 ½ 的点切掉。" },
    { q: "禁行边用 c = 1e6 表示，而这个窗口其实无解。这段代码会怎样？",
      o: ["抛出异常", "仍然返回一个“最优解”，总时间含 1e6，派法用到了禁行边；必须事后检查，并返回 Hall 证书", "自动返回空派法", "返回不含禁行边的次优解"], a: 1,
      w: "求解器只看矩阵，不知道 1e6 是“禁止”。有解时两种写法一样，无解时它照样给出一个含 M 的“最优解”。要检查结果里有没有用到 M，无解就返回 Hall 证书。" },
    { q: "“最晚到达最短”为什么不必写成 MIP？",
      o: ["因为 MIP 求不出来", "二分阈值 τ，只保留 c ≤ τ 的边，判断能否配满；最小的可行 τ 就是答案。配不满时有 Hall 证书说明谁在抢谁", "因为总时间才是唯一合理的目标", "因为必须用启发式"], a: 1,
      w: "阈值加匹配是精确的多项式算法，没有 gap。扫描 τ，每个 τ 再用一次匈牙利求最小总时间，就得到（最晚到达，总时间）的整条帕累托阶梯。" }
  ];
  var qState = {};
  function renderQuiz() {
    var box = clear($("quiz")), score = 0, answered = 0;
    QUIZ.forEach(function (it, k) {
      var st = qState[k], item = el("div", { cls: "qitem" });
      item.appendChild(el("div", { cls: "qh" }, [el("span", { cls: "qn", text: "Q" + (k + 1) }), el("span", { text: it.q })]));
      var opts = el("div", { cls: "qopts" });
      it.o.forEach(function (o, i) {
        var b = el("button", { type: "button", text: o, onclick: function () { qState[k] = i; renderQuiz(); } });
        if (st != null) { b.disabled = true; if (i === it.a) b.classList.add("right"); else if (i === st) b.classList.add("wrong"); }
        opts.appendChild(b);
      });
      item.appendChild(opts);
      if (st != null) {
        answered++; if (st === it.a) score++;
        item.appendChild(el("div", { cls: "qx" }, [el("b", { cls: st === it.a ? "ok" : "no", text: st === it.a ? "正确。" : "不对。" }), " " + it.w]));
      }
      box.appendChild(item);
    });
    box.appendChild(el("div", { cls: "qsum" }, [el("span", { cls: "score", text: score + " / " + QUIZ.length }),
      el("span", { style: "color:var(--muted)", text: answered < QUIZ.length ? "已答 " + answered + " 题" : score >= 7 ? "本章掌握得不错，可以去做 Lab 了。" : "回看对应小节，再做一遍。" }),
      el("button", { cls: "btn", type: "button", text: "重做", onclick: function () { qState = {}; renderQuiz(); } })]));
  }
  renderQuiz();

  // ------------------------------------------------------------ 目录高亮
  var links = Array.prototype.slice.call(document.querySelectorAll(".toc a"));
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) { if (e.isIntersecting) links.forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id); }); });
    }, { rootMargin: "-20% 0px -70% 0px" });
    document.querySelectorAll("section.chap").forEach(function (s) { io.observe(s); });
  }

  // ------------------------------------------------------------ 环境信息
  var envTxt = "SciPy " + D.env.scipy + " · HiGHS " + D.env.highs;
  $("envline").textContent = envTxt; $("envline2").textContent = envTxt;
})();
