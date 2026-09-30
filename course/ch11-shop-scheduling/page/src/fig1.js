/* fig1.js — 图 11-1：两台机器的流水车间与 Johnson 规则 */
(function () {
  var P = D.flow2, n = P.length, jo = Core.johnson(P), en = Core.enumFlow(P), worst = { value: -1, perm: null };
  Core.permutations(n).forEach(function (p) { var c = Core.flowSchedule(P, p).Cmax; if (c > worst.value) worst = { value: c, perm: p }; });
  var fifo = []; for (var i = 0; i < n; i++) fifo.push(i);
  var S = { perm: fifo.slice(), preset: "fifo" };
  var PRE = { fifo: fifo, johnson: jo.order, opt: en.perm, worst: worst.perm };
  function same(a, b) { return a.join() === b.join(); }
  function render() {
    var fs = drawFlow($("jsGantt"), P, S.perm, 46), c = fs.Cmax;
    var fl = clear($("jsFlags"));
    fl.appendChild(el("span", { cls: same(S.perm, jo.order) ? "ok" : "", text: same(S.perm, jo.order) ? "正是 Johnson 顺序" : "不是 Johnson 顺序" }));
    fl.appendChild(el("span", { cls: c === en.value ? "ok" : "no", text: c === en.value ? "达到最优 " + en.value : "比最优 " + en.value + " 多 " + (c - en.value) }));
    var st = clear($("jsStats"));
    st.appendChild(stat("当前 C_max", String(c), "所有作业都完成的时刻", true));
    st.appendChild(stat("Johnson 顺序", String(Core.flowSchedule(P, jo.order).Cmax), jo.order.map(jn).join(" → ")));
    st.appendChild(stat("枚举 720 种的最优 / 最差", en.value + " / " + worst.value, "最优排法与最差排法相差 " + (worst.value - en.value)));
    var ch = clear($("jsChips"));
    S.perm.forEach(function (j, pos) {
      ch.appendChild(el("span", { cls: "chipj" }, [
        el("button", { type: "button", "aria-label": jn(j) + " 前移", disabled: pos === 0 ? "" : null, text: "◀", onclick: function () { swap(pos, pos - 1); } }),
        el("b", { text: jn(j), style: "color:" + JCOL[j % 8] }),
        el("button", { type: "button", "aria-label": jn(j) + " 后移", disabled: pos === n - 1 ? "" : null, text: "▶", onclick: function () { swap(pos, pos + 1); } })
      ]));
    });
    var tb = clear($("jsTable")), body = el("tbody");
    tb.appendChild(el("thead", {}, [el("tr", {}, ["作业", "a（M1）", "b（M2）", "分组", "在 Johnson 顺序里的位置"].map(function (t) { return el("th", { text: t }); }))]));
    for (var j = 0; j < n; j++) body.appendChild(el("tr", {}, [el("td", { text: jn(j) }), el("td", { text: String(P[j][0]) }), el("td", { text: String(P[j][1]) }), el("td", { text: P[j][0] <= P[j][1] ? "a ≤ b" : "a > b" }), el("td", { text: String(jo.order.indexOf(j) + 1) })]));
    tb.appendChild(body);
    var say = "<p><b>Johnson 规则：</b>把 a ≤ b 的作业（" + jo.set1.map(jn).join("、") + "）按 a 从小到大放在前面，把 a &gt; b 的作业（" + jo.set2.map(jn).join("、") + "）按 b 从大到小放在后面。得到 " + jo.order.map(jn).join(" → ") + "。</p>";
    say += "<p>直觉：a 小的先做，让第二台机器尽早开工；b 小的放最后，让第二台机器最后的空转尽量短。当前顺序的 C<sub>max</sub> = <b class=\"key\">" + c + "</b>。</p>";
    $("jsSay").innerHTML = say;
    buildSegSync();
  }
  function swap(a, b) { var t = S.perm[a]; S.perm[a] = S.perm[b]; S.perm[b] = t; S.preset = null; render(); }
  var buildSegSync = buildSeg($("jsPre"), [{ key: "fifo", label: "原顺序 J1…J6" }, { key: "johnson", label: "Johnson" }, { key: "opt", label: "枚举最优" }, { key: "worst", label: "最差顺序" }], function () { return S.preset; }, function (k) { S.preset = k; S.perm = PRE[k].slice(); render(); });
  render();
  window.__fig1 = S;
})();
