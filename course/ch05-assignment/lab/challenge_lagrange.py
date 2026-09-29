"""挑战 · 冲突对的拉格朗日下界（对应 5.5 节）

给指派加一条冲突约束：两条边 e1 = (车 i1, 任务 j1)、e2 = (车 i2, 任务 j2) 不能同时被选，
即 x[e1] + x[e2] <= 1。加了这一行以后，LP 可能出现分数解，整数最优也比原来大。

把这条约束乘以价格 λ >= 0 吸收进目标（第 2 章的拉格朗日松弛）：
    L(λ) = min_派法 [ 总时间 + λ (x[e1] + x[e2] - 1) ]
         = (把 e1、e2 两条边的代价各加 λ 之后的指派最优值) - λ
每个 L(λ) 都是这个问题的下界；最好的下界 max_{λ>=0} L(λ) 等于这个问题的 LP 值。

任务：实现 conflict_bound(C, e1, e2)，返回 (λ*, L(λ*))。
要求：
- 每个 L(λ) 只用“解一次普通指派”来算（可以用 scipy 的 linear_sum_assignment，不要用 linprog）。
- L 是凹的分段线性函数，每一段的斜率只可能是 -1、0、+1（想一想为什么），
  所以可以在 λ 上二分：看当前最优派法里 e1、e2 出现了几条，就知道往哪边走。
- 测试用 scipy.optimize.linprog 解带这一行的 LP 作参照，要求两者的值相差不超过 1e-6。
"""
import numpy as np  # noqa: F401
from scipy.optimize import linear_sum_assignment  # noqa: F401


def conflict_bound(C, e1, e2):
    """C: (m, n) 代价；e1、e2: (车, 任务)，两条边的车和任务都互不相同。返回 (lam_star, L_value)。"""
    raise NotImplementedError("挑战：在 λ 上二分")
