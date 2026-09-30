"""生成 page/tests/fixtures.json：用 Lab 的独立参考实现（暴力、完整 SEC 的 LP、linprog）给 core8.js 出对拍数据。"""
import json
import pathlib
import random
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "lab"))

from instances import CVRP, TSP, dist, random_points  # noqa: E402
from oracle import cvrp_brute, full_sec_lp, lp_with_secs, mtz_lp_ref, tsp_brute  # noqa: E402


def main():
    rng = random.Random(8001)
    fx = {"tsp": [], "cvrp": []}
    for _ in range(30):
        P = random_points(rng, n=rng.randint(4, 7))
        D = dist(P)
        fx["tsp"].append({"P": P, "opt": tsp_brute(D), "assign": lp_with_secs(D, [])[0], "sec": full_sec_lp(D), "mtz": mtz_lp_ref(D)})
    for _ in range(25):
        m = rng.randint(3, 6)
        P = random_points(rng, n=m)
        dem = [rng.randint(1, 4) for _ in range(m)]
        Q = rng.randint(max(dem), sum(dem))
        K = rng.randint(1, 3)
        fx["cvrp"].append({"P": P, "dem": dem, "Q": Q, "K": K, "opt": cvrp_brute(dist(P), dem, Q, K)})
    D = dist(TSP["P"])
    fx["canon"] = {"opt": tsp_brute(D), "assign": lp_with_secs(D, [])[0], "sec": full_sec_lp(D), "mtz": mtz_lp_ref(D)}
    out = ROOT / "page" / "tests" / "fixtures.json"
    out.write_text(json.dumps(fx, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("wrote", out, fx["canon"])


if __name__ == "__main__":
    main()
