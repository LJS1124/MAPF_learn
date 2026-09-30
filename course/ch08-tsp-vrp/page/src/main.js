/* main.js — 先预测、自测、目录高亮、页面启动 */
(function () {
  var p1 = prediction($("p1"), {
    q: "9 个点（仓库 + 8 个货位）。只保留“每个点一条出弧、一条入弧”的约束（第 5 章的指派问题），它的最优解会把这 9 个点分成几个互不相连的回路？",
    opts: ["1 个：正好是一条完整的回路", "2 个", "4 个", "8 个"], ans: 2,
    explain: "4 个：{仓, 2}、{1, 7, 8}、{3, 5}、{4, 6}，总长 198。指派问题只管每个点有一进一出，不管连不连成一个圈，所以偏向短小的圈。最优回路是 255。下面的图已经解锁。"
  });
  p1.onReveal(gate($("fig1").querySelector(".fig-body"), p1));

  var p2 = prediction($("p2"), {
    q: "8 个客户的例子：指派松弛的下界是 198，最优是 255。MTZ 紧凑模型的 LP 下界大约是多少？",
    opts: ["约 203，只比指派松弛好一点", "约 225", "约 250", "255，与最优相等"], ans: 0,
    explain: "203.25。MTZ 的约束里有 Big-M 系数 m，LP 里 x 取很小的分数时约束几乎不起作用，下界很弱。用割平面加子回路约束，下界可以到 255。下面的图已经解锁，拖动客户数看别的规模。"
  });
  p2.onReveal(gate($("fig3").querySelector(".fig-body"), p2));

  var p3 = prediction($("p3"), {
    q: "22 个托盘、每辆车载重 9、最多 3 辆车。最优的总行驶距离是 360。扫描法（按角度分组、依次装车，每组精确排路线）的结果，比最优多百分之几？",
    opts: ["不到 1%", "约 5%", "约 16%", "约 50%"], ans: 2,
    explain: "419，比最优 360 多 59，约 16%。扫描法只看角度，不看距离，也不平衡各车的负荷：前两辆装满 9 个，第三辆只有 4 个。下面的图已经解锁。"
  });
  p3.onReveal(gate($("fig4").querySelector(".fig-body"), p3));

  var QUIZ = [
    { q: "只保留出入度约束的旅行商松弛，最优解为什么常常是一堆小回路？",
      o: ["因为求解器不够好", "这个松弛就是指派问题：每个点选一个后继，只保证有一进一出，不要求连成一个圈，所以最优解偏向短小的圈", "因为距离矩阵不对称", "因为点太多"], a: 1,
      w: "指派问题的解是一个置换，置换分解成若干个圈。子回路消除约束就是用来规定“只有一个圈”的。" },
    { q: "子回路消除约束有 2^(n−1) − n 个，为什么可以放心用？",
      o: ["因为求解器会一次性加载它们", "不用一次写完：先解 LP，分离出被违反的约束，加入，再解，实际只需要很少几条", "因为大多数约束是多余的，可以直接删掉", "因为 n 不会很大"], a: 1,
      w: "关键是分离能高效地做（一次最大流），这样指数多的约束就可以按需添加。本章例子里 247 条只用了 6 条。" },
    { q: "LP 解 x 里，仓库到点 t 的最大流（x 当容量）小于 1，说明什么？",
      o: ["点 t 到不了仓库", "有一组包含 t 的点被孤立在外面，进入它的弧流量之和不足 1，对应一条被违反的子回路约束", "LP 无解", "t 是最优回路上的最后一个点"], a: 1,
      w: "出入度约束成立时，S 内部的弧数 = |S| − 进入 S 的弧数。子回路约束等价于进入 S 的弧流量至少为 1，也就是仓库到 S 中每个点都能送过 1 个单位。最小割的汇侧就是被违反的 S。" },
    { q: "割平面循环停下时（再也分离不出被违反的约束），LP 的值是？",
      o: ["一定等于最优值", "加入全部子回路约束的 LP 值，与加入的顺序无关；它是下界，可能低于最优，也可能带分数解", "0", "指派松弛的值"], a: 1,
      w: "停下说明所有子回路约束都满足，LP 值就是完整约束下的最优。本章例子里它恰好等于最优 255；一般实例上它是一个很强的下界，差距交给分支。" },
    { q: "MTZ 模型的约束数只有 m² 级，LP 下界为什么弱？",
      o: ["因为变量太多", "约束里有 Big-M 系数 m：x 取小分数时约束几乎不起作用", "因为它不排除子回路", "因为 u 必须是整数"], a: 1,
      w: "x_ij = 0 时约束必须永远成立，所以系数取到 m；LP 里 x 很小时约束几乎松掉。这是第 3 章讲的 Big-M 的典型代价。" },
    { q: "下面哪个顺序对任何实例都成立？",
      o: ["最优 ≤ 子回路约束的 LP ≤ MTZ ≤ 指派松弛", "指派松弛 ≤ MTZ 的 LP ≤ 子回路约束的 LP ≤ 最优", "MTZ ≤ 指派松弛 ≤ 最优 ≤ 子回路约束", "四者相等"], a: 1,
      w: "松弛越多、约束越弱，下界越低；子回路约束是最强的，但仍是松弛，所以不超过最优。页面和 Lab 在随机实例上验证了这个顺序。" },
    { q: "CVRP 的容量割“进入 S 的弧数 ≥ ⌈d(S)/Q⌉”，为什么说它包含了子回路约束？",
      o: ["因为它写在同一个表里", "d(S) > 0 时 ⌈d(S)/Q⌉ ≥ 1，这就是“必须有弧从外面进入 S”，也就是子回路约束；而且它还带了装箱的下界", "因为 Q 总是 1", "因为它更弱"], a: 1,
      w: "⌈d(S)/Q⌉ 是装 S 里的托盘至少要的车数，也就是第 7 章装箱的下界。它至少为 1，所以不经过仓库的小圈同样被排除。" },
    { q: "2-opt 停下来时，得到的回路是？",
      o: ["最优回路", "对“反转一段”这类邻域的局部最优：任何一次反转都不能再缩短，但可能比全局最优长", "最近邻回路", "不合法的回路"], a: 1,
      w: "本章例子里 2-opt 停在 262，比最优 255 长 2.7%。要跳出局部最优，需要更大的邻域或者允许暂时变差的方法（第六部分）。" }
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
