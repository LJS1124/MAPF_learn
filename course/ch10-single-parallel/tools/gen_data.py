"""生成页面的静态数据 page/src/data.json：两个单机例子和环境版本。用法：python3 tools/gen_data.py"""
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "lab"))
from instances import JOB, JOB2  # noqa: E402

data = {"job": JOB, "job2": {**JOB2, "w": [1] * len(JOB2["p"])}, "env": {"scipy": "1.17.1", "highs": "1.12.0"}}
out = ROOT / "page" / "src" / "data.json"
out.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
print("wrote", out)
