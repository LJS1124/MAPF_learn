/* fig4.js — 图 7-4：覆盖割。根节点上反复“解 LP、找违反的覆盖、加割”，下界从 220 逼近 234；分支定界节点数 */
(function () {
  var G = D.gap, cl = Core.gapCutLoop(G.C, G.w, G.Q), R = cl.rounds, en = Core.gapEnum(G.C, G.w, G.Q), S = { r: 0 };
  var bb0 = Core.gapBB(G.C, G.w, G.Q), bb1 = Core.gapBB(G.C, G.w, G.Q, { cuts: cl.cuts });
  var lpNo = Core.gapLP(G.C, G.w, [1e6, 1e6, 1e6]).value;

  function cutText(c) { return "V" + (c.i + 1) + "：" + c.S.map(function (t) { return "T" + (t + 1); }).join("、") + " 至多选 " + c.k + " 个（这几个任务共 " + c.S.reduce(function (a, t) { return a + G.w[t]; }, 0) + " 个托盘，超过载重 " + G.Q[c.i] + "）"; }
  function chart() {
    var svg = $("cutChart"), vals = [lpNo, R[0].value].concat(R.slice(1).map(function (r) { return r.value; })), labs = ["不限载重", "加载重"].concat(R.slice(1).map(function (_, i) { return "第 " + (i + 1) + " 轮割"; }));
    vals.push(en.value); labs.push("整数最优");
    var c = lineChart(svg, { W: 420, H: 200, ml: 46, mr: 14, mt: 20, mb: 44, x: [-0.5, vals.length - 0.5], y: [205, 240], yticks: [210, 220, 230, 240].map(function (t) { return [t, String(t)]; }), xticks: [] });
    vals.forEach(function (v, i) {
      var isNow = i === S.r + 1, x = c.X(i), y = c.Y(v), bw = 34;
      sv("rect", { cls: "barfill" + (i === vals.length - 1 ? " hot" : ""), x: x - bw / 2, y: y, width: bw, height: (c.H - c.mb) - y, opacity: i > S.r + 1 && i < vals.length - 1 ? 0.25 : 1 }, svg);
      sv("text", { x: x, y: y - 5, "text-anchor": "middle", cls: "val", text: n0(Math.round(v * 100) / 100) }, svg);
      sv("text", { x: x, y: c.H - c.mb + 14, "text-anchor": "middle", cls: "val2", text: labs[i] }, svg);
    });
  }
  function draw() {
    var r = R[S.r], k = S.r;
    drawGap($("cutTbl"), G.C, G.w, G.Q, r.x, en.assign);
    var say = "<p>第 " + (k + 1) + " 轮的 LP：<b>" + n0(Math.round(r.value * 100) / 100) + "</b>，" + (k === 0 ? "只有载重约束。" : "带着前 " + k + " 轮加的 " + r.ncuts + " 条割。") + "分数的任务：" + (gapFracTasks(r.x, G.w).map(function (t) { return "T" + (t + 1); }).join("、") || "没有") + "。</p>";
    var ul = "";
    if (r.added.length) { say += "<p>这一轮找到 <b class=\"key\">" + r.added.length + "</b> 条被违反的覆盖割：</p>"; ul = "<ul class=\"cutlist\">" + r.added.map(function (c) { return "<li>" + cutText(c) + "；当前 LP 里它们的和是 " + f2(c.lhs) + " &gt; " + c.k + "</li>"; }).join("") + "</ul>"; }
    else say += "<p><b class=\"ok\">再也找不到违反的覆盖割</b>（按这里的分离规则）。下界停在 " + n0(Math.round(r.value * 100) / 100) + "，整数最优是 " + en.value + "，还差 " + n0(Math.round((en.value - r.value) * 100) / 100) + "。剩下的这一点靠分支解决。</p>";
    $("cutSay").innerHTML = say + ul;
    $("cutTxt").textContent = "第 " + (k + 1) + " / " + R.length + " 轮";
    $("cutPrev").disabled = k === 0; $("cutNext").disabled = k >= R.length - 1;
    var fl = clear($("cutFlags"));
    fl.appendChild(el("span", { cls: "hot", text: "分支定界：不加割 " + bb0.nodes + " 个节点" }));
    fl.appendChild(el("span", { cls: "ok", text: "先加 " + cl.cuts.length + " 条割：" + bb1.nodes + " 个节点" }));
    chart();
  }
  $("cutPrev").addEventListener("click", function () { if (S.r > 0) { S.r--; draw(); } });
  $("cutNext").addEventListener("click", function () { if (S.r < R.length - 1) { S.r++; draw(); } });
  $("cutAll").addEventListener("click", function () { S.r = R.length - 1; draw(); });
  $("cutReset").addEventListener("click", function () { S.r = 0; draw(); });
  draw();
  window.__fig4 = { cl: cl, bb0: bb0, bb1: bb1 };
})();
