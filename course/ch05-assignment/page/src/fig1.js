/* fig1.js — 图 5-1：任务陆续到达（地图、改派链、到达表） */
(function () {
  var DEFAULT = clone(D.scenario), P = DEFAULT.params;
  var S = { scn: clone(DEFAULT), okey: "fifo", k: 4, seed: 0, rnd: 1, dragged: false };
  var R = {};
  var ORD = [{ key: "fifo", label: "T1 → T5" }, { key: "rev", label: "T5 → T1" }, { key: "f2", label: "2 楼任务先到" }, { key: "rand", label: "随机顺序" }];

  function V(i) { return S.scn.vehicles[i]; }
  function T(j) { return S.scn.tasks[j]; }
  function order() {
    var n = S.scn.tasks.length, idx = range(n);
    if (S.okey === "rev") return idx.slice().reverse();
    if (S.okey === "f2") return idx.slice().sort(function (a, b) { return S.scn.tasks[b].floor - S.scn.tasks[a].floor || a - b; });
    if (S.okey === "rand") {
      var rnd = Core.mulberry32(1000 + S.rnd), a = idx.slice();
      for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
      return a;
    }
    return idx;
  }
  function compute() {
    var C = Core.costMatrix(S.scn), od = order();
    R = { C: C, order: od, inc: Core.incremental(C, od), gr: Core.greedyFifo(C, od), opt: Core.hungarian(C).value };
  }
  function ev() { return S.k > 0 ? R.inc.events[S.k - 1] : null; }

  // ------------------------------------------------------------ 地图
  var CELL = 30, LEFT = 44, HEAD = 20, FGAP = 30, TOP = 4;
  var FH = HEAD + (P.depth + 1) * CELL;
  function cx(x) { return LEFT + (x + 1) * CELL + CELL / 2; }
  function ftop(f) { return f === 2 ? TOP : TOP + FH + FGAP; }
  function cy(f, y) { return ftop(f) + HEAD + (P.depth - y) * CELL + CELL / 2; }
  var MW = LEFT + (P.width + 1) * CELL + 30, MH = ftop(1) + FH + 6;
  var map = $("map");
  map.setAttribute("viewBox", "0 0 " + MW + " " + MH);

  function drawBase() {
    var g = sv("g", {}, map);
    [2, 1].forEach(function (f) {
      sv("text", { cls: "flabel", x: 4, y: ftop(f) + 14, text: f + "F" }, g);
      for (var x = 0; x < P.width; x++) {
        sv("rect", { cls: "lane", x: cx(x) - CELL / 2 + 2, y: cy(f, P.depth) - CELL / 2, width: CELL - 4, height: P.depth * CELL, rx: 2 }, g);
        for (var y = 1; y < P.depth; y++) sv("line", { cls: "slot", x1: cx(x) - CELL / 2 + 2, x2: cx(x) + CELL / 2 - 2, y1: cy(f, y) - CELL / 2, y2: cy(f, y) - CELL / 2 }, g);
        sv("text", { cls: "axis", x: cx(x), y: ftop(f) + 14, "text-anchor": "middle", text: x }, g);
      }
      for (var yy = 1; yy <= P.depth; yy++) sv("text", { cls: "axis", x: LEFT - 4, y: cy(f, yy) + 3, "text-anchor": "end", text: yy }, g);
      sv("text", { cls: "note", x: 4, y: cy(f, P.depth) + 4, text: "货位" }, g);
      sv("rect", { cls: "aisle", x: cx(-1) - CELL / 2, y: cy(f, 0) - CELL / 2 + 3, width: (P.width + 1) * CELL, height: CELL - 6, rx: 3 }, g);
      sv("text", { cls: "note", x: 4, y: cy(f, 0) + 4, text: "主巷道" }, g);
    });
    sv("rect", { cls: "shaft", x: cx(-1) - 7, y: cy(2, 0), width: 14, height: cy(1, 0) - cy(2, 0) }, g);
    [2, 1].forEach(function (f) { sv("rect", { cls: "liftbox", x: cx(-1) - CELL / 2 + 3, y: cy(f, 0) - CELL / 2 + 2, width: CELL - 6, height: CELL - 4, rx: 3 }, g); });
    sv("text", { cls: "note", x: cx(-1) + 11, y: (cy(2, 0) + cy(1, 0)) / 2 + 4, text: "提升机" }, g);
    var defs = sv("defs", {}, map);
    [["same", "var(--accent)"], ["diff", "var(--hot)"], ["ghost", "var(--muted)"]].forEach(function (mk) {
      var m = sv("marker", { id: "ah-" + mk[0], viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 5, markerHeight: 5, orient: "auto-start-reverse" }, defs);
      sv("path", { d: "M0,0 L10,5 L0,10 z", style: "fill:" + mk[1] }, m);
    });
  }
  drawBase();
  var gRoutes = sv("g", {}, map), gOver = sv("g", {}, map), gMarks = sv("g", {}, map);

  function routeSegs(i, j, off) {
    var v = V(i), t = T(j);
    function pts(a) { return a.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" "); }
    if (v.floor === t.floor) {
      if (v.x === t.x) return [{ p: pts([[cx(v.x) + off, cy(v.floor, v.y)], [cx(t.x) + off, cy(t.floor, t.y)]]), end: true }];
      return [{ p: pts([[cx(v.x), cy(v.floor, v.y)], [cx(v.x), cy(v.floor, 0) + off], [cx(t.x), cy(t.floor, 0) + off], [cx(t.x), cy(t.floor, t.y)]]), end: true }];
    }
    return [
      { p: pts([[cx(v.x), cy(v.floor, v.y)], [cx(v.x), cy(v.floor, 0) + off], [cx(-1), cy(v.floor, 0) + off]]) },
      { p: pts([[cx(-1) + off, cy(v.floor, 0)], [cx(-1) + off, cy(t.floor, 0)]]), lift: true },
      { p: pts([[cx(-1), cy(t.floor, 0) + off], [cx(t.x), cy(t.floor, 0) + off], [cx(t.x), cy(t.floor, t.y)]]), end: true }
    ];
  }

  function drawRoutes() {
    clear(gRoutes); clear(gOver);
    var C = R.C, m = S.scn.vehicles.length, e = ev(), n = S.scn.tasks.length;
    var a = e ? e.aAfter : fill(n, -1), chain = {};
    if (e) e.chain.forEach(function (c) { chain[c.task] = c; });
    function draw(i, j, kind, label) {
      var off = (i - (m - 1) / 2) * 2.6, grp = sv("g", {}, gRoutes);
      routeSegs(i, j, off).forEach(function (s) {
        var at = { cls: "route " + kind + (s.lift ? " lift" : ""), points: s.p };
        if (s.end) at["marker-end"] = "url(#ah-" + kind + ")";
        sv("polyline", at, grp);
      });
      if (label) { var t = T(j); sv("text", { cls: "rlabel" + (kind === "diff" ? " hotl" : ""), x: cx(t.x) + 14, y: cy(t.floor, t.y) - 9, text: C[i][j] + "s" }, gRoutes); }
    }
    R.order.slice(0, S.k).forEach(function (j) {
      var i = a[j], c = chain[j];
      if (c) { if (c.from >= 0) draw(c.from, j, "ghost", false); draw(i, j, "diff", true); }
      else draw(i, j, "same", true);
    });
    if (e) { var t = T(e.task); sv("circle", { cls: "ring", cx: cx(t.x), cy: cy(t.floor, t.y), r: 16 }, gOver); }
  }

  function occupied(f, x, y, skip) { return S.scn.vehicles.concat(S.scn.tasks).some(function (o) { return o !== skip && o.floor === f && o.x === x && o.y === y; }); }
  function svgPoint(evt) { var pt = map.createSVGPoint(); pt.x = evt.clientX; pt.y = evt.clientY; return pt.matrixTransform(map.getScreenCTM().inverse()); }
  function cellAt(p, isTask) {
    var f = p.y < ftop(1) - FGAP / 2 ? 2 : 1;
    var x = Math.round((p.x - LEFT - CELL / 2) / CELL) - 1, y = P.depth - Math.round((p.y - ftop(f) - HEAD - CELL / 2) / CELL);
    x = Math.max(0, Math.min(P.width - 1, x)); y = Math.max(isTask ? 1 : 0, Math.min(P.depth, y));
    return { floor: f, x: x, y: y };
  }
  function moveTo(obj, c) {
    if (occupied(c.floor, c.x, c.y, obj)) return false;
    obj.floor = c.floor; obj.x = c.x; obj.y = c.y; S.dragged = true;
    refresh(true);
    return true;
  }
  function focusMark(id) { var n = gMarks.querySelector('[data-id="' + id + '"]'); if (n) n.focus(); }

  function drawMarks() {
    clear(gMarks);
    var e = ev(), n = S.scn.tasks.length, a = e ? e.aAfter : fill(n, -1), arrived = R.order.slice(0, S.k);
    function mk(obj, isTask, idx) {
      var spare = !isTask && a.indexOf(idx) < 0, pend = isTask && arrived.indexOf(idx) < 0, fresh = isTask && e && e.task === idx;
      var cls = (isTask ? "task" + (pend ? " pending" : "") + (fresh ? " fresh" : "") : "veh" + (spare ? " spare" : "")) + " drag";
      var g = sv("g", { cls: cls, tabindex: 0, role: "button",
        "aria-label": obj.id + "，" + obj.floor + " 楼，货道 " + obj.x + (obj.y ? "，货位 " + obj.y : "，主巷道") + "。方向键移动，Shift+上下换层",
        transform: "translate(" + cx(obj.x) + "," + cy(obj.floor, obj.y) + ")" }, gMarks);
      if (isTask) sv("circle", { r: 11 }, g); else sv("rect", { x: -11, y: -11, width: 22, height: 22, rx: 4 }, g);
      sv("text", { "text-anchor": "middle", y: 3.5, text: obj.id }, g);
      var drag = null;
      g.addEventListener("pointerdown", function (evt) {
        evt.preventDefault(); g.focus(); g.setPointerCapture(evt.pointerId);
        drag = { cell: { floor: obj.floor, x: obj.x, y: obj.y }, moved: false }; g.classList.add("dragging"); hideTip();
      });
      g.addEventListener("pointermove", function (evt) {
        if (!drag) return;
        var p = svgPoint(evt), c = cellAt(p, isTask);
        drag.cell = c; drag.moved = true;
        g.setAttribute("transform", "translate(" + p.x + "," + p.y + ")");
        clear(gOver);
        if (!occupied(c.floor, c.x, c.y, obj)) sv("rect", { cls: "dropcell", x: cx(c.x) - CELL / 2 + 1, y: cy(c.floor, c.y) - CELL / 2 + 1, width: CELL - 2, height: CELL - 2, rx: 4 }, gOver);
      });
      function end() {
        if (!drag) return;
        var c = drag.cell; drag = null; g.classList.remove("dragging");
        if (!(c.floor === obj.floor && c.x === obj.x && c.y === obj.y) && moveTo(obj, c)) { focusMark(obj.id); return; }
        g.setAttribute("transform", "translate(" + cx(obj.x) + "," + cy(obj.floor, obj.y) + ")");
        drawRoutes();
      }
      g.addEventListener("pointerup", end); g.addEventListener("pointercancel", end);
      g.addEventListener("keydown", function (evt) {
        var c = { floor: obj.floor, x: obj.x, y: obj.y };
        if (evt.key === "ArrowLeft") c.x--; else if (evt.key === "ArrowRight") c.x++;
        else if (evt.key === "ArrowUp" && evt.shiftKey) c.floor = 2; else if (evt.key === "ArrowDown" && evt.shiftKey) c.floor = 1;
        else if (evt.key === "ArrowUp") c.y++; else if (evt.key === "ArrowDown") c.y--; else return;
        evt.preventDefault();
        if (c.x < 0 || c.x >= P.width || c.y < (isTask ? 1 : 0) || c.y > P.depth) return;
        if (moveTo(obj, c)) focusMark(obj.id);
      });
      g.addEventListener("pointerenter", function (evt) {
        if (drag) return;
        showTip(evt, [el("div", { cls: "tv", text: obj.id }), el("div", { cls: "tl", text: obj.floor + " 楼 · 货道 " + obj.x + " · " + (obj.y ? "货位 " + obj.y : "主巷道") + (spare ? " · 闲置" : "") + (pend ? " · 尚未到达" : "") })]);
      });
      g.addEventListener("pointerleave", hideTip);
      g.dataset.id = obj.id;
    }
    S.scn.vehicles.forEach(function (v, i) { mk(v, false, i); });
    S.scn.tasks.forEach(function (t, j) { mk(t, true, j); });
  }

  // ------------------------------------------------------------ 右侧：统计、到达表、改派链
  function renderStats() {
    var e = ev(), n = S.scn.tasks.length, host = clear($("arrStats"));
    var tot = e ? e.total : 0, gt = S.k > 0 ? R.gr.steps[S.k - 1].total : 0;
    host.appendChild(stat("已到达", S.k + " / " + n, e ? "刚到：" + T(e.task).id : "还没有任务"));
    host.appendChild(stat("最优总时间", tot + " s", "已到达任务上的最优"));
    host.appendChild(stat("不改派的总时间", gt + " s", gt > tot ? "多 " + (gt - tot) + " s" : "与最优相同", gt > tot));
  }
  function renderTable() {
    var tbl = clear($("arrTable")), n = S.scn.tasks.length;
    tbl.appendChild(el("thead", {}, [el("tr", {}, ["到达", "任务", "边际成本", "不改派", "改派链"].map(function (h) { return el("th", { text: h }); }))]));
    var tb = el("tbody");
    R.order.forEach(function (j, i) {
      var e = R.inc.events[i], g = R.gr.steps[i];
      var dots = el("span", { cls: "len" }, range(e.chain.length).map(function (q) { return el("i", { cls: q === 0 ? "" : "h" }); }));
      var tr = el("tr", { cls: i === S.k - 1 ? "cur" : i >= S.k ? "future" : "", title: "跳到这次到达", onclick: function () { S.k = i + 1; refresh(false); } },
        [el("td", { text: String(i + 1) }), el("td", { text: T(j).id }), el("td", { text: e.marginal + " s" }),
         el("td", { cls: g.cost > e.marginal ? "gap" : "", text: g.cost + " s" }), el("td", {}, [String(e.chain.length), dots])]);
      tb.appendChild(tr);
    });
    tb.appendChild(el("tr", { cls: "tot" }, [el("td", { text: "合计" }), el("td", { text: "" }), el("td", { text: R.opt + " s" }), el("td", { text: R.gr.total + " s" }), el("td", { text: "" })]));
    tbl.appendChild(tb);
  }
  function renderChain() {
    var box = clear($("chainBox")), e = ev(), C = R.C;
    if (!e) {
      box.appendChild(el("div", { cls: "ch-h", text: "还没有任务到达" }));
      box.appendChild(el("p", { text: "点“下一个到达”，看第一个任务拿走哪辆车。" }));
      return;
    }
    var len = e.chain.length;
    box.appendChild(el("div", { cls: "ch-h", text: T(e.task).id + " 到达：" + (len === 1 ? "直接拿走一辆空闲车" : "改派链，共 " + len + " 步") }));
    var ol = el("ol");
    e.chain.forEach(function (c) {
      var t = T(c.task).id, to = V(c.to).id, cost = C[c.to][c.task];
      if (c.from < 0) ol.appendChild(el("li", { html: "<b>" + t + "</b> ← " + to + "（" + cost + " s，新增）" }));
      else { var old = C[c.from][c.task]; ol.appendChild(el("li", { html: "<b>" + t + "</b>：" + V(c.from).id + " → " + to + "（" + old + " → " + cost + " s，<span class=\"plus\">" + sgn(cost - old) + "</span>）" })); }
    });
    box.appendChild(ol);
    box.appendChild(el("p", { html: "净增量 = 边际成本 = <span class=\"mn\">" + e.marginal + " s</span> = 直接选最便宜的车 <span class=\"mn\">" + n0(e.u0) + "</span> + 改派多付 <span class=\"mn\">" + n0(e.D) + "</span>" }));
  }
  function renderStatus() {
    var name = S.dragged ? "自定义场景（已拖动）" : S.seed ? "随机场景 #" + S.seed : "默认场景：两层 · 6 车 · 5 任务（第 2 章）";
    $("scnStatus").innerHTML = "<b>" + name + "</b> · 最优总时间 <b>" + R.opt + " s</b>";
  }
  function renderStepper() {
    var n = S.scn.tasks.length;
    $("arrPrev").disabled = S.k <= 0; $("arrNext").disabled = S.k >= n; $("arrAll").disabled = S.k >= n;
    $("arrTxt").textContent = S.k === 0 ? "还没有任务到达。" : S.k === n ? "全部到达：最优总时间 " + R.opt + " s。" :
      "已到达 " + S.k + " / " + n + "：" + R.order.slice(0, S.k).map(function (j) { return T(j).id; }).join("、") + " 已按最优派好，下一个是 " + T(R.order[S.k]).id + "。";
  }
  function refresh(recompute) {
    if (recompute) { compute(); S.k = Math.min(S.k, S.scn.tasks.length); }
    drawMarks(); drawRoutes(); renderStats(); renderTable(); renderChain(); renderStatus(); renderStepper();
  }

  // ------------------------------------------------------------ 控件
  var sync = buildSeg($("ordSeg"), ORD, function () { return S.okey; }, function (k) {
    if (k === "rand" && S.okey === "rand") S.rnd++;
    S.okey = k; compute(); S.k = S.scn.tasks.length - 1; refresh(false);
  });
  $("arrPrev").addEventListener("click", function () { S.k = Math.max(0, S.k - 1); refresh(false); });
  $("arrNext").addEventListener("click", function () { S.k = Math.min(S.scn.tasks.length, S.k + 1); refresh(false); });
  $("arrAll").addEventListener("click", function () { S.k = S.scn.tasks.length; refresh(false); });
  $("btnReset").addEventListener("click", function () { S.scn = clone(DEFAULT); S.seed = 0; S.dragged = false; S.k = S.scn.tasks.length - 1; refresh(true); });
  $("btnRandom").addEventListener("click", function () { S.seed++; S.dragged = false; S.scn = Core.randomScenario(S.seed, P, 6, 5); S.k = 4; refresh(true); });

  compute();
  refresh(false);
  window.__fig1 = { state: S, get: function () { return R; } };
})();
