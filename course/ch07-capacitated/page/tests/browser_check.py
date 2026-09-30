"""在无头 Chromium 里加载页面，操作每个图的控件，检查数字、控制台错误和横向溢出，并截图。

用法：python3 page/tests/browser_check.py [输出目录]
需要：pip install playwright（浏览器用预装的 /opt/pw-browsers 里的 chromium）
"""
import glob
import pathlib
import re
import sys

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGE = ROOT / "dist" / "preview.html"
OUT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "dist" / "shots"
OUT.mkdir(parents=True, exist_ok=True)

problems = []


def check(cond, msg):
    if not cond:
        problems.append(msg)
        print("  ✗", msg)
    else:
        print("  ✓", msg)


def chromium_path():
    c = glob.glob("/opt/pw-browsers/chromium-*/chrome-linux/chrome") + glob.glob("/opt/pw-browsers/chromium/chrome-linux/chrome")
    return c[0] if c else None


PW = None


def run(width, scheme):
    b = PW.chromium.launch(executable_path=chromium_path(), headless=True, args=["--no-sandbox"])
    ctx = b.new_context(viewport={"width": width, "height": 900}, color_scheme=scheme)
    page = ctx.new_page()
    errors = []
    page.on("console", lambda m: errors.append(("console." + m.type, m.text)) if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: errors.append(("pageerror", str(e))))
    page.route(re.compile(r"https://fonts\.(googleapis|gstatic)\.com/.*"), lambda r: r.abort())
    page.goto(PAGE.as_uri(), wait_until="domcontentloaded")
    page.wait_for_timeout(600)
    print(f"== {width}-{scheme}")
    errs = [e for e in errors if "ERR_FAILED" not in e[1] and "net::" not in e[1]]
    check(not errs, f"没有控制台错误 {errs[:3]}")
    sw = page.evaluate("document.documentElement.scrollWidth"), page.evaluate("window.innerWidth")
    check(sw[0] <= sw[1] + 1, f"没有横向溢出 scrollWidth={sw[0]} innerWidth={sw[1]}")
    return b, ctx, page, errors


def seg(page, sid, n):
    page.locator(f"#{sid} button").nth(n).click()


def slide(page, sid, v):
    page.evaluate(f"var s=document.getElementById('{sid}'); s.value={v}; s.dispatchEvent(new Event('input'))")


