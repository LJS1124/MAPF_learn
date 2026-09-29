"""单智能体搜索：普通 A* 与带约束的时空 A*（Space-Time A*）。"""
from __future__ import annotations

import heapq
from typing import Dict, List, Optional, Set, Tuple

from .grid import Grid, Loc


class ConstraintTable:
    """单个智能体需要遵守的约束。

    vertex:  {(loc, t)}            —— 时刻 t 不能位于 loc
    edge:    {(a, b, t)}           —— 不能在时刻 t-1 位于 a 且在时刻 t 位于 b
    static:  {loc: t0}             —— 从 t0 起 loc 被永久占用（用于优先级规划中
                                      “已完成的高优先级智能体停在终点”）
    """

    def __init__(self):
        self.vertex: Set[Tuple[Loc, int]] = set()
        self.edge: Set[Tuple[Loc, Loc, int]] = set()
        self.static: Dict[Loc, int] = {}

    def add_vertex(self, loc: Loc, t: int) -> None:
        self.vertex.add((loc, t))

    def add_edge(self, a: Loc, b: Loc, t: int) -> None:
        self.edge.add((a, b, t))

    def add_static(self, loc: Loc, t0: int) -> None:
        self.static[loc] = min(t0, self.static.get(loc, t0))

    def add_path(self, path: List[Loc]) -> None:
        """把另一条路径当作动态障碍（优先级规划使用）。"""
        for t, loc in enumerate(path):
            self.add_vertex(loc, t)
            if t > 0:
                self.add_edge(loc, path[t - 1], t)  # 禁止对穿（交换位置）
        self.add_static(path[-1], len(path) - 1)

    def vertex_blocked(self, loc: Loc, t: int) -> bool:
        return (loc, t) in self.vertex or (loc in self.static and t >= self.static[loc])

    def edge_blocked(self, a: Loc, b: Loc, t: int) -> bool:
        return (a, b, t) in self.edge

    def goal_free_time(self, goal: Loc) -> Optional[int]:
        """到达 goal 后可以永久停留的最早时刻；若 goal 被永久占用则返回 None。"""
        if goal in self.static:
            return None
        return max((t + 1 for (loc, t) in self.vertex if loc == goal), default=0)

    def horizon(self) -> int:
        ts = [t for _, t in self.vertex] + [t for *_, t in self.edge]
        ts += list(self.static.values())
        return max(ts, default=0)


def astar(grid: Grid, start: Loc, goal: Loc) -> Optional[List[Loc]]:
    """经典 A*（曼哈顿启发，无时间维度、无等待）。第 2 章使用。"""
    def h(p: Loc) -> int:
        return abs(p[0] - goal[0]) + abs(p[1] - goal[1])

    open_list = [(h(start), 0, start)]
    g: Dict[Loc, int] = {start: 0}
    parent: Dict[Loc, Optional[Loc]] = {start: None}
    closed: Set[Loc] = set()
    while open_list:
        _, cost, cur = heapq.heappop(open_list)
        if cur in closed:
            continue
        closed.add(cur)
        if cur == goal:
            path = []
            node: Optional[Loc] = cur
            while node is not None:
                path.append(node)
                node = parent[node]
            return path[::-1]
        for n in grid.neighbors(cur):
            ng = cost + 1
            if ng < g.get(n, float("inf")):
                g[n] = ng
                parent[n] = cur
                heapq.heappush(open_list, (ng + h(n), ng, n))
    return None


def space_time_astar(
    grid: Grid,
    start: Loc,
    goal: Loc,
    constraints: Optional[ConstraintTable] = None,
    h_table: Optional[Dict[Loc, int]] = None,
    max_time: Optional[int] = None,
) -> Optional[List[Loc]]:
    """在 (位置, 时间) 状态空间里搜索，动作 = 上下左右 + 原地等待。

    返回的路径 path[t] 是时刻 t 的位置，终点处已满足“之后不再被约束”。
    找不到（或超过 max_time）返回 None。
    """
    ct = constraints or ConstraintTable()
    h_table = h_table if h_table is not None else grid.bfs_distances(goal)
    if start not in h_table:
        return None
    goal_free = ct.goal_free_time(goal)
    if goal_free is None:
        return None
    if max_time is None:
        # 超过“最晚约束时刻 + 地图大小”仍无解，基本可以认为无解
        max_time = ct.horizon() + len(grid.free_cells()) + 1

    if ct.vertex_blocked(start, 0):
        return None

    counter = 0  # 打破平局，保证堆里不会比较到不可比的元素
    open_list = [(h_table[start], h_table[start], counter, start, 0)]
    parent: Dict[Tuple[Loc, int], Optional[Tuple[Loc, int]]] = {(start, 0): None}
    closed: Set[Tuple[Loc, int]] = set()

    while open_list:
        _, _, _, loc, t = heapq.heappop(open_list)
        if (loc, t) in closed:
            continue
        closed.add((loc, t))
        if loc == goal and t >= goal_free:
            path: List[Loc] = []
            node: Optional[Tuple[Loc, int]] = (loc, t)
            while node is not None:
                path.append(node[0])
                node = parent[node]
            return path[::-1]
        if t >= max_time:
            continue
        for n in grid.neighbors(loc) + [loc]:  # 邻居 + 原地等待
            key = (n, t + 1)
            if key in closed or n not in h_table:
                continue
            if ct.vertex_blocked(n, t + 1) or ct.edge_blocked(loc, n, t + 1):
                continue
            if key not in parent:
                parent[key] = (loc, t)
                counter += 1
                f = t + 1 + h_table[n]
                # 先比 f，再优先 h 小（更接近终点），最后按插入顺序
                heapq.heappush(open_list, (f, h_table[n], counter, n, t + 1))
    return None
