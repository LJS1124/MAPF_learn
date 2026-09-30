"""练习 1 参考答案"""
from fractions import Fraction


def ratio_order(v, w):
    return sorted(range(len(v)), key=lambda j: (-Fraction(v[j], w[j]), j))


def knap_lp(v, w, cap, fixed=None):
    """0-1 背包的 LP 松弛（Dantzig 上界）。fixed[j] = 1 必选、0 必不选、-1 未定。
    返回 (上界, x, 分数变量的下标或 -1)；必选的重量已超载时返回 (-inf, x, -1)。"""
    n = len(v)
    fixed = fixed or [-1] * n
    x = [0.0] * n
    room, bound = cap, 0.0
    for j in range(n):
        if fixed[j] == 1:
            x[j] = 1.0
            room -= w[j]
            bound += v[j]
    if room < 0:
        return float("-inf"), x, -1
    frac = -1
    for j in ratio_order(v, w):
        if fixed[j] != -1:
            continue
        if w[j] <= room:
            x[j] = 1.0
            room -= w[j]
            bound += v[j]
        else:
            x[j] = room / w[j]
            bound += v[j] * room / w[j]
            frac = j if room > 0 else -1
            break
    return bound, x, frac


def knap_dp(v, w, cap):
    n = len(v)
    dp = [[0] * (cap + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        for c in range(cap + 1):
            dp[i][c] = dp[i - 1][c]
            if w[i - 1] <= c:
                dp[i][c] = max(dp[i][c], dp[i - 1][c - w[i - 1]] + v[i - 1])
    take, c = [0] * n, cap
    for i in range(n, 0, -1):
        if dp[i][c] != dp[i - 1][c]:
            take[i - 1] = 1
            c -= w[i - 1]
    return dp[n][cap], take
