"""生成 page/tests/fixtures.json：用 Lab 的独立参考实现（暴力枚举）给 core10.js 出对拍数据。"""
import json
import pathlib
import random
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "lab"))

from instances import random_jobs  # noqa: E402
from oracle import best_values, opt_cmax_identical  # noqa: E402


def main():
    rng = random.Random(1001)
    fx = {"single": [], "par": []}
    for _ in range(40):
        p, w, d = random_jobs(rng, n=rng.randint(2, 7))
        fx["single"].append({"p": p, "w": w, "d": d, "best": best_values(p, w, d)})
    for _ in range(30):
        m, n = rng.randint(2, 3), rng.randint(3, 8)
        p = [rng.randint(1, 9) for _ in range(n)]
        fx["par"].append({"p": p, "m": m, "opt": opt_cmax_identical(p, m)})
    out = ROOT / "page" / "tests" / "fixtures.json"
    out.write_text(json.dumps(fx, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("wrote", out)


if __name__ == "__main__":
    main()
