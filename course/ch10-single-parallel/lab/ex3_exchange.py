"""练习 3 · 交换论证（对应 10.1 节）

  swap_delta(p, w, seq, i, objective) -> 交换 seq 里位置 i 和 i+1 的两个作业以后，目标的变化量（新 − 旧）
        objective 取 'sumC'（ΣC_j）或 'sumwC'（Σw_jC_j）。答案与前面作业的开始时间无关，写成 p、w 的公式。
  bubble_path(p, w, d, seq, rule) -> (每次交换之后的顺序列表, 最后的顺序)
        rule 取 'SPT'、'WSPT'、'EDD'。每一步从左往右找第一个相邻对 (a, b)，如果 b 按规则应当严格排在 a 前面
        （SPT：p[b] < p[a]；WSPT：p[b]/w[b] < p[a]/w[a]，用 Fraction；EDD：d[b] < d[a]），就交换，然后重新从左找；
        没有这样的相邻对就停。

这就是交换论证的算法版：每次交换对“匹配的目标”都不会变差，交换到底得到的就是规则给出的顺序。
"""
from fractions import Fraction  # noqa: F401


def swap_delta(p, w, seq, i, objective):
    raise NotImplementedError("练习 3：相邻交换的变化量")


def bubble_path(p, w, d, seq, rule):
    raise NotImplementedError("练习 3：冒泡式交换")
