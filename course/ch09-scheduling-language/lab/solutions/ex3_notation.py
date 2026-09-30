"""练习 3 参考答案"""
import re

from complexity_table import A_EDGES, BETA_ORDER, G_EDGES

ALPHAS = ["1", "P2", "P", "Q", "R", "F2", "F", "J2", "J", "O2", "O"]
BETA_MAP = {"rj": "r", "r": "r", "prec": "prec", "prmp": "prmp", "dj": "d", "d": "d", "sjk": "s", "s": "s"}
GAMMA_MAP = {"cmax": "Cmax", "ΣCj": "sumC", "ΣwjCj": "sumwC", "lmax": "Lmax", "ΣTj": "sumT", "ΣwjTj": "sumwT", "ΣUj": "sumU", "ΣwjUj": "sumwU"}


def parse(s):
    """'P2 | r_j, prec | Σ w_j C_j' -> ('P2', ('r', 'prec'), 'sumwC')；不合法返回 None。
    机器环境里的 Pm、Qm…（m 是变量）记为 P、Q…；β 元素按 BETA_ORDER 排序去重；目标名忽略下划线与空格，Cmax、Lmax 不分大小写。"""
    parts = [x.strip() for x in s.split("|")]
    if len(parts) != 3:
        return None
    a = parts[0].replace(" ", "")
    if re.fullmatch(r"[PQRFJO]m", a):
        a = a[0]
    if a not in ALPHAS:
        return None
    beta = set()
    for t in re.split(r"[,\s]+", parts[1]):
        if not t:
            continue
        m = BETA_MAP.get(t.replace("_", "").replace("{", "").replace("}", "").lower())
        if m is None:
            return None
        beta.add(m)
    g = re.sub(r"[_{}\s]", "", parts[2]).replace("∑", "Σ")
    gm = GAMMA_MAP.get(g if g.startswith("Σ") else g.lower())
    if gm is None:
        return None
    return a, tuple(sorted(beta, key=BETA_ORDER.index)), gm


def _closure(edges):
    reach = {}
    for a, b in edges:
        reach.setdefault(a, set()).add(b)
    changed = True
    while changed:
        changed = False
        for a in list(reach):
            for b in list(reach[a]):
                for c in reach.get(b, ()):
                    if c not in reach[a]:
                        reach[a].add(c)
                        changed = True
    return lambda x, y: x == y or y in reach.get(x, ())


A_LE = _closure(A_EDGES)
G_LE = _closure(G_EDGES)


def is_special_case(p1, p2):
    """p1、p2 是 (α, β 元组, γ)。p1 是 p2 的特例吗？α 沿特例边（含自身）、γ 沿特例边（含自身）、
    β 是子集；且 prmp 必须两边都有或都没有。"""
    a1, b1, g1 = p1
    a2, b2, g2 = p2
    if ("prmp" in b1) != ("prmp" in b2):
        return False
    return A_LE(a1, a2) and G_LE(g1, g2) and set(b1) <= set(b2)
