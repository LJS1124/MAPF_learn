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

    check(page.locator("#fig1 .fig-body.gated").count() == 1, "图 11-1 起初被预测遮住")
    page.locator("#p1 .opts button").nth(1).click()
    check(page.locator("#fig1 .fig-body.gated").count() == 0, "图 11-1 解锁")
    page.locator("#fig1").scroll_into_view_if_needed()
    st = page.locator("#jsStats").inner_text()
    check("35" in st and "31" in st, f"原顺序 C_max=35：{st!r}")
    page.locator("#fig1").screenshot(path=str(OUT / "fig1-fifo.png"))
    page.locator("#jsPre button").nth(1).click()
    check("正是 Johnson 顺序" in page.locator("#jsFlags").inner_text() and "达到最优 31" in page.locator("#jsFlags").inner_text(), f"Johnson：31 最优：{page.locator('#jsFlags').inner_text()!r}")
    page.locator("#fig1").screenshot(path=str(OUT / "fig1-johnson.png"))
    page.locator("#jsPre button").nth(3).click()
    check("41" in page.locator("#jsStats").inner_text(), "最差顺序 41")
    page.locator("#jsChips button").nth(1).click()
    check("不是 Johnson" in page.locator("#jsFlags").inner_text(), "手动交换后不再是预置顺序")

    check(page.locator("#fig2 .fig-body.gated").count() == 1, "图 11-2 起初被预测遮住")
    page.locator("#p2 .opts button").nth(1).click()
    check(page.locator("#fig2 .fig-body.gated").count() == 0, "图 11-2 解锁")
    page.locator("#fig2").scroll_into_view_if_needed()
    page.click("#nhNext"); page.click("#nhNext")
    check("26" in page.locator("#nhStats").inner_text(), f"第 2 步部分顺序 C_max=26：{page.locator('#nhStats').inner_text()!r}")
    page.locator("#fig2").screenshot(path=str(OUT / "fig2-step.png"))
    page.click("#nhAll")
    check("44 / 42" in page.locator("#nhStats").inner_text() and "52" in page.locator("#nhStats").inner_text(), f"NEH 44、最优 42、原顺序 52：{page.locator('#nhStats').inner_text()!r}")
    check("21 个候选" in page.locator("#nhStats").inner_text().replace("只看了 ", "").replace("21 个候选", "21 个候选") or "21" in page.locator("#nhStats").inner_text(), "评价了 21 个候选")
    page.locator("#nhTable tr").nth(1).click()
    page.locator("#fig2").screenshot(path=str(OUT / "fig2-end.png"))

    check(page.locator("#fig3 .fig-body.gated").count() == 1, "图 11-3 起初被预测遮住")
    page.locator("#p3 .opts button").nth(2).click()
    check(page.locator("#fig3 .fig-body.gated").count() == 0, "图 11-3 解锁")
    page.locator("#fig3").scroll_into_view_if_needed()
    st = page.locator("#jgStats").inner_text()
    check("21" in st and "63 / 216" in st and "12" in st, f"作业车间 J1J2J3：21，63/216，下界 12：{st!r}")
    page.locator("#fig3").screenshot(path=str(OUT / "fig3-same.png"))
    page.locator("#jgPre button").nth(1).click()
    check("达到最优 13" in page.locator("#jgFlags").inner_text(), f"最优 13：{page.locator('#jgFlags').inner_text()!r}")
    page.locator("#fig3").screenshot(path=str(OUT / "fig3-best.png"))
    page.locator("#jgPre button").nth(2).click()
    check("不可行" in page.locator("#jgFlags").inner_text() and "有环" in page.locator("#jgSay").inner_text(), "有环的例子：不可行")
    page.locator("#fig3").screenshot(path=str(OUT / "fig3-cycle.png"))
    page.click("#jgRand")

    check(page.locator("#cmpTable tr").count() == 6, "对比表 5 行数据")
    check("8 × 8" in page.locator("#cmpTable").inner_text(), "对比表含 8 × 8")

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
