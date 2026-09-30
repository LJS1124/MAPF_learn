"""练习 2 参考答案"""
from labtarget import load


def neh(P):
    fm = load("ex1_flow").flow_makespan
    order = sorted(range(len(P)), key=lambda j: (-sum(P[j]), j))
    seq = []
    for j in order:
        best = None
        for pos in range(len(seq) + 1):
            s = seq[:pos] + [j] + seq[pos:]
            c = fm(P, s)
            if best is None or c < best[0]:
                best = (c, s)
        seq = best[1]
    return seq, fm(P, seq)
