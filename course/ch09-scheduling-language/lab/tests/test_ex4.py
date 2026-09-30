import pytest

from labtarget import load

ex4 = load("ex4_complexity")
ex3 = load("ex3_notation")


def cl(s):
    a, b, g = ex3.parse(s)
    return ex4.classify(a, b, g)[0]


@pytest.mark.parametrize("s,status", [
    ("1 | | ΣCj", "P"), ("1 | | ΣwjTj", "NP"), ("1 | | ΣwjUj", "W"), ("P2 | | Cmax", "W"),
    ("R | | ΣCj", "P"), ("R | | Cmax", "NP"), ("F2 | | Cmax", "P"), ("F | | Cmax", "NP"),
])
def test_table_entries(s, status):
    assert cl(s) == status


@pytest.mark.parametrize("s,status", [
    ("R | | ΣwjCj", "NP"),          # 至少和 P||ΣwjCj 一样难
    ("1 | r_j, prec | ΣwjCj", "NP"),  # 是 1|prec|ΣwjCj 的推广
    ("1 | r_j | ΣwjCj", "NP"),
    ("Q | | Lmax", "NP"),           # 至少和 P||Cmax（强 NP 难）一样难
    ("P2 | r_j | Cmax", "W"),
    ("1 | | Cmax", "P"),
    ("1 | prmp | Cmax", "P"),       # 是 P|prmp|Cmax 的特例
    ("1 | prec | Cmax", "P"),       # 是 1|prec|Lmax（多项式）的特例
    ("Q | | Cmax", "NP"),
])
def test_derived(s, status):
    assert cl(s) == status


def test_source_is_reported():
    st, src = ex4.classify("R", (), "sumwC")
    assert st == "NP" and src == ("P", (), "sumwC")


def test_no_contradictions_in_table():
    """一个 NP 难的问题，不可能是某个多项式可解问题的特例；并且每个表项按 classify 得到自己的状态。"""
    from complexity_table import BASE
    probs = [((a, tuple(x for x in b.split(",") if x), g), s) for a, b, g, s, _ in BASE]
    for p1, s1 in probs:
        for p2, s2 in probs:
            if s2 == "P" and s1 in ("NP", "W"):
                assert not ex3.is_special_case(p1, p2), (p1, p2)
    for (a, beta, g), s in probs:
        assert ex4.classify(a, beta, g)[0] == s
