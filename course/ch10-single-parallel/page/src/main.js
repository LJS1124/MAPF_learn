/* main.js — 先预测、自测、目录高亮、页面启动 */
(function () {
  var p1 = prediction($("p1"), {
    q: "单机上，相邻的两个作业：加工时间 7 的 a 排在加工时间 2 的 b 前面。交换它们（b 排到 a 前面），ΣC_j 会怎样？前面和后面的作业不受影响。",
    opts: ["减少 5", "减少 9", "不变", "增加 5"], ans: 0,
    explain: "减少 5。交换前完工时间是 t+7 和 t+9（和 2t+16），交换后是 t+2 和 t+9（和 2t+11）。一般地，变化 = p_b − p_a。所以长的排在短的前面总是可以改进，这就是 SPT。下面的图已经解锁。"
  });
  p1.onReveal(gate($("fig1").querySelector(".fig-body"), p1));

  var p2 = prediction($("p2"), {
    q: "第 9 章的 6 个托盘（p = 7, 3, 5, 2, 8, 5；d = 13, 23, 17, 5, 9, 21），按 EDD 顺序直接排，延误的作业有 5 个。用 Moore–Hodgson，最少能压到几个？",
    opts: ["4 个", "3 个", "2 个", "1 个"], ans: 3,
    explain: "1 个。EDD 顺序里 J5（p = 8，交货期 9）拖累了后面所有作业。Moore–Hodgson 发现超期后，把已选作业里最长的 J5 移走，其他 5 个全部按期。下面的图已经解锁。"
  });
  p2.onReveal(gate($("fig2").querySelector(".fig-body"), p2));

  var p3 = prediction($("p3"), {
    q: "4 台相同的机器。先来 12 个长度为 1 的作业，最后来一个长度为 4 的作业，按这个顺序做列表调度（每个作业放到完工最早的机器）。C_max 是多少？（最优是 4）",
    opts: ["4", "5", "6", "7"], ans: 3,
    explain: "7。前 12 个单位作业把 4 台机器各铺到 3，长作业接在任何一台后面，3 + 4 = 7；最优 4，比值 1.75 = 2 − 1/4，正好是 Graham 界。下面的图已经解锁。"
  });
  p3.onReveal(gate($("fig3").querySelector(".fig-body"), p3));

  var QUIZ = [
    { q: "交换论证里，交换相邻的两个作业 a、b（a 原来在前），为什么只有这两个作业的完工时间会变？",
      o: ["因为其他作业的加工时间为 0", "前面的作业没有动；这两个作业合起来占用的时间不变，后面的作业开始时刻仍是 t + p_a + p_b", "因为机器可以并行", "因为完工时间与顺序无关"], a: 1,
      w: "交换只改变两个作业的先后，它们合起来仍占用 p_a + p_b 的时间，所以后面的作业不受影响。这让证明只需要比较两个作业。" },
    { q: "WSPT 规则按什么排序？为什么？",
      o: ["按 w 从大到小", "按 p/w 从小到大：相邻交换的变化 = w_a·p_b − w_b·p_a ≤ 0 当且仅当 p_b/w_b ≤ p_a/w_a", "按 p 从小到大", "按 d 从小到大"], a: 1,
      w: "“单位权重的加工时间”小的先做。权重全为 1 时退化成 SPT。" },
    { q: "用 SPT 的交换规则去优化 Σw_jC_j，会怎样？",
      o: ["仍然最优", "每次交换都让目标变好", "交换有时会让目标变差，最终也不一定最优", "目标不变"], a: 2,
      w: "交换按 p 小的先，但 Σw_jC_j 关心的是 p/w。图 10-1 里从 J1…J6 出发，第 6 步 252 变成 256，最后停在 252，比最优 234 高。规则只对它对应的目标有保证。" },
    { q: "Moore–Hodgson 中，超期后为什么移走已选作业里加工时间最长的？",
      o: ["因为它的交货期最早", "每个作业放弃的代价都是 1（少一个准时作业），要让后面的作业尽早完成，腾出的时间越多越好，最长的最多", "因为它的权重最大", "因为这样最快"], a: 1,
      w: "ΣU 只数个数，所有作业价值相同，所以放弃占地方最大的。有权重时价值不同，这个论证就不成立，1 | | ΣwU 是弱 NP 难。" },
    { q: "列表调度的近似比 2 − 1/m 的证明用到了哪两件事？",
      o: ["机器数是偶数、作业数是奇数", "最后一个作业开始时所有机器都忙（所以开始时刻 ≤ (总量 − p_l)/m），以及 OPT ≥ 总量/m 和 OPT ≥ p_l", "作业都是单位长度", "作业按 LPT 排序"], a: 1,
      w: "C_max = S_l + p_l ≤ (总量 − p_l)/m + p_l = 总量/m + (1 − 1/m)p_l ≤ OPT + (1 − 1/m)OPT。" },
    { q: "图 10-3 里，m = 4 时列表调度最坏实例的 C_max 是 7，最优是 4。这说明什么？",
      o: ["列表调度总是比最优差一倍", "Graham 界 2 − 1/m = 1.75 是紧的：7/4 正好等于它", "m = 4 时 LPT 也是 7", "最优不可能是 4"], a: 1,
      w: "取等号的实例说明这个界不能再改进。LPT 把作业先排序，同样的机器数下最坏情形是 4/3 − 1/(3m) = 1.25。" },
    { q: "为什么允许中断以后，P | prmp | C_max 是多项式可解的，而 P | | C_max 是 NP 难的？",
      o: ["中断让机器变快了", "可中断时，绕圈法总能达到下界 max(最长作业, 总量/m)；不能中断时，作业整块放置，需要解装箱式的组合问题", "因为可中断时作业更多", "两者都是多项式的"], a: 1,
      w: "绕圈法把作业断开，每台机器正好装满 C。不能中断就不能这样凑，需要选择哪些作业放在一起，这就是子集和 / 划分问题。" },
    { q: "“P2 | | C_max 是弱 NP 难，P | | C_max 是强 NP 难”，区别是？",
      o: ["弱的更难", "弱 NP 难有伪多项式算法（时间与数值大小成正比，如子集和的动态规划）；强 NP 难连这样的算法也没有（除非 P = NP）", "两者没有区别", "强 NP 难可以在多项式时间内解"], a: 1,
      w: "P2 || C_max 用 O(n·总量) 的动态规划解，数值不大时很快。m 作为输入的 P || C_max 由 3-划分推出，是强 NP 难的。" }
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
