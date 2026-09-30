"""练习 4 参考答案"""
from complexity_table import BASE, BETA_ORDER
from labtarget import load


def _base():
    out = []
    for a, b, g, st, note in BASE:
        beta = tuple(sorted([x for x in b.split(",") if x], key=BETA_ORDER.index))
        out.append(((a, beta, g), st, note))
    return out


def classify(alpha, beta, gamma):
    """返回 (状态, 依据的表项)。状态：'P'、'W'、'NP'、'?'。
    1. 表里有就直接用；2. 表里有“比它更特例”的 NP 难/弱 NP 难项，它至少一样难（有强 NP 难项时记 NP，否则 W）；
    3. 表里有“比它更一般”的 P 项，它是 P；4. 否则 '?'。"""
    is_special_case = load("ex3_notation").is_special_case
    beta = tuple(sorted(beta, key=BETA_ORDER.index))
    prob = (alpha, beta, gamma)
    base = _base()
    for p, st, note in base:
        if p == prob:
            return st, p
    hard = [(p, st) for p, st, _ in base if st in ("NP", "W") and is_special_case(p, prob)]
    if hard:
        strong = [x for x in hard if x[1] == "NP"]
        pick = (strong or hard)[0]
        return pick[1], pick[0]
    easy = [p for p, st, _ in base if st == "P" and is_special_case(prob, p)]
    if easy:
        return "P", easy[0]
    return "?", None
