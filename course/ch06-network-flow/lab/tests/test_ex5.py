import pytest

from ai_solvers import AI_SOLVERS, PRIMARY_CODE
from labtarget import load

ex2 = load("ex2_maxflow")
ex5 = load("ex5_audit")


def good_solver(n, arcs, s, t):
    r = ex2.max_flow(n, arcs, s, t)
    return {"value": r["value"], "flow": r["flow"], "cut": r["cut"]}


def test_good_solver_passes_audit():
    assert ex5.audit(good_solver) == set(), "审查器对正确的函数报了警：误报"


@pytest.mark.parametrize("name", list(AI_SOLVERS))
def test_audit_finds_the_primary_problem(name):
    codes = ex5.audit(AI_SOLVERS[name])
    assert PRIMARY_CODE[name] in codes, f"{name} 应该被查出 {PRIMARY_CODE[name]}，实际报告：{sorted(codes)}"


def test_audit_reports_only_known_codes():
    known = {"NOT_MAX", "VIOLATES_CAP", "VIOLATES_CONSERVATION", "WRONG_VALUE", "BAD_CUT", "CRASH"}
    for fn in AI_SOLVERS.values():
        assert ex5.audit(fn) <= known


def test_audit_is_deterministic():
    fn = AI_SOLVERS["AI-C"]
    assert ex5.audit(fn) == ex5.audit(fn)
