/* fig2.js — 图 10-2：Moore–Hodgson。按交货期加入，超期就移走已选作业里最长的 */
(function () {
  var EX = { e1: { name: "例 1：本章的 6 个托盘", J: D.job }, e2: { name: "例 2：7 个作业，交货期更紧", J: D.job2 } };
  var S = { ex: "e1", k: 0 };
  function render() {
    var J = EX[S.ex].J, tr = Core.mooreTrace(J), fr = tr.frames, n = fr.length, k = S.k, edd = Core.RULES.EDD(J);
    var f = k > 0 ? fr[k - 1] : null, on = f ? f.onAfter : [], removedSoFar = fr.slice(0, k).filter(function (x) { return x.removed !== null; }).map(function (x) { return x.removed; });
    var seq = k === n ? tr.sequence : on.concat(removedSoFar);
    drawGantt($("moGantt"), J, on, { hl: f ? [f.job] : null, total: 34 });
    var say;
    if (!f) say = "<p>先把作业按交货期从早到晚排好：" + edd.map(jn).join("、") + "。然后依次加入，每次加入之后检查：现在的完工时间是否超过它自己的交货期？</p>";
    else if (!f.late) say = "<p>加入 <b>" + jn(f.job) + "</b>，完工时间 " + f.t + " ≤ 交货期 " + J.d[f.job] + "，按期。</p>";
    else say = "<p>加入 <b>" + jn(f.job) + "</b>，完工时间 " + f.t + " &gt; 交货期 " + J.d[f.job] + "，超期了。移走已选作业里<b class=\"key\">加工时间最长</b>的 <b>" + jn(f.removed) + "</b>（p = " + J.p[f.removed] + "），完工时间回到 " + f.tAfter + "。被移走的作业只能延误，它的加工时间省下来给后面的作业。</p>";
    if (k === n) { var e = Core.evaluate(J, tr.sequence), edu = Core.evaluate(J, edd); say = "<p><b class=\"ok\">结束。</b>延误作业 " + tr.late.map(jn).join("、") + "，共 <b>" + tr.late.length + "</b> 个；按期作业 " + tr.onTime.map(jn).join(" → ") + " 排在前面，延误的放到最后。对照 EDD 顺序直接排：延误 " + edu.sumU + " 个。</p>"; drawGantt($("moGantt"), J, tr.sequence, { dim: tr.late, total: 34 }); }
    $("moSay").innerHTML = say;
    var stt = clear($("moStats"));
    stt.appendChild(stat("按期作业", String(on.length), on.map(jn).join(" ") || "—"));
    stt.appendChild(stat("已移走（延误）", String(removedSoFar.length), removedSoFar.map(jn).join(" ") || "—", removedSoFar.length > 0));
    stt.appendChild(stat("EDD 顺序直接排的延误数", String(Core.evaluate(J, edd).sumU), "对照：Moore–Hodgson 最优 " + tr.late.length));
    $("moTxt").textContent = "第 " + k + " / " + n + " 个作业";
    $("moPrev").disabled = k === 0; $("moNext").disabled = k >= n;
  }
  buildSeg($("moEx"), Object.keys(EX).map(function (k) { return { key: k, label: EX[k].name }; }), function () { return S.ex; }, function (k) { S.ex = k; S.k = 0; render(); });
  $("moPrev").addEventListener("click", function () { if (S.k > 0) { S.k--; render(); } });
  $("moNext").addEventListener("click", function () { S.k++; render(); });
  $("moAll").addEventListener("click", function () { S.k = Core.mooreTrace(EX[S.ex].J).frames.length; render(); });
  $("moReset").addEventListener("click", function () { S.k = 0; render(); });
  render();
  window.__fig2 = S;
})();
