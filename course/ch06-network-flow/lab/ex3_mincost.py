"""练习 3 · 最小费用流：逐次最短路（对应 6.4 节）

  min_cost_flow(n, arcs, s, t, k=None) -> dict
        {"value": 实际送出的流量, "cost": 总费用, "flow": 每条原弧上的流量, "pi": 势（长度 n）}
        k = None：送最大流量，费用最小；k = 整数：至多送 k 个单位（不够就送最大流）。
        费用可以为负，但保证没有负环。
  cost_curve(n, arcs, s, t) -> [f(0), f(1), ..., f(最大流)]，f(k) 是流量恰为 k 时的最小费用。

做法提示：
- 每轮在残量图上找 s 到 t 的最短路（回退弧的费用是 −cost），沿路推瓶颈流量。
- 用势让 Dijkstra 可用：约化成本 cost + pi[u] − pi[v] >= 0。费用有负数时，初始势用 Bellman–Ford 算。
  每轮结束后 pi[v] += dist[v]（可达的点）。这和第 5 章匈牙利算法里“涨价”是同一件事。
- 证书：返回的 pi 要满足：残量图里每条有残量的弧，约化成本都不小于 0。
  最省事的办法是在最后的残量图上，用虚拟源 + Bellman–Ford 重算一遍。
"""


def min_cost_flow(n, arcs, s, t, k=None):
    raise NotImplementedError("练习 3：逐次最短路")


def cost_curve(n, arcs, s, t):
    raise NotImplementedError("练习 3：费用曲线")
