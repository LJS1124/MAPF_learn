"""本章的实例与生成器。

JOB：页面图 9-1、9-2 用的 6 个作业（一台提升机上的 6 个托盘）：加工时间 p、权重 w、交货期 d。
R：图 9-2 里“2 台不相关机器”的加工时间表 R[i][j]。
"""
import random

JOB = {"p": [7, 3, 5, 2, 8, 5], "w": [2, 2, 4, 4, 4, 2], "d": [13, 23, 17, 5, 9, 21]}
R = [[7, 3, 5, 2, 8, 5], [3, 6, 4, 5, 4, 9]]


def random_jobs(rng, n=6, releases=False):
    p = [rng.randint(1, 9) for _ in range(n)]
    w = [rng.randint(1, 5) for _ in range(n)]
    d = [rng.randint(3, 3 * n + 8) for _ in range(n)]
    r = [rng.randint(0, 12) for _ in range(n)] if releases else [0] * n
    return p, w, d, r
