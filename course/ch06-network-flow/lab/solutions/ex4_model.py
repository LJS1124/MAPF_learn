"""练习 4 参考答案：把问题写成网络"""
from labtarget import load


def assignment_network(C):
    """m 辆车（行）× n 个任务（列）。点：0 = 源，1..m = 车，m+1..m+n = 任务，m+n+1 = 汇。
    返回 (n_nodes, arcs, s, t)；最小费用流（流量 n）的费用就是最优总时间。"""
    m, n = len(C), len(C[0])
    s, t = 0, m + n + 1
    arcs = [(s, 1 + i, 1, 0) for i in range(m)]
    arcs += [(1 + i, m + 1 + j, 1, C[i][j]) for i in range(m) for j in range(n)]
    arcs += [(m + 1 + j, t, 1, 0) for j in range(n)]
    return m + n + 2, arcs, s, t


def solve_assignment(C):
    """返回 (总时间, assign)，assign[j] 是任务 j 的车（下标）。"""
    mcf = load("ex3_mincost").min_cost_flow
    m, n = len(C), len(C[0])
    N, arcs, s, t = assignment_network(C)
    r = mcf(N, arcs, s, t, n)
    assign = [None] * n
    for e, (u, v, _, _) in enumerate(arcs):
        if 1 <= u <= m and m + 1 <= v <= m + n and r["flow"][e] > 0.5:
            assign[v - m - 1] = u - 1
    return r["cost"], assign


def split_nodes(n, arcs, s, t, node_cap):
    """点容量：node_cap = {v: 容量}。把点 v 拆成 v（入）和 v+n（出），中间加一条容量为 node_cap[v] 的弧。
    没有列在 node_cap 里的点容量不限。返回 (2n, arcs2, s_out, t_in)：原弧 (u, v) 变成 (u+n, v)（从 u 的出口到 v 的入口）。
    弧的顺序：先是原弧（顺序不变），再是拆点弧 v→v+n（按 v 从小到大）。"""
    BIG = sum(a[2] for a in arcs) + 1
    arcs2 = [(u + n, v, c, w) for (u, v, c, w) in arcs]
    arcs2 += [(v, v + n, node_cap.get(v, BIG), 0) for v in range(n)]
    return 2 * n, arcs2, s + n, t
