/* core5.js 的对拍测试：用 Python 生成的夹具（SciPy、暴力枚举、linprog）逐项核对。
 * 运行：node --test page/tests/    （先跑一次 python3 tools/gen_fixtures.py 生成 fixtures.json）
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const fs = require("fs");
const Core = require(path.join(__dirname, "..", "src", "core5.js"));
const FX = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures.json"), "utf-8"));

const DEFAULT_C = [[24, 83, 38, 71, 82], [18, 61, 32, 49, 60], [6, 85, 36, 73, 84], [76, 43, 90, 9, 42], [68, 23, 82, 23, 10], [32, 75, 46, 63, 74]];
const close = (a, b, tol) => Math.abs(a - b) <= (tol || 1e-6);

test("默认场景：增量匈牙利的黄金轨迹与 HiGHS 顶点一致", () => {
  const r = Core.incremental(DEFAULT_C, [0, 1, 2, 3, 4]);
  assert.equal(r.total, 124);
  assert.deepEqual(r.u, [8, 67, 38, 33, 54]);
  assert.deepEqual(r.v, [0, 6, 2, 24, 44, 0]);
  assert.deepEqual(r.events.map((e) => e.marginal), [6, 23, 32, 9, 54]);
  const e5 = r.events[4];
  assert.deepEqual(e5.scans.map((s) => s.veh), [4, 3, 1, 2, 0]);
  assert.deepEqual(e5.scans.map((s) => s.radius), [0, 20, 38, 42, 44]);
  assert.equal(e5.D, 44); assert.equal(e5.u0, 10);
  assert.deepEqual(e5.chain, [{ task: 4, from: -1, to: 4 }, { task: 1, from: 4, to: 1 }, { task: 2, from: 1, to: 0 }]);
  assert.equal(Core.greedyFifo(DEFAULT_C, [0, 1, 2, 3, 4]).total, 144);
});

test("增量匈牙利：随机长方形矩阵上每个前缀都与 linear_sum_assignment 一致，且不变量成立", () => {
  FX.incremental.forEach((c, idx) => {
    const r = Core.incremental(c.C, c.order);
    const m = c.C.length;
    r.events.forEach((e, k) => {
      assert.ok(close(e.total, c.prefix[k]), `案例 ${idx} 前缀 ${k}: ${e.total} != ${c.prefix[k]}`);
      // 不变量（在该次插入之后）
      const done = c.order.slice(0, k + 1);
      for (let i = 0; i < m; i++) for (const j of done) assert.ok(c.C[i][j] + e.vAfter[i] - e.uAfter[j] >= -1e-9, "价格可行");
      done.forEach((j) => { const i = e.aAfter[j]; assert.ok(Math.abs(c.C[i][j] + e.vAfter[i] - e.uAfter[j]) < 1e-9, "配对的边是紧的"); });
      for (let i = 0; i < m; i++) if (e.aAfter.indexOf(i) < 0) assert.ok(Math.abs(e.vAfter[i]) < 1e-9, "空闲车价格为 0");
      assert.ok(close(e.marginal, e.uAfter[e.task]), "边际成本 = 新任务的最终价格");
    });
  });
});

test("dispatch：长方形、禁行、延后罚金与暴力枚举一致；无解时 Hall 证书有效", () => {
  let infeasible = 0;
  FX.dispatch.forEach((c, idx) => {
    const m = c.C.length, n = c.C[0].length;
    const r = Core.dispatch(c.C, { allowed: c.allowed, penalty: c.penalty });
    if (c.best === null) {
      infeasible++;
      assert.equal(r.feasible, false, `案例 ${idx} 应无解`);
      assert.ok(r.hall, "应有 Hall 证书");
      const S = r.hall.S, N = r.hall.N;
      assert.ok(N.length < S.length, "|N| < |S|");
      const neigh = new Set();
      S.forEach((j) => { for (let i = 0; i < m; i++) if (c.allowed[i][j]) neigh.add(i); });
      neigh.forEach((i) => assert.ok(N.indexOf(i) >= 0, "N 包含 S 的全部邻居"));
    } else {
      assert.equal(r.feasible, true, `案例 ${idx} 应有解`);
      assert.ok(close(r.total, c.best), `案例 ${idx}: ${r.total} != ${c.best}`);
      r.a.forEach((i, j) => { if (i >= 0) assert.ok(c.allowed[i][j], "没有用到禁行边"); });
    }
  });
  assert.ok(infeasible > 20);
});

test("瓶颈指派、字典序与帕累托阶梯与暴力枚举一致", () => {
  FX.bottleneck.forEach((c, idx) => {
    assert.equal(Core.bottleneck(c.C).tau, c.tau, `案例 ${idx} 的 τ*`);
    const p = Core.pareto(c.C);
    assert.ok(close(p.front[0].total, c.lex_total), "字典序总时间 = 阶梯第一点");
    assert.deepEqual(p.front.map((f) => [f.max, f.total]), c.pareto, `案例 ${idx} 的阶梯`);
  });
  const pd = Core.pareto(DEFAULT_C);
  assert.deepEqual(pd.front.map((f) => [f.max, f.total]), [[49, 146], [60, 136], [61, 124]]);
});

test("冲突对：LP、整数最优、拉格朗日下界与 linprog / 暴力枚举一致", () => {
  FX.conflict.forEach((c, idx) => {
    const ex = [{ cells: [[c.e1[0], c.e1[1], 1], [c.e2[0], c.e2[1], 1]], b: 1 }];
    const lp = Core.lpExtra(c.C, ex), ip = Core.ipExtra(c.C, ex);
    assert.ok(close(lp.value, c.lp, 1e-6), `案例 ${idx} LP: ${lp.value} != ${c.lp}`);
    assert.ok(close(ip.value, c.ip), `案例 ${idx} 整数最优`);
    const lag = Core.lagrangeBest(c.C, c.e1, c.e2);
    assert.ok(close(lag.L, FX.lagrange[idx].L, 1e-5), `案例 ${idx} 拉格朗日下界`);
    assert.ok(close(lag.L, c.lp, 1e-5), "拉格朗日下界 = LP 值");
    const dec = Core.decompose(lp.x, c.C.length, c.C[0].length);
    const wsum = dec.reduce((s, p) => s + p.w, 0);
    assert.ok(close(wsum, 1, 1e-6), "拆出的权重之和为 1");
  });
  // 默认场景的两个预设
  const ex = [{ cells: [[0, 2, 1], [1, 1, 1]], b: 1 }];
  assert.ok(close(Core.lpExtra(DEFAULT_C, ex).value, 128) && close(Core.ipExtra(DEFAULT_C, ex).value, 132));
});

test("全单模：全部方子式的行列式分布与 numpy 一致", () => {
  const map = { base: "base", "共享名额": "group12", "两个重叠名额": "group12_23", "冲突对": "conflict", "同车冲突": "conflictSame", "三条边冲突": "conflict3", "奇圈": "triangle" };
  Object.keys(map).forEach((name) => {
    const a = Core.tuAnalyze(Core.tuMatrix(map[name]).A);
    const got = {}; Object.keys(a.hist).forEach((k) => { got[String(Number(k))] = a.hist[k]; });
    assert.deepEqual(got, FX.tu[name], name);
  });
});

test("奇圈：三角形组队的 LP 与奇集割", () => {
  const a = Core.triangleLP([10, 10, 10], false), b = Core.triangleLP([10, 10, 10], true);
  assert.ok(close(a.lp, 15) && a.ip === 10);
  assert.ok(close(b.lp, 10));
  assert.ok(close(Core.triangleLP([20, 5, 5], false).lp, 20));
});

test("复杂度实验：乘积矩阵的扫描次数恰好是 n(n+1)/2", () => {
  [10, 20, 40, 80].forEach((n) => assert.equal(Core.scanStats(Core.productMatrix(n)).scans, n * (n + 1) / 2));
});
