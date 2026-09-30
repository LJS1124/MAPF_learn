"""生成 page/tests/fixtures.json：用 Lab 的独立参考实现（暴力、DP、linprog）给 core7.js 出对拍数据。"""
import json
import pathlib
import random
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "lab"))

from instances import BIN, GAP, KNAP, random_bin, random_gap, random_knap  # noqa: E402
from oracle import bin_opt, gap_ip, gap_lp_ref, knap_brute, knap_lp_ref  # noqa: E402


def ffd_count(w, Q):
    bins = []
    for j in sorted(range(len(w)), key=lambda j: (-w[j], j)):
        for b in bins:
            if b[0] + w[j] <= Q:
                b[0] += w[j]
                break
        else:
            bins.append([w[j]])
    return len(bins)


def main():
    rng = random.Random(7001)
    fx = {"knap": [], "gap": [], "bin": []}
    for _ in range(60):
        v, w, cap = random_knap(rng, n=rng.randint(5, 12))
        fx["knap"].append({"v": v, "w": w, "cap": cap, "opt": knap_brute(v, w, cap)[0], "lp": knap_lp_ref(v, w, cap)})
    for _ in range(40):
        C, w, Q = random_gap(rng, m=rng.randint(2, 4), n=rng.randint(4, 7), slack=(0.9, 1.6))
        ip, _ = gap_ip(C, w, Q)
        lp = gap_lp_ref(C, w, Q)
        fx["gap"].append({"C": C, "w": w, "Q": Q, "ip": ip, "lp": None if lp is None else lp[0]})
    for _ in range(50):
        w, Q = random_bin(rng, n=rng.randint(6, 11))
        fx["bin"].append({"w": w, "Q": Q, "opt": bin_opt(w, Q), "ffd": ffd_count(w, Q), "lb": -(-sum(w) // Q)})
    lp = gap_lp_ref(GAP["C"], GAP["w"], GAP["Q"])
    fx["canon"] = {"knap": {**KNAP, "opt": knap_brute(KNAP["v"], KNAP["w"], KNAP["cap"])[0], "lp": knap_lp_ref(KNAP["v"], KNAP["w"], KNAP["cap"])},
                   "gap": {**GAP, "lp": lp[0], "ip": gap_ip(GAP["C"], GAP["w"], GAP["Q"])[0]},
                   "bin": {**BIN, "opt": bin_opt(BIN["w"], BIN["Q"]), "ffd": ffd_count(BIN["w"], BIN["Q"])}}
    out = ROOT / "page" / "tests" / "fixtures.json"
    out.write_text(json.dumps(fx, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("wrote", out, fx["canon"]["knap"]["opt"], fx["canon"]["gap"]["lp"], fx["canon"]["gap"]["ip"], fx["canon"]["bin"])


if __name__ == "__main__":
    main()
