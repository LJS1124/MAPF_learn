"""生成页面的静态数据 page/src/data.json：作业、不相关机器的加工时间表、环境版本。用法：python3 tools/gen_data.py"""
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "lab"))
from instances import JOB, R  # noqa: E402

data = {"job": JOB, "R": R, "env": {"scipy": "1.17.1", "highs": "1.12.0"}}
out = ROOT / "page" / "src" / "data.json"
out.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
print("wrote", out)
