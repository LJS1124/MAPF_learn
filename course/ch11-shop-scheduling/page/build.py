"""把 page/src 里的部件拼成一个可发布的页面。

    python3 page/build.py

第 5 章的通用部件（shared.css、ch5.css、core.js、core2.js、core5.js、ui.js）直接引用 ch05-assignment/page/src，不复制。

输出：
    page/dist/ch11-shop-scheduling.html   发布用的片段（没有 <html>/<head>/<body>，发布时由平台补骨架）
    page/dist/preview.html             本地预览用（补上骨架和同样的基础样式）
    page/dist/app.js                   拼接后的全部脚本（用于 node --check）
"""
import html
import json
import pathlib
import re

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
SRC = HERE / "src"
SHARED = ROOT.parent / "ch05-assignment" / "page" / "src"
DIST = HERE / "dist"
DIST.mkdir(exist_ok=True)

KEYWORDS = r"\b(def|for|while|if|elif|else|return|in|and|or|not|break|continue|None|lambda|is|import|from|True|False)\b"


def read(name, base=SRC):
    return (base / name).read_text(encoding="utf-8")


def highlight(line):
    """极简的 Python 高亮：注释、字符串、关键字。"""
    m = re.search(r"#.*$", line)
    comment = ""
    if m and line[: m.start()].count('"') % 2 == 0:
        comment, line = m.group(0), line[: m.start()]
    parts = re.split(r'("[^"]*")', line)
    out = []
    for p in parts:
        if p.startswith('"') and p.endswith('"') and len(p) >= 2:
            out.append('<span class="s">%s</span>' % html.escape(p))
        else:
            out.append(re.sub(KEYWORDS, lambda k: '<span class="k">%s</span>' % k.group(1), html.escape(p)))
    s = "".join(out)
    if comment:
        s += '<span class="c">%s</span>' % html.escape(comment)
    return s


def listing(src_path, func):
    """从参考答案里取出一个函数，做成带行号的代码块（行与行之间不留换行，避免出现空行）。"""
    lines = src_path.read_text(encoding="utf-8").splitlines()
    start = next(i for i, l in enumerate(lines) if l.startswith("def %s(" % func))
    end = next((i for i in range(start + 1, len(lines)) if lines[i].startswith("def ") or lines[i].startswith("class ")), len(lines))
    body = lines[start:end]
    while body and not body[-1].strip():
        body.pop()
    spans = "".join('<span class="ln" data-n="%d">%s</span>' % (i + 1, highlight(l) or " ") for i, l in enumerate(body))
    return '<pre class="code" aria-label="%s 的参考实现">%s</pre>' % (func, spans), len(body)


def main():
    data = json.loads(read("data.json"))
    data_js = "window.DATA = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";"

    cores = "\n".join([read(f, SHARED) for f in ("core.js", "core2.js", "core5.js")] + [read("core11.js")])
    app_parts = [read("ui.js", SHARED), read("util11.js")] + [read(f) for f in ("fig1.js", "fig2.js", "fig3.js", "fig4.js", "main.js")]
    app = '(function () {\n"use strict";\n' + "\n".join(app_parts) + "\n})();\n"
    (DIST / "app.js").write_text(data_js + "\n" + cores + "\n" + app, encoding="utf-8")

    body = read("body1.html") + read("body2.html") + read("body3.html")
    models = ROOT / "lab" / "solutions" / "ex4_models.py"
    for fn in ("mip_jobshop", "cp_jobshop"):
        code_html, _ = listing(models, fn)
        body = body.replace("<!--CODE:%s-->" % fn, code_html)
    css = read("shared.css", SHARED) + "\n" + read("ch5.css", SHARED) + "\n" + read("ch11.css")
    page = (
        read("head.html")
        + "<style>\n" + css + "</style>\n\n"
        + body + "\n"
        + "<script>\n" + data_js + "\n</script>\n"
        + "<script>\n" + cores + "\n</script>\n"
        + "<script>\n" + app + "</script>\n"
    )
    (DIST / "ch11-shop-scheduling.html").write_text(page, encoding="utf-8")
    preview = (
        "<!doctype html><html><head><meta charset=utf8>"
        "<meta name=viewport content=\"width=device-width,initial-scale=1,viewport-fit=cover\">"
        "<style>:root{color-scheme:light;box-sizing:border-box}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#faf9f5;color:#141413}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style>"
        "</head><body>\n" + page + "</body></html>\n"
    )
    (DIST / "preview.html").write_text(preview, encoding="utf-8")
    print("built", DIST / "ch11-shop-scheduling.html", len(page) // 1024, "KB")


if __name__ == "__main__":
    main()
