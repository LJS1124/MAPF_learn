"""把 lab/ 打包成 dist/ch09-scheduling-language-lab.zip（解压后是一个 ch09-scheduling-language-lab/ 目录）。

用法：python3 tools/make_lab_zip.py [输出路径]
"""
import pathlib
import sys
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
LAB = ROOT / "lab"
out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "dist" / "ch09-scheduling-language-lab.zip"
out.parent.mkdir(parents=True, exist_ok=True)

SKIP = {"__pycache__", ".pytest_cache"}
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for f in sorted(LAB.rglob("*")):
        if f.is_dir() or any(part in SKIP for part in f.parts) or f.suffix == ".pyc":
            continue
        z.write(f, pathlib.Path("ch09-scheduling-language-lab") / f.relative_to(LAB))
print("wrote", out, out.stat().st_size // 1024, "KB")
