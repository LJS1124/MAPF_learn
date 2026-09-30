/* main.js — 先预测、自测、目录高亮、页面启动 */
(function () {
  var p1 = prediction($("p1"), {
    q: "6 个托盘在同一台提升机上排队，按加工时间从短到长排（SPT）。不计 C_max（它与顺序无关），SPT 排出来的顺序，在 ΣC、ΣwC、L_max、ΣT、ΣU 这五个目标里，有几个是最优的？",
    opts: ["0 个", "1 个（ΣC）", "3 个", "全部 5 个"], ans: 1,
    explain: "只有 ΣC_j：84，是最优。ΣwC_j 要看权重（WSPT 才最优），L_max 要看交货期（EDD），ΣU_j 要用 Moore–Hodgson。没有哪一种顺序能同时最好。下面的图已经解锁。"
  });
  p1.onReveal(gate($("fig1").querySelector(".fig-body"), p1));

  var p2 = prediction($("p2"), {
    q: "6 个作业的加工时间是 7、3、5、2、8、5，总量 30，放到两台相同的机器上，下界是 15。按编号顺序，逐个放到完工最早的机器上（列表调度），C_max 是多少？",
    opts: ["15，恰好达到下界", "16", "18", "20"], ans: 1,
    explain: "16，比最优 15 多 1。列表调度每一步只看“放哪里现在完工最早”，最后一个作业 J6 落在已经有 11 的机器上。改成最长的先放（LPT）就得到 15。下面的图已经解锁。"
  });
  p2.onReveal(gate($("fig2").querySelector(".fig-body"), p2));

  var p3 = prediction($("p3"), {
    q: "R || ΣC_j：不相关并行机，每个作业在不同机器上的加工时间各不相同，最小化完工时间之和。它属于哪一类？",
    opts: ["多项式可解", "弱 NP 难", "强 NP 难", "复杂度未知"], ans: 0,
    explain: "多项式可解：把（作业 j 排在机器 i 倒数第 k 位）当作“指派”，位置越靠后对总和的贡献越大，就是一个指派问题（第 5 章）。而同一环境下的 R || C_max 是强 NP 难。同样的机器，换一个目标，难度完全不同。下面的图已经解锁。"
  });
  p3.onReveal(gate($("fig3").querySelector(".fig-body"), p3));

  var QUIZ = [
    { q: "“1 | r_j | L_max”这个标签的意思是？",
      o: ["单机、作业有释放时间、最小化最大延迟", "一台机器、有 r 个作业、最小化最大长度", "单机、可中断、最小化最大完工时间", "并行机、有释放时间、最小化延迟之和"], a: 0,
      w: "α = 1 是单机，β = r_j 表示每个作业有释放时间（不能在它到达前开始），γ = L_max 是最大延迟 max(C_j − d_j)。" },
    { q: "L_max 和 ΣT_j（延误时间之和）的区别是？",
      o: ["没有区别", "L_max 看最坏的一单，可以是负数（提前）；ΣT_j 把每一单的迟到时间相加，提前不算（不奖励）", "L_max 只用于并行机", "ΣT_j 不受顺序影响"], a: 1,
      w: "L_j = C_j − d_j 可以是负数，取最大值；T_j = max(0, L_j)，求和。所以 L_max 最优的排法（EDD）不一定让 ΣT_j 最小。" },
    { q: "图 9-1 里，为什么“SPT”“WSPT”“EDD”各自最优的顺序不一样？",
      o: ["因为算法有 bug", "它们分别是 ΣC、ΣwC、L_max 的最优规则；目标不同，偏好的顺序就不同，没有一个顺序同时最好", "因为加工时间是随机的", "因为交货期是随机的"], a: 1,
      w: "SPT 让短作业早完成，降低完工时间之和；WSPT 兼顾权重；EDD 让交货期近的先做，压低最大延迟。它们互相冲突，ΣC 与 L_max 的帕累托前沿有 8 个点。" },
    { q: "没有释放时间的单机上，为什么 C_max 与作业的顺序无关？",
      o: ["因为作业可以同时做", "机器一直不空闲，最后一个作业的完工时间总是总加工时间", "因为 C_max 不是目标", "因为顺序总是最优的"], a: 1,
      w: "没有释放时间和准备时间，机器从 0 开始连续加工，全部完成的时刻等于加工时间之和。有释放时间或与顺序有关的准备时间时，就不再无关了。" },
    { q: "P、Q、R 三种并行机的关系是？",
      o: ["三者互不相关", "P 是 Q 的特例（速度都为 1），Q 是 R 的特例（p_ij = p_j / s_i），所以 R 最一般", "R 是 P 的特例", "Q 是 P 的特例"], a: 1,
      w: "相同并行机的加工时间与机器无关；速度不同的机器加工时间成比例；不相关机器是任意的表。越一般的环境，问题越难（或一样难）。" },
    { q: "已知 P2 || C_max 是 NP 难的。据此可以推出？",
      o: ["1 || C_max 是 NP 难", "R || C_max（P2 的推广）也是 NP 难", "R || C_max 是多项式的", "什么也推不出"], a: 1,
      w: "难度沿着推广传播：解 R || C_max 的算法可以直接用来解 P2 || C_max。1 || C_max 是 P2 的特例，没有这个结论（它其实是平凡的）。" },
    { q: "R || ΣC_j 是多项式可解的，而 R || C_max 是强 NP 难。这说明什么？",
      o: ["机器环境决定了问题的难度", "同一个机器环境里，目标不同，难度可以完全不同", "R 环境不可解", "ΣC_j 是 C_max 的推广"], a: 1,
      w: "R || ΣC_j 可以化成指派问题（第 5 章），是多项式的。R || C_max 是均衡各机器负荷，本质上是装箱类的问题，强 NP 难。" },
    { q: "“1 | s_jk | C_max”（单机、与顺序有关的准备时间、最小化完工时间）对应的经典问题是？",
      o: ["背包问题", "旅行商问题：作业是城市，s_jk 是从 j 到 k 的距离", "指派问题", "最短路"], a: 1,
      w: "准备时间只取决于前后两个作业，总完工时间 = 加工时间之和 + 准备时间之和，问题就是找一条最短的访问顺序，即旅行商（第 8 章）。设备在作业之间要移动时就是这种模型。" }
  ];
  QUIZ.forEach(function (it, k) {
    var r = (k * 3 + 1) % 4;
    it.o = it.o.slice(r).concat(it.o.slice(0, r));
    it.a = (it.a - r + 4) % 4;
  });
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
  var envTxt = "SciPy " + D.env.scipy + " · HiGHS " + D.env.highs;
  $("envline").textContent = envTxt; $("envline2").textContent = envTxt;
})();
