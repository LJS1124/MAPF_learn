/* util11.js — 流水车间与作业车间的甘特图、析取图画法 */
var JCOL = ["#2a78d6", "#eb6834", "#0f7a2e", "#8b5cc8", "#c08a1e", "#3a9ab5", "#c43a7a", "#5a6b78"];
var MCOL = ["#2a78d6", "#eb6834", "#0f7a2e"];
function jn(j) { return "J" + (j + 1); }
function mn(m) { return "M" + (m + 1); }
// 多机甘特图：rows[i] = [{ job, start, end, hl }]，label 是块里的文字
function drawRows(svg, rows, opts) {
  opts = opts || {};
  var m = rows.length, W = 680, rowH = 36, top = 14, H = top + m * rowH + 30, ml = 40, span = Math.max(opts.span || 10, 1), scale = (W - ml - 16) / span;
  clear(svg); svg.setAttribute("viewBox", "0 0 " + W + " " + H);
  var step = span > 40 ? 10 : 5;
  for (var k = 0; k <= span; k += step) { sv("line", { x1: ml + k * scale, x2: ml + k * scale, y1: top - 4, y2: top + m * rowH, stroke: "var(--line)" }, svg); sv("text", { x: ml + k * scale, y: top + m * rowH + 14, "text-anchor": "middle", cls: "tk", text: String(k) }, svg); }
  rows.forEach(function (row, i) {
    sv("text", { x: 4, y: top + i * rowH + 21, cls: "tk", text: opts.names ? opts.names[i] : mn(i) }, svg);
    row.forEach(function (s) {
      var w = (s.end - s.start) * scale;
      sv("rect", { x: ml + s.start * scale, y: top + i * rowH, width: Math.max(w - 1.2, 1), height: rowH - 7, rx: 4, fill: JCOL[s.job % 8], opacity: 0.92, stroke: s.hl ? "var(--ink)" : "none", "stroke-width": s.hl ? 3 : 0 }, svg);
      if (w > 14) sv("text", { x: ml + (s.start + s.end) / 2 * scale, y: top + i * rowH + 20, "text-anchor": "middle", cls: "gl", text: s.label || jn(s.job) }, svg);
    });
  });
  if (opts.mark != null) { var x = ml + opts.mark * scale; sv("line", { x1: x, x2: x, y1: top - 6, y2: top + m * rowH, stroke: "var(--hot)", "stroke-width": 2, "stroke-dasharray": "4 3" }, svg); sv("text", { x: x, y: top + m * rowH + 26, "text-anchor": "middle", cls: "tk", text: (opts.markLabel || "C_max") + " = " + opts.mark }, svg); }
}
// 流水车间的甘特图：perm = 作业顺序
function drawFlow(svg, P, perm, span) {
  var fs = Core.flowSchedule(P, perm), m = P[0].length, rows = [];
  for (var k = 0; k < m; k++) rows.push(perm.map(function (j) { return { job: j, start: fs.start[j][k], end: fs.end[j][k] }; }));
  drawRows(svg, rows, { span: span, mark: fs.Cmax });
  return fs;
}
// 在有向图里找一个环（返回节点序列），没有则 null
function findCycle(n, arcs) {
  var adj = []; for (var i = 0; i < n; i++) adj.push([]);
  arcs.forEach(function (a) { adj[a.from].push(a.to); });
  var color = new Array(n).fill(0), stack = [], found = null;
  function dfs(u) {
    color[u] = 1; stack.push(u);
    for (var i = 0; i < adj[u].length && !found; i++) {
      var v = adj[u][i];
      if (color[v] === 1) found = stack.slice(stack.indexOf(v));
      else if (color[v] === 0) dfs(v);
    }
    stack.pop(); color[u] = 2;
  }
  for (var s = 0; s < n && !found; s++) if (color[s] === 0) dfs(s);
  return found;
}
