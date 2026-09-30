"""练习 1 的预测题与标准答案（判分与终端对照表共用）。"""
EXPECTED = {
    "johnson_f2": ("两台机器的流水车间 F2 | | C_max，有多项式算法（Johnson 规则）吗？（YES / NO）", "YES"),
    "johnson_f3": ("三台机器的流水车间 F3 | | C_max，Johnson 规则还能保证最优吗？（YES / NO）", "NO"),
    "js_all_feasible": ("作业车间里，给每台机器任意选一个作业顺序，得到的排法都可行吗（不产生循环等待）？（YES / NO）", "NO"),
    "cp_vs_mip": ("同一个作业车间问题，CP（区间变量 + NoOverlap）和大 M 的 MIP 建出来的模型，求解结果会不同吗？（最优值相同 / 不同）", "相同"),
}
