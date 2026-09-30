/* core11.js 的对拍测试。运行：node --test page/tests/core11.test.js */
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const fs = require("fs");
const Core = require(path.join(__dirname, "..", "src", "core11.js"));
const FX = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures.json"), "utf-8"));
const F2 = [[1, 4], [9, 9], [6, 5], [3, 2], [5, 4], [1, 5]], F3 = [[4, 5, 6], [9, 8, 1], [5, 7, 3], [3, 7, 8], [6, 6, 1], [8, 3, 8]];
const JOBS = [[[2, 2], [1, 1], [0, 3]], [[2, 1], [0, 4], [1, 2]], [[1, 2], [0, 5], [2, 2]]];

test("流水车间 C_max 与独立实现一致；NEH 与 Python 参考答案逐个一致；不优于枚举最优", () => {
  FX.flow.forEach((c) => {
    assert.equal(Core.flowSchedule(c.P, c.perm).Cmax, c.cmax);
    const n = Core.neh(c.P);
    assert.deepEqual(n.order, c.neh); assert.equal(Core.flowSchedule(c.P, n.order).Cmax, c.neh_c);
    assert.ok(c.neh_c >= c.opt);
    assert.equal(Core.enumFlow(c.P).value, c.opt);
  });
});

test("Johnson 规则在两台机器的随机实例上取得枚举最优", () => {
  FX.flow.filter((c) => c.P[0].length === 2).forEach((c) => assert.equal(Core.flowSchedule(c.P, Core.johnson(c.P).order).Cmax, c.opt));
  const j = Core.johnson(F2);
  assert.deepEqual(j.order, [0, 5, 1, 2, 4, 3]); assert.deepEqual([j.set1, j.set2], [[0, 5, 1], [2, 4, 3]]);
  assert.equal(Core.flowSchedule(F2, j.order).Cmax, 31); assert.equal(Core.flowSchedule(F2, [0, 1, 2, 3, 4, 5]).Cmax, 35);
});

test("页面例子 F3：NEH 44，先来先做 52，最优 42", () => {
  const n = Core.neh(F3);
  assert.deepEqual(n.order, [4, 0, 3, 2, 5, 1]); assert.equal(Core.flowSchedule(F3, n.order).Cmax, 44);
  assert.equal(Core.flowSchedule(F3, [0, 1, 2, 3, 4, 5]).Cmax, 52); assert.equal(Core.enumFlow(F3).value, 42);
});

test("作业车间：析取图求值与独立实现一致（含环检测），枚举最优一致", () => {
  FX.js.forEach((c) => {
    const r = Core.jsEval(c.jobs, c.orders);
    if (c.cmax === null) assert.equal(r.feasible, false); else { assert.equal(r.feasible, true); assert.equal(r.makespan, c.cmax); }
    assert.equal(Core.jsOpt(c.jobs).value, c.opt);
  });
});

test("页面例子：每台机器按 J1、J2、J3 排得 21，最优 13，216 种组合中 63 种可行，下界 12", () => {
  assert.equal(Core.jsEval(JOBS, { 0: [0, 1, 2], 1: [0, 1, 2], 2: [0, 1, 2] }).makespan, 21);
  const o = Core.jsOpt(JOBS);
  assert.equal(o.value, 13); assert.equal(o.total, 216); assert.equal(o.feasibleCount, 63); assert.equal(Core.jsLowerBound(JOBS), 12);
  assert.equal(Core.jsEval(JOBS, { 0: [0, 1, 2], 1: [0, 1, 2], 2: [2, 1, 0] }).feasible, false);
  const r = Core.jsEval(JOBS, o.orders); assert.equal(r.makespan, 13); assert.ok(r.critical.length >= 2);
});
