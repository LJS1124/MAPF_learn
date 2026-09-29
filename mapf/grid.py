"""四连通栅格地图与 MAPF 实例。坐标统一为 (row, col)。"""
from __future__ import annotations

import random
from dataclasses import dataclass
from typing import List, Sequence, Tuple

Loc = Tuple[int, int]
MOVES: Tuple[Loc, ...] = ((0, 1), (1, 0), (0, -1), (-1, 0))  # 右 下 左 上


class Grid:
    """栅格地图。'.' 为空地，'@' 或 'T' 为障碍（兼容 MovingAI .map 格式）。"""

    def __init__(self, rows: Sequence[str]):
        self.height = len(rows)
        self.width = len(rows[0]) if rows else 0
        if any(len(r) != self.width for r in rows):
            raise ValueError("地图每一行长度必须一致")
        self.blocked = [[c in "@T" for c in r] for r in rows]

    @classmethod
    def from_file(cls, path: str) -> "Grid":
        """读取 MovingAI 格式（type/height/width/map 头）或纯字符地图。"""
        with open(path, encoding="utf-8") as f:
            lines = [ln.rstrip("\n") for ln in f]
        if lines and lines[0].startswith("type"):
            idx = next(i for i, ln in enumerate(lines) if ln.strip() == "map")
            lines = lines[idx + 1:]
        return cls([ln for ln in lines if ln])

    def passable(self, loc: Loc) -> bool:
        r, c = loc
        return 0 <= r < self.height and 0 <= c < self.width and not self.blocked[r][c]

    def neighbors(self, loc: Loc) -> List[Loc]:
        """不含“原地等待”的可移动邻居。"""
        r, c = loc
        out = []
        for dr, dc in MOVES:
            n = (r + dr, c + dc)
            if self.passable(n):
                out.append(n)
        return out

    def free_cells(self) -> List[Loc]:
        return [(r, c) for r in range(self.height) for c in range(self.width)
                if not self.blocked[r][c]]

    def bfs_distances(self, goal: Loc) -> dict:
        """从 goal 出发的真实最短距离表，用作 A* 的精确启发函数。"""
        from collections import deque
        dist = {goal: 0}
        q = deque([goal])
        while q:
            cur = q.popleft()
            for n in self.neighbors(cur):
                if n not in dist:
                    dist[n] = dist[cur] + 1
                    q.append(n)
        return dist


@dataclass
class Instance:
    grid: Grid
    starts: List[Loc]
    goals: List[Loc]

    @property
    def num_agents(self) -> int:
        return len(self.starts)


def random_instance(grid: Grid, num_agents: int, seed: int = 0) -> Instance:
    """随机生成起点/终点互不重复的实例（不保证可解，仅保证各自连通）。"""
    rng = random.Random(seed)
    cells = grid.free_cells()
    if 2 * num_agents > len(cells):
        raise ValueError("智能体过多，空地不足")
    for _ in range(1000):
        starts = rng.sample(cells, num_agents)
        goals = rng.sample(cells, num_agents)
        if all(g in grid.bfs_distances(s) for s, g in zip(starts, goals)):
            return Instance(grid, starts, goals)
    raise RuntimeError("无法生成连通的实例")
