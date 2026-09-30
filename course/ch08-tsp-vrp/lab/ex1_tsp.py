"""练习 1 · 旅行商的精确解与指派松弛（对应 8.1 节）

点 0 是仓库，D 是 n×n 的距离矩阵。

  held_karp(D) -> (最短回路长度, 回路)
        动态规划：dp[集合][最后一个点] = 从仓库出发走遍这个集合、停在这个点的最短路程。O(n² 2ⁿ)。
        回路是点的顺序 [0, ...]，不重复写回仓库。n = 1 时返回 (0, [0])。
  assignment_relaxation(D) -> (值, succ)
        只保留“每个点恰有一条出弧、一条入弧”的松弛，就是第 5 章的指派问题（对角线不许选）。
        succ[i] 是点 i 的后继。可以用 scipy.optimize.linear_sum_assignment。
  find_subtours(succ) -> 回路列表
        把后继数组拆成回路，每个回路从它最小的点开始，回路按各自最小的点排序。

先填 PREDICTION（题目见 predictions.py），再动手。跑完 pytest 之后，终端最后会把预测和实际结果并排列出来。
"""
import numpy as np  # noqa: F401
from scipy.optimize import linear_sum_assignment  # noqa: F401

PREDICTION = {
    "assign_lower": None,        # "YES" / "NO"
    "assign_one_tour": None,     # "YES" / "NO"
    "sec_integral": None,        # "YES" / "NO"
    "mtz_stronger": None,        # "YES" / "NO"
}


def held_karp(D):
    raise NotImplementedError("练习 1：Held–Karp")


def assignment_relaxation(D):
    raise NotImplementedError("练习 1：指派松弛")


def find_subtours(succ):
    raise NotImplementedError("练习 1：拆回路")
