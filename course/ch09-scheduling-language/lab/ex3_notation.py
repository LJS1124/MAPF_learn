"""练习 3 · 三段式记号（对应 9.2、9.5 节）

  parse(s) -> (α, β 元组, γ)；不合法返回 None
        例：'P2 | r_j, prec | Σ w_j C_j' -> ('P2', ('r', 'prec'), 'sumwC')
        α 取 1、P2、P、Q、R、F2、F、J2、J、O2、O（Pm、Qm…这种带 m 的写法记为 P、Q…）。
        β 元素：r_j→'r'，prec→'prec'，prmp→'prmp'，d_j→'d'，s_jk→'s'（忽略下划线、花括号和大小写）；按 complexity_table.BETA_ORDER 排序、去重。
        γ：Cmax、Lmax（不分大小写）；ΣCj→'sumC'，ΣwjCj→'sumwC'，ΣTj→'sumT'，ΣwjTj→'sumwT'，ΣUj→'sumU'，ΣwjUj→'sumwU'
        （忽略空格、下划线、花括号；∑ 与 Σ 等同）。恰好要有三段，用 | 分开；第二段可以为空。
  is_special_case(p1, p2) -> bool
        p1、p2 是 parse 的结果。p1 是 p2 的特例吗？条件：
        α：沿 complexity_table.A_EDGES 的边（可传递，含自身）；γ：沿 G_EDGES（可传递，含自身）；
        β：p1 的约束是 p2 的子集；并且 prmp 必须两边都有或都没有（可中断不能比较难易）。
"""
import re  # noqa: F401

from complexity_table import A_EDGES, BETA_ORDER, G_EDGES  # noqa: F401


def parse(s):
    raise NotImplementedError("练习 3：解析")


def is_special_case(p1, p2):
    raise NotImplementedError("练习 3：特例关系")
