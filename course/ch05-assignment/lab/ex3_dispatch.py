"""练习 3 · 长方形、禁行、延后罚金（对应 5.6 节）

任务：包装 scipy.optimize.linear_sum_assignment，让它能处理真实派车里的三种情况。

    车比任务多       有些车闲着。（linear_sum_assignment 自己就支持）
    车比任务少       有的任务只能延后，延后要付罚金 penalty[j]。
    某些 (车, 任务) 不允许   电量不够、载重不符、够不着。allowed[i][j] = False

要求：
1. linear_sum_assignment 只能当黑盒用，并且不允许把 inf 或 nan 传进去。
2. 禁行边要用一个足够大的 M 表示，并且事后检查结果里有没有用到禁行边。
   M 取多大才安全？想一想：任何用到禁行边的派法，必须比任何合法派法都贵。
3. 无解时（没有合法派法）不能返回一个含 M 的“最优解”，而是返回 feasible=False，
   并给出 Hall 证书 hall = (S, N)：S 是一组任务，N 是这些任务全部可用的车（包含所有 allowed 的车），且 |N| < |S|。
4. penalty=None 表示所有任务都必须派车；给了 penalty（标量或长度 n 的数组），任务可以延后，
   延后的任务在 assign 里记为 None，total 里要加上它的罚金。

返回的 total = 派出去的任务的行驶成本 + 延后任务的罚金。
"""
from dataclasses import dataclass
from typing import List, Optional, Tuple

import numpy as np
from scipy.optimize import linear_sum_assignment  # noqa: F401  只能当黑盒


@dataclass
class Result:
    feasible: bool
    assign: List[Optional[int]]                  # assign[j] = 任务 j 的车；延后的任务为 None
    total: float                                 # 不可行时为 float("inf")
    deferred: List[int]                          # 被延后的任务下标
    hall: Optional[Tuple[frozenset, frozenset]]  # 不可行时的 (S, N)


def dispatch(C, allowed=None, penalty=None) -> Result:
    """C: (m, n) 行驶成本；allowed: (m, n) 布尔或 None（全部允许）；penalty: None / 标量 / 长度 n 的数组。"""
    raise NotImplementedError("练习 3：补零、补虚拟车、检查禁行边、给出 Hall 证书")
