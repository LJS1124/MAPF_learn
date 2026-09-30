/* ui.js — 公共工具：DOM 构造、提示框、先预测与遮罩、分段按钮、折线图坐标 */
var D = window.DATA, Core = window.Core, SVGNS = "http://www.w3.org/2000/svg";

function $(id) { return document.getElementById(id); }
function el(tag, attrs, kids) {
  var e = document.createElement(tag);
  if (attrs) for (var k in attrs) {
    if (attrs[k] == null) continue;
    if (k === "text") e.textContent = attrs[k];
    else if (k === "html") e.innerHTML = attrs[k];
    else if (k === "cls") e.className = attrs[k];
    else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), attrs[k]);
    else e.setAttribute(k, attrs[k]);
  }
  (kids || []).forEach(function (c) { if (c != null) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
  return e;
}
function sv(tag, attrs, parent) {
  var e = document.createElementNS(SVGNS, tag);
  if (attrs) for (var k in attrs) {
    if (k === "text") e.textContent = attrs[k];
    else if (k === "cls") e.setAttribute("class", attrs[k]);
    else e.setAttribute(k, attrs[k]);
  }
  if (parent) parent.appendChild(e);
  return e;
}
function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); return n; }
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function range(n) { var o = []; for (var i = 0; i < n; i++) o.push(i); return o; }
function fill(n, x) { return new Array(n).fill(x); }
function f1(v) { return (Math.round(v * 10) / 10).toFixed(1); }
function f2(v) { return (Math.round(v * 100) / 100).toFixed(2); }
function pct(v) { return (v * 100).toFixed(1) + "%"; }
function n0(v) { if (v === Infinity) return "∞"; return Math.abs(v - Math.round(v)) < 1e-9 ? String(Math.round(v)) : f1(v); }
function sgn(v) { return (v > 1e-9 ? "+" : v < -1e-9 ? "−" : "") + n0(Math.abs(v)); }
function commas(v) { return Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
function near(a, b) { return Math.abs(a - b) < 1e-7; }
function M(base, s) { return el("span", {}, [el("span", { cls: "m", text: base }), s ? el("sub", { cls: "m", text: s }) : null]); }
function sum(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s; }

// ------------------------------------------------------------ tooltip
var tip = $("tip");
function showTip(evt, nodes) {
  clear(tip); nodes.forEach(function (n) { tip.appendChild(n); });
  tip.hidden = false;
  var x = evt.clientX + 14, y = evt.clientY + 14, r = tip.getBoundingClientRect();
  if (x + r.width > window.innerWidth - 8) x = evt.clientX - r.width - 14;
  if (y + r.height > window.innerHeight - 8) y = evt.clientY - r.height - 14;
  tip.style.left = Math.max(8, x) + "px"; tip.style.top = Math.max(8, y) + "px";
}
function hideTip() { tip.hidden = true; }

// ------------------------------------------------------------ 先预测与遮罩
function gate(host, prediction) {
  if (window.PRINT_MODE) return function () {};   // 打印/PDF：不遮挡
  host.classList.add("gated");
  var cover = el("div", { cls: "gate-cover" }, [el("div", {}, [
    el("p", { text: "先完成上面的预测，再看结果" }),
    el("button", { cls: "btn ghost", type: "button", text: "跳过预测，直接看", onclick: function () { prediction.reveal(null); } })
  ])]);
  host.appendChild(cover);
  return function () { host.classList.remove("gated"); if (cover.parentNode) cover.parentNode.removeChild(cover); };
}
function prediction(box, cfg) {
  var opened = [], done = false, res = el("div", { cls: "res", hidden: "" });
  var btns = cfg.opts.map(function (o, k) { return el("button", { type: "button", text: o, onclick: function () { api.reveal(k); } }); });
  box.appendChild(el("div", { cls: "q", text: cfg.q }));
  box.appendChild(el("div", { cls: "opts" }, btns));
  box.appendChild(res);
  var api = {
    onReveal: function (fn) { opened.push(fn); },
    reveal: function (k) {
      if (done) return; done = true;
      btns.forEach(function (b, i) { b.disabled = true; if (i === cfg.ans) b.classList.add("right"); else if (i === k) b.classList.add("wrong"); });
      clear(res); res.hidden = false;
      if (k === null) res.appendChild(el("span", { text: "（已跳过）" }));
      else res.appendChild(el("b", { cls: k === cfg.ans ? "ok" : "no", text: k === cfg.ans ? "预测正确。" : "和实际不一样。" }));
      res.appendChild(document.createTextNode(" " + cfg.explain));
      opened.forEach(function (fn) { fn(); });
    }
  };
  if (window.PRINT_MODE) setTimeout(function () { api.reveal(cfg.ans); }, 0);   // 打印/PDF：直接显示答案与解析
  return api;
}

// ------------------------------------------------------------ 分段按钮
// items: [{key, label}]；get() 返回当前 key；pick(key) 在点击时调用
function buildSeg(host, items, get, pick) {
  clear(host);
  function sync() {
    Array.prototype.forEach.call(host.children, function (b, i) { if (items[i]) b.setAttribute("aria-pressed", items[i].key === get() ? "true" : "false"); });
  }
  items.forEach(function (it) {
    host.appendChild(el("button", { type: "button", text: it.label, "aria-pressed": get() === it.key ? "true" : "false",
      onclick: function () { var first = host.firstChild; pick(it.key); if (host.firstChild === first) sync(); } }));
  });
  return sync;
}

function stat(label, value, sub, hot) {
  return el("div", { cls: "stat" + (hot ? " hot" : "") }, [el("div", { cls: "l", text: label }), el("div", { cls: "v", text: value }), sub ? el("div", { cls: "d", text: sub }) : null]);
}

// 分数的紧凑显示：1/2 -> ½
function ufrac(x) { var s = Core.frac(x); return { "1/2": "½", "1/3": "⅓", "2/3": "⅔", "1/4": "¼", "3/4": "¾" }[s] || s; }

// 派法的文字：T1←V3, T2←V2 ...
function assignText(a, scn) {
  return a.map(function (i, j) { return scn.tasks[j].id + "←" + (i < 0 || i == null ? "延后" : scn.vehicles[i].id); }).join("，");
}

// ------------------------------------------------------------ 折线图坐标（对数/线性都可用）
function lineChart(svg, cfg) {
  clear(svg);
  var W = cfg.W || 340, H = cfg.H || 200, ml = cfg.ml || 46, mr = cfg.mr || 16, mt = cfg.mt || 20, mb = cfg.mb || 36;
  svg.setAttribute("viewBox", "0 0 " + W + " " + H);
  var xs = cfg.x, ys = cfg.y;
  function X(v) { return ml + (v - xs[0]) / (xs[1] - xs[0]) * (W - ml - mr); }
  function Y(v) { return mt + (1 - (v - ys[0]) / (ys[1] - ys[0])) * (H - mt - mb); }
  (cfg.yticks || []).forEach(function (t) {
    sv("line", { cls: "gridline", x1: ml, x2: W - mr, y1: Y(t[0]), y2: Y(t[0]) }, svg);
    sv("text", { x: ml - 6, y: Y(t[0]) + 3.5, "text-anchor": "end", text: t[1] }, svg);
  });
  sv("line", { cls: "axisline", x1: ml, x2: W - mr, y1: H - mb, y2: H - mb }, svg);
  (cfg.xticks || []).forEach(function (t) {
    sv("line", { cls: "axisline", x1: X(t[0]), x2: X(t[0]), y1: H - mb, y2: H - mb + 4 }, svg);
    sv("text", { x: X(t[0]), y: H - mb + 16, "text-anchor": "middle", text: t[1] }, svg);
  });
  if (cfg.xlabel) sv("text", { x: (ml + W - mr) / 2, y: H - 4, "text-anchor": "middle", cls: "val2", text: cfg.xlabel }, svg);
  if (cfg.ylabel) sv("text", { x: 4, y: 11, cls: "val2", text: cfg.ylabel }, svg);
  return { X: X, Y: Y, W: W, H: H, ml: ml, mr: mr, mt: mt, mb: mb };
}
