"""第 2 章：单智能体 A*。运行：python examples/01_astar.py"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from mapf import Grid, astar

grid = Grid.from_file("maps/maze-10x10.map")
path = astar(grid, (0, 0), (8, 9))
print("路径长度:", len(path) - 1)
print(path)
