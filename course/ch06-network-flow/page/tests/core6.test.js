/* core6.js 的对拍测试：夹具由 tools/gen_fixtures.py 用 Floyd、枚举割、linprog 生成。
 * 运行：node --test page/tests/core6.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const fs = require("fs");
const Core = require(path.join(__dirname, "..", "src", "core6.js"));
const FX = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures.json"), "utf-8"));
const INF = 1e18;
const N6 = ["S", "a", "b", "c", "d", "T"];
const CANON = [[0, 1, 7, 2], [0, 2, 6, 2], [1, 2, 5, 1], [1, 3, 4, 3], [2, 3, 2, 4], [2, 4, 4, 1], [3, 4, 6, 4], [3, 5, 6, 4], [4, 5, 7, 4], [1, 4, 2, 2]]
  .map(([u, v, cap, cost]) => ({ u, v, cap, cost }));
const NEG = CANON.concat([{ u: 3, v: 2, cap: 3, cost: -4 }]);
const names = (n) => Array.from({ length: n }, (_, i) => "n" + i);
const same = (d, ref) => d.every((x, i) => (ref[i] === null ? x >= INF : x === ref[i]));

test("默认网络：Dijkstra 7，负权版本里 Dijkstra 错（7）而 Bellman–Ford、Johnson 对（6）", () => {
  assert.deepEqual(Core.dijkstra(N6, CANON, 0).dist, FX.canon.dist);
  assert.equal(Core.dijkstra(N6, NEG, 0).dist[5], 7);
  assert.deepEqual(Core.bellmanFord(N6, NEG, 0).dist, FX.canon.dist_neg);
  assert.deepEqual(Core.johnson(N6, NEG, 0).dist, FX.canon.dist_neg);
  const j = Core.johnson(N6, NEG, 0);
  assert.ok(j.reduced.every((e) => e.cost >= 0));
});

test("Dijkstra 与 Floyd 一致（60 张随机图）", () => {
  FX.dijkstra.forEach((c) => assert.ok(same(Core.dijkstra(names(c.n), c.arcs, 0).dist, c.dist)));
});

test("Bellman–Ford 和 Johnson 在含负费用（无负环）的随机图上与 Floyd 一致（60 张）", () => {
  FX.bellman.forEach((c) => {
    const bf = Core.bellmanFord(names(c.n), c.arcs, 0);
    assert.equal(bf.negCycle, null);
    assert.ok(same(bf.dist, c.dist));
    const jo = Core.johnson(names(c.n), c.arcs, 0);
    assert.ok(same(jo.dist, c.dist));
    assert.ok(jo.reduced.every((e) => e.cost >= 0));
  });
});

test("负环：Bellman–Ford 报出的环真的是负的；Johnson 拒绝有负环的图", () => {
  let reach = 0;
  FX.negcycle.forEach((c) => {
    const bf = Core.bellmanFord(names(c.n), c.arcs, 0);
    if (!c.reachable_negative_cycle) { assert.equal(bf.negCycle, null); return; }
    reach++;
    const cyc = bf.negCycle; let total = 0;
    cyc.forEach((v, i) => {
      const w = cyc[(i + 1) % cyc.length];
      const cand = c.arcs.filter((e) => e.u === v && e.v === w);
      assert.ok(cand.length > 0, "环上相邻两点之间没有弧");
      total += Math.min(...cand.map((e) => e.cost));
    });
    assert.ok(total < 0);
  });
  assert.ok(reach >= 10);
});

test("最大流：两种规则的值都等于枚举得到的最小割；流合法；割容量 = 流量", () => {
  FX.maxflow.forEach((c) => ["bfs", "dfs"].forEach((rule) => {
    const nm = names(c.n), r = Core.maxflow(nm, c.arcs, 0, c.n - 1, rule);
    assert.equal(r.value, c.value);
    assert.equal(r.cutCap, c.value);
    const bal = new Array(c.n).fill(0);
    c.arcs.forEach((e, k) => { assert.ok(r.flow[k] >= 0 && r.flow[k] <= e.cap); bal[e.u] -= r.flow[k]; bal[e.v] += r.flow[k]; });
    for (let v = 1; v < c.n - 1; v++) assert.equal(bal[v], 0);
    assert.equal(bal[c.n - 1], c.value);
    assert.ok(r.reach[0] && !r.reach[c.n - 1]);
  }));
});

test("默认网络：最大流 12，BFS 4 次增广，DFS 8 次", () => {
  const b = Core.maxflow(N6, CANON, 0, 5, "bfs"), d = Core.maxflow(N6, CANON, 0, 5, "dfs");
  assert.equal(b.value, 12); assert.equal(b.steps.length, 4); assert.equal(d.steps.length, 8);
  assert.equal(b.cutCap, 12);
});

test("最小费用流：每个整数流量的费用等于 LP；曲线凸", () => {
  FX.mincost.forEach((c) => {
    const nm = names(c.n), full = Core.minCostFlow(nm, c.arcs, 0, c.n - 1);
    assert.equal(full.flow, c.maxflow);
    const curve = Core.costCurve(full.steps);
    assert.deepEqual(curve, c.curve);
    for (let k = 1; k + 1 < curve.length; k++) assert.ok(curve[k + 1] - curve[k] >= curve[k] - curve[k - 1]);
    const k = Math.floor(c.maxflow / 2), part = Core.minCostFlow(nm, c.arcs, 0, c.n - 1, k);
    assert.equal(part.cost, c.curve[k]);
  });
});

test("默认网络：费用曲线与边际成本；负权版本流量 1 的费用 6", () => {
  const r = Core.minCostFlow(N6, CANON, 0, 5), curve = Core.costCurve(r.steps);
  assert.deepEqual(curve, FX.canon.curve);
  assert.equal(r.cost, 100);
  assert.equal(Core.minCostFlow(N6, NEG, 0, 5, 1).cost, FX.canon.cost_k1_neg);
});

test("网络 LP：点弧关联矩阵全单模，LP 的顶点是整数，值等于逐次最短路", () => {
  const A = Core.nodeArcMatrix(N6, CANON).A, an = Core.tuAnalyze(A);
  assert.ok(Object.keys(an.hist).every((k) => Math.abs(Number(k)) <= 1));
  assert.equal(an.viol, null);
  for (let k = 0; k <= 12; k++) {
    const lp = Core.flowLP(N6, CANON, 0, 5, k);
    assert.equal(lp.status, "optimal");
    assert.ok(Math.abs(lp.value - FX.canon.curve[k]) < 1e-6);
    assert.ok(lp.x.every((v) => Math.abs(v - Math.round(v)) < 1e-9), "k=" + k + " 的 LP 解不是整数");
  }
});

test("多商品流：三角形算例 LP 值 6 且是分数解，整数（每个商品一条路）无解", () => {
  const T = Core.triangleNet(), lp = Core.multiFlowLP(T.N, T.edges, T.coms);
  assert.equal(lp.status, "optimal");
  assert.ok(Math.abs(lp.value - 6) < 1e-6);
  assert.ok(lp.x.some((v) => Math.abs(v - 0.5) < 1e-9) && lp.x.every((v) => Math.abs(v * 2 - Math.round(v * 2)) < 1e-9));
  const ip = Core.multiIntegerBest(T.N, T.edges, T.coms);
  assert.equal(ip.value, null);
  assert.deepEqual(ip.counts, [2, 2, 2]);
  // 只留两个商品时整数解存在
  const two = Core.multiIntegerBest(T.N, T.edges, T.coms.slice(0, 2));
  assert.equal(two.value, 4);
});

test("点弧关联矩阵（加一行之后）的行列式分布与 numpy 枚举一致", () => {
  const A = Core.nodeArcMatrix(N6, CANON).A;
  const row = (S) => { const r = new Array(10).fill(0); S.forEach((i) => (r[i] = 1)); return r; };
  const cases = { none: A, nodec: A.concat([row([3, 4])]), chain: A.concat([row([1, 5])]), pair: A.concat([row([0, 3])]) };
  Object.keys(cases).forEach((k) => {
    const an = Core.tuAnalyze(cases[k]), exp = FX.canon.hist[k], got = {};
    Object.keys(an.hist).forEach((d) => (got[String(Number(d))] = an.hist[d]));
    assert.deepEqual(got, exp, k);
  });
});
