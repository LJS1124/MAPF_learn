"""把 page/src 里的部件拼成一个可发布的页面。

    python3 page/build.py

输出：
    page/dist/ch05-assignment.html   发布用的片段（没有 <html>/<head>/<body>，发布时由平台补骨架）
    page/dist/preview.html           本地预览用（补上骨架和同样的基础样式）
    page/dist/app.js                 拼接后的全部脚本（用于 node --check）
"""
import json
import pathlib
import subprocess

HERE = pathlib.Path(__file__).resolve().parent
SRC = HERE / "src"
DIST = HERE / "dist"
DIST.mkdir(exist_ok=True)


def read(name):
    return (SRC / name).read_text(encoding="utf-8")


def main():
    data = json.loads(read("data.json"))
    cx = subprocess.run(["node", str(HERE.parent / "tools" / "gen_cx.js")], check=True, capture_output=True, text=True).stdout
    data["cx"] = json.loads(cx)
    data_js = "window.DATA = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";"

    cores = "\n".join(read(f) for f in ("core.js", "core2.js", "core5.js"))
    app_parts = ["ui.js", "fig1.js", "fig2.js", "fig3.js", "fig4.js", "fig5.js", "fig6.js", "fig7.js", "main.js"]
    app = '(function () {\n"use strict";\n' + "\n".join(read(f) for f in app_parts) + "\n})();\n"
    (DIST / "app.js").write_text(data_js + "\n" + cores + "\n" + app, encoding="utf-8")

    body = read("body1.html") + read("body2.html") + read("body3.html")
    css = read("shared.css") + "\n" + read("ch5.css")
    page = (
        read("head.html")
        + "<style>\n" + css + "</style>\n\n"
        + body + "\n"
        + "<script>\n" + data_js + "\n</script>\n"
        + "<script>\n" + cores + "\n</script>\n"
        + "<script>\n" + app + "</script>\n"
    )
    (DIST / "ch05-assignment.html").write_text(page, encoding="utf-8")
    preview = (
        "<!doctype html><html><head><meta charset=utf8>"
        "<meta name=viewport content=\"width=device-width,initial-scale=1,viewport-fit=cover\">"
        "<style>:root{color-scheme:light;box-sizing:border-box}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#faf9f5;color:#141413}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style>"
        "</head><body>\n" + page + "</body></html>\n"
    )
    (DIST / "preview.html").write_text(preview, encoding="utf-8")
    print("built", DIST / "ch05-assignment.html", len(page) // 1024, "KB")


if __name__ == "__main__":
    main()
