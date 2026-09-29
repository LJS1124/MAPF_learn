"""两层立体库的几何与行驶时间。

与第 1、2 章 Lab 的 warehouse.py 使用同一套规则，默认场景的代价矩阵与页面里的完全一致。

行驶规则（教学用的整数近似）：
- 主巷道每格 2 s，货道每格 3 s，顶升换向一次 5 s，提升机换层一次 30 s。
- 提升机在主巷道左端（x = -1），两层各有一个出入口。
- 空车可以从托盘下方穿过，不考虑车与车之间的冲突。
"""
from __future__ import annotations

import random
from dataclasses import dataclass
from typing import List, Tuple

import numpy as np

PARAMS = dict(aisle_s=2, lane_s=3, turn_s=5, lift_s=30, width=10, depth=5)
LIFT_X = -1


@dataclass(frozen=True)
class Spot:
    id: str
    floor: int
    x: int      # 货道编号 0..width-1
    y: int      # 0 = 主巷道，1..depth = 货道内的货位


def _same_floor(x1: int, y1: int, x2: int, y2: int, p=PARAMS) -> int:
    if x1 == x2:
        if y1 == y2:
            return 0
        if y1 == 0:
            return p["turn_s"] + y2 * p["lane_s"]
        if y2 == 0:
            return y1 * p["lane_s"]
        return abs(y1 - y2) * p["lane_s"]
    t = 0
    if y1 > 0:
        t += y1 * p["lane_s"] + p["turn_s"]
    t += abs(x1 - x2) * p["aisle_s"]
    if y2 > 0:
        t += p["turn_s"] + y2 * p["lane_s"]
    return t


def travel_time(v: Spot, t: Spot, p=PARAMS) -> int:
    """车 v 空驶到任务 t 的取货点需要的秒数。"""
    if v.floor == t.floor:
        return _same_floor(v.x, v.y, t.x, t.y, p)
    return (_same_floor(v.x, v.y, LIFT_X, 0, p)
            + abs(v.floor - t.floor) * p["lift_s"]
            + _same_floor(LIFT_X, 0, t.x, t.y, p))


def cost_matrix(vehicles: List[Spot], tasks: List[Spot], p=PARAMS) -> np.ndarray:
    return np.array([[travel_time(v, t, p) for t in tasks] for v in vehicles], dtype=float)


def default_scenario() -> Tuple[List[Spot], List[Spot]]:
    """第 2 章场景：第 1 章默认场景 + 备用车 V6（6 辆车，5 个任务）。"""
    vehicles = [Spot("V1", 1, 4, 3), Spot("V2", 1, 0, 0), Spot("V3", 1, 5, 3),
                Spot("V4", 2, 2, 5), Spot("V5", 2, 8, 0), Spot("V6", 1, 0, 3)]
    tasks = [Spot("T1", 1, 5, 1), Spot("T2", 2, 5, 4), Spot("T3", 1, 6, 5),
             Spot("T4", 2, 2, 2), Spot("T5", 2, 9, 1)]
    return vehicles, tasks


def default_costs() -> np.ndarray:
    v, t = default_scenario()
    return cost_matrix(v, t)


def random_scenario(seed: int, n_veh: int, n_task: int, p=PARAMS) -> Tuple[List[Spot], List[Spot]]:
    """可复现的随机两层场景：车 40% 概率停在主巷道，任务一定在货道里。"""
    rng = random.Random(seed)
    used = set()

    def place(is_task: bool) -> Tuple[int, int, int]:
        while True:
            f = rng.choice((1, 2))
            x = rng.randrange(p["width"])
            y = rng.randint(1, p["depth"]) if is_task or rng.random() < 0.6 else 0
            if (f, x, y) not in used:
                used.add((f, x, y))
                return f, x, y

    vehicles = [Spot(f"V{i + 1}", *place(False)) for i in range(n_veh)]
    tasks = [Spot(f"T{j + 1}", *place(True)) for j in range(n_task)]
    return vehicles, tasks
