"""第 6 章：对比 PP 与 CBS 的成功率、解质量与耗时。

用法：python examples/03_benchmark.py [地图路径] [每个规模的实例数]
"""
import os, sys, time
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from mapf import Grid, random_instance, prioritized_planning, cbs, validate, sum_of_costs

map_path = sys.argv[1] if len(sys.argv) > 1 else "maps/empty-8x8.map"
trials = int(sys.argv[2]) if len(sys.argv) > 2 else 10
grid = Grid.from_file(map_path)
print(f"地图 {map_path}，每个规模 {trials} 个随机实例（CBS 限 2000 个节点）")
print(f"{'agents':>6} | {'PP成功':>6} {'PP SOC':>8} {'PP秒':>7} | {'CBS成功':>7} {'CBS SOC':>8} {'CBS秒':>7}")
for n in (2, 4, 6, 8):
    row = {"pp": [0, 0, 0.0], "cbs": [0, 0, 0.0]}
    for seed in range(trials):
        inst = random_instance(grid, n, seed)
        for key, fn in (("pp", prioritized_planning), ("cbs", lambda i: cbs(i, 2000))):
            t0 = time.perf_counter()
            paths = fn(inst)
            dt = time.perf_counter() - t0
            if paths and validate(inst, paths)[0]:
                row[key][0] += 1
                row[key][1] += sum_of_costs(paths)
            row[key][2] += dt
    f = lambda k: (row[k][0], row[k][1] / max(row[k][0], 1), row[k][2] / trials)
    print(f"{n:>6} | {f('pp')[0]:>4}/{trials} {f('pp')[1]:>8.1f} {f('pp')[2]:>7.3f} | "
          f"{f('cbs')[0]:>5}/{trials} {f('cbs')[1]:>8.1f} {f('cbs')[2]:>7.3f}")
