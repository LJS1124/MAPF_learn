"""练习 2 参考答案。"""
from dataclasses import dataclass, field
from typing import List, Optional, Tuple

import numpy as np


@dataclass
class Insertion:
    task: int
    u0: float
    scan_order: List[int]
    radius: List[float]
    D: float
    chain: List[Tuple[int, Optional[int], int]] = field(default_factory=list)
    marginal: float = 0.0


class IncrementalAssignment:
    def __init__(self, C):
        self.C = np.asarray(C, dtype=float)
        self.m, self.n = self.C.shape
        assert self.m >= self.n, "车数必须不少于任务数"
        self.u = [0.0] * self.n
        self.v = [0.0] * self.m
        self.vehicle_of = [None] * self.n
        self.task_of = [None] * self.m
        self.arrived: List[int] = []
        self.scans = 0

    def total(self) -> float:
        return float(sum(self.C[self.vehicle_of[j]][j] for j in self.arrived))

    def insert(self, j0: int) -> Insertion:
        C, u, v, m = self.C, self.u, self.v, self.m
        before = self.total()
        u[j0] = min(C[i][j0] + v[i] for i in range(m))
        u0 = u[j0]
        d = [C[i][j0] + v[i] - u[j0] for i in range(m)]
        pred = [j0] * m
        scanned = [False] * m
        order: List[int] = []
        radius: List[float] = []
        while True:
            i_star = min((i for i in range(m) if not scanned[i]), key=lambda i: (d[i], i))
            r = d[i_star]
            scanned[i_star] = True
            order.append(i_star)
            radius.append(float(r))
            self.scans += 1
            jp = self.task_of[i_star]
            if jp is None:
                break
            for i in range(m):
                if not scanned[i]:
                    cand = r + (C[i][jp] + v[i] - u[jp])
                    if cand < d[i]:
                        d[i] = cand
                        pred[i] = jp
        D = d[i_star]
        for i, r in zip(order, radius):
            if i == i_star:
                continue
            v[i] += D - r
            u[self.task_of[i]] += D - r
        u[j0] += D
        chain: List[Tuple[int, Optional[int], int]] = []
        i = i_star
        while True:
            j = pred[i]
            prev = self.vehicle_of[j]
            chain.append((j, prev, i))
            self.vehicle_of[j] = i
            self.task_of[i] = j
            if j == j0:
                break
            i = prev
        chain.reverse()
        self.arrived.append(j0)
        return Insertion(task=j0, u0=float(u0), scan_order=order, radius=radius, D=float(D),
                         chain=chain, marginal=self.total() - before)
