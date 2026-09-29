"""练习 2 · 增量匈牙利（对应 5.1、5.2、5.3 节）

任务：实现 IncrementalAssignment.insert(j)。任务一个个到达，每次到达都要把最优派法更新好，
并且返回这次插入的详细过程（扫描顺序、改派链、边际成本）。

记号（与第 2 章一致）：
    C[i][j]   车 i 到任务 j 的代价，m 行车，n 列任务，m >= n
    u[j]      任务价格（不限符号）；v[i] 车价格（>= 0）
    约化成本  r_ij = C[i][j] + v[i] - u[j]，始终 >= 0；紧边 = r_ij 为 0

不变量（每次 insert 结束后都必须成立，pytest 会逐项检查）：
    1. 价格可行：所有 r_ij >= 0（只看已到达的任务）
    2. 已配对的边是紧的
    3. 空闲的车价格为 0
    4. 当前派法对已到达的任务是最优的

一次 insert(j) 的规则（页面里图 5-2 的回放用的就是这套规则，请严格遵守，包括平局规则）：
    1. 初始价格   u[j] = min_i (C[i][j] + v[i])
    2. 标签       d[i] = C[i][j] + v[i] - u[j]，前驱 pred[i] = j
    3. 每一轮     在未扫描的车里取 d 最小的 i*（d 相同取编号小的），标记为已扫描，记下 (i*, d[i*])
    4. 若 i* 是空闲车：停止
       否则设 j' = i* 当前的任务，对每个未扫描的车 i：
           若 d[i*] + (C[i][j'] + v[i] - u[j']) < d[i]，就令 d[i] = 这个值，pred[i] = j'
    5. 停止后 D = d[i*]。对每个已扫描的、不是终点的车 i：
           v[i] += D - d[i]；它当前的任务 u += D - d[i]
       新任务 u[j] += D
    6. 从 i* 出发沿 pred 回溯：任务 pred[i*] 改派给 i*，它原来的车 i' 接着按 pred[i'] 回溯……直到回到新任务 j。
       chain 按“从新任务开始”的顺序记录 (任务, 原来的车 或 None, 新的车)。
    7. marginal = 插入后的总时间 - 插入前的总时间。

复杂度：每次 insert 最多扫描 m 辆车，每次扫描 O(m)，所以一次 insert 是 O(m²)，n 个任务共 O(n m²)。
"""
from dataclasses import dataclass, field
from typing import List, Optional, Tuple

import numpy as np


@dataclass
class Insertion:
    task: int
    u0: float                      # 新任务的初始价格
    scan_order: List[int]          # 被扫描的车，按扫描先后（包含最后那辆空闲车）
    radius: List[float]            # 每辆车被扫描时的 d 值，与 scan_order 对齐
    D: float                       # 最短增广路的长度 = 终点车被扫描时的 d
    chain: List[Tuple[int, Optional[int], int]] = field(default_factory=list)  # (任务, 原来的车/None, 新的车)
    marginal: float = 0.0          # 总时间增量


class IncrementalAssignment:
    def __init__(self, C):
        self.C = np.asarray(C, dtype=float)
        self.m, self.n = self.C.shape
        assert self.m >= self.n, "车数必须不少于任务数"
        self.u = [0.0] * self.n
        self.v = [0.0] * self.m
        self.vehicle_of = [None] * self.n    # 任务 -> 车
        self.task_of = [None] * self.m       # 车 -> 任务
        self.arrived: List[int] = []
        self.scans = 0                       # 累计扫描次数，用来看复杂度

    def total(self) -> float:
        return float(sum(self.C[self.vehicle_of[j]][j] for j in self.arrived))

    def insert(self, j: int) -> Insertion:
        raise NotImplementedError("练习 2：实现一次插入")
