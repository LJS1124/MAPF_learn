/* main.js — 先预测、自测、目录高亮、页面启动 */
(function () {
  var p1 = prediction($("p1"), {
    q: "背包的载重是 22。LP 的最优解是：价值/重量最高的四个托盘装满（重量 20，价值 104），再装第五个托盘（T6，价值 10，重量 7）的 2/7，上界 106.86。整数最优是多少？",
    opts: ["106", "105", "104", "低于 100"], ans: 2,
    explain: "整数最优是 104：就是那四个托盘，把分数的 T6 舍掉。上界向下取整（106）比它大，说明取整不能当答案。载重换成 26 时，整数最优就不是舍入得到的了。下面的图已经解锁，拖动载重看。"
  });
  p1.onReveal(gate($("fig1").querySelector(".fig-body"), p1));

  var p2 = prediction($("p2"), {
    q: "广义指派的例子里，加载重之后 LP 值是 220，整数最优是 234。在根节点上反复“解 LP、找违反的覆盖割、加割”，下界最多能被推到多少？",
    opts: ["约 222，割只能挤出一点", "约 226", "233，几乎追平整数最优", "超过 234，因为割更强"], ans: 2,
    explain: "三轮之后下界是 233，页面找不到更多违反的覆盖割。不可能超过 234：割对每个整数可行解都有效，整数最优的解自己满足所有的割。下面的图已经解锁。"
  });
  p2.onReveal(gate($("fig4").querySelector(".fig-body"), p2));

  var p3 = prediction($("p3"), {
    q: "9 个托盘的重量是 3、8、5、6、3、9、6、5、9，总重 54，每个车次容量 18。下界是 3 个车次。首次适应递减（从大到小，放进第一个放得下的车次）需要几个？",
    opts: ["3 个", "4 个", "5 个", "6 个"], ans: 1,
    explain: "FFD 用 4 个：[9, 9]、[8, 6, 3]、[6, 5, 5]，最后一个 3 放不下任何一个车次。最优是 3 个：{9, 6, 3}、{9, 6, 3}、{8, 5, 5}，每个车次正好装满。下面的图已经解锁。"
  });
  p3.onReveal(gate($("fig5").querySelector(".fig-body"), p3));

  var QUIZ = [
    { q: "0-1 背包的 LP 松弛，最优解里最多有几个变量取分数？为什么？",
      o: ["最多 1 个：只有一行约束，顶点上至多一个变量落在 0 和 1 之间", "最多 2 个，因为有上界约束", "任意多个", "0 个，因为背包的矩阵全单模"], a: 0,
      w: "按价值/重量装，装到装不下的那个装一部分，其余不是 0 就是 1。矩阵只有一行，系数 w_j 是任意整数，不是全单模，所以 LP 的最优值可以高于整数最优。" },
    { q: "Dantzig 上界是 106.86，整数最优是 104。关于“上界向下取整”，哪个说法对？",
      o: ["向下取整得 106，就是最优", "向下取整仍是上界，但不一定等于最优；这里 106 大于 104", "向下取整会低于最优", "价值是整数时上界一定是整数"], a: 1,
      w: "整数解也满足 LP 的约束，所以最优不超过上界，取整之后（价值是整数）仍是上界。它可以比最优大，这时还要分支或者别的手段来收紧。" },
    { q: "背包的分支定界里，节点上界向下取整不超过手上最好的整数解，为什么可以剪掉这个节点？",
      o: ["因为这个节点已经没有可行解了", "价值是整数，这个节点里任何整数解的价值都不超过上界的整数部分，不可能比手上的更好", "因为它是深度最深的节点", "因为它的 LP 是分数"], a: 1,
      w: "这一支里的整数解都满足这一支的 LP 约束，价值不超过 LP 值；价值是整数，所以不超过它的整数部分。不比手上的更好，就不用再看。" },
    { q: "为什么广义指派（GAP）的 LP 不再自带整数解，而第 5 章的指派可以？",
      o: ["因为变量更多了", "第 5 章的约束矩阵每列恰有两个 1（二部图），全单模；载重约束的系数是 w_j，破坏了这个结构", "因为 GAP 没有目标函数", "因为求解器变慢了"], a: 1,
      w: "全单模的证明依赖“每列一个任务行的 1 加一个车行的 1”。载重行的系数是任意的托盘数，这个结构没有了，LP 的顶点可以是分数点，表现为一个任务被劈给几辆车。" },
    { q: "图 7-3 里把每辆车的载重加 2 以后，LP 值等于整数最优（212）。原因是？",
      o: ["载重约束变成了等式", "三辆车分到的托盘数（每个任务拿走最便宜的车）都在载重之内，载重约束不起作用，问题退化成“每个任务选最便宜的车”", "求解器的容差变大了", "任务变少了"], a: 1,
      w: "载重不起作用时，GAP 就是没有容量的指派，整数性回来。载重紧到会起作用，LP 才会把一个任务劈开。" },
    { q: "覆盖割 Σ_{j∈S} x_ij ≤ |S| − 1 为什么是“有效”的，为什么又是“有用”的？",
      o: ["它对所有整数可行解都成立（全装进去就超载了），但会删掉当前 LP 的分数解", "它对所有分数解都成立", "它会删掉一些整数最优解，但更快", "它只在 x 全为 0 时成立"], a: 0,
      w: "S 的总重量超过载重，整数解不可能把 S 里的任务全装在车 i 上，所以整数可行解都满足这条不等式，没有整数解被删掉。LP 里 x 的和超过 |S| − 1 的分数解被删掉，这就是割的作用。" },
    { q: "松弛载重约束得到的拉格朗日下界，最好能达到多少？",
      o: ["整数最优", "LP 值：松弛后的子问题（每个任务选加价后最便宜的车）有整数性，所以最优 λ 给出的下界等于 LP 值", "无限大", "0"], a: 1,
      w: "子问题的 LP 已经是整数的（每个任务独立地选车），拉格朗日对偶的最优值等于 LP 值。覆盖割能超过 LP 值，是因为它利用了“装不下”这个整数性质。" },
    { q: "装箱里，FFD 用了 4 个车次，下界是 ⌈54/18⌉ = 3。关于最优车次，正确的结论是？",
      o: ["最优一定是 4", "最优在 3 和 4 之间，要用别的办法（比如回溯）确定；这个例子里最优是 3", "最优一定是 3", "最优可能大于 4"], a: 1,
      w: "FFD 的车次数是最优的上界，下界给出最优的下限，所以最优在 3 和 4 之间。要确定就要搜索。这个例子里最优是 3，每个车次正好装满，FFD 多开了一个车次。" }
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
