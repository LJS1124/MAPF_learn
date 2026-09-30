/* core9.js 的对拍测试：夹具由 tools/gen_fixtures.py 用暴力枚举与参考答案的复杂度推理生成。
 * 运行：node --test page/tests/core9.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const fs = require("fs");
const Core = require(path.join(__dirname, "..", "src", "core9.js"));
const FX = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures.json"), "utf-8"));
const JOB = { p: [7, 3, 5, 2, 8, 5], w: [2, 2, 4, 4, 4, 2], d: [13, 23, 17, 5, 9, 21] };

test("evaluate 与 Python 参考实现一致（含释放时间）", () => {
  FX.eval.forEach((c) => {
    const e = Core.evaluate({ p: c.p, w: c.w, d: c.d, r: c.r }, c.seq);
    Core.KEYS.forEach((k) => assert.equal(e[k], c.ref[k], k));
  });
});

test("bestBy 的各目标最小值与枚举一致", () => {
  FX.best.forEach((c) => {
    const b = Core.bestBy({ p: c.p, w: c.w, d: c.d, r: c.r });
    Core.KEYS.forEach((k) => assert.equal(b[k].value, c.ref[k], k));
  });
});

test("页面例子：SPT/WSPT/EDD/Moore 的取值与各目标最优", () => {
  const J = JOB, ev = (s) => Core.evaluate(J, s);
  const spt = ev(Core.RULES.SPT(J)), fifo = ev(Core.RULES.FIFO(J)), edd = ev(Core.RULES.EDD(J)), wspt = ev(Core.RULES.WSPT(J)), mo = ev(Core.moore(J));
  assert.deepEqual([spt.sumC, spt.sumwC, spt.Lmax, spt.sumT, spt.sumU, spt.sumwU], [84, 252, 21, 30, 2, 6]);
  assert.equal(fifo.sumC, 104); assert.equal(wspt.sumwC, 234); assert.deepEqual([edd.Lmax, edd.sumC, edd.sumU], [7, 108, 5]); assert.deepEqual([mo.sumU, mo.Lmax], [1, 21]);
  const b = Core.bestBy(J);
  assert.deepEqual(Core.KEYS.map((k) => b[k].value), [30, 84, 234, 7, 18, 1, 4]);
  assert.deepEqual(Core.pareto(J).map((q) => [q.sumC, q.Lmax]), [[108, 7], [107, 8], [95, 9], [94, 11], [90, 12], [89, 16], [85, 17], [84, 21]]);
});

test("并行机：枚举最优与列表调度；页面例子", () => {
  FX.par.forEach((c) => assert.equal(Core.optCmax(c.P).Cmax, c.opt));
  const P2 = [JOB.p, JOB.p], R = [[7, 3, 5, 2, 8, 5], [3, 6, 4, 5, 4, 9]], ord = [0, 1, 2, 3, 4, 5], lpt = ord.slice().sort((a, b) => JOB.p[b] - JOB.p[a] || a - b);
  assert.equal(Core.listSchedule(P2, ord).Cmax, 16); assert.equal(Core.optCmax(P2).Cmax, 15); assert.equal(Core.listSchedule(P2, lpt).Cmax, 15);
  assert.equal(Core.listSchedule(R, ord).Cmax, 11); assert.equal(Core.listSchedule(R, lpt).Cmax, 14); assert.equal(Core.optCmax(R).Cmax, 11);
});

test("三段式记号的解析", () => {
  assert.deepEqual(Core.parse("P2 | r_j, prec | Σw_jC_j"), { alpha: "P2", beta: ["r", "prec"], gamma: "sumwC" });
  assert.deepEqual(Core.parse("1|r_j|L_max"), { alpha: "1", beta: ["r"], gamma: "Lmax" });
  assert.equal(Core.parse("1 | | foo"), null);
});

test("复杂度地图：对全部 2816 个（机器 × 约束 × 目标）组合，与 Python 的推理一致", () => {
  let n = 0;
  Object.keys(FX.cx).forEach((key) => {
    const [a, b, g] = key.split("|"), beta = b ? b.split(",") : [];
    const got = Core.classify({ alpha: a, beta: beta, gamma: g }).status;
    assert.equal(got, FX.cx[key], key); n++;
  });
  assert.equal(n, 2816);
});
