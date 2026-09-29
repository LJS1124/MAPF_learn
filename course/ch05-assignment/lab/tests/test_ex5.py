import numpy as np
import pytest

from ai_solvers import AI_SOLVERS, PRIMARY_CODE
from labtarget import load

ex3 = load("ex3_dispatch")
ex5 = load("ex5_audit")


def good_solver(C, allowed=None, penalty=None):
    r = ex3.dispatch(C, allowed, penalty)
    return {"feasible": r.feasible, "assign": r.assign, "total": r.total}


def test_good_solver_passes_audit():
    assert ex5.audit(good_solver) == set(), "审查器对正确的函数报了警：误报"


@pytest.mark.parametrize("name", list(AI_SOLVERS))
def test_audit_finds_the_primary_problem(name):
    codes = ex5.audit(AI_SOLVERS[name])
    assert PRIMARY_CODE[name] in codes, f"{name} 应该被查出 {PRIMARY_CODE[name]}，实际报告：{sorted(codes)}"


def test_audit_reports_only_known_codes():
    known = {"USES_FORBIDDEN", "FALSE_FEASIBLE", "FALSE_INFEASIBLE", "TASKS_DROPPED",
             "WRONG_TOTAL", "NOT_OPTIMAL", "CRASH"}
    for fn in AI_SOLVERS.values():
        assert ex5.audit(fn) <= known


def test_audit_is_deterministic():
    fn = AI_SOLVERS["AI-B"]
    assert ex5.audit(fn) == ex5.audit(fn)
