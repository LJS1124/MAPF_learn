"""练习 4 · 把问题写成网络（对应 6.4、6.5 节）

  assignment_network(C)             -> (n_nodes, arcs, s, t)
        第 5 章的指派问题（m 辆车 × n 个任务，m >= n）写成网络：
        点 0 = 源，1..m = 车，m+1..m+n = 任务，m+n+1 = 汇；
        源→车、任务→汇 容量 1 费用 0；车→任务 容量 1 费用 C[i][j]。
        弧的顺序：先全部 源→车，再车→任务（先车后任务，i 外层 j 内层），最后 任务→汇。
  solve_assignment(C)               -> (总时间, assign)
        用练习 3 的 min_cost_flow（流量 n）求解，assign[j] 是任务 j 的车下标。
        默认场景应得到 124。
  split_nodes(n, arcs, s, t, node_cap) -> (n2, arcs2, s2, t2)
        点容量：提升机一次只能过 1 辆车，这是“点”的容量，网络流只认弧容量。
        办法是拆点：点 v 拆成入口 v 和出口 v+n，中间连一条容量为 node_cap[v] 的弧。
        原弧 (u, v) 变成 (u+n, v)；没在 node_cap 里的点容量不限（用 sum(容量)+1）。
        弧的顺序：先是原弧（顺序不变），再是拆点弧 (v, v+n)，v 从 0 到 n-1。
        新的源是 s+n（源点自己的出口），汇是 t（汇点自己的入口）。
"""
from labtarget import load  # noqa: F401


def assignment_network(C):
    raise NotImplementedError("练习 4：指派 = 最小费用流")


def solve_assignment(C):
    raise NotImplementedError("练习 4：用最小费用流解指派")


def split_nodes(n, arcs, s, t, node_cap):
    raise NotImplementedError("练习 4：拆点")
