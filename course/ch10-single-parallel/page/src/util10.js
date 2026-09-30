/* util10.js — 甘特图与下标记号的公共画法 */
var JCOL = ["#2a78d6", "#eb6834", "#0f7a2e", "#8b5cc8", "#c08a1e", "#3a9ab5", "#c43a7a", "#5a6b78"];
function subs(s) { return s.replace(/_(max|jk|j)/g, "<sub>$1</sub>"); }
function jn(j) { return "J" + (j + 1); }
// 单机甘特图：seq 里的作业连续加工；opts.hl 高亮的作业；opts.dim 变淡的作业；opts.total 时间轴的长度
function drawGantt(svg, J, seq, opts) {
  opts = opts || {};
  var tot = 0; seq.forEach(function (j) { tot += J.p[j]; });
  var W = 680, H = 150, ml = 20, span = Math.max(opts.total || tot, tot, 20), scale = (W - ml - 16) / span, t = 0;
  clear(svg); svg.setAttribute("viewBox", "0 0 " + W + " " + H);
  for (var k = 0; k <= span; k += 5) { sv("line", { x1: ml + k * scale, x2: ml + k * scale, y1: 32, y2: 98, stroke: "var(--line)" }, svg); sv("text", { x: ml + k * scale, y: 114, "text-anchor": "middle", cls: "tk", text: String(k) }, svg); }
  seq.forEach(function (j) {
    var x = ml + t * scale, w = J.p[j] * scale, late = J.d && t + J.p[j] > J.d[j], hl = opts.hl && opts.hl.indexOf(j) >= 0;
    sv("rect", { x: x, y: 42, width: w - 1.5, height: 44, rx: 5, fill: JCOL[j % 8], opacity: opts.dim && opts.dim.indexOf(j) >= 0 ? 0.25 : 0.9, stroke: hl ? "var(--ink)" : late ? "var(--bad)" : "none", "stroke-width": hl ? 3.5 : late ? 3 : 0 }, svg);
    sv("text", { x: x + w / 2, y: 62, "text-anchor": "middle", cls: "gl", text: jn(j) }, svg);
    sv("text", { x: x + w / 2, y: 77, "text-anchor": "middle", cls: "gs", text: "p=" + J.p[j] }, svg);
    if (J.d) {
      var dx = ml + J.d[j] * scale;
      sv("path", { d: "M" + dx + " 36 l-5 -10 h10 z", fill: late ? "var(--bad)" : JCOL[j % 8], stroke: "var(--surface)", "stroke-width": 1 }, svg);
      sv("text", { x: dx, y: 18, "text-anchor": "middle", cls: "gs", text: "d" + (j + 1) }, svg);
    }
    t += J.p[j];
  });
  sv("text", { x: W - 8, y: 140, "text-anchor": "end", cls: "tk", text: "三角标 = 交货期；红框 = 延误" }, svg);
}
// 并行机甘特图：slots[i] = [{ job, start, end }]
function drawMachines(svg, slots, p, opts) {
  opts = opts || {};
  var m = slots.length, W = 680, rowH = 40, top = opts.top || 20, H = top + m * rowH + 34, ml = 56, span = opts.span || 10, scale = (W - ml - 16) / span;
  svg.setAttribute("viewBox", "0 0 " + W + " " + H);
  for (var k = 0; k <= span; k += (span > 40 ? 10 : 5)) { sv("line", { x1: ml + k * scale, x2: ml + k * scale, y1: top - 4, y2: top + m * rowH, stroke: "var(--line)" }, svg); sv("text", { x: ml + k * scale, y: top + m * rowH + 14, "text-anchor": "middle", cls: "tk", text: String(k) }, svg); }
  slots.forEach(function (sl, i) {
    sv("text", { x: 4, y: top + i * rowH + 24, cls: "tk", text: "机器 " + (i + 1) }, svg);
    sl.forEach(function (s) {
      var w = (s.end - s.start) * scale;
      sv("rect", { x: ml + s.start * scale, y: top + i * rowH, width: Math.max(w - 1.2, 1), height: rowH - 8, rx: 4, fill: JCOL[s.job % 8], opacity: 0.9 }, svg);
      if (w > 15) sv("text", { x: ml + (s.start + s.end) / 2 * scale, y: top + i * rowH + 21, "text-anchor": "middle", cls: "gl", text: opts.short ? String(p[s.job]) : jn(s.job) }, svg);
    });
  });
  return { H: H, ml: ml, scale: scale, top: top, rowH: rowH, m: m };
}
