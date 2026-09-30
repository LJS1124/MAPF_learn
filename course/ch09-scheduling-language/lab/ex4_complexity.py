"""练习 4 · 沿特例与推广推理复杂度（对应 9.5 节）

complexity_table.BASE 是一张已知结果表（状态：P 多项式、W 弱 NP 难、NP 强 NP 难）。

  classify(alpha, beta, gamma) -> (状态, 依据的表项)
        beta 是元组。规则：
        1. 表里有这一项：直接用它，依据就是它自己；
        2. 否则，表里有“它的特例”是 NP 或 W 的：它至少一样难。有 NP 项时状态取 'NP'，否则 'W'（依据取表里靠前的一项）；
        3. 否则，表里有“它是其特例”的 P 项：状态 'P'（依据取表里靠前的一项）；
        4. 否则 ('?', None)。
        “特例”用练习 3 的 is_special_case 判断。表项的依据写成 (α, β 元组, γ)。
"""
from complexity_table import BASE, BETA_ORDER  # noqa: F401
from labtarget import load  # noqa: F401


def classify(alpha, beta, gamma):
    raise NotImplementedError("练习 4：复杂度推理")
