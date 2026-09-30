"""练习 2 参考答案"""
from labtarget import load


def knap_bb(v, w, cap):
    lp = load("ex1_knapsack").knap_lp
    n = len(v)
    state = {"best": 0, "take": [0] * n, "nodes": 0}

    def visit(fixed):
        state["nodes"] += 1
        bound, x, frac = lp(v, w, cap, fixed)
        if bound == float("-inf"):
            return
        if int(bound + 1e-9) <= state["best"]:
            return
        if frac < 0:
            state["best"], state["take"] = round(bound), [round(t) for t in x]
            return
        f1 = fixed[:]
        f1[frac] = 1
        visit(f1)
        f0 = fixed[:]
        f0[frac] = 0
        visit(f0)

    visit([-1] * n)
    return {"best": state["best"], "take": state["take"], "nodes": state["nodes"]}
