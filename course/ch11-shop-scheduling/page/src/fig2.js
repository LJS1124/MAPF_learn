/* fig2.js — 图 11-2：三台机器的流水车间与 NEH 启发式 */
(function () {
  var P = D.flow3, n = P.length, R = Core.neh(P), en = Core.enumFlow(P), fifo = []; for (var i = 0; i < n; i++) fifo.push(i);
  var fifoC = Core.flowSchedule(P, fifo).Cmax, S = { k: 0, pick: null };
  function tot(j) { return P[j].reduce(function (a, b) { return a + b; }, 0); }
  function render() {
    var k = S.k, seq, say;
    if (k === 0) { seq = []; say = "<p>先把作业按总加工时间从大到小排：" + R.start.map(function (j) { return jn(j) + "（" + tot(j) + "）"; }).join("、") + "。然后按这个次序，一个一个插进当前的部分顺序，每次插在使部分顺序 C<sub>max</sub> 最小的位置，并列取靠前的位置。</p>"; }
    else {
      var st = R.steps[k - 1], opt = S.pick != null ? st.options[S.pick] : st.options[st.chosen];
      seq = opt.seq;
      say = "<p>第 " + k + " 步：插入 <b>" + jn(st.job) + "</b>。可选位置 " + st.options.length + " 个，C<sub>max</sub> 依次是 " + st.options.map(function (o) { return o.cmax; }).join("、") + "，选 <b class=\"key\">第 " + (st.chosen + 1) + " 个位置</b>（" + st.cmax + "）。" + (S.pick != null && S.pick !== st.chosen ? "现在预览的是第 " + (S.pick + 1) + " 个候选。" : "点表里的一行可以预览别的位置。") + "</p>";
    }
    if (k === n) say += "<p><b class=\"ok\">结束。</b>NEH 得到 " + R.order.map(jn).join(" → ") + "，C<sub>max</sub> = " + R.steps[n - 1].cmax + "；原顺序 " + fifoC + "；枚举 720 种的最优是 " + en.value + "，NEH 差 " + (R.steps[n - 1].cmax - en.value) + "。</p>";
    if (seq.length) drawFlow($("nhGantt"), P, seq, 60); else { clear($("nhGantt")); $("nhGantt").setAttribute("viewBox", "0 0 680 40"); sv("text", { x: 10, y: 24, cls: "tk", text: "还没有插入任何作业" }, $("nhGantt")); }
    $("nhSay").innerHTML = say;
    var cur = seq.length ? Core.flowSchedule(P, seq).Cmax : 0;
    var stt = clear($("nhStats"));
    stt.appendChild(stat("当前部分顺序的 C_max", String(cur), seq.length ? seq.map(jn).join(" → ") : "—", true));
    stt.appendChild(stat("原顺序 J1…J6", String(fifoC), "对照"));
    stt.appendChild(stat("NEH / 枚举最优", R.steps[n - 1].cmax + " / " + en.value, "NEH 只看了 " + R.steps.reduce(function (a, s) { return a + s.options.length; }, 0) + " 个候选，而不是 720 个"));
    var tb = clear($("nhTable")), body = el("tbody");
    if (k > 0) {
      var stp = R.steps[k - 1];
      tb.appendChild(el("thead", {}, [el("tr", {}, ["位置", "部分顺序", "C_max"].map(function (t) { return el("th", { text: t }); }))]));
      stp.options.forEach(function (o, i) {
        body.appendChild(el("tr", { cls: (i === stp.chosen ? "cur " : "") + (S.pick === i ? "cur" : ""), onclick: function () { S.pick = i; render(); } }, [el("td", { text: String(i + 1) }), el("td", { text: o.seq.map(jn).join(" ") }), el("td", { text: String(o.cmax) })]));
      });
      tb.appendChild(body);
    }
    $("nhTxt").textContent = "第 " + k + " / " + n + " 步";
    $("nhPrev").disabled = k === 0; $("nhNext").disabled = k >= n;
  }
  $("nhPrev").addEventListener("click", function () { if (S.k > 0) { S.k--; S.pick = null; render(); } });
  $("nhNext").addEventListener("click", function () { if (S.k < n) { S.k++; S.pick = null; render(); } });
  $("nhAll").addEventListener("click", function () { S.k = n; S.pick = null; render(); });
  $("nhReset").addEventListener("click", function () { S.k = 0; S.pick = null; render(); });
  render();
  window.__fig2 = S;
})();
