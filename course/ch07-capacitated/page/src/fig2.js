/* fig2.js — 图 7-2：背包的分支定界。逐个节点回放搜索树 */
(function () {
  var K = D.knap, n = K.v.length, bb = Core.knapBB(K.v, K.w, K.cap), nodes = bb.nodes, S = { step: 1 };
  var svg = $("btSvg");
  function nm(j) { return "T" + (j + 1); }
  // 树的布局：叶子从左到右排，父节点在子节点的中间
  var kids = nodes.map(function () { return []; });
  nodes.forEach(function (nd) { if (nd.parent >= 0) kids[nd.parent].push(nd.id); });
  var pos = [], leaf = 0, maxDepth = 0;
  (function lay(id) {
    var nd = nodes[id]; maxDepth = Math.max(maxDepth, nd.depth);
    if (!kids[id].length) { pos[id] = leaf++; return; }
    kids[id].forEach(lay);
    pos[id] = (pos[kids[id][0]] + pos[kids[id][kids[id].length - 1]]) / 2;
  })(0);
  var W = 720, H = 60 + maxDepth * 62, cw = (W - 60) / Math.max(leaf - 1, 1);
  function X(id) { return 30 + pos[id] * cw; }
  function Y(id) { return 30 + nodes[id].depth * 62; }

  function incumbent(k) { var b = 0; for (var i = 0; i < k; i++) if (nodes[i].status === "integer") b = Math.max(b, nodes[i].value); return b; }
  function pathOf(id) {
    var out = [];
    while (id > 0) { var nd = nodes[id]; out.push(nm(nd.item) + (nd.choice ? " 选" : " 不选")); id = nd.parent; }
    return out.reverse();
  }
  function draw() {
    var k = S.step, cur = k - 1;
    clear(svg); svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    for (var i = 1; i < k; i++) {
      var nd = nodes[i];
      sv("line", { cls: "edge" + (i === cur ? " now" : ""), x1: X(nd.parent), y1: Y(nd.parent) + 14, x2: X(i), y2: Y(i) - 14 }, svg);
      sv("text", { cls: "el", x: (X(nd.parent) + X(i)) / 2 + (nd.choice ? -16 : 16), y: (Y(nd.parent) + Y(i)) / 2 + 3, "text-anchor": "middle", text: nm(nd.item) + (nd.choice ? "=1" : "=0") }, svg);
    }
    for (i = 0; i < k; i++) {
      var d = nodes[i], g = sv("g", { cls: "nd " + d.status + (i === cur ? " now" : "") }, svg);
      sv("rect", { x: X(i) - 27, y: Y(i) - 14, width: 54, height: 28, rx: 6 }, g);
      sv("text", { x: X(i), y: Y(i) - 1, "text-anchor": "middle", text: d.bound === -Infinity ? "超载" : f1(d.bound) }, g);
      sv("text", { cls: "sm", x: X(i), y: Y(i) + 10, "text-anchor": "middle", text: d.status === "integer" ? "整数 " + d.value : d.status === "pruned" ? "剪枝" : d.status === "infeasible" ? "" : "" }, g);
    }
    var d0 = nodes[cur], inc = incumbent(k), say = "<p>第 <b>" + k + "</b> / " + nodes.length + " 个节点";
    say += d0.parent < 0 ? "（根）：整个背包的 LP 上界 " + f1(d0.bound) + "，分数变量是 " + nm(d0.frac) + "。分两支：先试选 " + nm(d0.frac) + "，再试不选。</p>" : "。决定：" + pathOf(cur).join("，") + "。上界 " + (d0.bound === -Infinity ? "超载" : f1(d0.bound)) + "。</p>";
    if (d0.status === "pruned") say += "<p><b class=\"no\">剪枝</b>：上界 " + f1(d0.bound) + " 向下取整是 " + Math.floor(d0.bound + 1e-9) + "，不比手上最好的整数解 " + inc + " 更大，这一支里不可能有更好的解。</p>";
    if (d0.status === "infeasible") say += "<p><b class=\"no\">作废</b>：必选的物品已经超过载重。</p>";
    if (d0.status === "integer") say += "<p><b class=\"ok\">找到整数解</b>，价值 " + d0.value + "，成为新的最好解。</p>";
    if (d0.status === "branch" && d0.parent >= 0) say += "<p>LP 解里的分数变量是 " + nm(d0.frac) + "，继续分两支。</p>";
    $("btSay").innerHTML = say;
    var fl = clear($("btFlags"));
    fl.appendChild(el("span", { cls: inc ? "ok" : "", text: "当前最好整数解：" + inc }));
    fl.appendChild(el("span", { text: "已创建 " + k + " 个节点" }));
    fl.appendChild(el("span", { cls: k === nodes.length ? "hot" : "", text: "全部 " + nodes.length + " 个，完全枚举要 " + (Math.pow(2, n + 1) - 1) + " 个" }));
    $("btTxt").textContent = "第 " + k + " / " + nodes.length + " 步";
    $("btPrev").disabled = k <= 1; $("btNext").disabled = k >= nodes.length;
  }
  $("btPrev").addEventListener("click", function () { if (S.step > 1) { S.step--; draw(); } });
  $("btNext").addEventListener("click", function () { if (S.step < nodes.length) { S.step++; draw(); } });
  $("btAll").addEventListener("click", function () { S.step = nodes.length; draw(); });
  $("btReset").addEventListener("click", function () { S.step = 1; draw(); });
  draw();
  window.__fig2 = { S: S, nodes: nodes };
})();
