"""生成页面的静态数据 page/src/data.json：场景、代价矩阵、环境版本、实测耗时。

用法：python3 tools/gen_data.py
实测耗时取决于机器，只用于表 5-3；页面里的其他数字都在浏览器里实时计算。
"""
import json
import pathlib
import statistics
import sys
import time

import numpy as np
import scipy
from scipy.optimize import Bounds, LinearConstraint, linear_sum_assignment, linprog, milp

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "lab"))
from solutions.ex2_incremental import IncrementalAssignment  # noqa: E402
from warehouse import PARAMS, default_costs, default_scenario  # noqa: E402


def rand_matrix(n, seed=2):
    return np.random.default_rng(seed).integers(1, 1_000_001, size=(n, n)).astype(float)


def timeit(fn, repeat):
    ts = []
    for _ in range(repeat):
        t0 = time.perf_counter()
        fn()
        ts.append((time.perf_counter() - t0) * 1000)
    return statistics.median(ts)


def assignment_lp(M):
    n = M.shape[0]
    A = np.zeros((2 * n, n * n))
    for i in range(n):
        for j in range(n):
            A[i, i * n + j] = 1
            A[n + j, i * n + j] = 1
    return A


def measure():
    rows = []
    for n, rep_fast, rep_slow in ((50, 9, 3), (100, 7, 3), (200, 5, 1)):
        M = rand_matrix(n)
        A = assignment_lp(M)

        def py():
            inc = IncrementalAssignment(M)
            for j in range(n):
                inc.insert(j)

        rows.append({
            "n": n,
            "py": timeit(py, rep_fast),
            "lsa": timeit(lambda: linear_sum_assignment(M), 30),
            "lp": timeit(lambda: linprog(M.ravel(), A_eq=A, b_eq=np.ones(2 * n), bounds=(0, 1), method="highs-ds"), rep_slow),
            "milp": timeit(lambda: milp(M.ravel(), constraints=LinearConstraint(A, 1, 1), integrality=np.ones(n * n), bounds=Bounds(0, 1)), rep_slow),
        })
    M = rand_matrix(1000)
    rows.append({"n": 1000, "py": None, "lsa": timeit(lambda: linear_sum_assignment(M), 5), "lp": None, "milp": None})
    return rows


def highs_version():
    try:
        from scipy.optimize._highspy import _core
        v = getattr(_core, "HIGHS_VERSION", None) or getattr(_core, "highs_version", None)
        if v:
            return str(v() if callable(v) else v)
    except Exception:
        pass
    return "1.12.0"      # 与第 1、2 章页面同一环境的记录


def main():
    vehicles, tasks = default_scenario()
    C = default_costs()
    opt_r, opt_c = linear_sum_assignment(C)
    data = {
        "scenario": {
            "name": "第 2 章场景：第 1 章默认场景 + 备用车 V6",
            "params": PARAMS,
            "vehicles": [{"id": v.id, "floor": v.floor, "x": v.x, "y": v.y} for v in vehicles],
            "tasks": [{"id": t.id, "floor": t.floor, "x": t.x, "y": t.y} for t in tasks],
        },
        "C": C.astype(int).tolist(),
        "opt": float(C[opt_r, opt_c].sum()),
        "a": [int(i) for _, i in sorted(zip(opt_c, opt_r))],
        "env": {"scipy": scipy.__version__, "highs": highs_version()},
        "timing": {"rows": measure()},
    }
    out = ROOT / "page" / "src" / "data.json"
    out.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    print("wrote", out, "opt", data["opt"], "a", data["a"])
    for r in data["timing"]["rows"]:
        print(r)


if __name__ == "__main__":
    main()
