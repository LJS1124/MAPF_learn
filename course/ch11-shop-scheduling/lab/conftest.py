"""pytest 配置：把 lab 根目录放进 sys.path；跑完后把练习 1 的预测和实际结果并排列出来。"""
import os
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)


def pytest_terminal_summary(terminalreporter):
    try:
        from predictions import EXPECTED
        from labtarget import load
        ex1 = load("ex1_flow")
    except Exception:
        return
    pred = getattr(ex1, "PREDICTION", {})
    if not any(v is not None for v in pred.values()):
        return
    tr = terminalreporter
    tr.write_sep("=", "练习 1：你的预测 vs 实际")
    right = 0
    for name, (_, actual) in EXPECTED.items():
        p = pred.get(name)
        mark = "✓" if p == actual else "✗"
        right += p == actual
        tr.write_line(f"  {mark} {name:<12} 预测 {str(p):<6} 实际 {actual}")
    tr.write_line(f"  预测正确 {right} / {len(EXPECTED)}")
