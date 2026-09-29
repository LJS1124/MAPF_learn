"""在无头 Chromium 里加载页面，操作每个图的控件，检查数字、控制台错误和横向溢出，并截图。

用法：python3 page/tests/browser_check.py [输出目录]
需要：pip install playwright（浏览器用预装的 /opt/pw-browsers 里的 chromium）
"""
import glob
import json
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


def run(width, scheme, shots):
    b = PW.chromium.launch(executable_path=chromium_path(), headless=True, args=["--no-sandbox"])
    ctx = b.new_context(viewport={"width": width, "height": 900}, color_scheme=scheme)
    page = ctx.new_page()
    errors = []
    page.on("console", lambda m: errors.append(("console." + m.type, m.text)) if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: errors.append(("pageerror", str(e))))
    page.route(re.compile(r"https://fonts\.(googleapis|gstatic)\.com/.*"), lambda r: r.abort())
    page.goto(PAGE.as_uri(), wait_until="domcontentloaded")
    page.wait_for_timeout(600)
    tag = f"{width}-{scheme}"
    print(f"== {tag}")
    errs = [e for e in errors if "ERR_FAILED" not in e[1] and "net::" not in e[1]]
    check(not errs, f"没有控制台错误 {errs[:3]}")
    sw = page.evaluate("document.documentElement.scrollWidth"), page.evaluate("window.innerWidth")
    check(sw[0] <= sw[1] + 1, f"没有横向溢出 scrollWidth={sw[0]} innerWidth={sw[1]}")
    if shots:
        for sec in ("s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"):
            page.evaluate(f"document.getElementById('{sec}').scrollIntoView()")
            page.wait_for_timeout(120)
        page.evaluate("window.scrollTo(0,0)")
    return b, ctx, page, errors


