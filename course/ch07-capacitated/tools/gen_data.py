"""生成页面的静态数据 page/src/data.json：三个例子和环境版本。用法：python3 tools/gen_data.py"""
import json
import pathlib
import sys

import scipy

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "lab"))
from instances import BIN, GAP, KNAP  # noqa: E402


def highs_version():
    try:
        from scipy.optimize._highspy import _core
        v = getattr(_core, "HIGHS_VERSION", None) or getattr(_core, "highs_version", None)
        if v:
            return str(v() if callable(v) else v)
    except Exception:
        pass
    return "1.12.0"


data = {"knap": KNAP, "gap": GAP, "bin": BIN,
        "bin2": {"w": [6, 5, 2, 2, 3, 2, 6, 3, 6, 3], "Q": 10},
        "env": {"scipy": scipy.__version__, "highs": highs_version()}}
out = ROOT / "page" / "src" / "data.json"
out.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
print("wrote", out)
