"""练习 1 · 最短路：Dijkstra、Bellman–Ford、Johnson（对应 6.1–6.2 节）

网络用 (n, arcs) 表示：n 个点（0..n-1），arcs 是 (u, v, cap, cost) 元组的列表。本练习只用 cost。
没有路的点，距离记为 network.INF（float("inf")）。

  dijkstra(n, arcs, s)       -> (dist, pred)
        用数组版（每轮扫一遍找最小标签，不用堆）。已确定的点不再改。
        遇到负费用的弧，抛出 ValueError（不要悄悄给一个错的数）。
        pred[v] 是最短路上进入 v 的那条弧的下标，起点和不可达点是 -1。
  bellman_ford(n, arcs, s)   -> (dist, pred, neg_cycle)
        最多 n-1 轮松弛所有弧；再扫一遍，还能松弛就说明从 s 可达一个负环：
        沿 pred 回走 n 步一定落在环上，把环上的点按前进方向列出来作为 neg_cycle（点的列表）。
        没有负环时 neg_cycle 是 None。
  johnson(n, arcs, s)        -> (dist, h)
        加一个连到所有点、费用为 0 的虚拟源，用 Bellman–Ford 算势 h；
        每条弧的费用改成 cost + h[u] − h[v]（应当 >= 0），再 Dijkstra，最后还原距离。
        图里有负环时返回 (None, None)。
  path_to(arcs, pred, t)     -> 最短路上的弧下标列表（从起点到 t 的顺序）

先填 PREDICTION 再动手。取值 "RIGHT" 或 "WRONG"。
跑完 pytest 之后，终端最后会把你的预测和实际结果并排列出来。
"""
from network import INF  # noqa: F401

PREDICTION = {
    "dijkstra_neg": None,
    "bellman_neg": None,
    "johnson_neg": None,
    "dijkstra_negcycle": None,
}


def dijkstra(n, arcs, s):
    raise NotImplementedError("练习 1：Dijkstra")


def bellman_ford(n, arcs, s):
    raise NotImplementedError("练习 1：Bellman–Ford + 负环")


def johnson(n, arcs, s):
    raise NotImplementedError("练习 1：Johnson")


def path_to(arcs, pred, t):
    raise NotImplementedError("练习 1：还原路径")
