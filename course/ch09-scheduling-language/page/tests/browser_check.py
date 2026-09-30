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

    check(page.locator("#fig1 .fig-body.gated").count() == 1, "图 9-1 起初被预测遮住")
    page.locator("#p1 .opts button").nth(1).click()
    check(page.locator("#fig1 .fig-body.gated").count() == 0, "图 9-1 解锁")
    page.locator("#fig1").scroll_into_view_if_needed()
    tb = page.locator("#jobMetrics").inner_text()
    check("84" in tb and "234" in tb and "18" in tb, f"各目标最优 84 / 234 / 18：{tb[:120]!r}")
    page.locator("#jobRules button").nth(1).click()
    sc = page.evaluate("document.querySelector('#jobMetrics tbody tr:nth-child(2)').innerText")
    check("84" in sc, f"SPT：ΣC = 84：{sc!r}")
    page.locator("#fig1").screenshot(path=str(OUT / "fig1-spt.png"))
    page.locator("#jobRules button").nth(3).click()
    lm = page.evaluate("document.querySelector('#jobMetrics tbody tr:nth-child(4)').innerText")
    check("7" in lm, f"EDD：Lmax = 7：{lm!r}")
    page.locator("#jobRules button").nth(4).click()
    check("1" in page.evaluate("document.querySelector('#jobMetrics tbody tr:nth-child(6)').innerText"), "Moore：ΣU = 1")
    page.locator("#jobSeq button").nth(1).click()
    check(page.evaluate("window.__fig1.rule") == "手动", "手动调整顺序")
    page.locator("#fig1").screenshot(path=str(OUT / "fig1-manual.png"))

    check(page.locator("#fig2 .fig-body.gated").count() == 1, "图 9-2 起初被预测遮住")
    page.locator("#p2 .opts button").nth(1).click()
    check(page.locator("#fig2 .fig-body.gated").count() == 0, "图 9-2 解锁")
    page.locator("#fig2").scroll_into_view_if_needed()
    st = page.locator("#envStats").inner_text()
    check("16" in st and "15" in st, f"P2 按编号：16，最优 15：{st!r}")
    page.locator("#fig2").screenshot(path=str(OUT / "fig2-P.png"))
    page.locator("#ordSeg button").nth(1).click()
    check("15" in page.locator("#envStats").inner_text(), "LPT：15")
    page.locator("#envSeg button").nth(3).click()
    st = page.locator("#envStats").inner_text()
    check("14" in st and "11" in st, f"R2 + LPT：14，最优 11：{st!r}")
    page.locator("#fig2").screenshot(path=str(OUT / "fig2-R.png"))

    check(page.locator("#fig3 .fig-body.gated").count() == 1, "图 9-3 起初被预测遮住")
    page.locator("#p3 .opts button").nth(0).click()
    check(page.locator("#fig3 .fig-body.gated").count() == 0, "图 9-3 解锁")
    page.locator("#fig3").scroll_into_view_if_needed()
    check("多项式" in page.locator("#notBadge").inner_text(), "默认 1 | | ΣC_j：多项式")
    page.locator("#notAlpha button").nth(4).click()
    check("多项式" in page.locator("#notBadge").inner_text() and "指派" in page.locator("#notWhy").inner_text(), f"R | | ΣC_j：多项式（指派）：{page.locator('#notWhy').inner_text()!r}")
    page.locator("#notGamma button").nth(0).click()
    check("NP 难" in page.locator("#notBadge").inner_text(), "R | | C_max：NP 难")
    page.locator("#notAlpha button").nth(0).click()
    page.locator("#notBeta button").nth(0).click()
    page.locator("#notGamma button").nth(3).click()
    check("NP 难" in page.locator("#notBadge").inner_text(), "1 | r_j | L_max：NP 难")
    page.locator("#fig3").screenshot(path=str(OUT / "fig3.png"))

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
