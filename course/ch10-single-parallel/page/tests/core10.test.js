/* core10.js 的对拍测试。运行：node --test page/tests/core10.test.js */
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const fs = require("fs");
const Core = require(path.join(__dirname, "..", "src", "core10.js"));
const FX = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures.json"), "utf-8"));
const JOB = { p: [7, 3, 5, 2, 8, 5], w: [2, 2, 4, 4, 4, 2], d: [13, 23, 17, 5, 9, 21] };

test("SPT / WSPT / EDD / Moore 在随机实例上取得枚举最优", () => {
  FX.single.forEach((c) => {
    const J = { p: c.p, w: c.w, d: c.d }, ev = (s) => Core.evaluate(J, s);
    assert.equal(ev(Core.RULES.SPT(J)).sumC, c.best.sumC);
    assert.equal(ev(Core.RULES.WSPT(J)).sumwC, c.best.sumwC);
    assert.equal(ev(Core.RULES.EDD(J)).Lmax, c.best.Lmax);
    assert.equal(ev(Core.moore(J)).sumU, c.best.sumU);
    assert.equal(Core.mooreTrace(J).late.length, c.best.sumU);
  });
});

test("冒泡式交换：匹配的目标从不变差，最终是规则顺序，次数 = 逆序对个数", () => {
  FX.single.forEach((c) => {
    const J = { p: c.p, w: c.w, d: c.d }, n = c.p.length, start = Array.from({ length: n }, (_, i) => i).reverse();
    [["SPT", "sumC"], ["WSPT", "sumwC"], ["EDD", "Lmax"]].forEach(([rule, obj]) => {
      const b = Core.bubblePath(J, start, rule);
      let prev = Core.evaluate(J, start)[obj], inv = 0;
      b.steps.forEach((s) => { const v = Core.evaluate(J, s.seq)[obj]; assert.ok(v <= prev, rule); prev = v; });
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (Core.before(rule, J, start[j], start[i])) inv++;
      assert.equal(b.steps.length, inv);
      assert.equal(Core.evaluate(J, b.final)[obj], Core.evaluate(J, Core.RULES[rule](J))[obj]);
    });
  });
  const c = (r) => Core.bubblePath(JOB, [0, 1, 2, 3, 4, 5], r).steps.length;
  assert.deepEqual([c("SPT"), c("WSPT"), c("EDD")], [7, 8, 8]);
});

test("Moore–Hodgson 的两个页面例子：延误 1 个与 3 个", () => {
  assert.deepEqual(Core.mooreTrace(JOB).late, [4]);
  const J2 = { p: [4, 7, 6, 3, 4, 6, 8], w: [1, 1, 1, 1, 1, 1, 1], d: [10, 18, 4, 14, 12, 17, 18] };
  const t = Core.mooreTrace(J2);
  assert.deepEqual(t.late, [2, 1, 6]); assert.equal(Core.evaluate(J2, Core.RULES.EDD(J2)).sumU, 6);
});

test("列表调度与 LPT 的最坏实例：2m−1 与 4m−1，最优 m 与 3m（m ≤ 3 时用枚举核对）", () => {
  for (let m = 2; m <= 6; m++) {
    const a = Core.worstListInstance(m), b = Core.lptWorstInstance(m);
    assert.equal(Core.listSchedule(Core.identical(a.p, m), a.order).Cmax, 2 * m - 1);
    assert.equal(Core.listSchedule(Core.identical(b.p, m), b.order).Cmax, 4 * m - 1);
    if (m <= 3) { assert.equal(Core.optCmax(Core.identical(a.p, m)).Cmax, a.opt); assert.equal(Core.optCmax(Core.identical(b.p, m)).Cmax, b.opt); }
  }
});

test("Graham 界与 LPT 界；P2 的子集和动态规划与枚举一致", () => {
  FX.par.forEach((c) => {
    const P = Core.identical(c.p, c.m), ord = c.p.map((_, i) => i);
    assert.ok(Core.listSchedule(P, ord).Cmax <= (2 - 1 / c.m) * c.opt + 1e-9);
    assert.ok(Core.listSchedule(P, Core.lptOrder(c.p)).Cmax <= (4 / 3 - 1 / (3 * c.m)) * c.opt + 1e-9);
    if (c.m === 2) assert.equal(Core.p2Opt(c.p).Cmax, c.opt);
  });
});

test("McNaughton：C = max(最长, 总量/m)，每台机器不超过 C，每个作业的总时间正确", () => {
  const r = Core.mcnaughton([9, 9, 9, 3], 3);
  assert.equal(r.Cmax, 10);
  const per = {}; r.slots.forEach((sl) => { let tot = 0; sl.forEach((s) => { per[s.job] = (per[s.job] || 0) + s.end - s.start; tot += s.end - s.start; }); assert.ok(tot <= 10 + 1e-9); });
  assert.deepEqual([0, 1, 2, 3].map((j) => per[j]), [9, 9, 9, 3]);
});

test("最坏实例的构造性最优排法：每个作业恰好用一次，C_max = m 与 3m", () => {
  for (let m = 2; m <= 6; m++) {
    [[Core.worstListOptSlots(m), Core.worstListInstance(m).p, m], [Core.lptWorstOptSlots(m), Core.lptWorstInstance(m).p, 3 * m]].forEach(([slots, p, opt]) => {
      const jobs = [].concat(...slots.map((s) => s.map((x) => x.job))).sort((a, b) => a - b);
      assert.deepEqual(jobs, p.map((_, i) => i));
      assert.equal(Math.max(...slots.map((s) => (s.length ? s[s.length - 1].end : 0))), opt);
    });
  }
});
