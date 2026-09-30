"""本章的实例。JOB 与第 9 章相同（一台提升机上的 6 个托盘）；JOB2 是图 10-2 的第二个例子（7 个作业，交货期更紧）。"""
import random

JOB = {"p": [7, 3, 5, 2, 8, 5], "w": [2, 2, 4, 4, 4, 2], "d": [13, 23, 17, 5, 9, 21]}
JOB2 = {"p": [4, 7, 6, 3, 4, 6, 8], "d": [10, 18, 4, 14, 12, 17, 18]}


def random_jobs(rng, n=6):
    return ([rng.randint(1, 9) for _ in range(n)], [rng.randint(1, 5) for _ in range(n)], [rng.randint(3, 3 * n + 8) for _ in range(n)])
