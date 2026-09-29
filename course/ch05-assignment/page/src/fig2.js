/* fig2.js — 图 5-2：一次插入的回放（Dijkstra 在约化成本上找最短改派链） */
(function () {
  var C = D.C, SC = D.scenario, IT = SC.tasks, IV = SC.vehicles, n = IT.length, m = IV.length;
  var INS = Core.incremental(C, range(n));
  var S = { task: 4, t: 0, timer: null };
  function TN(j) { return IT[j].id; }
  function VN(i) { return IV[i].id; }
  function evt() { return INS.events[S.task]; }
  function lastT() { return evt().scans.length + 1; }     // 步骤 0 .. K+1

  function stateAt(t) {
    var e = evt(), K = e.scans.length, st;
    var uB = e.uBefore.slice(); uB[e.task] = e.u0;
    if (t === 0) st = { kind: "init", u: uB, v: e.vBefore, d: e.d0, pred: fill(m, e.task), scanned: [], cur: -1, match: e.aBefore };
    else if (t <= K) {
      var sc = e.scans[t - 1];
      st = { kind: sc.free ? "stop" : "scan", u: uB, v: e.vBefore, d: sc.d, pred: sc.pred, scanned: e.scans.slice(0, t).map(function (s) { return s.veh; }), cur: sc.veh, match: e.aBefore, sc: sc };
    } else {
      var ls = e.scans[K - 1];
      st = { kind: "final", u: e.uAfter, v: e.vAfter, d: ls.d, pred: ls.pred, scanned: e.scans.map(function (s) { return s.veh; }), cur: -1, match: e.aAfter, chain: e.chain };
    }
    st.t = t;
    return st;
  }
  function arrived(j) { return j <= S.task; }

  // ------------------------------------------------------------ 二部图
  function drawGraph(svg, st) {
    clear(svg);
    var e = evt(), W = 600, GAP = 44, TOPM = 28, H = TOPM + Math.max(n, m) * GAP + 6;
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    var xT = 96, xV = 412;
    function yT(j) { return TOPM + (Math.max(n, m) - n) * GAP / 2 + j * GAP + GAP / 2 - 4; }
    function yV(i) { return TOPM + (Math.max(n, m) - m) * GAP / 2 + i * GAP + GAP / 2 - 4; }
    sv("text", { cls: "bipcap", x: xT - 46, y: 14, text: "任务  u" }, svg);
    sv("text", { cls: "bipcap", x: xV + 46, y: 14, "text-anchor": "end", text: "车  v" }, svg);
    if (st.kind !== "final") sv("text", { cls: "bipcap", x: xV + 56, y: 14, text: "标签 d" }, svg);
    var gE = sv("g", {}, svg), gN = sv("g", {}, svg), edges = [], i, j;
    function tight(ii, jj) { return Math.abs(C[ii][jj] + st.v[ii] - st.u[jj]) < 1e-9; }
    var treeKey = {}, chainKey = {}, oldKey = {};
    if (st.kind !== "init") st.scanned.forEach(function (iv) { treeKey[st.pred[iv] + "-" + iv] = true; });
    if (st.chain) st.chain.forEach(function (c) { chainKey[c.task + "-" + c.to] = true; if (c.from >= 0) oldKey[c.task + "-" + c.from] = true; });
    for (j = 0; j < n; j++) {
      if (!arrived(j)) continue;
      for (i = 0; i < m; i++) {
        var key = j + "-" + i, mt = st.match[j] === i, tt = tight(i, j);
        var w = chainKey[key] ? 5 : treeKey[key] ? 4 : oldKey[key] ? 3 : mt ? 2 : tt ? 1 : 0;
        var cls = "e" + (chainKey[key] ? " chain" : treeKey[key] && st.kind !== "final" ? " tree" : oldKey[key] ? " old" : mt ? " match" : tt ? " tight" : " faint");
        edges.push({ i: i, j: j, w: w, cls: cls });
      }
    }
    edges.sort(function (a, b) { return a.w - b.w; });
    edges.forEach(function (ed) { sv("line", { cls: ed.cls, x1: xT + 46, y1: yT(ed.j), x2: xV - 46, y2: yV(ed.i) }, gE); });
    function node(x, y, label, sub2, val, cls, extra) {
      var ng = sv("g", { cls: "bnode " + cls }, gN);
      sv("rect", { x: x - 46, y: y - 15, width: 92, height: 30, rx: 6 }, ng);
      sv("text", { cls: "nid", x: x - 38, y: y + 4, text: label }, ng);
      sv("text", { cls: "nsub", x: x - 12, y: y + 3.5, text: sub2 }, ng);
      sv("text", { cls: "nval", x: x + 40, y: y + 4, "text-anchor": "end", text: val }, ng);
      if (extra) sv("text", { cls: "dlab" + (extra.inf ? " inf" : ""), x: x + 56, y: y + 4, text: extra.text }, ng);
    }
    for (j = 0; j < n; j++) {
      var late = !arrived(j);
      node(xT, yT(j), IT[j].id, IT[j].floor + "F", late ? "—" : n0(st.u[j]), "task" + (j === e.task ? " newt" : "") + (late ? " idle" : ""));
    }
    for (i = 0; i < m; i++) {
      var sc = st.scanned.indexOf(i) >= 0, mtch = st.match.indexOf(i) >= 0;
      var cls = "veh" + (sc ? " scanned" : "") + (st.cur === i ? " cur" : "");
      var extra = null;
      if (st.kind === "final") { var dv = st.v[i] - e.vBefore[i]; if (dv > 1e-9) extra = { text: "+" + n0(dv) }; }
      else extra = { text: "d " + n0(st.d[i]) + (sc ? " ✓" : "") };
      node(xV, yV(i), IV[i].id, IV[i].floor + "F", n0(st.v[i]), cls, extra);
    }
  }

  // ------------------------------------------------------------ 车的表
  function drawTable(st) {
    var tbl = clear($("insTable")), e = evt();
    tbl.appendChild(el("thead", {}, [el("tr", {}, ["车", "当前任务", "车价 v", "标签 d", "前驱", "状态"].map(function (h) { return el("th", { text: h }); }))]));
    var tb = el("tbody");
    for (var i = 0; i < m; i++) {
      var task = -1; st.match.forEach(function (iv, j) { if (iv === i) task = j; });
      var si = st.scanned.indexOf(i), stt;
      if (st.kind === "final") stt = e.chain.some(function (c) { return c.to === i; }) ? "链上" : si >= 0 ? "已扫描" : "—";
      else if (si >= 0) stt = st.cur === i ? (st.kind === "stop" ? "空闲，终点" : "本轮扫描") : "已扫描";
      else stt = "待扫描";
      var vChg = st.kind === "final" && Math.abs(st.v[i] - e.vBefore[i]) > 1e-9;
      var tr = el("tr", { cls: (si >= 0 ? "scanned" : "") + (st.cur === i ? " cur" : "") }, [
        el("td", { text: IV[i].id + "（" + IV[i].floor + "F）" }),
        el("td", { text: task >= 0 ? TN(task) : "空闲" }),
        el("td", { cls: vChg ? "chg" : "", text: n0(st.v[i]) }),
        el("td", { text: st.kind === "final" ? "—" : n0(st.d[i]) }),
        el("td", { text: st.kind === "final" ? "—" : TN(st.pred[i]) }),
        el("td", { cls: "st", text: stt })]);
      tb.appendChild(tr);
    }
    tbl.appendChild(tb);
  }

  // ------------------------------------------------------------ 旁白
  function say(st) {
    var e = evt(), j0 = e.task, h = "", i;
    function dl() { return range(m).map(function (q) { return VN(q) + " " + n0(st.d[q]); }).join("、"); }
    if (st.kind === "init") {
      var best = 0; for (i = 1; i < m; i++) if (C[i][j0] + e.vBefore[i] < C[best][j0] + e.vBefore[best]) best = i;
      h = "<b>" + TN(j0) + " 到达。</b>标价 <span class=\"mn\">u = min(c + v) = " + n0(e.u0) + "</span>（" + VN(best) + "：c = " + C[best][j0] + "，车价 v = " + n0(e.vBefore[best]) + "）。标签 d 是各车相对这个价格的约化成本：" + dl() + "。";
      var holder = -1; e.aBefore.forEach(function (iv, jj) { if (iv === best) holder = jj; });
      h += holder >= 0 ? " " + VN(best) + " 的标签是 0，但它正被 " + TN(holder) + " 占着，直接拿走会让 " + TN(holder) + " 无车可用。" : " " + VN(best) + " 是空闲的，标签 0，下一步就会停。";
    } else if (st.kind === "scan" || st.kind === "stop") {
      var sc = st.sc, ii = sc.veh;
      h = "<b>扫描 " + VN(ii) + "（标签 " + n0(sc.radius) + "，未扫描的车里最小）。</b>";
      if (sc.free) h += VN(ii) + " 是空闲车，停止。最短交替路的长度 <span class=\"mn\">D = " + n0(sc.radius) + "</span>，沿前驱回溯就是改派链。";
      else {
        h += VN(ii) + " 正在做 " + TN(sc.task) + "（这条边是紧的），所以 " + TN(sc.task) + " 也得搬家。经过它可以更便宜地够到其他车：";
        h += sc.relaxed.length ? sc.relaxed.map(function (x) { return VN(x.veh) + " 的标签 " + n0(x.from) + " → <b class=\"key\">" + n0(x.to) + "</b>（经 " + TN(x.via) + "）"; }).join("；") + "。" : "没有标签被改进。";
      }
    } else {
      var inner = e.scans.filter(function (s) { return !s.free; });
      h = "<b>涨价，然后翻转。</b>";
      if (inner.length) h += "已扫描的车（终点除外）涨 <span class=\"mn\">D − d</span>：" + inner.map(function (s) { return VN(s.veh) + " +" + n0(e.D - s.radius) + "（" + TN(s.task) + " 同涨）"; }).join("、") + "；";
      else h += "D = 0，没有价格需要变；";
      h += "新任务 " + TN(j0) + " 涨 D，最终 <span class=\"mn\">u = " + n0(e.u0) + " + " + n0(e.D) + " = " + n0(e.uAfter[j0]) + "</span>。 翻转：" + e.chain.map(function (c) {
        return c.from < 0 ? TN(c.task) + " ← " + VN(c.to) : TN(c.task) + "：" + VN(c.from) + " → " + VN(c.to);
      }).join("；") + "。";
      h += "<span class=\"fin\">总时间 " + (e.total - e.marginal) + " → " + e.total + " s，边际成本 " + e.marginal + " = <span class=\"mn\">u₀ " + n0(e.u0) + " + D " + n0(e.D) + "</span>，正是 " + TN(j0) + " 的最终价格。</span>";
    }
    return h;
  }

  // ------------------------------------------------------------ 渲染与控件
  function render() {
    var st = stateAt(S.t);
    drawGraph($("insGraph"), st);
    drawTable(st);
    $("insSay").innerHTML = say(st);
    $("insPrev").disabled = S.t <= 0; $("insNext").disabled = S.t >= lastT();
    $("insCount").textContent = "步 " + S.t + " / " + lastT();
  }
  function stop() { if (S.timer) { clearInterval(S.timer); S.timer = null; } $("insAuto").textContent = "▶ 自动播放"; }
  var ctl = clear($("insCtl"));
  ctl.appendChild(el("button", { cls: "btn", id: "insPrev", type: "button", text: "◀ 上一步", onclick: function () { stop(); S.t = Math.max(0, S.t - 1); render(); } }));
  ctl.appendChild(el("button", { cls: "btn primary", id: "insNext", type: "button", text: "下一步 ▶", onclick: function () { stop(); S.t = Math.min(lastT(), S.t + 1); render(); } }));
  ctl.appendChild(el("span", { cls: "hgcount", id: "insCount" }));
  $("insAuto").addEventListener("click", function () {
    if (S.timer) { stop(); return; }
    if (S.t >= lastT()) S.t = 0;
    $("insAuto").textContent = "⏸ 暂停";
    render();
    S.timer = setInterval(function () { if (S.t >= lastT()) { stop(); return; } S.t++; render(); if (S.t >= lastT()) stop(); }, 1300);
  });
  $("insReset").addEventListener("click", function () { stop(); S.t = 0; render(); });
  buildSeg($("insSeg"), range(n).map(function (j) { return { key: j, label: TN(j) + " 到达" }; }), function () { return S.task; }, function (k) { stop(); S.task = k; S.t = 0; render(); });
  render();
  window.__fig2 = { state: S, INS: INS };
})();
