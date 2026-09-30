import random

import pytest

from instances import JOBSHOP, random_jobshop
from labtarget import load
from oracle import js_eval, js_opt

ch = load("challenge_dispatch")


def test_page_instance():
    c, orders = ch.js_dispatch(JOBSHOP)
    assert c == js_eval(JOBSHOP, orders)
    assert c == 15


@pytest.mark.parametrize("seed", range(25))
def test_random(seed):
    rng = random.Random(600 + seed)
    jobs = random_jobshop(rng, nj=rng.randint(2, 4), nm=rng.randint(2, 3))
    c, orders = ch.js_dispatch(jobs)
    assert c == js_eval(jobs, orders), "返回的 orders 必须可行，且最大完工时间与汇报的一致"
    assert c >= js_opt(jobs)
    assert (c, orders) == ch.js_dispatch(jobs)
