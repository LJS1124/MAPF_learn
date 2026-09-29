/* fig1.js — 图 6-1：最短路。Dijkstra / Bellman–Ford / Johnson 在同一张网络上逐步回放，可加一条负费用弧或负环 */
(function () {
  var NET = D.net, NAMES = NET.names, INF = 1e18;
  var S = { kind: "orig", algo: "dij", step: 0, frames: [] };
  var view = NetView($("net1"), { names: NAMES, pos: NET.pos, edges: NET.edges.concat([NET.neg]) });

  function edgesFor(kind) {
    var e = NET.edges.map(function (x) { return { u: x.u, v: x.v, cap: x.cap, cost: x.cost }; });
    if (kind === "neg") e.push({ u: NET.neg.u, v: NET.neg.v, cap: NET.neg.cap, cost: NET.neg.cost });
    if (kind === "cycle") e.push({ u: NET.neg.u, v: NET.neg.v, cap: NET.neg.cap, cost: -6 });
    return e;
  }
  function L(x) { return x >= INF / 2 ? "∞" : mnum(x); }
  function en(k) { return NAMES[k.u] + "→" + NAMES[k.v]; }
  function truthOf(E) { var bf = Core.bellmanFord(NAMES, E, 0); return bf.negCycle ? null : bf.dist; }

  // 一帧：所有需要画的东西
  function frame(E, o) {
    var f = { ec: [], et: [], nc: [], nt: [], say: o.say || "", rows: [], hidden: [] };
    E.forEach(function (e, k) {
      var cls = e.cost < 0 ? "neg" : "";
      if (o.tree && o.tree[k]) cls += " on";
      if (o.hot && o.hot[k]) cls += " hot";
      if (o.skip && o.skip[k]) cls += " skip";
      if (o.cyc && o.cyc[k]) cls += " cut";
      if (o.dimAll && !(o.tree && o.tree[k]) && !(o.hot && o.hot[k]) && !(o.skip && o.skip[k]) && !(o.cyc && o.cyc[k])) cls += " dim";
      f.ec.push(cls);
      f.et.push(o.edgeText ? mnum(o.edgeText[k]) : mnum(e.cost));
    });
    for (var i = 0; i < NAMES.length; i++) {
      var c = o.done && o.done[i] ? "done" : "";
      if (o.cur === i) c = "cur";
      if (o.bad && o.bad[i]) c = "bad";
      if (o.cycNodes && o.cycNodes.indexOf(i) >= 0) c = "bad";
      f.nc.push(c);
      f.nt.push(o.labels ? (o.labelPrefix || "d=") + L(o.labels[i]) + (o.bad && o.bad[i] && o.truth ? "（应为 " + L(o.truth[i]) + "）" : "") : "");
      f.rows.push({ name: NAMES[i], val: o.labels ? L(o.labels[i]) : "", chg: o.changed && o.changed[i], truth: o.truth ? L(o.truth[i]) : null, bad: o.bad && o.bad[i], status: o.status ? o.status[i] : "", h: o.h ? mnum(o.h[i]) : null });
    }
    f.cols = o.cols || "dist";
    return f;
  }

  function dijFrames(E, reduced, hvals) {
    var r = Core.dijkstra(NAMES, E, 0), F = [], done = [], tree = {}, truth = reduced ? null : truthOf(E), prev = NAMES.map(function (_, i) { return i === 0 ? 0 : INF; });
    var lab0 = prev.slice(), pre = reduced ? "d′=" : "d=";
    F.push(frame(E, { labels: lab0, cur: 0, labelPrefix: pre, edgeText: reduced ? reduced : null, dimAll: false,
      say: "<p>" + (reduced ? "在新费用 <span class=\"mn\">c′</span> 上跑 Dijkstra。" : "") + "起点 S 的标签是 0，其余是 ∞。每一步：<b>取标签最小、还没确定的点，把它确定下来</b>，再用它去尝试改进邻点的标签。</p>", status: NAMES.map(function () { return ""; }) }));
    r.events.forEach(function (ev, idx) {
      done[ev.node] = true;
      var hot = {}, skip = {}, changed = {};
      ev.relaxed.forEach(function (x) { hot[x.edge] = true; changed[x.to] = true; });
      ev.skipped.forEach(function (x) { skip[x.edge] = true; });
      NAMES.forEach(function (_, v) { if (done[v] && r.events[idx].pred[v] >= 0) tree[r.events[idx].pred[v]] = true; });
      var parts = [];
      ev.relaxed.forEach(function (x) { parts.push("<span class=\"mn\">" + en(E[x.edge]) + "</span>：" + L(x.from) + " → <b class=\"key\">" + L(x.to_) + "</b>"); });
      var sk = ev.skipped.map(function (x) { return "<b class=\"no\">" + en(E[x.edge]) + "</b> 本可以把 " + NAMES[x.to] + " 从 " + L(x.had) + " 改成 " + L(x.cand) + "，但 " + NAMES[x.to] + " 已经确定，Dijkstra 不再回头改"; });
      var say = "<p>确定 <b>" + NAMES[ev.node] + "</b>（标签 " + L(ev.dist) + "）。" + (parts.length ? "松弛：" + parts.join("；") + "。" : "它没有能改进的邻点。") + "</p>" + (sk.length ? "<p>" + sk.join("；") + "。这就是负费用弧让它出错的地方。</p>" : "");
      var last = idx === r.events.length - 1, bad = null;
      if (last && truth && !reduced) {
        bad = {}; var nb = 0;
        NAMES.forEach(function (_, v) { if (r.dist[v] < INF && truth[v] < INF && r.dist[v] !== truth[v]) { bad[v] = true; nb++; } });
        if (nb) say += "<p><b class=\"no\">答案不对：</b>" + Object.keys(bad).map(function (v) { return NAMES[v] + "（" + L(r.dist[v]) + "，应为 " + L(truth[v]) + "）"; }).join("、") + "。</p>";
        else say += "<p><b class=\"ok\">结束。</b>S 到 T 的最短距离是 " + L(r.dist[5]) + "。</p>";
      } else if (last && !truth && !reduced) {
        say += "<p><b class=\"no\">结束了，还给出了数字，但图里有负环，最短路根本不存在。</b>Dijkstra 不会报警。</p>";
      }
      var st = NAMES.map(function (_, v) { return done[v] ? "已确定" : ""; });
      F.push(frame(E, { labels: ev.d, done: done.slice(), cur: ev.node, hot: hot, skip: skip, tree: Object.assign({}, tree), changed: changed, say: say, truth: last && truth && !reduced ? truth : null, bad: bad, status: st, labelPrefix: pre, edgeText: reduced ? reduced : null, h: hvals }));
    });
    return { frames: F, res: r };
  }

  function bfFrames(E) {
    var r = Core.bellmanFord(NAMES, E, 0), F = [], lab = NAMES.map(function (_, i) { return i === 0 ? 0 : INF; });
    F.push(frame(E, { labels: lab, say: "<p>标签同样从 S=0、其余 ∞ 开始。每一轮：<b>把所有弧各松弛一遍</b>（按弧的编号顺序），不管哪个点先确定。最多 " + (NAMES.length - 1) + " 轮，因为最短路至多 " + (NAMES.length - 1) + " 条弧。</p>", status: NAMES.map(function () { return ""; }) }));
    r.rounds.forEach(function (rd, i) {
      var hot = {}, changed = {};
      rd.updates.forEach(function (u) { hot[u.edge] = true; changed[u.to] = true; });
      var parts = rd.updates.map(function (u) { return "<span class=\"mn\">" + en(E[u.edge]) + "</span>：" + L(u.from) + " → <b class=\"key\">" + L(u.to_) + "</b>"; });
      F.push(frame(E, { labels: rd.d, hot: hot, changed: changed, say: "<p>第 " + (i + 1) + " 轮：" + (parts.length ? parts.join("；") + "。" : "没有任何标签变化。") + "</p>" + (i === r.rounds.length - 1 && !parts.length ? "<p><b class=\"ok\">一整轮没有变化，提前结束。</b></p>" : ""), status: NAMES.map(function () { return ""; }) }));
    });
    var truth = r.negCycle ? null : r.dist;
    if (r.negCycle) {
      var cyc = r.negCycle, cyE = {}, tot = 0, txt = [];
      cyc.forEach(function (v, i) {
        var w = cyc[(i + 1) % cyc.length], best = -1;
        E.forEach(function (e, k) { if (e.u === v && e.v === w && (best < 0 || e.cost < E[best].cost)) best = k; });
        cyE[best] = true; tot += E[best].cost; txt.push(NAMES[v]);
      });
      F.push(frame(E, { labels: r.dist, cyc: cyE, cycNodes: cyc, say: "<p>第 " + NAMES.length + " 轮检查：<b class=\"no\">还能松弛</b>。最短路最多 " + (NAMES.length - 1) + " 条弧，还能改进，说明有环在越绕越短。沿前驱回走 " + NAMES.length + " 步一定落在这个环上：<span class=\"mn\">" + txt.join("→") + "→" + txt[0] + "</span>，总费用 <b class=\"no\">" + mnum(tot) + "</b>。</p><p>每绕一圈少 " + n0(-tot) + "，最短路是 −∞，算法报告“有负环”。</p>", status: NAMES.map(function () { return ""; }) }));
    } else {
      F.push(frame(E, { labels: r.dist, done: NAMES.map(function () { return true; }), truth: r.dist, say: "<p><b class=\"ok\">检查通过</b>：再松弛一轮没有变化，没有负环。S 到 T 的最短距离是 " + L(r.dist[5]) + "。</p>", status: NAMES.map(function () { return "✓"; }) }));
    }
    return { frames: F, res: r };
  }

  function johnFrames(E) {
    var F = [], jo = Core.johnson(NAMES, E, 0);
    F.push(frame(E, { say: "<p>Dijkstra 怕负费用。Johnson 的做法：先找一组“势” <span class=\"mn\">h(v)</span>，把每条弧的费用改成 <span class=\"mn\">c′ = c + h(u) − h(v)</span>，使新费用都 ≥ 0；任何一条 u 到 v 的路，费用都恰好多了 <span class=\"mn\">h(u) − h(v)</span>，所以<b>最短路不变</b>，只是长度整体平移。</p>" }));
    if (jo.negCycle) {
      var bf = Core.bellmanFord(NAMES.concat(["*"]), E.concat(NAMES.map(function (_, i) { return { u: NAMES.length, v: i, cap: 0, cost: 0 }; })), NAMES.length);
      var cyE = {}, cyc = jo.negCycle;
      cyc.forEach(function (v, i) { var w = cyc[(i + 1) % cyc.length]; E.forEach(function (e, k) { if (e.u === v && e.v === w) cyE[k] = true; }); });
      F.push(frame(E, { cyc: cyE, cycNodes: cyc, say: "<p>第一步：加一个虚拟源 <span class=\"mn\">*</span>，向每个点连一条费用 0 的弧，从 <span class=\"mn\">*</span> 出发跑 Bellman–Ford。<b class=\"no\">发现负环</b>（红色）：势不存在，Johnson 到此为止，没有后面的步骤。有负环时，先要决定怎么处理它，而不是硬算最短路。</p>" }));
      return { frames: F, res: jo };
    }
    var h = jo.h, hot = {};
    F.push(frame(E, { labels: h, labelPrefix: "h=", say: "<p>第一步：加一个虚拟源 <span class=\"mn\">*</span>，向每个点连一条费用 0 的弧，从 <span class=\"mn\">*</span> 出发跑 Bellman–Ford，得到每个点的 <span class=\"mn\">h(v)</span>（图中每个点旁边的数）。" + (h.every(function (x) { return x === 0; }) ? "费用都是非负，所有 h 都是 0，Johnson 退化成 Dijkstra。" : "h(v) 是 * 到 v 的最短距离，所以对每条弧有 h(v) ≤ h(u) + c，也就是 c + h(u) − h(v) ≥ 0。") + "</p>", cols: "h" }));
    var red = jo.reduced.map(function (e) { return e.cost; });
    var tight = {}; E.forEach(function (e, k) { if (red[k] === 0) tight[k] = true; });
    F.push(frame(E, { labels: h, labelPrefix: "h=", edgeText: red.map(function (x, k) { return n0(x); }), tree: tight, say: "<p>第二步：换成新费用 <span class=\"mn\">c′ = c + h(u) − h(v)</span>（弧上的数字）。<b>全部 ≥ 0</b>，其中 " + Object.keys(tight).length + " 条等于 0（蓝色，第 5 章说的“紧边”）。这一步之后就可以放心用 Dijkstra。</p>", cols: "h" }));
    var dj = dijFrames(jo.reduced, red, h);
    dj.frames.slice(0).forEach(function (fr, i) { if (i > 0) { fr.cols = "h"; F.push(fr); } });
    var d = jo.dist;
    F.push(frame(E, { labels: d, done: NAMES.map(function () { return true; }), truth: truthOf(E), say: "<p>第三步：还原。原来的距离 <span class=\"mn\">d(v) = d′(v) − h(S) + h(v)</span>。S 到 T 的最短距离是 <b class=\"ok\">" + L(d[5]) + "</b>，与 Bellman–Ford 的结果一致。总代价：一次 Bellman–Ford 加一次 Dijkstra。多源最短路时，这笔预处理只付一次。</p>", status: NAMES.map(function () { return "✓"; }), h: h }));
    return { frames: F, res: jo };
  }

  function build() {
    var E = edgesFor(S.kind);
    S.E = E;
    S.frames = (S.algo === "dij" ? dijFrames(E) : S.algo === "bf" ? bfFrames(E) : johnFrames(E)).frames;
    if (S.step > S.frames.length - 1) S.step = S.frames.length - 1;
  }

  function render() {
    var f = S.frames[S.step], E = S.E;
    var hide = view.edgeEls.map(function (_, k) { return k >= E.length; });
    view.draw({ edgeCls: f.ec, edgeText: f.et, nodeCls: f.nc, nodeText: f.nt, edgeHide: hide });
    $("spSay").innerHTML = f.say;
    $("spTxt").textContent = "第 " + S.step + " / " + (S.frames.length - 1) + " 步";
    $("spPrev").disabled = S.step === 0; $("spNext").disabled = S.step === S.frames.length - 1;
    var showTruth = f.rows.some(function (r) { return r.truth != null; }), showH = f.cols === "h";
    var tb = clear($("spTable")), head = el("tr", {}, [el("th", { text: "点" }), el("th", { text: showH ? "h" : "" }), el("th", { text: "标签" }), showTruth ? el("th", { text: "正确值" }) : null, el("th", { text: "" })]);
    tb.appendChild(el("thead", {}, [head]));
    var body = el("tbody");
    f.rows.forEach(function (r, i) {
      body.appendChild(el("tr", { cls: f.nc[i] === "cur" ? "cur" : "" }, [
        el("td", { text: r.name }), el("td", { text: showH && r.h != null ? r.h : "" }),
        el("td", { cls: (r.chg ? "chg " : "") + (r.bad ? "wrong" : ""), text: r.val }),
        showTruth ? el("td", { cls: r.bad ? "right" : "", text: r.truth }) : null,
        el("td", { cls: "txt", text: r.status || "" })]));
    });
    tb.appendChild(body);
    $("spFlags").innerHTML = "";
    var neg = S.E.some(function (e) { return e.cost < 0; });
    $("spFlags").appendChild(el("span", { cls: neg ? "hot" : "", text: neg ? "有负费用弧" : "费用全部非负" }));
    if (S.kind === "cycle") $("spFlags").appendChild(el("span", { cls: "no", text: "b→c→b 是负环" }));
    // 已知结论
    var truth = truthOf(E);
    $("spFlags").appendChild(el("span", { cls: truth ? "ok" : "no", text: truth ? "S→T 最短距离 " + L(truth[5]) : "最短路不存在（−∞）" }));
  }

  buildSeg($("spKind"), [{ key: "orig", label: "原网络（费用非负）" }, { key: "neg", label: "加一条 c→b（−4）" }, { key: "cycle", label: "把 c→b 改成 −6（负环）" }], function () { return S.kind; }, function (k) { S.kind = k; S.step = 0; build(); render(); });
  buildSeg($("spAlgo"), [{ key: "dij", label: "Dijkstra" }, { key: "bf", label: "Bellman–Ford" }, { key: "joh", label: "Johnson" }], function () { return S.algo; }, function (k) { S.algo = k; S.step = 0; build(); render(); });
  $("spPrev").addEventListener("click", function () { if (S.step > 0) { S.step--; render(); } });
  $("spNext").addEventListener("click", function () { if (S.step < S.frames.length - 1) { S.step++; render(); } });
  $("spAll").addEventListener("click", function () { S.step = S.frames.length - 1; render(); });
  $("spReset").addEventListener("click", function () { S.step = 0; render(); });
  view.onEdge(function (k, ev) {
    var e = S.E[k]; if (!e) return;
    showTip(ev, [el("div", { html: "<b>" + en(e) + "</b>　费用 " + mnum(e.cost) })]);
  });
  build(); render();
  window.__fig1 = S;
})();
