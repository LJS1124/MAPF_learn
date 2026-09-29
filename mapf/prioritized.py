"""优先级规划（Prioritized Planning, Silver 2005）：按顺序逐个规划，后者避让前者。"""
from __future__ import annotations

from typing import List, Optional, Sequence

from .astar import ConstraintTable, space_time_astar
from .grid import Instance
from .utils import Path


def prioritized_planning(instance: Instance,
                         order: Optional[Sequence[int]] = None) -> Optional[List[Path]]:
    """快速、不完备、不最优。任何一个智能体规划失败就整体返回 None。"""
    order = list(order) if order is not None else list(range(instance.num_agents))
    paths: List[Optional[Path]] = [None] * instance.num_agents
    ct = ConstraintTable()  # 所有已规划路径累积成同一张约束表
    for i in order:
        path = space_time_astar(instance.grid, instance.starts[i], instance.goals[i], ct)
        if path is None:
            return None
        paths[i] = path
        ct.add_path(path)
    return paths  # type: ignore[return-value]
