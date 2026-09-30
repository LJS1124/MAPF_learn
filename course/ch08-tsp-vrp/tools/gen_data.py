"""生成页面的静态数据 page/src/data.json：点坐标、CVRP 参数、环境版本。用法：python3 tools/gen_data.py"""
import json
import pathlib
import sys

import scipy

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "lab"))
from instances import CVRP, TSP  # noqa: E402

data = {"tsp": TSP, "cvrp": {"dem": CVRP["dem"], "Q": CVRP["Q"], "K": CVRP["K"]}, "env": {"scipy": scipy.__version__, "highs": "1.12.0"}}
out = ROOT / "page" / "src" / "data.json"
out.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
print("wrote", out)
