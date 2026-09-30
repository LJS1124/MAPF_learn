"""练习 1 · 流水车间：C_max 的计算与 Johnson 规则（对应 11.1 节）

P[j][k] 是作业 j 在第 k 台机器上的加工时间。所有作业按同一个顺序 perm 依次经过第 0、1、… 台机器
（“排列流水车间”）。每台机器一次只做一个作业，一个作业一次只在一台机器上；作业在一台机器上做完才能去下一台。

  flow_makespan(P, perm) -> C_max
        递推：作业 j 在机器 k 上的完工时间 = max(它在机器 k−1 上的完工时间, 机器 k 上前一个作业的完工时间) + P[j][k]。
  johnson(P) -> 作业的顺序（只用于两台机器，P[j] = (a_j, b_j)）
        a_j ≤ b_j 的作业按 a_j 从小到大放前面，a_j > b_j 的按 b_j 从大到小放后面，并列取下标小的。

先填 PREDICTION（题目见 predictions.py），再动手。跑完 pytest 之后，终端最后会把预测和实际结果并排列出来。
"""

PREDICTION = {
    "johnson_f2": None,          # "YES" / "NO"
    "johnson_f3": None,          # "YES" / "NO"
    "js_all_feasible": None,     # "YES" / "NO"
    "cp_vs_mip": None,           # "相同" / "不同"
}


def flow_makespan(P, perm):
    raise NotImplementedError("练习 1：C_max 的递推")


def johnson(P):
    raise NotImplementedError("练习 1：Johnson 规则")
