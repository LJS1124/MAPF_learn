"""练习 1 · 单机上的目标函数（对应 9.1、9.3 节）

作业 j 有加工时间 p[j]、权重 w[j]、交货期 d[j]、释放时间 r[j]。一台机器，作业按 seq 的顺序加工，不能中断，
不能在 r[j] 之前开始，机器空闲时要等（开始时间 = max(上一个作业的完工时间, r[j])）。

  evaluate(p, w, d, r, seq) -> dict，键：
        Cmax 最大完工时间；sumC 完工时间之和；sumwC 加权完工时间之和；
        Lmax 最大延迟 max(C_j − d_j)（可为负）；sumT 延误时间之和 Σ max(0, C_j − d_j)；
        sumU 延误作业个数；sumwU 延误作业的权重之和。
  best_by(p, w, d, r) -> {目标: (最小值, 取得最小值的第一个顺序)}
        枚举全部顺序（itertools.permutations 的字典序，严格更小才更新）。n <= 7 够用。

先填 PREDICTION（题目见 predictions.py），再动手。跑完 pytest 之后，终端最后会把预测和实际结果并排列出来。
"""
import itertools  # noqa: F401

KEYS = ["Cmax", "sumC", "sumwC", "Lmax", "sumT", "sumU", "sumwU"]

PREDICTION = {
    "cmax_order": None,      # "YES" / "NO"
    "spt_lmax": None,        # "YES" / "NO"
    "rj_hard": None,         # "YES" / "NO"
    "p2_cmax": None,         # "YES" / "NO"
}


def evaluate(p, w, d, r, seq):
    raise NotImplementedError("练习 1：评估一个顺序")


def best_by(p, w, d, r):
    raise NotImplementedError("练习 1：枚举各目标的最优")
