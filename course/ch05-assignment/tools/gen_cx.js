/* 复杂度实验的静态序列：用页面同一份 core5.js 计算，输出 JSON（供 build.py 嵌入页面）。
 * 用法：node tools/gen_cx.js > page/src/cx.json */
const path = require("path");
const Core = require(path.join(__dirname, "..", "page", "src", "core5.js"));

const NS = [10, 20, 40, 80, 160, 320];
const out = { ns: NS, rand: { scans: [], relax: [] }, prod: { scans: [], relax: [] } };
NS.forEach(function (n) {
  const r = Core.scanStats(Core.randomMatrix(n, 1 * 1000 + n, 1000000));   // 与页面 randSeries(seed = 1) 相同
  const p = Core.scanStats(Core.productMatrix(n));
  out.rand.scans.push(r.scans); out.rand.relax.push(r.relax);
  out.prod.scans.push(p.scans); out.prod.relax.push(p.relax);
});
process.stdout.write(JSON.stringify(out));
