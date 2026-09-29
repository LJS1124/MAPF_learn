"""冲突搜索 CBS（Conflict-Based Search, Sharon et al. 2015）——完备且最优（SOC）。"""
from __future__ import annotations

import heapq
import itertools
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

from .astar import ConstraintTable, space_time_astar
from .grid import Instance
from .utils import Path, find_conflicts, sum_of_costs


@dataclass
class CTNode:
    """约束树（Constraint Tree）节点。"""
    constraints: Dict[int, ConstraintTable]  # agent -> 该智能体的约束
    paths: List[Path]
    cost: int = 0
    n_conflicts: int = 0


def _copy_ct(ct: ConstraintTable) -> ConstraintTable:
    new = ConstraintTable()
    new.vertex, new.edge, new.static = set(ct.vertex), set(ct.edge), dict(ct.static)
    return new


def _split(conflict) -> List[Tuple[int, str, tuple]]:
    """把一个冲突拆成两条互斥的约束：(agent, 类型, 参数)。"""
    kind, i, j, where, t = conflict
    if kind == "vertex":
        return [(i, "vertex", (where, t)), (j, "vertex", (where, t))]
    a, b = where  # i: a->b，j: b->a
    return [(i, "edge", (a, b, t)), (j, "edge", (b, a, t))]


def cbs(instance: Instance, max_nodes: int = 100_000) -> Optional[List[Path]]:
    """返回 SOC 最优解；无解或超出 max_nodes 返回 None。"""
    grid = instance.grid
    h_tables = [grid.bfs_distances(g) for g in instance.goals]  # 每个智能体只算一次

    def plan(i: int, ct: ConstraintTable) -> Optional[Path]:
        return space_time_astar(grid, instance.starts[i], instance.goals[i], ct, h_tables[i])

    # 根节点：每个智能体各走各的最短路，不考虑彼此
    constraints = {i: ConstraintTable() for i in range(instance.num_agents)}
    paths = []
    for i in range(instance.num_agents):
        p = plan(i, constraints[i])
        if p is None:
            return None
        paths.append(p)
    root = CTNode(constraints, paths, sum_of_costs(paths), len(find_conflicts(paths)))

    tie = itertools.count()
    # 优先队列：先比总代价，再比冲突数（更少更优先），最后插入顺序
    open_list = [(root.cost, root.n_conflicts, next(tie), root)]
    expanded = 0
    while open_list:
        _, _, _, node = heapq.heappop(open_list)
        conflicts = find_conflicts(node.paths, first_only=True)
        if not conflicts:
            return node.paths  # 第一个被弹出的无冲突节点即最优解
        expanded += 1
        if expanded > max_nodes:
            return None
        for agent, kind, args in _split(conflicts[0]):
            new_cons = dict(node.constraints)
            ct = _copy_ct(node.constraints[agent])
            (ct.add_vertex if kind == "vertex" else ct.add_edge)(*args)
            new_cons[agent] = ct
            new_path = plan(agent, ct)
            if new_path is None:
                continue  # 该分支无解，剪掉
            new_paths = list(node.paths)
            new_paths[agent] = new_path
            child = CTNode(new_cons, new_paths, sum_of_costs(new_paths),
                           len(find_conflicts(new_paths)))
            heapq.heappush(open_list, (child.cost, child.n_conflicts, next(tie), child))
    return None