def main():
    b, ctx, page, errors = run(1280, "light")
    page.screenshot(path=str(OUT / "hero.png"))

    check(page.locator("#fig1 .fig-body.gated").count() == 1, "图 7-1 起初被预测遮住")
    page.locator("#p1 .opts button").nth(2).click()
    check(page.locator("#fig1 .fig-body.gated").count() == 0, "图 7-1 解锁")
    page.locator("#fig1").scroll_into_view_if_needed()
    st = page.locator("#kbStats").inner_text()
    check("106.86" in st and "104" in st, f"载重 22：LP 106.86、最优 104：{st!r}")
    page.locator("#fig1").screenshot(path=str(OUT / "fig1-22.png"))
    slide(page, "kbCap", 26)
    st = page.locator("#kbStats").inner_text()
    check("112.57" in st and "111" in st, f"载重 26：LP 112.57、最优 111：{st!r}")
    slide(page, "kbCap", 20)
    check("没有分数变量" in page.locator("#kbSay").inner_text(), "载重 20：没有分数变量")

    page.locator("#fig2").scroll_into_view_if_needed()
    check("全部 15 个" in page.locator("#btFlags").inner_text(), "树共 15 个节点")
    page.click("#btAll")
    check("整数解" in page.locator("#btSay").inner_text() and "104" in page.locator("#btSay").inner_text(), "最后一个节点是价值 104 的整数解")
    page.locator("#fig2").screenshot(path=str(OUT / "fig2.png"))
    page.click("#btReset"); page.click("#btNext"); page.click("#btNext")
    check("装 T6" in page.locator("#btSay").inner_text() or "T6" in page.locator("#btSay").inner_text(), "第 2 个节点的决定含 T6")

    page.locator("#fig3").scroll_into_view_if_needed()
    st = page.locator("#gapStats").inner_text()
    check("220" in st and "234" in st, f"默认载重：LP 220、整数 234：{st!r}")
    page.locator("#fig3").screenshot(path=str(OUT / "fig3-0.png"))
    slide(page, "gapD", 2)
    st = page.locator("#gapStats").inner_text()
    check("212" in st and "回来" in page.locator("#gapSay").inner_text(), f"载重 +2：LP = 整数 = 212：{st!r}")
    slide(page, "gapD", -3)
    check("无解" in page.locator("#gapStats").inner_text(), "载重 −3：无解")
    slide(page, "gapD", 0)

    check(page.locator("#fig4 .fig-body.gated").count() == 1, "图 7-4 起初被预测遮住")
    page.locator("#p2 .opts button").nth(2).click()
    check(page.locator("#fig4 .fig-body.gated").count() == 0, "图 7-4 解锁")
    page.locator("#fig4").scroll_into_view_if_needed()
    fl = page.locator("#cutFlags").inner_text()
    check("55" in fl and "23" in fl, f"节点数 55 → 23：{fl!r}")
    page.click("#cutNext")
    check("229" in page.locator("#cutSay").inner_text(), "第 2 轮 LP 229")
    page.click("#cutAll")
    check("233" in page.locator("#cutSay").inner_text() and "再也找不到" in page.locator("#cutSay").inner_text(), "最后一轮：233，找不到更多割")
    page.locator("#fig4").screenshot(path=str(OUT / "fig4.png"))

    check(page.locator("#fig5 .fig-body.gated").count() == 1, "图 7-5 起初被预测遮住")
    page.locator("#p3 .opts button").nth(1).click()
    check(page.locator("#fig5 .fig-body.gated").count() == 0, "图 7-5 解锁")
    page.locator("#fig5").scroll_into_view_if_needed()
    st = page.locator("#binStats").inner_text()
    check("4" in st and "3" in st, f"FFD 4、最优 3：{st!r}")
    page.locator("#fig5").screenshot(path=str(OUT / "fig5-ffd.png"))
    seg(page, "binMode", 1)
    page.locator("#fig5").screenshot(path=str(OUT / "fig5-opt.png"))
    seg(page, "binEx", 1)
    check("5" in page.locator("#binStats").inner_text(), "例 2：FFD 5")

    page.locator("#quiz .qopts button").first.click()
    check(page.locator("#quiz .qx").count() == 1, "自测答题后出现解析")
    real = [e for e in errors if "ERR_FAILED" not in e[1] and "net::" not in e[1]]
    check(not real, f"交互后没有控制台错误 {real[:3]}")
    page.screenshot(path=str(OUT / "full.png"), full_page=True)
    b.close()

    for width, scheme in ((400, "light"), (1280, "dark"), (400, "dark")):
        b, ctx, page, errors = run(width, scheme)
        page.screenshot(path=str(OUT / f"top-{width}-{scheme}.png"))
        for pid, fid in (("p1", "fig1"), ("p2", "fig4"), ("p3", "fig5")):
            page.locator(f"#{pid} .opts button").nth(0).click()
            page.locator(f"#{fid}").scroll_into_view_if_needed()
            page.locator(f"#{fid}").screenshot(path=str(OUT / f"{fid}-{width}-{scheme}.png"))
        for fid in ("fig2", "fig3"):
            page.locator(f"#{fid}").scroll_into_view_if_needed()
            page.locator(f"#{fid}").screenshot(path=str(OUT / f"{fid}-{width}-{scheme}.png"))
        b.close()

    print("\n问题数：", len(problems))
    for m in problems:
        print(" -", m)
    return 1 if problems else 0


if __name__ == "__main__":
    PW = sync_playwright().start()
    try:
        code = main()
    finally:
        PW.stop()
    sys.exit(code)
