"""练习 4 · 瓶颈指派与帕累托阶梯（对应 5.7 节）

第 1 章的“最晚到达最短”不用写成 MIP，用“阈值 + 匹配”就能精确求解：
    1. 把所有代价从小到大排好，二分一个阈值 τ；
    2. 只保留 C[i][j] <= τ 的 (车, 任务) 对，看能不能让每个任务都配到一辆不同的车（二部图匹配）；
    3. 能配上的最小 τ 就是最晚到达的最优值。

任务：实现下面三个函数。C 是 (m, n) 的代价矩阵，m >= n。返回的派法 assign[j] = 任务 j 的车。

    bottleneck(C)      -> (τ*, assign)：最晚到达最小；随便一个达到 τ* 的派法即可
    lexicographic(C)   -> (τ*, total, assign)：先让最晚到达最小，再在 max <= τ* 的派法里让总时间最小
    pareto(C)          -> [(max, total), ...]：所有非支配点，max 严格递增，total 严格递减

提示：
- 匹配可以用 scipy.sparse.csgraph.maximum_bipartite_matching，也可以自己写 Kuhn 增广。
- lexicographic 和 pareto 里，“只保留 C <= τ 的边，求总时间最小”正是练习 3 的 dispatch(C, allowed=(C <= τ))。
- pareto 的做法：对每个 τ >= τ*，算一次 dispatch，取“总时间第一次下降”的那些点，横坐标用派法的实际最大代价。
"""
import numpy as np  # noqa: F401


def bottleneck(C):
    raise NotImplementedError("练习 4：二分阈值 + 二部图匹配")


def lexicographic(C):
    raise NotImplementedError("练习 4：先 bottleneck，再在 C <= τ* 的边里最小化总时间")


def pareto(C):
    raise NotImplementedError("练习 4：扫描阈值，收集总时间的每一次下降")
