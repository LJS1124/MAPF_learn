"""练习 2 · NEH 启发式（对应 11.2 节）

三台及以上的流水车间是强 NP 难的，Johnson 规则不再保证最优。NEH（Nawaz–Enscore–Ham，1983）是最常用的构造启发式：

  neh(P) -> (顺序, C_max)
        1. 作业按总加工时间（各机器上的和）从大到小排队，并列取下标小的；
        2. 依次把队里的作业插入当前的部分序列：试遍所有 len+1 个位置，选插入后（部分序列的）C_max 最小的位置，并列取靠前的位置；
        3. 全部插完得到顺序，返回它和它的 C_max。
        C_max 用练习 1 的 flow_makespan。
页面例子（3 台机器 6 个作业）：顺序 [4, 0, 3, 2, 5, 1]，C_max = 44；最优是 42。
"""
from labtarget import load  # noqa: F401


def neh(P):
    raise NotImplementedError("练习 2：NEH")
