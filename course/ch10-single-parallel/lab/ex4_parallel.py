"""练习 4 · 并行机：列表调度的最坏情况、LPT、McNaughton（对应 10.3 节）

相同并行机，m 台。作业加工时间 p。

  lpt_order(p)                  加工时间从大到小（并列取下标小的）
  list_cmax(p, m, order)        按 order 依次放到“放上去以后完工最早”的机器（并列取编号小的），返回 C_max
  worst_list_instance(m)        -> (p, order, 最优 C_max)：列表调度的最坏实例：m(m−1) 个长度 1 的作业排在前面，最后一个长度 m 的作业；最优 = m
  lpt_worst_instance(m)         -> (p, order, 最优 C_max)：LPT 的最坏实例：大小 2m−1, 2m−1, 2m−2, 2m−2, …, m+1, m+1（各两个），
                                   再加 3 个 m；order 是 LPT 顺序；最优 = 3m
  mcnaughton(p, m)              -> (C, slots)：允许中断，C = max(最长作业, 总量 / m)。
                                   把作业按编号排成一行，第 1 台机器装满 C 再换下一台，装不下的作业断开，剩下部分放到下一台机器的开头。
                                   slots[i] 是机器 i 上的 (作业, 开始, 结束) 列表，按时间排序。
判分会验证：最坏实例上列表调度 = 2m−1、LPT = 4m−1；Graham 界与 LPT 界；McNaughton 的合法性（同一作业的两段在时间上不重叠）。
"""


def lpt_order(p):
    raise NotImplementedError("练习 4：LPT 顺序")


def list_cmax(p, m, order):
    raise NotImplementedError("练习 4：列表调度")


def worst_list_instance(m):
    raise NotImplementedError("练习 4：列表调度的最坏实例")


def lpt_worst_instance(m):
    raise NotImplementedError("练习 4：LPT 的最坏实例")


def mcnaughton(p, m):
    raise NotImplementedError("练习 4：绕圈法")
