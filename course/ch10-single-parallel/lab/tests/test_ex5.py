import pytest

from ai_solvers import AI_SOLVERS, PRIMARY_CODE
from labtarget import load

ex1 = load("ex1_rules")
ex2 = load("ex2_moore")
ex5 = load("ex5_audit")


def good_solver(p, w, d):
    return {"sumC": ex1.spt_order(p), "sumwC": ex1.wspt_order(p, w), "Lmax": ex1.edd_order(d), "sumU": ex2.moore_hodgson(p, d)[0]}


def test_good_solver_passes_audit():
    assert ex5.audit(good_solver) == set(), "审查器对正确的函数报了警：误报"


@pytest.mark.parametrize("name", list(AI_SOLVERS))
def test_audit_finds_the_primary_problem(name):
    codes = ex5.audit(AI_SOLVERS[name])
    assert PRIMARY_CODE[name] in codes, f"{name} 应该被查出 {PRIMARY_CODE[name]}，实际报告：{sorted(codes)}"


def test_audit_reports_only_known_codes():
    known = {"BAD_SUMC", "BAD_SUMWC", "BAD_LMAX", "BAD_SUMU", "CRASH"}
    for fn in AI_SOLVERS.values():
        assert ex5.audit(fn) <= known


def test_audit_is_deterministic():
    assert ex5.audit(AI_SOLVERS["AI-C"]) == ex5.audit(AI_SOLVERS["AI-C"])
