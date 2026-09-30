/* main.js — 先预测、自测、目录高亮、页面启动 */
(function () {
  var p1 = prediction($("p1"), {
    q: "6 个作业在两台机器上的加工时间（a, b）：J1 (1,4)、J2 (9,9)、J3 (6,5)、J4 (3,2)、J5 (5,4)、J6 (1,5)。按 J1…J6 的顺序，C_max = 35。Johnson 规则得到的顺序，C_max 是多少？",
    opts: ["33", "31", "29", "27"], ans: 1,
    explain: "31。集合 1（a ≤ b）是 J1、J6、J2，按 a 升序；集合 2 是 J3、J5、J4，按 b 降序，得到 J1→J6→J2→J3→J5→J4。它等于枚举 720 种顺序的最小值。C_max 至少是 max(Σa + min b, min a + Σb) = 30，所以 29 和 27 不可能。下面的图已经解锁。"
  });
  p1.onReveal(gate($("fig1").querySelector(".fig-body"), p1));

  var p2 = prediction($("p2"), {
    q: "3 台机器、6 个作业（图 11-2 的数据），按 J1…J6 的顺序 C_max = 52。NEH 只评价 21 个候选，得到的 C_max 是多少？（枚举 720 种的最优值在选项之中。）",
    opts: ["46", "44", "42", "40"], ans: 1,
    explain: "44。NEH 比原顺序好 8，与最优 42 差 2。选项里 42 是最优值，NEH 没有保证能到；40 比最优还小，不可能。下面的图已经解锁。"
  });
  p2.onReveal(gate($("fig2").querySelector(".fig-body"), p2));

  var p3 = prediction($("p3"), {
    q: "3 个作业、3 台机器的作业车间。每台机器上的作业顺序各有 3! = 6 种，共 6 × 6 × 6 = 216 种组合。其中能对应可行调度（析取图无环）的有多少种？",
    opts: ["216", "150", "63", "27"], ans: 2,
    explain: "63。不到三分之一的组合是可行的，其余都会让某几个作业互相等待，析取图里出现环。这说明直接在机器顺序上搜索时，必须处理不可行的邻居。下面的图已经解锁。"
  });
  p3.onReveal(gate($("fig3").querySelector(".fig-body"), p3));

  var QUIZ = [
    { q: "置换流水车间里，排在第 j 位的作业在机器 k 上的完工时间 C_jk 怎么算？",
      o: ["C_jk = C_j,k−1 + p_jk", "C_jk = max(C_j−1,k, C_j,k−1) + p_jk", "C_jk = C_j−1,k + p_jk", "C_jk = min(C_j−1,k, C_j,k−1) + p_jk"], a: 1,
      w: "要等这台机器上一个作业做完（C_j−1,k），也要等自己在上一台机器上做完（C_j,k−1），取较晚的一个再加上自己的加工时间。" },
    { q: "Johnson 规则里，a > b 的作业为什么放在后面并按 b 从大到小排？",
      o: ["因为它们的 a 大", "最后一个作业在第二台机器上的时间决定收尾的空转，b 小的留到最后，让收尾最短", "因为这样第一台机器更忙", "没有理由，是约定"], a: 1,
      w: "前半部分让 a 小的先走，第二台机器早早有活干；后半部分让 b 小的留到最后，第二台机器收尾的等待最短。" },
    { q: "F3 | | C_max 为什么没有像 Johnson 那样的多项式规则？",
      o: ["因为三台机器没法排", "它是强 NP 难的（除非 P = NP）", "因为置换调度不再最优", "因为递推公式失效"], a: 1,
      w: "F3 | | C_max 是强 NP 难的（Garey、Johnson、Sethi，1976）。只有 min a ≥ max b 或 min c ≥ max b 这类特殊情形，才能合成两台虚拟机器再用 Johnson。" },
    { q: "NEH 启发式的核心步骤是？",
      o: ["按加工时间从小到大排序", "按总加工时间降序取作业，逐个插入使部分顺序 C_max 最小的位置", "随机交换两个作业直到不能改进", "先解 LP 松弛再取整"], a: 1,
      w: "NEH 只评价 O(n²) 个候选，结果通常接近最优，但没有最坏保证。" },
    { q: "作业车间的析取图里，选定每台机器上的作业顺序以后，C_max 是什么？",
      o: ["所有工序的加工时间之和", "最忙的那台机器的负荷", "图里的最长路", "最长作业的总时间"], a: 2,
      w: "路线弧和机器弧合起来是一张有向图，每道工序最早开始时刻是起点到它的最长路，C_max 是整张图的最长路。最忙的机器负荷和最长作业只是下界。" },
    { q: "析取图里出现环意味着什么？",
      o: ["C_max 很大", "这组机器顺序互相矛盾，没有对应的可行调度", "有多个最优解", "需要更多机器"], a: 1,
      w: "环表示“A 要等 B，B 要等 C，C 又要等 A”，谁也无法开始。本章的 3 × 3 例子里，216 种机器顺序只有 63 种无环。" },
    { q: "大 M 的 MIP 模型对作业车间为什么弱？",
      o: ["因为变量太少", "M 取得很大，析取约束在 y 放松成小数后几乎不起作用，LP 松弛值远小于最优值（例子里 9.0 对 13）", "因为整数变量不能取 0 和 1", "因为目标函数是非线性的"], a: 1,
      w: "松弛太弱，分支定界要枚举很多 y 的组合才能证明最优。CP-SAT 用区间变量和 NoOverlap，不需要 M，内部有针对“不重叠”的边界推理。" },
    { q: "关于“选 MIP 还是 CP”，本章的建议是？",
      o: ["永远选 CP-SAT", "永远选 MIP", "看问题结构：时间窗和不重叠为主的调度问题适合 CP，成本线性、网络结构强的问题适合 MIP", "两者一样，随便选"], a: 2,
      w: "同一个作业车间，10 × 10 上 CP-SAT 0.1 秒内证明最优，大 M 的 MIP 30 秒还有很大的间隙；第 5–7 章的指派、网络流、背包则是 MIP 的强项。" }
  ];
  var qState = {};
  if (window.PRINT_MODE) QUIZ.forEach(function (it, k) { qState[k] = it.a; });   // 打印/PDF：显示参考答案
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

  var links = Array.prototype.slice.call(document.querySelectorAll(".toc a"));
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) { if (e.isIntersecting) links.forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id); }); });
    }, { rootMargin: "-20% 0px -70% 0px" });
    document.querySelectorAll("section.chap").forEach(function (s) { io.observe(s); });
  }
  var envTxt = "SciPy " + D.env.scipy + " · HiGHS " + D.env.highs + " · OR-Tools " + D.env.ortools;
  $("envline").textContent = envTxt; $("envline2").textContent = envTxt;
})();
