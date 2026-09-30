"""生成页面的静态数据 page/src/data.json：三个例子，以及 MIP 与 CP 的对比表（用 Lab 的参考答案实测；耗时依赖机器，只作数量级参考）。

用法：LAB_TARGET=solutions python3 tools/gen_data.py
"""
import json
import os
import pathlib
import random
import sys
import time

os.environ["LAB_TARGET"] = "solutions"
ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "lab"))

from instances import FLOW2, FLOW3, JOBSHOP, random_jobshop  # noqa: E402
from solutions.ex4_models import cp_jobshop, mip_jobshop, mip_lp_bound  # noqa: E402


def lb(jobs):
    load = {}
    for job in jobs:
        for m, d in job:
            load[m] = load.get(m, 0) + d
    return max(max(load.values()), max(sum(d for _, d in job) for job in jobs))


def mip_timed(jobs, limit=30):
    """大 M 的 MIP，带时间限制。返回 (最好可行值, 对偶下界, 耗时, 是否证明最优)。"""
    import numpy as np
    from scipy.optimize import Bounds, LinearConstraint, milp
    from solutions.ex4_models import _mip_parts
    c, A, lo, hi, n, npair, M = _mip_parts(jobs)
    integ = np.zeros(len(c))
    integ[n + 1:] = 1
    ub = np.concatenate([np.full(n + 1, M), np.ones(npair)])
    t = time.perf_counter()
    r = milp(c, constraints=LinearConstraint(A, lo, hi), integrality=integ, bounds=Bounds(np.zeros(len(c)), ub), options={"time_limit": limit})
    return round(r.fun, 2), round(float(r.mip_dual_bound), 2), round(time.perf_counter() - t, 2), r.status == 0


def row(name, jobs):
    t = time.perf_counter()
    cp = cp_jobshop(jobs)
    tcp = time.perf_counter() - t
    val, dual, tm, proven = mip_timed(jobs)
    out = {"name": name, "nj": len(jobs), "nm": 1 + max(m for j in jobs for m, _ in j), "ops": sum(len(j) for j in jobs), "opt": cp, "lb": lb(jobs),
           "tcp": round(tcp, 2), "mip": val, "dual": dual, "tmip": tm, "proven": proven}
    if proven:
        assert round(val) == cp
    if len(jobs) <= 4:
        out["lp"] = round(mip_lp_bound(jobs), 2)
    return out


def main():
    rng = random.Random(1102)
    rows = [row("页面例子 3 × 3", JOBSHOP)]
    for nj, nm in ((5, 5), (8, 8), (10, 10), (12, 10)):
        rows.append(row(f"{nj} × {nm}", random_jobshop(rng, nj, nm)))
    data = {"flow2": FLOW2, "flow3": FLOW3, "jobshop": JOBSHOP, "cmp": rows, "env": {"scipy": "1.17.1", "highs": "1.12.0", "ortools": "9.15"}}
    out = ROOT / "page" / "src" / "data.json"
    out.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    for r in rows:
        print(r)


if __name__ == "__main__":
    main()
