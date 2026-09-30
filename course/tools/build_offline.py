"""把各章的页面片段做成可以直接离线阅读的文档，放进 course/offline/：

  chNN-xxx.html   完整的单文件网页（样式、脚本、数据全部内联，不请求任何外部资源；双击即可打开，仍然可交互）
  chNN-xxx.pdf    静态的 PDF（预测题与自测已展开答案，逐步回放的图停在最后一步，适合打印和手机阅读）

用法：
    python3 course/tools/build_offline.py            # 全部章节
    python3 course/tools/build_offline.py ch06       # 只做一章
需要：pip install playwright（浏览器用预装的 chromium）。先运行各章 page/build.py。
"""
import glob
import pathlib
import re
import sys

from playwright.sync_api import sync_playwright

COURSE = pathlib.Path(__file__).resolve().parent.parent
OUT = COURSE / "offline"
OUT.mkdir(exist_ok=True)

# 章 -> (页面片段, 生成 PDF 前要点击的按钮：让逐步回放的图停在有信息的位置)
CHAPTERS = {
    "ch05-assignment": ("ch05-assignment", ["#arrAll"]),
    "ch06-network-flow": ("ch06-network-flow", ["#spAll", "#mfAll", "#nmSeg button:nth-child(3)"]),
    "ch07-capacitated": ("ch07-capacitated", ["#btAll", "#cutAll"]),
}

PRINT_CSS = """
:root { color-scheme: light; }
body { background: #fff !important; }
.topbar, .toc, .gate-cover, .stepper, .btn, .foot .btn { display: none !important; }
.layout { display: block !important; }
main { max-width: none !important; padding: 0 !important; }
.page { padding: 0 !important; }
.fig, .thm, .callout, .predict, .qitem, .card, table, pre, .lab { break-inside: avoid; }
h2.sec { break-after: avoid; }
.fig.wide, .wide { max-width: none !important; }
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
"""


def chromium_path():
    c = glob.glob("/opt/pw-browsers/chromium-*/chrome-linux/chrome") + glob.glob("/opt/pw-browsers/chromium/chrome-linux/chrome")
    return c[0] if c else None


def offline_html(fragment: str) -> str:
    """补上 <html> 骨架；去掉字体的外部链接（离线时使用样式里写好的系统回退字体）。"""
    fragment = re.sub(r'<link[^>]+(fonts\.googleapis|fonts\.gstatic)[^>]*>\s*', "", fragment)
    return (
        '<!doctype html>\n<html lang="zh-CN"><head><meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
        "<style>:root{box-sizing:border-box}html{-webkit-text-size-adjust:100%}body{margin:0;padding:0;"
        "font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:var(--bg,#f6f8f9);color:var(--ink,#101922)}"
        "img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style>\n"
        "</head><body>\n" + fragment + "</body></html>\n"
    )


def main():
    want = sys.argv[1:]
    pw = sync_playwright().start()
    try:
        for name, (frag, clicks) in CHAPTERS.items():
            if want and not any(name.startswith(w) for w in want):
                continue
            src = COURSE / name / "page" / "dist" / f"{frag}.html"
            html = offline_html(src.read_text(encoding="utf-8"))
            dst = OUT / f"{name}.html"
            dst.write_text(html, encoding="utf-8")
            ext = re.findall(r'<(?:link|script|img)[^>]+(?:src|href)="(https?://[^"]+)"', html)
            assert not ext, ext      # 除了正文里的参考链接，不应有任何外部资源引用
            b = pw.chromium.launch(executable_path=chromium_path(), headless=True, args=["--no-sandbox"])
            page = b.new_context(viewport={"width": 1100, "height": 900}, color_scheme="light").new_page()
            reqs = []
            page.on("request", lambda r: reqs.append(r.url) if r.url.startswith("http") else None)
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.add_init_script("window.PRINT_MODE = true;")
            page.goto(dst.as_uri(), wait_until="load")
            page.wait_for_timeout(500)
            for sel in clicks:
                page.click(sel)
            page.evaluate("document.querySelectorAll('details').forEach(function (d) { d.open = true; })")
            page.emulate_media(media="print")
            page.add_style_tag(content=PRINT_CSS)
            page.wait_for_timeout(300)
            pdf = OUT / f"{name}.pdf"
            page.pdf(path=str(pdf), format="A4", print_background=True, margin={"top": "14mm", "bottom": "14mm", "left": "12mm", "right": "12mm"},
                     display_header_footer=True, header_template="<span></span>",
                     footer_template='<div style="font-size:9px;width:100%;text-align:center;color:#666"><span class="pageNumber"></span> / <span class="totalPages"></span></div>')
            print(f"{name}: html {dst.stat().st_size // 1024} KB, pdf {pdf.stat().st_size // 1024} KB; 外部请求: {len(reqs)} {reqs[:3]}; 脚本错误: {errors}")
            b.close()
    finally:
        pw.stop()


if __name__ == "__main__":
    main()
