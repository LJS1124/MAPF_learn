"""生成 page/tests/fixtures.json：用 Lab 的独立参考实现（暴力枚举）给 core11.js 出对拍数据。"""
import json
import os
import pathlib
import random
import sys

os.environ["LAB_TARGET"] = "solutions"
ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "lab"))

from instances import random_flow, random_jobshop  # noqa: E402
from oracle import enum_flow, flow_cmax, js_eval, js_opt  # noqa: E402
from solutions.ex2_neh import neh  # noqa: E402


def main():
    rng = random.Random(1101)
    fx = {"flow": [], "js": []}
    for k in range(40):
        P = random_flow(rng, n=rng.randint(2, 6), m=2 + k % 3)
        perm = list(range(len(P)))
        rng.shuffle(perm)
        seq, c = neh(P)
        fx["flow"].append({"P": P, "perm": perm, "cmax": flow_cmax(P, perm), "opt": enum_flow(P), "neh": seq, "neh_c": c})
    for _ in range(30):
        jobs = random_jobshop(rng, nj=rng.randint(2, 4), nm=rng.randint(2, 3))
        nm = 1 + max(m for j in jobs for m, _ in j)
        orders = {}
        for m in range(nm):
            o = list(range(len(jobs)))
            rng.shuffle(o)
            orders[str(m)] = o
        fx["js"].append({"jobs": jobs, "orders": orders, "cmax": js_eval(jobs, {int(k): v for k, v in orders.items()}), "opt": js_opt(jobs)})
    out = ROOT / "page" / "tests" / "fixtures.json"
    out.write_text(json.dumps(fx, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("wrote", out)


if __name__ == "__main__":
    main()
