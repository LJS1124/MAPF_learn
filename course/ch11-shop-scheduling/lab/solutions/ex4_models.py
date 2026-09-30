"""练习 4 参考答案：同一个作业车间问题的 MIP 与 CP 两种模型"""
import numpy as np
from scipy.optimize import Bounds, LinearConstraint, linprog, milp


def _mip_parts(jobs):
    ops = [(j, k) for j in range(len(jobs)) for k in range(len(jobs[j]))]
    idx = {o: i for i, o in enumerate(ops)}
    n = len(ops)
    dur = [jobs[j][k][1] for j, k in ops]
    M = sum(dur)
    pairs = []                      # 同一台机器上的每一对工序（不同作业）
    for a in range(n):
        for b in range(a + 1, n):
            if jobs[ops[a][0]][ops[a][1]][0] == jobs[ops[b][0]][ops[b][1]][0] and ops[a][0] != ops[b][0]:
                pairs.append((a, b))
    nv = n + 1 + len(pairs)         # 起始时刻 s_o、C_max、每对的 y（y = 1 表示 a 在 b 之前）
    A, lo, hi = [], [], []

    def row(coefs, lb, ub):
        r = np.zeros(nv)
        for i, c in coefs:
            r[i] += c
        A.append(r)
        lo.append(lb)
        hi.append(ub)
    for j, job in enumerate(jobs):
        for k in range(len(job) - 1):
            row([(idx[(j, k + 1)], 1), (idx[(j, k)], -1)], dur[idx[(j, k)]], np.inf)
        row([(n, 1), (idx[(j, len(job) - 1)], -1)], dur[idx[(j, len(job) - 1)]], np.inf)
    for p, (a, b) in enumerate(pairs):
        y = n + 1 + p
        row([(b, 1), (a, -1), (y, -M)], dur[a] - M, np.inf)          # y = 1：s_b >= s_a + d_a
        row([(a, 1), (b, -1), (y, M)], dur[b], np.inf)               # y = 0：s_a >= s_b + d_b
    c = np.zeros(nv)
    c[n] = 1
    return c, np.array(A), np.array(lo), np.array(hi), n, len(pairs), M


def mip_jobshop(jobs):
    """大 M 的析取模型，返回最优的最大完工时间（整数）。"""
    c, A, lo, hi, n, npair, M = _mip_parts(jobs)
    integrality = np.zeros(len(c))
    integrality[n + 1:] = 1
    ub = np.concatenate([np.full(n + 1, M), np.ones(npair)])
    res = milp(c, constraints=LinearConstraint(A, lo, hi), integrality=integrality, bounds=Bounds(np.zeros(len(c)), ub))
    return int(round(res.fun))


def mip_lp_bound(jobs):
    """同一个模型的 LP 松弛值（y 取 [0, 1] 内的小数）。"""
    c, A, lo, hi, n, npair, M = _mip_parts(jobs)
    ub = np.concatenate([np.full(n + 1, M), np.ones(npair)])
    res = milp(c, constraints=LinearConstraint(A, lo, hi), integrality=np.zeros(len(c)), bounds=Bounds(np.zeros(len(c)), ub))
    return float(res.fun)


def cp_jobshop(jobs):
    """CP-SAT：区间变量 + 每台机器的 NoOverlap，返回最优的最大完工时间。"""
    from ortools.sat.python import cp_model
    model = cp_model.CpModel()
    horizon = sum(d for job in jobs for _, d in job)
    by_machine = {}
    ends = []
    for j, job in enumerate(jobs):
        prev_end = None
        for k, (m, d) in enumerate(job):
            s = model.NewIntVar(0, horizon, f"s{j}_{k}")
            e = model.NewIntVar(0, horizon, f"e{j}_{k}")
            iv = model.NewIntervalVar(s, d, e, f"i{j}_{k}")
            by_machine.setdefault(m, []).append(iv)
            if prev_end is not None:
                model.Add(s >= prev_end)
            prev_end = e
        ends.append(prev_end)
    for ivs in by_machine.values():
        model.AddNoOverlap(ivs)
    cmax = model.NewIntVar(0, horizon, "cmax")
    model.AddMaxEquality(cmax, ends)
    model.Minimize(cmax)
    solver = cp_model.CpSolver()
    solver.parameters.num_workers = 1
    solver.parameters.random_seed = 1
    status = solver.Solve(model)
    assert status == cp_model.OPTIMAL
    return int(solver.ObjectiveValue())
