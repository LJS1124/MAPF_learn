"""挑战 · 2-opt 局部搜索（对应 8.5 节）

给定一条回路（从仓库 0 开始的点顺序），反复做“反转一段”：选 1 <= i < j <= n−1，
把 tour[i..j] 反转，去掉弧 (tour[i−1], tour[i]) 和 (tour[j], tour[(j+1) mod n])，换成 (tour[i−1], tour[j]) 和 (tour[i], tour[(j+1) mod n])。

  two_opt(D, tour) -> {"tour": 最后的回路, "steps": 每一步的长度变化（都是负数）}
        规则（要严格照做，步数才和判分数据一致）：i 从 1、j 从 i+1 起按顺序扫描，遇到第一个长度变化 < 0 的就反转，
        然后回到 i = 1 重新扫描；一整遍都没有改进就停。
页面例子：从最近邻回路（290）出发，两步得到 262（steps = [-3, -25]），最优是 255。
"""


def two_opt(D, tour):
    raise NotImplementedError("挑战：2-opt")
