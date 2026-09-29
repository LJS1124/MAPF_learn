# 07 进阶算法地图

本章是导览而非实现教程，帮你在读论文时快速定位。细节请查第 09 章的文献。

## 7.1 最优与有界次优（CBS 家族）

- **ICBS**（Boyarski et al., 2015）：冲突分类 + MDD 推理，优先处理 cardinal 冲突。
- **CBSH / CBSH-RM**（Felner et al., 2018）：冲突图启发。
- **ECBS / EECBS**（Barer 2014 / Li et al., 2021）：给定次优界 *w*，保证解代价 ≤ w × 最优。EECBS 是目前有界次优的强基线。
- **Lazy CBS、CCBS（连续时间）** 等变体。

## 7.2 单智能体加速：SIPP

**Safe Interval Path Planning**（Phillips & Likhachev, 2011）：把每个顶点在时间轴上的“无冲突区间”作为状态，一次扩展可以直接跳到区间内任意时刻，避免逐时刻等待展开。CBS/EECBS 的高性能实现的低层通常用 SIPP。

## 7.3 大规模、次优、快

- **PP / PBS**：优先级规划，PBS 用搜索决定优先级。
- **MAPF-LNS / LNS2**（Li et al., 2021/2022）：从初始解出发，反复“拆掉一小部分智能体的路径并重规划”的大邻域搜索，可以处理上千智能体。
- **PIBT**（Okumura et al., 2019/2022）：Priority Inheritance with Backtracking，每步只做局部决策，天然适合**终身 MAPF**和在线场景。
- **LaCAM / LaCAM2**（Okumura, 2023）：在联合配置空间做惰性搜索，PIBT 作为后继生成器，在大规模实例上很强。

## 7.4 相关问题

- **终身 MAPF（Lifelong MAPF）**：完成任务后立即领新任务，如仓库拣选。
- **MAPD**：任务分配 + 路径规划一起做。
- **连续时间/运动学约束**：机器人有体积、速度、转向限制；见 CCBS、MAPF-DP（考虑执行延迟）、鲁棒/概率 MAPF。
- **去中心化与部分观测**：每个智能体只看局部，见下节。

## 7.5 学习方法（仓库名 “mapf_learn” 的另一层含义）

把 MAPF 交给神经网络/强化学习，用于去中心化执行：

- **PRIMAL**（Sartoretti et al., 2019）：强化学习 + 模仿学习，学习局部观测下的策略。
- **后续工作**：图神经网络通信、与经典规划混合（如把学习到的策略作为启发或初始解）、以及近期基于大规模数据训练的 Transformer 类模型（如 MAPF-GPT）。

需要注意：学习方法通常**不保证完备/最优**，评估时要和 PP、LNS、LaCAM 等强基线在相同冲突模型与时限下对比。

## 7.6 如何选择算法

| 场景 | 建议 |
|---|---|
| 少量智能体（≲ 50）、要最优 | CBS 家族（ICBS/CBSH）或 CBS + SIPP |
| 要保证质量上界 | EECBS |
| 数百到上千智能体、要快 | PP、MAPF-LNS、LaCAM |
| 在线/终身任务流 | PIBT 或滚动时域规划 |
| 部分观测、去中心化执行 | 学习方法或规则 + 局部协商 |

## 7.7 建议的下一步实践

在本仓库基础上依次实现：SIPP → cardinal 冲突（ICBS 一半）→ 简单版 LNS（随机拆 *m* 个智能体重规划）→ PIBT。每一步都用 `validate` 与 `03_benchmark.py` 对照。
