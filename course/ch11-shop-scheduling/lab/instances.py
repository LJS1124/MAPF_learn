"""本章的实例。

FLOW2：图 11-1 的 6 个作业，两台机器（入库、出库）；P[j] = (a_j, b_j)。
FLOW3：图 11-2 的 6 个作业，三台机器（入库、提升机、出库）。
JOBSHOP：图 11-3 的 3 个作业、3 台机器；jobs[j] = [(机器, 加工时间), ...]，机器从 0 编号（页面里叫 M1、M2、M3）。
"""
import random

FLOW2 = [[1, 4], [9, 9], [6, 5], [3, 2], [5, 4], [1, 5]]
FLOW3 = [[4, 5, 6], [9, 8, 1], [5, 7, 3], [3, 7, 8], [6, 6, 1], [8, 3, 8]]
JOBSHOP = [[(2, 2), (1, 1), (0, 3)], [(2, 1), (0, 4), (1, 2)], [(1, 2), (0, 5), (2, 2)]]


def random_flow(rng, n=6, m=3):
    return [[rng.randint(1, 9) for _ in range(m)] for _ in range(n)]


def random_jobshop(rng, nj=3, nm=3):
    jobs = []
    for _ in range(nj):
        ms = list(range(nm))
        rng.shuffle(ms)
        jobs.append([(m, rng.randint(1, 5)) for m in ms])
    return jobs
