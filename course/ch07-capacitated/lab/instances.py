"""本章的实例与生成器。

KNAP：页面图 7-1、7-2 用的背包（8 个托盘：价值、重量，一辆车的载重 22）。
GAP ：页面图 7-3、7-4 用的广义指派（3 辆车 × 10 个任务；C[i][j] 是行驶时间，w[j] 是托盘数，Q[i] 是车的载重）。
BIN ：页面图 7-5 用的装载（9 个托盘，每个车次容量 18）。
"""
import random

KNAP = {"v": [26, 6, 5, 29, 7, 10, 27, 22], "w": [5, 7, 9, 5, 6, 7, 6, 4], "cap": 22}
GAP = {
    "C": [[49, 38, 32, 6, 29, 45, 31, 57, 38, 44],
          [15, 39, 18, 60, 45, 39, 45, 18, 38, 18],
          [59, 39, 44, 42, 59, 13, 19, 52, 45, 56]],
    "w": [4, 3, 4, 6, 4, 3, 3, 8, 3, 2],
    "Q": [15, 16, 17],
}
BIN = {"w": [3, 8, 5, 6, 3, 9, 6, 5, 9], "Q": 18}


def random_knap(rng, n=8):
    w = [rng.randint(3, 12) for _ in range(n)]
    v = [rng.randint(5, 30) for _ in range(n)]
    return v, w, max(1, int(sum(w) * rng.uniform(0.3, 0.6)))


def random_gap(rng, m=3, n=7, slack=(1.1, 1.5)):
    C = [[rng.randint(5, 60) for _ in range(n)] for _ in range(m)]
    w = [rng.randint(2, 8) for _ in range(n)]
    tot = sum(w)
    Q = [max(1, int(tot / m * rng.uniform(*slack))) for _ in range(m)]
    return C, w, Q


def random_bin(rng, n=9):
    Q = rng.randint(10, 20)
    return [rng.randint(2, Q - 2) for _ in range(n)], Q
