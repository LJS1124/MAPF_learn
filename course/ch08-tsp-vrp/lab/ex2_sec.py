"""练习 2 · 子回路消除：用最大流分离，根节点的割平面循环（对应 8.2 节）

模型（有向）：x_ij ∈ [0, 1]，每个点出度 = 入度 = 1，再加子回路约束：
    对不含仓库的点集 S：Σ_{i∈S, j∈S, i≠j} x_ij <= |S| − 1
子集有指数多个，所以不一次写完，而是需要时再加（惰性约束）。

  separate_sec(x, eps=1e-6) -> [S, ...]
        x 是 n×n 的（可能带分数的）解。对每个 t = 1..n−1，用 helpers.maxflow_to(x, 0, t) 求仓库到 t 的最大流；
        流量 < 1 − eps 说明有被违反的子回路约束，S = 返回的汇侧点集去掉仓库；|S| >= 2 才算，重复的 S 只留一个。
        返回按 (|S|, S) 排序的列表。
  cut_loop(D, max_rounds=30) -> {"rounds": 每轮 LP 值, "secs": 加入的全部 S, "final": 最后一个 LP 值}
        每轮：解 LP（目前所有的 S）→ 记录值 → separate_sec → 没有新的 S 就停，否则加入。
        LP 可以用 scipy.optimize.linprog，变量是 n(n−1) 条弧。

判分：最后的 LP 值必须等于“加入全部子回路约束”的 LP 值（与路径无关的唯一值）；下界只增不减；
分离出的约束远少于全部子集。
"""
import numpy as np  # noqa: F401
from scipy.optimize import linprog  # noqa: F401

from helpers import maxflow_to  # noqa: F401


def separate_sec(x, eps=1e-6):
    raise NotImplementedError("练习 2：分离子回路约束")


def cut_loop(D, max_rounds=30):
    raise NotImplementedError("练习 2：割平面循环")
