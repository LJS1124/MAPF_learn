"""练习 4 参考答案"""
from labtarget import load


def separate_cover(xrow, w, Qi, eps=1e-6):
    order = sorted(range(len(xrow)), key=lambda j: (-xrow[j], w[j], j))
    S, tot = [], 0
    for j in order:
        if xrow[j] < eps:
            break
        S.append(j)
        tot += w[j]
        if tot > Qi:
            break
    if tot <= Qi:
        return None
    for j in sorted(S, key=lambda j: (xrow[j], j)):
        if tot - w[j] > Qi:
            S.remove(j)
            tot -= w[j]
    if sum(xrow[j] for j in S) > len(S) - 1 + eps:
        return sorted(S)
    return None


def cut_loop(C, w, Q, max_rounds=12):
    gap_lp = load("ex3_gap").gap_lp
    cuts, rounds = [], []
    for _ in range(max_rounds):
        val, x = gap_lp(C, w, Q, cuts)
        if val is None:
            break
        rounds.append(val)
        new = []
        for i in range(len(Q)):
            S = separate_cover(list(x[i]), w, Q[i])
            if S is not None and (i, S, len(S) - 1) not in cuts:
                new.append((i, S, len(S) - 1))
        if not new:
            break
        cuts += new
    return {"rounds": rounds, "cuts": cuts, "final": rounds[-1] if rounds else None}
