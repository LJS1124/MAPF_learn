"""练习 4 · 覆盖割与根节点的割平面循环（对应 7.4 节）

每辆车的载重约束 Σ w_j x_ij <= Q_i 是一个背包约束。若任务集合 S 的总重量超过 Q_i（S 是一个“覆盖”），
则 S 里的任务不能全放进车 i：Σ_{j∈S} x_ij <= |S| − 1。S 是极小的覆盖（去掉任何一个就放得下）时，这条割最强。

  separate_cover(xrow, w, Qi, eps=1e-6) -> 违反的极小覆盖 S（下标从小到大的列表），没有则 None
        1. 把任务按 (−x, w, 下标) 排序，从前往后取，x < eps 就停；取到总重量 > Qi 为止。总重量放得下就返回 None。
        2. 按 (x, 下标) 从小到大试着去掉 S 里的任务：去掉之后总重量仍 > Qi 就去掉。
        3. Σ x_j（j∈S）> |S| − 1 + eps 才算违反，返回 sorted(S)；否则 None。
  cut_loop(C, w, Q, max_rounds=12) -> {"rounds": 每轮的 LP 值, "cuts": [(i, S, |S|-1), ...], "final": 最后一个 LP 值}
        每轮：解 LP（练习 3，带上目前的割）→ 记录值 → 对每辆车（下标从小到大）分离一条割，
        已经在 cuts 里的不重复加 → 没有新割就停。
页面的例子应当得到 rounds ≈ [220, 229, 233]，共 4 条割。
"""
from labtarget import load  # noqa: F401


def separate_cover(xrow, w, Qi, eps=1e-6):
    raise NotImplementedError("练习 4：分离覆盖割")


def cut_loop(C, w, Q, max_rounds=12):
    raise NotImplementedError("练习 4：割平面循环")
