"""生成 page/tests/fixtures.json：用 Lab 的独立参考实现（Floyd、枚举割、linprog）给 core6.js 出对拍数据。

    python3 tools/gen_fixtures.py
"""
import json
import pathlib
import random
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "lab"))

from network import CANON, CANON_NEG, INF, random_network  # noqa: E402
from oracle import floyd, has_neg_cycle, max_flow_value, min_cost_lp, min_cut_value  # noqa: E402


def arcs_json(arcs):
    return [{"u": u, "v": v, "cap": c, "cost": w} for (u, v, c, w) in arcs]


def dist_json(d):
    return [None if x == INF else x for x in d]


def det_hist(A):
    """全部方子式的行列式分布（numpy 独立枚举）。"""
    import itertools
    import numpy as np
    A = np.array(A, float)
    R, C = A.shape
    h = {}
    for k in range(1, min(R, C) + 1):
        for rs in itertools.combinations(range(R), k):
            sub = A[list(rs)]
            for cs in itertools.combinations(range(C), k):
                d = int(round(np.linalg.det(sub[:, list(cs)])))
                h[d] = h.get(d, 0) + 1
    return {str(k): v for k, v in sorted(h.items())}


def main():
    rng = random.Random(6001)
    fx = {"dijkstra": [], "bellman": [], "negcycle": [], "maxflow": [], "mincost": []}
    for _ in range(60):
        n, arcs = random_network(rng, n=rng.randint(4, 8), m=rng.randint(5, 16))
        d, _ = floyd(n, arcs)
        fx["dijkstra"].append({"n": n, "arcs": arcs_json(arcs), "dist": dist_json(d[0])})
    for _ in range(60):
        n, arcs = random_network(rng, n=rng.randint(4, 8), m=rng.randint(5, 16), allow_neg=True)
        d, neg = floyd(n, arcs)
        assert not neg
        fx["bellman"].append({"n": n, "arcs": arcs_json(arcs), "dist": dist_json(d[0])})
    while len(fx["negcycle"]) < 30:
        n, arcs = random_network(rng, n=rng.randint(5, 8), m=rng.randint(8, 14), allow_neg=True, neg_cycle=True)
        d, neg = floyd(n, arcs)
        reach = any(d[0][v] < INF and d[v][v] < 0 for v in range(n))
        fx["negcycle"].append({"n": n, "arcs": arcs_json(arcs), "reachable_negative_cycle": reach})
    for _ in range(80):
        n, arcs = random_network(rng, n=rng.randint(4, 9), m=rng.randint(6, 20), max_cap=rng.randint(1, 9))
        val, S = min_cut_value(n, arcs, 0, n - 1)
        fx["maxflow"].append({"n": n, "arcs": arcs_json(arcs), "value": val})
    while len(fx["mincost"]) < 80:
        n, arcs = random_network(rng, n=rng.randint(4, 8), m=rng.randint(6, 16), max_cap=rng.randint(1, 6), allow_neg=rng.random() < 0.4)
        if has_neg_cycle(n, arcs):
            continue
        f = max_flow_value(n, arcs, 0, n - 1)
        curve = [min_cost_lp(n, arcs, 0, n - 1, k) for k in range(f + 1)]
        fx["mincost"].append({"n": n, "arcs": arcs_json(arcs), "maxflow": f, "curve": curve})
    d, _ = floyd(6, CANON)
    dn, _ = floyd(6, CANON_NEG)
    fx["canon"] = {
        "dist": d[0], "dist_neg": dn[0], "maxflow": max_flow_value(6, CANON, 0, 5),
        "curve": [min_cost_lp(6, CANON, 0, 5, k) for k in range(13)],
        "cost_k1_neg": min_cost_lp(6, CANON_NEG, 0, 5, 1),
    }
    import numpy as np
    A = np.zeros((6, 10), int)
    for e, (u, v, _, _) in enumerate(CANON):
        A[u, e] += 1
        A[v, e] -= 1
    def with_row(arcs):
        r = np.zeros((1, 10), int)
        r[0, arcs] = 1
        return np.vstack([A, r])
    fx["canon"]["hist"] = {"none": det_hist(A), "nodec": det_hist(with_row([3, 4])), "chain": det_hist(with_row([1, 5])), "pair": det_hist(with_row([0, 3]))}
    out = ROOT / "page" / "tests" / "fixtures.json"
    out.write_text(json.dumps(fx, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("wrote", out, out.stat().st_size // 1024, "KB", fx["canon"])


if __name__ == "__main__":
    main()
