"""复杂度结果表（教材中的经典结果，Pinedo、Brucker），练习 4 直接使用，不要修改。

每一项：(机器环境, β 约束, 目标, 状态, 说明)。状态：P 多项式；W 弱 NP 难（有伪多项式算法）；NP 强 NP 难（或 NP 难）。
β 用逗号分隔的字符串（可为空），元素取自 r / prec / prmp / d / s，顺序不限（使用时请排序）。
"""
BASE = [
    [ "1", "", "Cmax", "P", "任意顺序，O(n)" ],
    [ "1", "", "sumC", "P", "SPT（最短加工时间优先）" ],
    [ "1", "", "sumwC", "P", "WSPT（Smith 规则）" ],
    [ "1", "", "Lmax", "P", "EDD（最早交货期优先，Jackson）" ],
    [ "1", "", "sumU", "P", "Moore–Hodgson，O(n log n)" ],
    [ "1", "", "sumwU", "W", "背包问题的推广，伪多项式动态规划" ],
    [ "1", "", "sumT", "W", "Du–Leung 1990；Lawler 的伪多项式动态规划" ],
    [ "1", "", "sumwT", "NP", "强 NP 难（Lawler 1977；Lenstra 等 1977）" ],
    [ "1", "r", "Cmax", "P", "按释放时间排序" ],
    [ "1", "r", "Lmax", "NP", "强 NP 难" ],
    [ "1", "r", "sumC", "NP", "强 NP 难" ],
    [ "1", "prec", "Lmax", "P", "Lawler 的从后往前排" ],
    [ "1", "prec", "sumwC", "NP", "强 NP 难" ],
    [ "1", "prmp,r", "sumC", "P", "SRPT（剩余加工时间最短优先）" ],
    [ "1", "prmp,r", "Lmax", "P", "可中断的 EDD" ],
    [ "P2", "", "Cmax", "W", "由划分问题推出；伪多项式动态规划" ],
    [ "P", "", "Cmax", "NP", "强 NP 难（3-划分）；LPT 有 4/3 的近似比" ],
    [ "P", "", "sumC", "P", "SPT 轮流派" ],
    [ "P", "", "sumwC", "NP", "NP 难" ],
    [ "P", "prmp", "Cmax", "P", "McNaughton 的绕圈法" ],
    [ "P", "prec", "Cmax", "NP", "强 NP 难" ],
    [ "Q", "", "sumC", "P", "Horn 1973，化成指派问题" ],
    [ "R", "", "sumC", "P", "化成指派问题（第 5 章）" ],
    [ "R", "", "Cmax", "NP", "强 NP 难；Lenstra–Shmoys–Tardos 的 2 倍近似" ],
    [ "F2", "", "Cmax", "P", "Johnson 规则（第 11 章）" ],
    [ "F2", "", "sumC", "NP", "强 NP 难" ],
    [ "F", "", "Cmax", "NP", "m ≥ 3 强 NP 难（Garey 等 1976）" ],
    [ "J2", "", "Cmax", "P", "Jackson 规则" ],
    [ "J", "", "Cmax", "NP", "m ≥ 3 强 NP 难" ],
    [ "O2", "", "Cmax", "P", "Gonzalez–Sahni" ],
    [ "O", "", "Cmax", "NP", "m ≥ 3 NP 难" ]
]

# “A 是 B 的特例”的边：难度沿边向更一般的方向只增不减
A_EDGES = [["1","P2"],["P2","P"],["P","Q"],["Q","R"],["1","F2"],["F2","F"],["F2","J2"],["J2","J"],["F","J"],["1","O2"],["O2","O"]]
G_EDGES = [["Cmax","Lmax"],["sumC","sumwC"],["sumC","sumT"],["sumT","sumwT"],["sumwC","sumwT"],["sumU","sumwU"]]
BETA_ORDER = ["r", "prec", "prmp", "d", "s"]
