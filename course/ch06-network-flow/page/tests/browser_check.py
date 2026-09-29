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


def main():
    b, ctx, page, errors = run(1280, "light")
    page.screenshot(path=str(OUT / "hero.png"))

    # ---- 图 6-1
    check(page.locator("#fig1 .fig-body.gated").count() == 1, "图 6-1 起初被预测遮住")
    page.locator("#p1 .opts button").nth(2).click()
    check(page.locator("#fig1 .fig-body.gated").count() == 0, "答完预测后图 6-1 解锁")
    seg(page, "spKind", 1)
    page.click("#spAll")
    say = page.locator("#spSay").inner_text()
    tab = page.locator("#spTable").inner_text()
    check("答案不对" in say and "T（7，应为 6）" in say, f"负权版本 Dijkstra：T=7 应为 6：{say[-60:]!r}")
    check("正确值" in tab, "表里出现“正确值”一列")
    page.locator("#fig1").scroll_into_view_if_needed()
    page.locator("#fig1").screenshot(path=str(OUT / "fig1-dij-neg.png"))
    seg(page, "spAlgo", 1)
    page.click("#spAll")
    check("检查通过" in page.locator("#spSay").inner_text() and "6" in page.locator("#spSay").inner_text(), "Bellman–Ford：检查通过，距离 6")
    seg(page, "spKind", 2)
    page.click("#spAll")
    check("负环" in page.locator("#spSay").inner_text() and "−2" in page.locator("#spSay").inner_text(), "负环版本：Bellman–Ford 报出总费用 −2")
    page.locator("#fig1").screenshot(path=str(OUT / "fig1-bf-cycle.png"))
    seg(page, "spAlgo", 2)
    page.click("#spAll")
    check("发现负环" in page.locator("#spSay").inner_text(), "负环版本：Johnson 拒绝")
    seg(page, "spKind", 1)
    page.click("#spAll")
    check("还原" in page.locator("#spSay").inner_text() and "6" in page.locator("#spSay").inner_text(), "Johnson（负权版本）：还原后距离 6")
    page.locator("#fig1").screenshot(path=str(OUT / "fig1-johnson.png"))
    seg(page, "spKind", 0)
    seg(page, "spAlgo", 0)
    page.click("#spAll")
    check("7" in page.locator("#spSay").inner_text() and "结束" in page.locator("#spSay").inner_text(), "原网络 Dijkstra：距离 7")

    # ---- 图 6-2
    check(page.locator("#fig2 .fig-body.gated").count() == 1, "图 6-2 起初被预测遮住")
    page.locator("#p2 .opts button").nth(1).click()
    check(page.locator("#fig2 .fig-body.gated").count() == 0, "图 6-2 解锁")
    page.locator("#fig2").scroll_into_view_if_needed()
    check("4 次增广" in page.locator("#mfFlags").inner_text() and "8 次增广" in page.locator("#mfFlags").inner_text(), f"BFS 4 次、DFS 8 次：{page.locator('#mfFlags').inner_text()!r}")
    page.click("#mfAll")
    say = page.locator("#mfSay").inner_text()
    check("12" in say and "a→c" in say and "b→c" in say, f"最小割 12：{say[:80]!r}")
    page.locator("#fig2").screenshot(path=str(OUT / "fig2-cut.png"))
    seg(page, "mfRule", 1)
    seg(page, "mfView", 1)
    page.locator("#mfTable tbody tr").nth(1).click()
    check("回退弧" in page.locator("#mfSay").inner_text(), "DFS 第 2 次增广用了回退弧")
    page.locator("#fig2").screenshot(path=str(OUT / "fig2-dfs.png"))

    # ---- 图 6-3
    page.locator("#fig3").scroll_into_view_if_needed()
    page.evaluate("var s=document.getElementById('mcK'); s.value=12; s.dispatchEvent(new Event('input'))")
    stats = page.locator("#mcStats").inner_text()
    check("100" in stats, f"k=12 总费用 100：{stats!r}")
    page.evaluate("var s=document.getElementById('mcK'); s.value=5; s.dispatchEvent(new Event('input'))")
    stats = page.locator("#mcStats").inner_text()
    check("36" in stats and "8" in stats, f"k=5 总费用 36、边际 8：{stats!r}")
    check("LP 的解全是整数" in page.locator("#mcFlags").inner_text(), "LP 解是整数")
    page.check("#mcH")
    page.locator("#fig3").screenshot(path=str(OUT / "fig3.png"))

    # ---- 图 6-4
    check(page.locator("#fig4 .fig-body.gated").count() == 1, "图 6-4 起初被预测遮住")
    page.locator("#p3 .opts button").nth(1).click()
    check(page.locator("#fig4 .fig-body.gated").count() == 0, "图 6-4 解锁")
    page.locator("#fig4").scroll_into_view_if_needed()
    check("8,007" in page.locator("#nmHead").inner_text() or "8007" in page.locator("#nmHead").inner_text(), f"方子式 8007 个：{page.locator('#nmHead').inner_text()!r}")
    check("全单模" in page.locator("#nmMsg").inner_text(), "不加行：全单模")
    seg(page, "nmSeg", 1)
    check("全单模" in page.locator("#nmMsg").inner_text() and "19,447" in page.locator("#nmHead").inner_text(), "点 c 的容量：仍全单模")
    seg(page, "nmSeg", 2)
    check("不是全单模" in page.locator("#nmMsg").inner_text(), "串联弧共限额：不是全单模")
    stats = page.locator("#nmStats").inner_text()
    check("7.5" in stats and "8" in stats, f"k=1 LP 7.5、整数 8：{stats!r}")
    page.locator("#fig4").screenshot(path=str(OUT / "fig4.png"))
    page.evaluate("var s=document.getElementById('nmK'); s.value=5; s.dispatchEvent(new Event('input'))")
    check("整数最优" in page.locator("#nmSay").inner_text() and "42" in page.locator("#nmSay").inner_text(), "k=5 时 LP 值与整数最优相同（42）")

    # ---- 图 6-5
    page.locator("#fig5").scroll_into_view_if_needed()
    stats = page.locator("#mcStats").nth(1).inner_text() if page.locator("#mcStats").count() > 1 else ""
    fig5 = page.locator("#fig5").inner_text()
    check("无解" in fig5 and "6" in fig5, f"LP 6、整数无解：{fig5[:60]!r}")
    page.locator("#xcSel button").nth(0).click()
    page.locator("#xcSel .chips button, #xcSel button").nth(2).click()
    page.locator("#fig5").screenshot(path=str(OUT / "fig5-int.png"))
    page.check("#xcTwo")
    check("4" in page.locator("#fig5 .statrow").inner_text(), "只留两个商品：LP = 整数 = 4")
    page.uncheck("#xcTwo")
    seg(page, "xcMode", 0)
    page.locator("#fig5").screenshot(path=str(OUT / "fig5-lp.png"))

    # ---- 自测
    page.locator("#quiz .qopts button").first.click()
    check(page.locator("#quiz .qx").count() == 1, "自测答题后出现解析")
    real = [e for e in errors if "ERR_FAILED" not in e[1] and "net::" not in e[1]]
    check(not real, f"交互后没有控制台错误 {real[:3]}")
    page.screenshot(path=str(OUT / "full.png"), full_page=True)
    b.close()

    for width, scheme in ((400, "light"), (1280, "dark"), (400, "dark")):
        b, ctx, page, errors = run(width, scheme)
        page.screenshot(path=str(OUT / f"top-{width}-{scheme}.png"))
        for pid, fid in (("p1", "fig1"), ("p2", "fig2"), ("p3", "fig4")):
            page.locator(f"#{pid} .opts button").nth(0).click()
            page.locator(f"#{fid}").scroll_into_view_if_needed()
            page.locator(f"#{fid}").screenshot(path=str(OUT / f"{fid}-{width}-{scheme}.png"))
        page.locator("#fig5").scroll_into_view_if_needed()
        page.locator("#fig5").screenshot(path=str(OUT / f"fig5-{width}-{scheme}.png"))
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
