import pytest

from ai_solvers import AI_SOLVERS, PRIMARY_CODE
from labtarget import load
from oracle import flow_cmax

ex5 = load("ex5_audit")


def test_good_solver_passes_audit():
    assert ex5.audit(flow_cmax) == set(), "审查器对正确的函数报了警：误报"


@pytest.mark.parametrize("name", list(AI_SOLVERS))
def test_audit_finds_the_primary_problem(name):
    codes = ex5.audit(AI_SOLVERS[name])
    assert PRIMARY_CODE[name] in codes, f"{name} 应该被查出 {PRIMARY_CODE[name]}，实际报告：{sorted(codes)}"


def test_audit_reports_only_known_codes():
    known = {"ORDER_IGNORED", "WRONG_M2", "WRONG_M3PLUS", "REVERSED_ORDER", "CRASH"}
    for fn in AI_SOLVERS.values():
        assert ex5.audit(fn) <= known


def test_audit_is_deterministic():
    assert ex5.audit(AI_SOLVERS["AI-C"]) == ex5.audit(AI_SOLVERS["AI-C"])
