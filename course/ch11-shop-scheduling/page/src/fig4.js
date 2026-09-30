/* fig4.js — 表 11-1：MIP 与 CP-SAT 的实测对比（数据来自 data.json） */
(function () {
  var tb = clear($("cmpTable")), body = el("tbody");
  tb.appendChild(el("thead", {}, [el("tr", {}, ["实例", "工序数", "最优 C_max", "CP-SAT 用时", "MIP 结果（解 / 对偶界）", "MIP 用时", "MIP 是否证明最优", "LP 松弛"].map(function (t) { return el("th", { text: t }); }))]));
  D.cmp.forEach(function (r) {
    body.appendChild(el("tr", { cls: "" }, [
      el("td", { text: r.name }), el("td", { text: String(r.ops) }), el("td", { text: String(r.opt) }),
      el("td", { text: r.tcp.toFixed(2) + " 秒" }),
      el("td", { text: n0(r.mip) + " / " + f2(r.dual) }),
      el("td", { text: r.tmip.toFixed(2) + " 秒" }),
      el("td", { text: r.proven ? "是" : "否（限时 30 秒）" }),
      el("td", { text: r.lp != null ? f1(r.lp) : "—" })
    ]));
  });
  tb.appendChild(body);
})();
