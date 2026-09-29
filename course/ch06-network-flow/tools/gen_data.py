"""生成页面的静态数据 page/src/data.json：网络、坐标、加一行以后的 LP 与整数最优表、环境版本。

用法：python3 tools/gen_data.py
页面里其余的数字都在浏览器里实时计算。
"""
import json
import pathlib
import sys

import numpy as np
import scipy
from scipy.optimize import Bounds, LinearConstraint, linprog, milp

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "lab"))
from network import CANON, NAMES  # noqa: E402
from oracle import min_cost_lp  # noqa: E402

POS = [[46, 150], [186, 60], [186, 240], [344, 60], [344, 240], [494, 150]]
EXTRAS = [
    {"key": "none", "label": "不加", "arcs": [], "b": 0,
     "note": "6 个点 × 10 条弧的点弧关联矩阵。每一列（一条弧）恰好有一个 +1（起点）和一个 −1（终点）。"},
    {"key": "nodec", "label": "点 c 的容量", "arcs": [3, 4], "b": 4,
     "note": "多一行：进入 c 的两条弧（a→c、b→c）合计至多 4。这是点容量，可以拆点还原成普通的弧容量，所以仍是网络。"},
    {"key": "chain", "label": "串联弧共限额", "arcs": [1, 5], "b": 1,
     "note": "多一行：S→b 与 b→d 合计至多 1。这两条弧首尾相接，走 S→b→d 的一个单位会被计两次。"},
    {"key": "pair", "label": "另一处共限额", "arcs": [0, 3], "b": 3,
     "note": "多一行：S→a 与 a→c 合计至多 3。同样是首尾相接的两条弧共用一个限额。"},
]


def highs_version():
    try:
        from scipy.optimize._highspy import _core
        v = getattr(_core, "HIGHS_VERSION", None) or getattr(_core, "highs_version", None)
        if v:
            return str(v() if callable(v) else v)
    except Exception:
        pass
    return "1.12.0"


def extra_tables():
    n, m = 6, len(CANON)
    A = np.zeros((n, m))
    for e, (u, v, _, _) in enumerate(CANON):
        A[u, e] += 1
        A[v, e] -= 1
    cost = np.array([a[3] for a in CANON], float)
    cap = np.array([a[2] for a in CANON], float)
    out = []
    for ex in EXTRAS:
        lp_row, ip_row = [], []
        for k in range(13):
            beq = np.zeros(n)
            beq[0], beq[5] = k, -k
            kw = {}
            cons = [LinearConstraint(A, beq, beq)]
            if ex["arcs"]:
                r = np.zeros(m)
                r[ex["arcs"]] = 1
                kw = {"A_ub": [r], "b_ub": [ex["b"]]}
                cons.append(LinearConstraint([r], -np.inf, ex["b"]))
            lp = linprog(cost, A_eq=A, b_eq=beq, bounds=list(zip([0] * m, cap)), method="highs", **kw)
            if lp.status != 0:
                lp_row.append(None)
                ip_row.append(None)
                continue
            ip = milp(cost, constraints=cons, integrality=np.ones(m), bounds=Bounds(0, cap))
            lp_row.append(round(lp.fun, 4))
            ip_row.append(round(ip.fun, 4) if ip.status == 0 else None)
        out.append(dict(ex, lp=lp_row, ip=ip_row))
    return out


def main():
    data = {
        "net": {"names": NAMES, "pos": POS, "edges": [{"u": u, "v": v, "cap": c, "cost": w} for (u, v, c, w) in CANON],
                "neg": {"u": 3, "v": 2, "cap": 3, "cost": -4}},
        "extras": extra_tables(),
        "curve": [min_cost_lp(6, CANON, 0, 5, k) for k in range(13)],
        "env": {"scipy": scipy.__version__, "highs": highs_version()},
    }
    out = ROOT / "page" / "src" / "data.json"
    out.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    print("wrote", out)
    for e in data["extras"]:
        print(e["key"], list(zip(e["lp"], e["ip"])))


if __name__ == "__main__":
    main()
