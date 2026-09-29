"""解的度量、冲突检测与合法性校验。"""
from __future__ import annotations

from typing import List, Optional, Tuple

from .grid import Instance, Loc

Path = List[Loc]


def location_at(path: Path, t: int) -> Loc:
    """t 超过路径长度后，智能体停在终点（“到达后停留”模型）。"""
    return path[min(t, len(path) - 1)]


def sum_of_costs(paths: List[Path]) -> int:
    """SOC：各智能体到达终点的时间之和（路径长度 - 1）。"""
    return sum(len(p) - 1 for p in paths)


def makespan(paths: List[Path]) -> int:
    """最后一个智能体到达终点的时间。"""
    return max(len(p) - 1 for p in paths)


# 冲突：("vertex", i, j, loc, t) 或 ("edge", i, j, (a, b), t)
# 其中 edge 冲突表示 i 在 t-1→t 走 a→b，同时 j 走 b→a。
Conflict = Tuple[str, int, int, object, int]


def find_conflicts(paths: List[Path], first_only: bool = False) -> List[Conflict]:
    out: List[Conflict] = []
    horizon = max(len(p) for p in paths)
    for t in range(horizon):
        for i in range(len(paths)):
            for j in range(i + 1, len(paths)):
                a, b = location_at(paths[i], t), location_at(paths[j], t)
                if a == b:
                    out.append(("vertex", i, j, a, t))
                    if first_only:
                        return out
                if t > 0:
                    pa, pb = location_at(paths[i], t - 1), location_at(paths[j], t - 1)
                    if a == pb and b == pa and a != b:
                        out.append(("edge", i, j, (pa, a), t))
                        if first_only:
                            return out
    return out


def validate(instance: Instance, paths: Optional[List[Path]]) -> Tuple[bool, str]:
    """检查一组路径是否是合法解，返回 (是否合法, 原因)。"""
    if paths is None:
        return False, "无解"
    if len(paths) != instance.num_agents:
        return False, "路径数量与智能体数量不一致"
    g = instance.grid
    for i, p in enumerate(paths):
        if p[0] != instance.starts[i] or p[-1] != instance.goals[i]:
            return False, f"智能体 {i} 起点或终点不对"
        for t, loc in enumerate(p):
            if not g.passable(loc):
                return False, f"智能体 {i} 在 t={t} 穿过障碍"
            if t > 0:
                d = abs(loc[0] - p[t - 1][0]) + abs(loc[1] - p[t - 1][1])
                if d > 1:
                    return False, f"智能体 {i} 在 t={t} 发生瞬移"
    conflicts = find_conflicts(paths, first_only=True)
    if conflicts:
        return False, f"存在冲突：{conflicts[0]}"
    return True, "OK"
