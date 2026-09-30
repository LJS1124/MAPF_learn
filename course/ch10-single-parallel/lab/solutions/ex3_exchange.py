"""练习 3 参考答案"""
from fractions import Fraction


def swap_delta(p, w, seq, i, objective):
    """交换 seq 里位置 i 和 i+1 的两个作业以后，目标的变化量（新 − 旧）。objective 取 'sumC' 或 'sumwC'。"""
    a, b = seq[i], seq[i + 1]
    if objective == "sumC":
        return p[b] - p[a]
    return w[a] * p[b] - w[b] * p[a]


def _before(rule, p, w, d, a, b):
    if rule == "SPT":
        return p[a] < p[b]
    if rule == "WSPT":
        return Fraction(p[a], w[a]) < Fraction(p[b], w[b])
    return d[a] < d[b]


def bubble_path(p, w, d, seq, rule):
    seq = list(seq)
    path = []
    moved = True
    while moved:
        moved = False
        for i in range(len(seq) - 1):
            if _before(rule, p, w, d, seq[i + 1], seq[i]):
                seq[i], seq[i + 1] = seq[i + 1], seq[i]
                path.append(list(seq))
                moved = True
                break
    return path, seq
