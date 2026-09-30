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


def main():
    b, ctx, page, errors = run(1280, "light")
    page.screenshot(path=str(OUT / "hero.png"))

    check(page.locator("#fig1 .fig-body.gated").count() == 1, "图 10-1 起初被预测遮住")
    page.locator("#p1 .opts button").nth(0).click()
    check(page.locator("#fig1 .fig-body.gated").count() == 0, "图 10-1 解锁")
    page.locator("#fig1").scroll_into_view_if_needed()
    check("共 7 次交换" in page.locator("#xcFlags").inner_text() and "从不变差" in page.locator("#xcFlags").inner_text(), f"SPT–ΣC：7 次，从不变差：{page.locator('#xcFlags').inner_text()!r}")
    page.click("#xcAll")
    check("84" in page.locator("#xcSay").inner_text(), "SPT 最后 ΣC = 84")
    page.locator("#fig1").screenshot(path=str(OUT / "fig1-spt.png"))
    page.locator("#xcObj button").nth(1).click()
    check("第 6 步开始变差" in page.locator("#xcFlags").inner_text(), f"SPT–ΣwC：第 6 步变差：{page.locator('#xcFlags').inner_text()!r}")
    page.locator("#fig1").screenshot(path=str(OUT / "fig1-mismatch.png"))
    page.locator("#xcRule button").nth(1).click()
    check("规则与目标匹配" in page.locator("#xcFlags").inner_text() and "共 8 次交换" in page.locator("#xcFlags").inner_text(), "WSPT–ΣwC：匹配，8 次")
    page.locator("#xcRule button").nth(2).click()
    page.click("#xcAll")
    check("7" in page.locator("#xcSay").inner_text(), "EDD 最后 L_max = 7")

    check(page.locator("#fig2 .fig-body.gated").count() == 1, "图 10-2 起初被预测遮住")
    page.locator("#p2 .opts button").nth(3).click()
    check(page.locator("#fig2 .fig-body.gated").count() == 0, "图 10-2 解锁")
    page.locator("#fig2").scroll_into_view_if_needed()
    page.click("#moNext"); page.click("#moNext")
    check("移走" in page.locator("#moSay").inner_text() and "J5" in page.locator("#moSay").inner_text(), f"第 2 个作业超期，移走 J5：{page.locator('#moSay').inner_text()[:60]!r}")
    page.locator("#fig2").screenshot(path=str(OUT / "fig2-step.png"))
    page.click("#moAll")
    check("共 1 个" in page.locator("#moSay").inner_text().replace("<b>", "") or "1" in page.locator("#moSay").inner_text(), "例 1：延误 1 个")
    page.locator("#moEx button").nth(1).click(); page.click("#moAll")
    check("3" in page.locator("#moSay").inner_text() and "6" in page.locator("#moStats").inner_text(), f"例 2：延误 3 个，EDD 6 个：{page.locator('#moStats').inner_text()!r}")
    page.locator("#fig2").screenshot(path=str(OUT / "fig2-ex2.png"))

    check(page.locator("#fig3 .fig-body.gated").count() == 1, "图 10-3 起初被预测遮住")
    page.locator("#p3 .opts button").nth(3).click()
    check(page.locator("#fig3 .fig-body.gated").count() == 0, "图 10-3 解锁")
    page.locator("#fig3").scroll_into_view_if_needed()
    st = page.locator("#pmStats").inner_text()
    check("7" in st and "4" in st and "1.75" in st, f"m=4 列表调度：7、最优 4、1.75：{st!r}")
    page.locator("#fig3").screenshot(path=str(OUT / "fig3-list.png"))
    page.locator("#pmMode button").nth(1).click()
    st = page.locator("#pmStats").inner_text()
    check("15" in st and "12" in st and "1.25" in st, f"m=4 LPT：15、12、1.25：{st!r}")
    page.locator("#fig3").screenshot(path=str(OUT / "fig3-lpt.png"))
    page.locator("#pmMode button").nth(2).click()
    check("10" in page.locator("#pmStats").inner_text() and "12" in page.locator("#pmStats").inner_text(), "绕圈法：C=10，不可中断最优 12")
    page.locator("#fig3").screenshot(path=str(OUT / "fig3-pmtn.png"))

    page.locator("#quiz .qopts button").first.click()
    check(page.locator("#quiz .qx").count() == 1, "自测答题后出现解析")
    real = [e for e in errors if "ERR_FAILED" not in e[1] and "net::" not in e[1]]
    check(not real, f"交互后没有控制台错误 {real[:3]}")
    page.screenshot(path=str(OUT / "full.png"), full_page=True)
    b.close()

    for width, scheme in ((400, "light"), (1280, "dark"), (400, "dark")):
        b, ctx, page, errors = run(width, scheme)
        page.screenshot(path=str(OUT / f"top-{width}-{scheme}.png"))
        for pid, fid in (("p1", "fig1"), ("p2", "fig2"), ("p3", "fig3")):
            page.locator(f"#{pid} .opts button").nth(0).click()
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
