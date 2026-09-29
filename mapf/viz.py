"""终端 ASCII 可视化（零依赖）。"""
from __future__ import annotations

from typing import List

from .grid import Instance
from .utils import Path, location_at

_SYMBOLS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"


def render_frame(instance: Instance, paths: List[Path], t: int) -> str:
    g = instance.grid
    canvas = [["#" if g.blocked[r][c] else "." for c in range(g.width)]
              for r in range(g.height)]
    for i, goal in enumerate(instance.goals):  # 终点用 * 标出（被智能体覆盖时不显示）
        canvas[goal[0]][goal[1]] = "*"
    for i, p in enumerate(paths):
        r, c = location_at(p, t)
        canvas[r][c] = _SYMBOLS[i % len(_SYMBOLS)]
    return "\n".join("".join(row) for row in canvas)


def render_all(instance: Instance, paths: List[Path]) -> str:
    horizon = max(len(p) for p in paths)
    return "\n\n".join(f"t = {t}\n{render_frame(instance, paths, t)}" for t in range(horizon))


def play(instance: Instance, paths: List[Path], delay: float = 0.4) -> None:
    """在终端里逐帧播放。"""
    import time
    for t in range(max(len(p) for p in paths)):
        print(f"\x1b[2J\x1b[Ht = {t}\n{render_frame(instance, paths, t)}", flush=True)
        time.sleep(delay)
