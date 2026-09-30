"""挑战参考答案"""


def lagrange_bound(C, w, Q, ub, iters=400):
    """松弛载重约束：L(λ) = Σ_j min_i (C[i][j] + λ_i w_j) − Σ_i λ_i Q_i，λ >= 0。次梯度上升。返回 (最好的 L, λ)。"""
    m, n = len(C), len(w)
    lam = [0.0] * m
    best, best_lam = float("-inf"), lam[:]
    for _ in range(iters):
        load = [0.0] * m
        val = -sum(lam[i] * Q[i] for i in range(m))
        for j in range(n):
            i = min(range(m), key=lambda i: (C[i][j] + lam[i] * w[j], i))
            val += C[i][j] + lam[i] * w[j]
            load[i] += w[j]
        if val > best:
            best, best_lam = val, lam[:]
        g = [load[i] - Q[i] for i in range(m)]
        gg = sum(x * x for x in g)
        if gg == 0:
            break
        step = (ub - val) / gg
        lam = [max(0.0, lam[i] + step * g[i]) for i in range(m)]
    return best, best_lam
