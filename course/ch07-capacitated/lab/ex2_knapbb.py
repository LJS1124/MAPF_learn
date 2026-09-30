"""练习 2 · 背包的分支定界（对应 7.2 节）

  knap_bb(v, w, cap) -> {"best": 最优价值, "take": 0/1 列表, "nodes": 创建的节点数}

规则（要严格照做，节点数才会和判分数据一致）：
- 深度优先。每个节点先用 knap_lp（练习 1）算上界。
- 节点数从 1 开始，每次调用 visit 计一个，包括随后被剪掉的节点。
- 上界是 -inf（超载）：这个节点作废。
- int(bound + 1e-9) <= 当前最好的整数解：剪枝（价值是整数，上界不到 best + 1 就没有希望）。
- LP 解没有分数变量：是整数解，更新 best 与 take。
- 否则在 LP 解里那个分数变量 f 上分支：先访问 x_f = 1（fixed[f] = 1），再访问 x_f = 0。
初始 best = 0。页面图 7-2 的例子应当得到 best = 104、nodes = 15。
"""
from labtarget import load  # noqa: F401


def knap_bb(v, w, cap):
    raise NotImplementedError("练习 2：分支定界")
