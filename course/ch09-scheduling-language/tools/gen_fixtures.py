"""生成 page/tests/fixtures.json：用 Lab 的独立参考实现（暴力枚举）与参考答案的复杂度推理给 core9.js 出对拍数据。"""
import itertools
import os
import json
import pathlib
import random
import sys

os.environ["LAB_TARGET"] = "solutions"
ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "lab"))

from instances import random_jobs  # noqa: E402
from oracle import KEYS, best_values, evaluate, opt_cmax  # noqa: E402
from solutions import ex3_notation as ex3, ex4_complexity as ex4  # noqa: E402
from complexity_table import BETA_ORDER  # noqa: E402

ALPHAS = ex3.ALPHAS
GAMMAS = ["Cmax", "sumC", "sumwC", "Lmax", "sumT", "sumwT", "sumU", "sumwU"]


def main():
    rng = random.Random(9001)
    fx = {"eval": [], "best": [], "par": [], "cx": {}}
    for k in range(40):
        p, w, d, r = random_jobs(rng, n=rng.randint(1, 7), releases=k % 2 == 1)
        seq = list(range(len(p)))
        rng.shuffle(seq)
        fx["eval"].append({"p": p, "w": w, "d": d, "r": r, "seq": seq, "ref": evaluate(p, w, d, r, seq)})
    for k in range(12):
        p, w, d, r = random_jobs(rng, n=rng.randint(2, 6), releases=k % 2 == 0)
        fx["best"].append({"p": p, "w": w, "d": d, "r": r, "ref": best_values(p, w, d, r)})
    for _ in range(30):
        m, n = rng.randint(1, 3), rng.randint(2, 7)
        P = [[rng.randint(1, 9) for _ in range(n)] for _ in range(m)]
        fx["par"].append({"P": P, "opt": opt_cmax(P)})
    betas = [tuple(b) for k in range(6) for b in itertools.combinations(BETA_ORDER, k)]
    for a in ALPHAS:
        for b in betas:
            for g in GAMMAS:
                fx["cx"][f"{a}|{','.join(b)}|{g}"] = ex4.classify(a, b, g)[0]
    out = ROOT / "page" / "tests" / "fixtures.json"
    out.write_text(json.dumps(fx, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("wrote", out, len(fx["cx"]), "个分类")


if __name__ == "__main__":
    main()
