import random

import pytest

from instances import JOBSHOP, random_jobshop
from labtarget import load
from oracle import js_opt

ex4 = load("ex4_models")


def test_page_instance():
    assert ex4.mip_jobshop(JOBSHOP) == 13
    assert ex4.cp_jobshop(JOBSHOP) == 13


def test_lp_relaxation_is_weak():
    lp = ex4.mip_lp_bound(JOBSHOP)
    assert lp <= 13 + 1e-6
    assert lp < 12, "大 M 模型的 LP 松弛很弱：页面例子里连简单下界 12（最忙机器与最长作业）都达不到"


@pytest.mark.parametrize("seed", range(12))
def test_random(seed):
    rng = random.Random(500 + seed)
    jobs = random_jobshop(rng, nj=rng.randint(2, 3), nm=rng.randint(2, 3))
    opt = js_opt(jobs)
    assert ex4.mip_jobshop(jobs) == opt
    assert ex4.cp_jobshop(jobs) == opt
