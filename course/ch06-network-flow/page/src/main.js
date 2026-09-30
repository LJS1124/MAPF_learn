/* main.js — 先预测、自测、目录高亮、页面启动 */
(function () {
  // ------------------------------------------------------------ 先预测
  var p1 = prediction($("p1"), {
    q: "在原网络上多加一条弧 c→b，费用 −4（从 c 走到 b 反而省 4）。直接用 Dijkstra 求 S 到 T 的最短距离，会得到什么？",
    opts: ["报错，因为有负费用", "6，正确答案", "7，比正确答案大 1，没有任何提示", "陷入死循环"], ans: 2,
    explain: "标准的 Dijkstra 不检查费用的符号。b 在 c 之前就被确定为 2，等 c 被确定（标签 5），c→b 想把 b 改成 1，但 b 已经确定，不再回头，最终 T = 7。正确答案 6 要走 S→a→c→b→d→T。下面的图已经解锁，切到“加一条 c→b（−4）”一步步看。"
  });
  p1.onReveal(gate($("fig1").querySelector(".fig-body"), p1));

  var p2 = prediction($("p2"), {
    q: "从 S 发出的两条弧容量是 7 和 6，进入 T 的两条弧容量是 6 和 7，合计都是 13。这张网络的最大流是多少？",
    opts: ["13，出弧或入弧被塞满", "12", "11", "10"], ans: 1,
    explain: "中间四条弧 a→c（4）、b→c（2）、b→d（4）、a→d（2）把 {S, a, b} 与 {c, d, T} 隔开，容量之和 12，任何流都要穿过它。13 是一个更松的上界（只看 S 的出弧）。下面的图已经解锁，看最后一步的最小割。"
  });
  p2.onReveal(gate($("fig2").querySelector(".fig-body"), p2));

  var p3 = prediction($("p3"), {
    q: "在原网络上加一行限额：“S→b 与 b→d 合计至多 1”，送 1 个单位（原来最便宜的路是 S→b→d→T，费用 7；次便宜的是 S→a→d→T，费用 8）。LP 的最优值和整数最优值分别是？",
    opts: ["LP 7，整数 7", "LP 7.5，整数 8", "LP 8，整数 8", "LP 7，整数 8"], ans: 1,
    explain: "S→b→d→T 会把限额用两次，整数解只好走 8。LP 可以让 ½ 单位走费用 7 的路、½ 单位走费用 8 的路，限额合计只用了 ½ + ½ = 1，费用 7.5。这是一行首尾相接的弧共用限额造成的分数解。下面的检查器已经解锁。"
  });
  p3.onReveal(gate($("fig4").querySelector(".fig-body"), p3));

  // ------------------------------------------------------------ 自测
  var QUIZ = [
    { q: "为什么 Dijkstra 在有负费用弧的网络上可能给出错误答案，而且不报错？",
      o: ["它的复杂度太高", "它假设一个点一旦被确定，标签就是最终值，以后不再修改；负费用弧可能在之后给这个点更短的路", "它不能处理有向图", "它只适用于费用为整数的网络"], a: 1,
      w: "“确定的点不再改”依赖“走一段路只会更长”，也就是费用非负。负费用弧让后面才出现的路更短，Dijkstra 不回头，给出的是一个偏大的数，没有任何提示。" },
    { q: "Bellman–Ford 已经做了 n − 1 轮松弛，再做第 n 轮，仍有标签变小。这说明什么？",
      o: ["前面的轮数算错了", "从起点可达一个负环", "网络不连通", "需要换成 Dijkstra"], a: 1,
      w: "没有负环时，最短路至多 n − 1 条弧，n − 1 轮之后所有标签都是最终值。还能变小，说明有环在越绕越短。沿前驱回走 n 步落在环上，读出来就是证据。" },
    { q: "Johnson 算法里的势 h 满足什么条件，为什么改用 c′ = c + h(u) − h(v) 之后最短路不变？",
      o: ["h 是每个点到终点的距离，它让所有路等长", "h(v) ≤ h(u) + c，所以 c′ ≥ 0；任何 s 到 t 的路，新费用都恰好比原来多 h(s) − h(t)，与走哪条路无关", "h 全部取 0", "h 是每个点的度数"], a: 1,
      w: "路径上相邻两项的 h 依次抵消，只剩起点和终点。所以每条 s 到 t 的路平移同样的量，最短路不变。用虚拟源加 Bellman–Ford 得到的最短距离满足 h(v) ≤ h(u) + c，保证 c′ ≥ 0。" },
    { q: "最大流里的回退弧有什么用？",
      o: ["让算法更快", "允许把已经送出去的流量收回一部分，改走别处；没有它，贪心地推流可能停在不是最大的流上", "表示网络里的反向道路", "只是记账用，不影响结果"], a: 1,
      w: "回退弧的残量等于当前的流量。沿它推流就是减少原弧的流量。没有回退弧，先推的路占住的关键弧就永远退不出来，可能停在次优的流上。Lab 练习 5 的 AI-A 就是这样的。" },
    { q: "算法停止后，从 S 在残量图里还能到达的点集是 X。为什么从 X 到其余点的原弧容量之和恰好等于最大流量？",
      o: ["巧合，由网络的形状决定", "这些弧一定都是满的（否则残量图里还能走出去），反向弧的流量一定是 0（否则有回退弧），所以流量正好等于这些容量之和", "因为 X 里的点是随机选的", "因为割不需要满足流量守恒"], a: 1,
      w: "这就是最大流最小割定理的“强”的一半：算法的终止状态本身构造出一个和流量相等的割。任何流都不超过任何割，所以这个割是最小割，这个流是最大流。" },
    { q: "最小费用流的费用曲线 f(k)（送 k 个单位的最小费用）为什么是凸的？",
      o: ["因为费用总是正的", "逐次最短路每一轮的路都不比上一轮短，f 的斜率就是这些路长，所以斜率不降", "因为容量是整数", "因为使用了 Dijkstra"], a: 1,
      w: "便宜的通道先被用光，剩下的只会更贵，边际成本单调不降。这也是“平均成本会低估边际成本”的原因。" },
    { q: "点弧关联矩阵为什么全单模？关键的一步是？",
      o: ["元素都是 0、+1、−1", "若一个方子式的每一列都恰有一个 +1 和一个 −1，所有行相加得零向量，行线性相关，行列式为 0；否则有全零列或单元素列，按它展开并归纳", "任何方阵的行列式都是整数", "求解器总是返回整数解"], a: 1,
      w: "关键是每条弧有一个起点和一个终点，所以每列恰好一个 +1 一个 −1。第 5 章的二部图是它的特例。元素是 0、±1 不足以保证全单模。" },
    { q: "在最小费用流的网络上加下面哪一行，整数性会被破坏？",
      o: ["每条弧的流量上界", "“进入点 c 的两条弧合计至多 4”（点容量）", "“S→b 与 b→d 两条首尾相接的弧合计至多 1”", "增加一个连到所有源点的超级源"], a: 2,
      w: "弧的上界是单位矩阵，点容量可以拆点还原成弧容量，超级源只是多加了弧，这三个都保持网络结构。把两条不同的弧绑进同一个限额，破坏了“每列一个 +1 一个 −1”，页面找到行列式 ±2 的子式，LP 出现分数解。" }
  ];
  // 正确选项的位置轮换一下（固定的排列，不随机），避免答案总在同一个位置
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
