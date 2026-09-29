# 09 参考文献与资源

以下均为该领域公认的原始文献/资源，建议按引用名检索原文核对细节。

## 综述与基准
- Stern et al. *Multi-Agent Pathfinding: Definitions, Variants, and Benchmarks.* SoCS 2019.（问题定义与 MovingAI 基准）
- Felner et al. *Search-Based Optimal Solvers for the Multi-Agent Pathfinding Problem: Summary and Challenges.* SoCS 2017.

## 经典算法
- Silver. *Cooperative Pathfinding.* AIIDE 2005.（时空 A* 与协作寻路 / PP 的源头之一）
- Sharon, Stern, Felner, Sturtevant. *Conflict-Based Search for Optimal Multi-Agent Pathfinding.* Artificial Intelligence 2015.（CBS）
- Boyarski et al. *ICBS: Improved Conflict-Based Search Algorithm for Multi-Agent Pathfinding.* IJCAI 2015.
- Felner et al. *Adding Heuristics to Conflict-Based Search for Multi-Agent Path Finding.* ICAPS 2018.（CBSH）
- Barer et al. *Suboptimal Variants of the Conflict-Based Search Algorithm.* SoCS 2014.（ECBS）
- Li, Ruml, Koenig. *EECBS: A Bounded-Suboptimal Search for Multi-Agent Path Finding.* AAAI 2021.
- Phillips, Likhachev. *SIPP: Safe Interval Path Planning for Dynamic Environments.* ICRA 2011.

## 大规模与次优
- Li et al. *Anytime Multi-Agent Path Finding via Large Neighborhood Search.* IJCAI 2021.（MAPF-LNS）
- Li et al. *MAPF-LNS2: Fast Repairing for Multi-Agent Path Finding via Large Neighborhood Search.* AAAI 2022.
- Okumura et al. *Priority Inheritance with Backtracking for Iterative Multi-Agent Path Finding.* Artificial Intelligence 2022.（PIBT）
- Okumura. *LaCAM: Search-Based Algorithm for Quick Multi-Agent Pathfinding.* AAAI 2023.

## 复杂度
- Yu, LaValle. *Structure and Intractability of Optimal Multi-Robot Path Planning on Graphs.* AAAI 2013.

## 学习方法
- Sartoretti et al. *PRIMAL: Pathfinding via Reinforcement and Imitation Multi-Agent Learning.* IEEE RA-L 2019.

## 工具与代码
- MovingAI 基准与地图：<https://movingai.com/benchmarks/mapf/index.html>
- 作者 Jiaoyang Li 的 CBSH/EECBS/MAPF-LNS 参考实现（C++，GitHub 搜索作者名与算法名）。
- Keisuke Okumura 的 PIBT / LaCAM 实现与 MAPF 综述页面（GitHub 搜索作者名与算法名）。

> 注：本教程编写时未联网逐条核对页码/卷期，引用信息以论文原文为准；如发现错误，欢迎提 issue 或 PR。
