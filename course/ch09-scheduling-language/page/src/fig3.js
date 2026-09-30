/* fig3.js — 图 9-3：三段式记号与复杂度地图。选 α | β | γ，看它容易还是难；地图里每个格子是一个（机器环境 × 目标）的组合 */
(function () {
  var S = { alpha: "1", beta: [], gamma: "sumC" }, AL = Core.ALPHAS, GA = Core.GAMMAS;
  var ATXT = { "1": "1", P2: "P2", P: "Pm", Q: "Qm", R: "Rm", F2: "F2", F: "Fm", J2: "J2", J: "Jm", O2: "O2", O: "Om" };
  var STATUS = { P: ["多项式可解", "ok"], W: ["NP 难（有伪多项式算法）", "hot"], NP: ["NP 难", "no"], "?": ["表里推不出", ""] };
  function render() {
    var prob = { alpha: S.alpha, beta: S.beta.slice().sort(function (a, b) { return Core.BETAS.indexOf(a) - Core.BETAS.indexOf(b); }), gamma: S.gamma }, res = Core.classify(prob);
    $("notTxt").innerHTML = subs(Core.format(ATXT[prob.alpha], prob.beta, prob.gamma));
    var badge = clear($("notBadge"));
    badge.appendChild(el("span", { cls: STATUS[res.status][1], text: STATUS[res.status][0] }));
    $("notWhy").textContent = res.why + "。";
    // 地图
    var tb = clear($("cxMap")), head = el("tr", {}, [el("th")]);
    GA.forEach(function (g) { head.appendChild(el("th", { html: subs(Core.G_TEXT[g]) })); });
    tb.appendChild(el("thead", {}, [head]));
    var body = el("tbody");
    AL.forEach(function (a) {
      var tr = el("tr", {}, [el("th", { cls: "rl", text: ATXT[a] })]);
      GA.forEach(function (g) {
        var r = Core.classify({ alpha: a, beta: prob.beta, gamma: g }), sel = a === S.alpha && g === S.gamma;
        tr.appendChild(el("td", { cls: "cx-" + r.status + (sel ? " sel" : ""), title: r.why, text: { P: "P", W: "弱", NP: "难", "?": "?" }[r.status], onclick: function () { S.alpha = a; S.gamma = g; render(); } }));
      });
      body.appendChild(tr);
    });
    tb.appendChild(body);
    $("cxNote").textContent = prob.beta.length ? "地图按当前选的附加条件（β）计算。" : "β 为空：没有释放时间、先后约束等附加条件。";
    Object.keys(S.chips).forEach(function (b) { S.chips[b].setAttribute("aria-pressed", S.beta.indexOf(b) >= 0 ? "true" : "false"); });
  }
  buildSeg($("notAlpha"), AL.map(function (a) { return { key: a, label: ATXT[a] }; }), function () { return S.alpha; }, function (k) { S.alpha = k; render(); });
  buildSeg($("notGamma"), GA.map(function (g) { return { key: g, label: Core.G_TEXT[g].replace(/_/g, "") }; }), function () { return S.gamma; }, function (k) { S.gamma = k; render(); });
  S.chips = {};
  var host = $("notBeta");
  Core.BETAS.forEach(function (b) { var c = el("button", { type: "button", text: Core.B_TEXT[b].replace(/_/g, ""), "aria-pressed": "false", onclick: function () { var i = S.beta.indexOf(b); if (i >= 0) S.beta.splice(i, 1); else S.beta.push(b); render(); } }); S.chips[b] = c; host.appendChild(c); });
  render();
  window.__fig3 = S;
})();
