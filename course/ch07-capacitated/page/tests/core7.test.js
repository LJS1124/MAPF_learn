/* core7.js 的对拍测试：夹具由 tools/gen_fixtures.py 用暴力、DP、linprog 生成。
 * 运行：node --test page/tests/core7.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const fs = require("fs");
const Core = require(path.join(__dirname, "..", "src", "core7.js"));
const FX = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures.json"), "utf-8"));
const near = (a, b, t) => Math.abs(a - b) <= (t || 1e-6);

test("背包：LP 上界、DP、分支定界与暴力枚举一致；LP 至多一个分数变量", () => {
  FX.knap.forEach((c) => {
    const lp = Core.knapLP(c.v, c.w, c.cap);
    assert.ok(near(lp.bound, c.lp));
    assert.ok(lp.x.filter((t) => t > 1e-9 && t < 1 - 1e-9).length <= 1);
    assert.equal(Core.knapDP(c.v, c.w, c.cap).value, c.opt);
    const bb = Core.knapBB(c.v, c.w, c.cap);
    assert.equal(bb.best, c.opt);
    assert.ok(bb.nodes.length <= 2 ** (c.v.length + 1) - 1);
  });
});

test("页面背包：LP 106.857，最优 104，分支定界 15 个节点", () => {
  const k = FX.canon.knap, bb = Core.knapBB(k.v, k.w, k.cap);
  assert.ok(near(Core.knapLP(k.v, k.w, k.cap).bound, 106.857142857, 1e-6));
  assert.equal(bb.best, 104); assert.equal(bb.nodes.length, 15); assert.equal(k.opt, 104);
});

test("GAP：LP 值、枚举最优与 linprog、暴力一致", () => {
  FX.gap.forEach((c) => {
    const lp = Core.gapLP(c.C, c.w, c.Q), en = Core.gapEnum(c.C, c.w, c.Q);
    if (c.lp === null) { assert.notEqual(lp.status, "optimal"); assert.equal(en.value, null); return; }
    assert.ok(near(lp.value, c.lp, 1e-5), "LP " + lp.value + " vs " + c.lp);
    assert.equal(en.value, c.ip);
    if (c.ip !== null) assert.ok(lp.value <= c.ip + 1e-6);
  });
});

test("页面 GAP：LP 220，整数最优 234；覆盖割三轮 220 → 229 → 233，共 4 条割；分支定界节点数 55 → 23", () => {
  const g = FX.canon.gap;
  assert.ok(near(g.lp, 220)); assert.equal(g.ip, 234);
  const lp = Core.gapLP(g.C, g.w, g.Q);
  assert.ok(near(lp.value, 220, 1e-6));
  const fracTasks = g.w.map((_, t) => t).filter((t) => lp.x.some((r) => r[t] > 1e-6 && r[t] < 1 - 1e-6));
  assert.deepEqual(fracTasks, [2]);
  const cl = Core.gapCutLoop(g.C, g.w, g.Q);
  assert.deepEqual(cl.rounds.map((r) => Math.round(r.value * 1000) / 1000), [220, 229, 233]);
  assert.equal(cl.cuts.length, 4);
  assert.equal(Core.gapBB(g.C, g.w, g.Q).best, 234);
  assert.equal(Core.gapBB(g.C, g.w, g.Q).nodes, 55);
  const bc = Core.gapBB(g.C, g.w, g.Q, { cuts: cl.cuts });
  assert.equal(bc.best, 234); assert.equal(bc.nodes, 23);
});

test("覆盖割：每个整数可行派法都满足；下界只增不减，不超过整数最优", () => {
  FX.gap.slice(0, 25).forEach((c) => {
    if (c.ip === null) return;
    const cl = Core.gapCutLoop(c.C, c.w, c.Q);
    cl.rounds.forEach((r, i) => { if (i) assert.ok(r.value >= cl.rounds[i - 1].value - 1e-7); });
    assert.ok(cl.final.value <= c.ip + 1e-6);
    const m = c.C.length, n = c.w.length;
    (function go(j, a) {
      if (j === n) {
        const load = new Array(m).fill(0); a.forEach((i, t) => (load[i] += c.w[t]));
        if (load.some((l, i) => l > c.Q[i])) return;
        cl.cuts.forEach((cut) => assert.ok(cut.S.filter((t) => a[t] === cut.i).length <= cut.k));
        return;
      }
      for (let i = 0; i < m; i++) go(j + 1, a.concat([i]));
    })(0, []);
  });
});

test("装载：FFD 车次、最优车次与回溯一致；FFD ≥ 最优 ≥ 下界", () => {
  FX.bin.forEach((c) => {
    if (c.opt === null) return;
    assert.equal(Core.ffd(c.w, c.Q).length, c.ffd);
    assert.equal(Core.binOpt(c.w, c.Q).bins, c.opt);
    assert.ok(c.ffd >= c.opt && c.opt >= Core.binLB(c.w, c.Q));
  });
  const b = FX.canon.bin;
  assert.equal(Core.ffd(b.w, b.Q).length, 4); assert.equal(Core.binOpt(b.w, b.Q).bins, 3);
});
