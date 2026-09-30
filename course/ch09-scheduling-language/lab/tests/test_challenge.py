import random

import pytest

from instances import JOB
from labtarget import load
from oracle import pareto_ref

ch = load("challenge_pareto")


def test_page_instance():
    assert ch.pareto(JOB["p"], JOB["d"]) == [(108, 7), (107, 8), (95, 9), (94, 11), (90, 12), (89, 16), (85, 17), (84, 21)]


@pytest.mark.parametrize("seed", range(20))
def test_random(seed):
    rng = random.Random(400 + seed)
    n = rng.randint(2, 6)
    p = [rng.randint(1, 9) for _ in range(n)]
    d = [rng.randint(3, 3 * n + 8) for _ in range(n)]
    front = ch.pareto(p, d)
    assert front == pareto_ref(p, d)
    assert all(a[0] > b[0] and a[1] < b[1] for a, b in zip(front, front[1:])), "按 L_max 从小到大，ΣC 应当严格减小"
