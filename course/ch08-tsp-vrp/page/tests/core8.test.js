/* core8.js 的对拍测试：夹具由 tools/gen_fixtures.py 用暴力、完整 SEC 的 LP、linprog 生成。
 * 运行：node --test page/tests/core8.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const fs = require("fs");
const Core = require(path.join(__dirname, "..", "src", "core8.js"));
const FX = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures.json"), "utf-8"));
const near = (a, b, t) => Math.abs(a - b) <= (t || 1e-5);
const PAGE = [[76, 49], [91, 54], [50, 56], [17, 46], [12, 4], [17, 63], [27, 33], [86, 55], [99, 38]];

test("Held–Karp 与暴力枚举一致，回路合法", () => {
  FX.tsp.forEach((c) => {
    const D = Core.dist(c.P), r = Core.heldKarp(D);
    assert.equal(r.value, c.opt); assert.equal(Core.tourLength(D, r.tour), c.opt);
    assert.deepEqual(r.tour.slice().sort((a, b) => a - b), D.map((_, i) => i)); assert.equal(r.tour[0], 0);
  });
});

test("指派松弛、MTZ 的 LP 值与 linprog 一致；割平面循环停下时等于完整子回路 LP；顺序：指派 ≤ MTZ ≤ 子回路 ≤ 最优", () => {
  FX.tsp.forEach((c) => {
    const D = Core.dist(c.P);
    assert.ok(near(Core.assignLP(D).value, c.assign));
    assert.ok(near(Core.mtzLP(D).value, c.mtz));
    const cl = Core.cutLoop(D);
    assert.ok(near(cl.final.value, c.sec), cl.final.value + " vs " + c.sec);
    cl.rounds.forEach((r, i) => { if (i) assert.ok(r.value >= cl.rounds[i - 1].value - 1e-7); });
    assert.ok(c.assign <= c.mtz + 1e-6 && c.mtz <= c.sec + 1e-6 && c.sec <= c.opt + 1e-6);
  });
});

test("页面例子：最优 255，指派 198 且分成 4 个回路，割循环 198 → 219 → 235 → 255，MTZ 203.25", () => {
  const D = Core.dist(PAGE), a = Core.assignLP(D);
  assert.equal(Core.heldKarp(D).value, 255); assert.equal(FX.canon.opt, 255);
  assert.ok(near(a.value, 198));
  assert.deepEqual(Core.subtours(a.x).map((c) => c.slice().sort((p, q) => p - q)), [[0, 2], [1, 7, 8], [3, 5], [4, 6]]);
  const cl = Core.cutLoop(D);
  assert.deepEqual(cl.rounds.map((r) => Math.round(r.value * 1000) / 1000), [198, 219, 235, 255]);
  assert.equal(cl.secs.length, 6);
  assert.ok(near(Core.mtzLP(D).value, 203.25));
  assert.ok(near(FX.canon.mtz, 203.25) && near(FX.canon.sec, 255));
});

test("最近邻 290，2-opt 两步到 262（−3、−25）；最后没有可改进的 2-opt", () => {
  const D = Core.dist(PAGE), nn = Core.nearestNeighbor(D);
  assert.equal(Core.tourLength(D, nn), 290);
  const r = Core.twoOpt(D, nn);
  assert.deepEqual(r.steps.map((s) => s.delta), [-3, -25]);
  assert.equal(Core.tourLength(D, r.tour), 262);
});

test("CVRP：子集 DP 与暴力一致；页面例子最优 360，扫描法 419", () => {
  FX.cvrp.forEach((c) => {
    const D = Core.dist(c.P), r = Core.cvrpOpt(D, c.dem, c.Q, c.K);
    assert.equal(r.value, c.opt);
  });
  const D = Core.dist(PAGE), dem = [2, 2, 2, 2, 4, 5, 3, 2];
  const o = Core.cvrpOpt(D, dem, 9, 3), s = Core.sweep(PAGE, D, dem, 9);
  assert.equal(o.value, 360); assert.equal(s.value, 419);
  assert.equal(o.routes.reduce((t, r) => t + Core.tourLength(D, r), 0), 360);
});
