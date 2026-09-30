"""挑战参考答案"""


def two_opt(D, tour):
    tour = list(tour)
    n = len(tour)
    steps = []
    improved = True
    while improved:
        improved = False
        for i in range(1, n - 1):
            for j in range(i + 1, n):
                a, b, c, d = tour[i - 1], tour[i], tour[j], tour[(j + 1) % n]
                delta = D[a][c] + D[b][d] - D[a][b] - D[c][d]
                if delta < 0:
                    tour[i:j + 1] = tour[i:j + 1][::-1]
                    steps.append(delta)
                    improved = True
                    break
            if improved:
                break
    return {"tour": tour, "steps": steps}