def main():
    # ------------------------------------------------------------------ 桌面：功能检查
    b, ctx, page, errors = run(1280, "light", True)
    page.screenshot(path=str(OUT / "hero.png"))

    # 图 5-1：先预测 → 解锁 → 下一个到达
    check(page.locator("#fig1 .fig-body.gated").count() == 1, "图 5-1 起初被预测遮住")
    page.locator("#p1 .opts button").nth(2).click()
    check(page.locator("#fig1 .fig-body.gated").count() == 0, "答完预测后图 5-1 解锁")
    check("+54 s" in page.locator("#p1").inner_text() or "54" in page.locator("#p1 .res").inner_text(), "预测解析里有 54 s")
    check(page.locator("#arrTable tbody tr").count() == 6, "到达表 5 行 + 合计")
    check("T5" in page.locator("#arrTxt").inner_text(), "初始状态：下一个是 T5")
    page.click("#arrNext")
    txt = page.locator("#chainBox").inner_text()
    check("改派链" in txt and "54" in txt and "T2" in txt and "T3" in txt, f"T5 到达的改派链含 T2、T3 与 54 s：{txt[:60]!r}")
    stats = page.locator("#arrStats").inner_text()
    check("124" in stats and "144" in stats, f"到达完成后：最优 124、不改派 144：{stats!r}")
    page.locator("#fig1").scroll_into_view_if_needed()
    page.locator("#fig1").screenshot(path=str(OUT / "fig1.png"))
    # 换顺序
    page.locator("#ordSeg button").nth(1).click()
    check(page.locator("#arrTable tbody tr").count() == 6, "换到达顺序后表仍完整")
    tot = page.locator("#arrTable tbody tr.tot").inner_text()
    check("124" in tot, f"任何顺序总和都是 124：{tot!r}")
    page.locator("#btnRandom").click()
    check(page.locator("#arrTable tbody tr").count() == 6, "随机场景可用")
    page.locator("#btnReset").click()

    # 图 5-2：回放
    page.locator("#fig2").scroll_into_view_if_needed()
    check(page.locator("#insTable tbody tr").count() == 6, "车表 6 行")
    steps = 0
    while page.locator("#insNext").is_enabled():
        page.click("#insNext"); steps += 1
    say = page.locator("#insSay").inner_text()
    check(steps == 6 and "54" in say and "44" in say, f"T5 回放共 6 步，末步含 D=44 与 54：steps={steps}")
    page.locator("#fig2").screenshot(path=str(OUT / "fig2.png"))
    page.locator("#insSeg button").nth(0).click()
    check(page.locator("#insNext").is_enabled(), "切到 T1 后可重新回放")

    # 图 5-3
    page.locator("#fig3").scroll_into_view_if_needed()
    check(page.locator("#cxChart circle").count() == 12, "复杂度图 12 个点")
    check("51,360" in page.locator("#cxNote").inner_text() or "51,360" in page.locator("#cxNote").inner_html(), "乘积矩阵 n=320 扫描 51,360 次")
    page.locator("#cxMetric button").nth(1).click()
    page.click("#cxRerun")
    check(page.locator("#cxChart circle").count() == 12, "换种子重跑后仍是 12 个点")
    check(page.locator("#timeTable tbody tr").count() == 4, "耗时表 4 行")
    page.locator("#fig3").screenshot(path=str(OUT / "fig3.png"))

    # 图 5-4
    page.locator("#p2 .opts button").nth(1).click()
    check(page.locator("#fig4 .fig-body.gated").count() == 0, "图 5-4 解锁")
    want = {"不加": "全单模", "共享名额": "全单模", "重叠名额": "不是全单模", "冲突对": "不是全单模", "同车冲突": "全单模", "三边冲突": "不是全单模", "奇圈": "不是全单模"}
    for k, label in enumerate(want):
        page.locator("#tuSeg button").nth(k).click()
        msg = page.locator("#tuMsg").inner_text()
        ok = (msg.startswith("全单模") if want[label] == "全单模" else msg.startswith("不是全单模"))
        check(ok, f"检查器 {label}：{msg[:14]!r}")
    page.locator("#tuSeg button").nth(3).click()
    check("(1/2, 1/2, 1/2)" in page.locator("#tuMsg").inner_text(), "冲突对的反例解是 (1/2, 1/2, 1/2)")
    check("11,439" in page.locator("#tuHead").inner_text(), "冲突对矩阵共 11,439 个方子式")
    page.locator("#fig4").scroll_into_view_if_needed()
    page.locator("#fig4").screenshot(path=str(OUT / "fig4.png"))
    check(page.locator("#tuNoteLp").inner_text().strip() != "", "段末提示的 LP 值已填")

    # 图 5-5
    page.locator("#fig5").scroll_into_view_if_needed()
    say = page.locator("#cfSay").inner_text()
    check("128" in page.locator("#cfStats").inner_text() and "132" in page.locator("#cfStats").inner_text(), "默认冲突对：LP 128、整数 132")
    check("50%" in say, "LP 解拆成两个 50% 的派法")
    page.locator("#cfPre button").nth(2).click()
    check("整数" in page.locator("#cfStats").inner_text() and page.locator("#cfMtx td.frac").count() == 0, "第三个预设 LP 是整数")
    page.locator("#cfPre button").nth(0).click()
    page.evaluate("document.getElementById('cfLam').value = 4; document.getElementById('cfLam').dispatchEvent(new Event('input'))")
    check("128" in page.locator("#cfLagNote").inner_text(), "λ=4 时 L=128")
    page.locator("#fig5").screenshot(path=str(OUT / "fig5a.png"))
    page.locator("#lpTabs button").nth(1).click()
    check("15" in page.locator("#triStats").inner_text() and "10" in page.locator("#triStats").inner_text(), "三角形：LP 15、整数 10")
    page.check("#triCut")
    check("整数" in page.locator("#triStats").inner_text(), "加奇集割后 LP 变整数")
    page.uncheck("#triCut")
    page.locator("#fig5").screenshot(path=str(OUT / "fig5b.png"))

    # 图 5-6
    page.locator("#fig6").scroll_into_view_if_needed()
    check(page.locator("#wkTable tbody tr").count() == 5, "延后表 5 行")
    page.evaluate("document.getElementById('wkP').value = 60; document.getElementById('wkP').dispatchEvent(new Event('input'))")
    page.locator("#wkVeh button").nth(4).click()
    page.locator("#wkVeh button").nth(5).click()
    check("延后" in page.locator("#wkTable").inner_text(), "关掉 V5、V6 后有任务被延后")
    page.locator("#fig6").screenshot(path=str(OUT / "fig6a.png"))
    page.locator("#wkTabs button").nth(1).click()
    page.locator("#fbPre button").nth(1).click()
    good = page.locator("#fbGood").inner_text()
    naive = page.locator("#fbNaive").inner_text()
    check("无解" in good and "T2" in good and "V4" in good, f"无提升机：Hall 证书含 T2、V4：{good[:50]!r}")
    check("1,000,057" in naive, f"“1e6 写法”得到 1,000,057：{naive[:70]!r}")
    page.locator("#fig6").screenshot(path=str(OUT / "fig6b.png"))

    # 图 5-7
    page.locator("#p3 .opts button").nth(2).click()
    check(page.locator("#fig7 .fig-body.gated").count() == 0, "图 5-7 解锁")
    page.locator("#fig7").scroll_into_view_if_needed()
    check(page.locator("#bnTable tbody tr").count() == 3, "帕累托阶梯 3 级")
    page.click("#bnBest")
    check("146" in page.locator("#bnSay").inner_text(), "τ=49：总时间 146")
    idx = page.evaluate("parseInt(document.getElementById('bnTau').value)")
    page.evaluate(f"document.getElementById('bnTau').value = {idx - 1}; document.getElementById('bnTau').dispatchEvent(new Event('input'))")
    say = page.locator("#bnSay").inner_text()
    check("无解" in say and "T2" in say and "T4" in say and "T5" in say, f"τ=48：无解，Hall 证书 {{T2,T4,T5}}：{say[:60]!r}")
    page.locator("#fig7").screenshot(path=str(OUT / "fig7.png"))
    page.click("#bnFree")

    # 自测
    page.locator("#quiz .qopts button").first.click()
    check(page.locator("#quiz .qx").count() == 1, "自测答题后出现解析")

    real = [e for e in errors if "ERR_FAILED" not in e[1] and "net::" not in e[1]]
    check(not real, f"交互后没有控制台错误 {real[:3]}")
    page.screenshot(path=str(OUT / "full-top.png"), full_page=False)
    page.screenshot(path=str(OUT / "full.png"), full_page=True)
    b.close()

    # ------------------------------------------------------------------ 手机宽度与深色
    for width, scheme in ((400, "light"), (1280, "dark"), (400, "dark")):
        b, ctx, page, errors = run(width, scheme, False)
        page.screenshot(path=str(OUT / f"top-{width}-{scheme}.png"))
        page.evaluate("document.getElementById('s2').scrollIntoView()")
        page.locator("#p1 .opts button").nth(0).click()
        page.locator("#fig1").scroll_into_view_if_needed()
        page.locator("#fig1").screenshot(path=str(OUT / f"fig1-{width}-{scheme}.png"))
        page.locator("#fig4").scroll_into_view_if_needed()
        page.locator("#p2 .opts button").nth(0).click()
        page.locator("#fig4").screenshot(path=str(OUT / f"fig4-{width}-{scheme}.png"))
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
