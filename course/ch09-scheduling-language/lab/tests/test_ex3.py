import pytest

from labtarget import load

ex3 = load("ex3_notation")


@pytest.mark.parametrize("s,expect", [
    ("1 | | ΣCj", ("1", (), "sumC")),
    ("1|r_j|L_max", ("1", ("r",), "Lmax")),
    ("P2 | | C_max", ("P2", (), "Cmax")),
    ("Pm | prec, r_j | Σ w_j C_j", ("P", ("r", "prec"), "sumwC")),
    ("R | | Σ C_j", ("R", (), "sumC")),
    ("F2||Cmax", ("F2", (), "Cmax")),
    ("1 | prmp, r_j | ΣU_j", ("1", ("r", "prmp"), "sumU")),
    ("Qm | s_jk | ΣT_j", ("Q", ("s",), "sumT")),
    ("1 | r_j, r_j | Lmax", ("1", ("r",), "Lmax")),
])
def test_parse(s, expect):
    assert ex3.parse(s) == expect


@pytest.mark.parametrize("s", ["", "1 | Cmax", "X | | Cmax", "1 | foo | Cmax", "1 | | foo", "1 | | | Cmax"])
def test_parse_invalid(s):
    assert ex3.parse(s) is None


def sc(a, b):
    return ex3.is_special_case(ex3.parse(a), ex3.parse(b))


def test_special_case_machines():
    assert sc("1 | | Cmax", "P | | Cmax") and sc("P | | Cmax", "Q | | Cmax") and sc("Q | | Cmax", "R | | Cmax")
    assert sc("1 | | Cmax", "R | | Cmax")
    assert not sc("R | | Cmax", "P | | Cmax")
    assert sc("F2 | | Cmax", "J2 | | Cmax") and not sc("O2 | | Cmax", "J2 | | Cmax")


def test_special_case_objectives_and_constraints():
    assert sc("1 | | Cmax", "1 | | Lmax")
    assert sc("1 | | ΣCj", "1 | | ΣwjCj") and sc("1 | | ΣCj", "1 | | ΣTj")
    assert not sc("1 | | ΣUj", "1 | | ΣTj")
    assert sc("1 | | Lmax", "1 | r_j | Lmax") and sc("1 | r_j | Lmax", "1 | r_j, prec | Lmax")
    assert not sc("1 | r_j | Lmax", "1 | | Lmax")


def test_prmp_is_not_comparable():
    assert not sc("1 | | Cmax", "1 | prmp | Cmax")
    assert not sc("1 | prmp | Cmax", "1 | | Cmax")
    assert sc("1 | prmp | Cmax", "P | prmp | Cmax")
    assert sc("1 | | Cmax", "1 | | Cmax")
