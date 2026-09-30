import itertools
import random

import pytest

from instances import JOBSHOP, random_jobshop
from labtarget import load
from oracle import js_eval

ex3 = load("ex3_disjunctive")


def test_page_instance():
    ident = {m: [0, 1, 2] for m in range(3)}
    assert ex3.js_makespan(JOBSHOP, ident) == 21
    best = {0: [1, 2, 0], 1: [2, 1, 0], 2: [1, 0, 2]}
    assert ex3.js_makespan(JOBSHOP, best) == 13
    cyc = {0: [0, 1, 2], 1: [0, 1, 2], 2: [2, 1, 0]}
    assert ex3.js_makespan(JOBSHOP, cyc) is None


def test_counts_of_feasible_orientations():
    perms = list(itertools.permutations(range(3)))
    n_ok = sum(1 for combo in itertools.product(perms, repeat=3) if ex3.js_makespan(JOBSHOP, {m: combo[m] for m in range(3)}) is not None)
    assert n_ok == 63


@pytest.mark.parametrize("seed", range(40))
def test_random(seed):
    rng = random.Random(100 + seed)
    jobs = random_jobshop(rng, nj=rng.randint(2, 4), nm=rng.randint(2, 3))
    nm = 1 + max(m for job in jobs for m, _ in job)
    orders = {}
    for m in range(nm):
        o = list(range(len(jobs)))
        rng.shuffle(o)
        orders[m] = o
    assert ex3.js_makespan(jobs, orders) == js_eval(jobs, orders)
