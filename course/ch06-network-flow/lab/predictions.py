"""练习 1 的预测题与标准答案（判分与终端对照表共用）。"""
EXPECTED = {
    "dijkstra_neg": ("在 CANON_NEG（多了一条 c→b、费用 −4 的弧）上，Dijkstra 给出的 S→T 距离对吗？", "WRONG"),
    "bellman_neg": ("同一张图上，Bellman–Ford 给出的距离对吗？", "RIGHT"),
    "johnson_neg": ("同一张图上，Johnson（先算势再 Dijkstra）给出的距离对吗？", "RIGHT"),
    "dijkstra_negcycle": ("图里有负环时，Dijkstra 会报错吗？（“会”记 RIGHT，“不会，直接给一个数”记 WRONG）", "WRONG"),
}
