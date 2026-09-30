/* gapview.js — 广义指派的表格画法：费用、LP 解（整数/分数）、整数最优的派法、每辆车的载重 */
function drawGap(tbl, C, w, Q, x, assign) {
  var m = C.length, n = w.length;
  clear(tbl);
  var head = el("tr", {}, [el("th")]), wrow = el("tr", { cls: "wrow" }, [el("th", { cls: "rl", text: "托盘数" })]);
  for (var j = 0; j < n; j++) { head.appendChild(el("th", { text: "T" + (j + 1) })); wrow.appendChild(el("td", { text: String(w[j]) })); }
  head.appendChild(el("th", { text: "载重" })); wrow.appendChild(el("td"));
  tbl.appendChild(el("thead", {}, [head]));
  var body = el("tbody"); body.appendChild(wrow);
  for (var i = 0; i < m; i++) {
    var tr = el("tr", {}, [el("th", { cls: "rl", text: "V" + (i + 1) })]), load = 0;
    for (j = 0; j < n; j++) {
      var v = x ? x[i][j] : 0, cls = v > 1 - 1e-6 ? "on" : v > 1e-6 ? "fr" : "";
      if (assign && assign[j] === i) cls += " ip";
      load += v * w[j];
      var td = el("td", { cls: cls }, [document.createTextNode(String(C[i][j]))]);
      if (v > 1e-6 && v < 1 - 1e-6) td.appendChild(el("small", { text: ufrac(v) }));
      tr.appendChild(td);
    }
    tr.appendChild(el("td", { cls: "load" + (load > Q[i] + 1e-6 ? " over" : ""), text: n0(Math.round(load * 100) / 100) + " / " + Q[i] }));
    body.appendChild(tr);
  }
  tbl.appendChild(body);
}
function gapFracTasks(x, w) { return w.map(function (_, t) { return t; }).filter(function (t) { return x.some(function (r) { return r[t] > 1e-6 && r[t] < 1 - 1e-6; }); }); }
