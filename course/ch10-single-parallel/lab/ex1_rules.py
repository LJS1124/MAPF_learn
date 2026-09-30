"""练习 1 · 三条排序规则（对应 10.1 节）

单机、没有释放时间、不能中断。三个函数都返回作业下标的顺序，加工时间/权重/交货期并列时，下标小的在前。

  spt_order(p)       SPT：加工时间从小到大        （1 | | ΣC_j 的最优）
  wspt_order(p, w)   WSPT：p_j / w_j 从小到大     （1 | | Σw_jC_j 的最优；用 fractions.Fraction 比较，不要用浮点数）
  edd_order(d)       EDD：交货期从早到晚          （1 | | L_max 的最优）

先填 PREDICTION（题目见 predictions.py），再动手。跑完 pytest 之后，终端最后会把预测和实际结果并排列出来。
"""
from fractions import Fraction  # noqa: F401

PREDICTION = {
    "swap_sumC": None,      # "减少" / "不变" / "增加"
    "spt_lmax": None,       # "YES" / "NO"
    "list_ratio": None,     # "2 − 1/m" / "2" / "4/3" / "1"
    "pmtn_p": None,         # "YES" / "NO"
}


def spt_order(p):
    raise NotImplementedError("练习 1：SPT")


def wspt_order(p, w):
    raise NotImplementedError("练习 1：WSPT")


def edd_order(d):
    raise NotImplementedError("练习 1：EDD")
