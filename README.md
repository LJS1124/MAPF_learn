# MAPF 学习教程：多智能体路径规划从入门到 CBS

MAPF（Multi-Agent Path Finding，多智能体路径规划）：在同一张图上，给 *k* 个智能体各指定起点和终点，求 *k* 条**互不冲突**的路径。它是仓储机器人、自动泊车、游戏 NPC 寻路、无人机编队等场景的核心问题。

本仓库把教程和**可运行的最小实现**放在一起：每一章先讲概念，再对应到几十行代码，所有代码只依赖 Python 3.9+ 标准库。

## 学习路线

| 章节 | 内容 | 对应代码 |
|---|---|---|
| [01 问题定义](docs/01-problem.md) | 图、冲突类型、目标函数、复杂度 | `mapf/grid.py`, `mapf/utils.py` |
| [02 单智能体 A*](docs/02-astar.md) | 启发式搜索回顾 | `mapf/astar.py: astar` |
| [03 时空 A* 与约束](docs/03-space-time-astar.md) | 加入时间维度与等待动作 | `mapf/astar.py: space_time_astar` |
| [04 优先级规划](docs/04-prioritized-planning.md) | 最简单的 MAPF 求解器及其失败模式 | `mapf/prioritized.py` |
| [05 冲突搜索 CBS](docs/05-cbs.md) | 完备且最优的两层搜索 | `mapf/cbs.py` |
| [06 实验与评估](docs/06-experiments.md) | 成功率、SOC、makespan、对比实验 | `examples/03_benchmark.py` |
| [07 进阶算法地图](docs/07-advanced.md) | ICBS/EECBS、LNS、PIBT/LaCAM、SIPP、学习方法 | — |
| [08 练习与项目](docs/08-exercises.md) | 由浅入深的练习题与提示 | — |
| [09 参考文献](docs/09-references.md) | 论文、基准与工具 | — |

建议顺序阅读 01→06，边读边跑代码；07 建立全局视野；08 动手巩固。

## 快速开始

```bash
git clone <本仓库> && cd MAPF_learn
python3 -m unittest discover -s tests -v       # 跑全部测试
python3 examples/01_astar.py                   # 单智能体 A*
python3 examples/02_swap_conflict.py           # PP 失败、CBS 成功的经典例子，并打印动画帧
python3 examples/03_benchmark.py maps/empty-8x8.map 10   # 小规模对比实验
```

## 目录结构

```
mapf/          # 参考实现（grid、astar、prioritized、cbs、utils、viz）
docs/          # 教程正文（中文）
examples/      # 与章节对应的可运行脚本
maps/          # 小地图（MovingAI .map 格式）
tests/         # unittest 测试，保证教程里的结论可复现
```

## 代码约定

- 坐标为 `(row, col)`，四连通，每步代价 1，动作 = 上/下/左/右/等待。
- 时间从 0 开始离散推进；`path[t]` 是智能体在时刻 `t` 的位置。
- 智能体到达终点后**停留在终点**（“stay at target”模型），因此仍可能挡住别人。
- 冲突 = 顶点冲突（同时刻同格）+ 边冲突（对穿交换位置）。
- 目标函数默认 SOC（Sum of Costs）。

## 另一条线：物流调度与运筹优化课程

[`course/`](course/) 是一门 33 章的系统课程（数学规划、组合优化、调度、路径与波次、大规模方法、启发式、多智能体时空规划、动态与不确定），每章有交互页、Lab 代码包与对拍测试。大纲见 [course/outline.md](course/outline.md)。第 5 章（指派问题与匈牙利算法）的源码已在 [course/ch05-assignment/](course/ch05-assignment/)。第 7 部分的 MAPF 理论原型会建立在上面这份 MAPF 教程之上。
