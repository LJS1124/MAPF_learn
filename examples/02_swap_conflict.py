"""第 3 章：两个智能体在走廊里的冲突，演示 ST-A*、优先级规划与 CBS。"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from mapf import Grid, Instance, prioritized_planning, cbs, validate, sum_of_costs
from mapf.viz import render_all

grid = Grid.from_file("maps/corridor.map")
# 智能体 0：左 -> 右；智能体 1：右 -> 左。中间必须借助竖直岔路错开
inst = Instance(grid, starts=[(2, 0), (2, 6)], goals=[(2, 6), (2, 0)])
for name, solver in [("优先级规划", prioritized_planning), ("CBS", cbs)]:
    paths = solver(inst)
    print(f"== {name}: {validate(inst, paths)}, SOC={sum_of_costs(paths) if paths else None}")
    if paths and name == "CBS":
        print(render_all(inst, paths))
