"""练习 1 的预测题与标准答案（判分与终端对照表共用）。"""
EXPECTED = {
    "knap_frac_count": ("背包的 LP 松弛，最优解里最多有几个变量是分数？", "1"),
    "knap_lp_vs_opt": ("背包的整数最优，一定等于 LP 上界向下取整吗？（YES / NO）", "NO"),
    "gap_loose": ("把每辆车的载重放到足够大（约束不起作用），GAP 的 LP 解是整数吗？（YES / NO）", "YES"),
    "gap_tight": ("载重收紧到有的任务放不下时，GAP 的 LP 值一定等于整数最优吗？（YES / NO）", "NO"),
}
