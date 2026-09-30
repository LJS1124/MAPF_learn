"""练习 1 · 背包：LP 上界与动态规划（对应 7.1 节）

  knap_lp(v, w, cap, fixed=None) -> (上界, x, 分数变量的下标或 -1)
        0-1 背包的 LP 松弛（Dantzig 上界）：按价值/重量从大到小装，装不下的那个装一部分。
        fixed[j] = 1 必选、0 必不选、-1 未定（练习 2 的分支定界要用）。
        必选的物品已经超载时，返回 (float("-inf"), x, -1)。
        价值/重量相同时，下标小的优先（用 fractions.Fraction 比较，不要用浮点数）。
  knap_dp(v, w, cap)            -> (最优价值, take)   take[j] 是 0/1

先填 PREDICTION（取值见 predictions.py 里的题目），再动手。跑完 pytest 之后，终端最后会把预测和实际结果并排列出来。
"""
from fractions import Fraction  # noqa: F401

PREDICTION = {
    "knap_frac_count": None,      # "0" / "1" / "2" / "很多"
    "knap_lp_vs_opt": None,       # "YES" / "NO"
    "gap_loose": None,            # "YES" / "NO"
    "gap_tight": None,            # "YES" / "NO"
}


def knap_lp(v, w, cap, fixed=None):
    raise NotImplementedError("练习 1：Dantzig 上界")


def knap_dp(v, w, cap):
    raise NotImplementedError("练习 1：动态规划")
