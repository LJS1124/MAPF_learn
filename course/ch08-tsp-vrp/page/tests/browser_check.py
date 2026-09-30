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

    check(page.locator("#fig1 .fig-body.gated").count() == 1, "图 8-1 起初被预测遮住")
    page.locator("#p1 .opts button").nth(2).click()
    check(page.locator("#fig1 .fig-body.gated").count() == 0, "图 8-1 解锁")
    page.locator("#fig1").scroll_into_view_if_needed()
    st = page.locator("#tspStats").inner_text()
    check("198" in st and "255" in st and "4" in st, f"指派松弛 198、最优 255、4 个回路：{st!r}")
    page.locator("#fig1").screenshot(path=str(OUT / "fig1-assign.png"))
    seg(page, "tspMode", 1)
    check("255" in page.locator("#tspSay").inner_text() and "57" in page.locator("#tspSay").inner_text(), "最优回路 255，差 57")
    page.locator("#fig1").screenshot(path=str(OUT / "fig1-opt.png"))

    page.locator("#fig2").scroll_into_view_if_needed()
    check("198" in page.locator("#secSay").inner_text(), "第 1 轮 198")
    page.locator("#fig2").screenshot(path=str(OUT / "fig2-1.png"))
    page.click("#secNext"); page.click("#secNext")
    check("235" in page.locator("#secSay").inner_text(), "第 3 轮 235")
    page.click("#secAll")
    say = page.locator("#secSay").inner_text()
    check("255" in say and "6 条" in say and "247" in say, f"最后：255，6 条 / 247 条：{say[:80]!r}")
    page.locator("#fig2").screenshot(path=str(OUT / "fig2-4.png"))

    check(page.locator("#fig3 .fig-body.gated").count() == 1, "图 8-3 起初被预测遮住")
    page.locator("#p2 .opts button").nth(0).click()
    check(page.locator("#fig3 .fig-body.gated").count() == 0, "图 8-3 解锁")
    page.locator("#fig3").scroll_into_view_if_needed()
    tb = page.locator("#bndTable").inner_text()
    check("203.25" in tb and "198" in tb and "255" in tb, f"m=8：198 / 203.25 / 255：{tb!r}")
    page.locator("#fig3").screenshot(path=str(OUT / "fig3-8.png"))
    slide(page, "bndM", 4)
    tb = page.locator("#bndTable").inner_text()
    check("168" in tb and "170" in tb and "211" in tb, f"m=4：168 / 170 / 211：{tb!r}")
    slide(page, "bndM", 8)

    check(page.locator("#fig4 .fig-body.gated").count() == 1, "图 8-4 起初被预测遮住")
    page.locator("#p3 .opts button").nth(2).click()
    check(page.locator("#fig4 .fig-body.gated").count() == 0, "图 8-4 解锁")
    page.locator("#fig4").scroll_into_view_if_needed()
    st = page.locator("#vrpStats").inner_text()
    check("360" in st and "255" in st, f"最优 360，单车 255：{st!r}")
    page.locator("#fig4").screenshot(path=str(OUT / "fig4-opt.png"))
    seg(page, "vrpMode", 1)
    check("419" in page.locator("#vrpStats").inner_text() and "59" in page.locator("#vrpSay").inner_text(), "扫描法 419，多 59")
    page.locator("#fig4").screenshot(path=str(OUT / "fig4-sweep.png"))

    page.locator("#fig5").scroll_into_view_if_needed()
    check("290" in page.locator("#optStats").inner_text(), "最近邻 290")
    page.click("#optNext"); page.click("#optNext")
    check("262" in page.locator("#optStats").inner_text(), "2-opt 两步：262")
    page.locator("#fig5").screenshot(path=str(OUT / "fig5-2opt.png"))
    page.click("#optNext")
    check("255" in page.locator("#optStats").inner_text() and "最优" in page.locator("#optSay").inner_text(), "最后一张：最优 255")

    page.locator("#quiz .qopts button").first.click()
    check(page.locator("#quiz .qx").count() == 1, "自测答题后出现解析")
    real = [e for e in errors if "ERR_FAILED" not in e[1] and "net::" not in e[1]]
    check(not real, f"交互后没有控制台错误 {real[:3]}")
    page.screenshot(path=str(OUT / "full.png"), full_page=True)
    b.close()

    for width, scheme in ((400, "light"), (1280, "dark"), (400, "dark")):
        b, ctx, page, errors = run(width, scheme)
        page.screenshot(path=str(OUT / f"top-{width}-{scheme}.png"))
        for pid, fid in (("p1", "fig1"), ("p2", "fig3"), ("p3", "fig4")):
            page.locator(f"#{pid} .opts button").nth(0).click()
            page.locator(f"#{fid}").scroll_into_view_if_needed()
            page.locator(f"#{fid}").screenshot(path=str(OUT / f"{fid}-{width}-{scheme}.png"))
        for fid in ("fig2", "fig5"):
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
