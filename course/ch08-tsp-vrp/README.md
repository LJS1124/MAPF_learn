# 第 8 章 旅行商与车辆路径入门：约束多到写不完时怎么办

第二部分“组合优化”的最后一章。TSP 的模型 = 第 5 章的指派 + “连成一个圈”，后者需要指数多的约束。两种应对：不一次写完、需要时用最大流分离再加（割平面），或者引入辅助变量压成多项式个（MTZ，但下界弱）。再把载重加进来，得到车辆路径问题（CVRP）的骨架，最后看最近邻与 2-opt。

## 内容

| 节 | 主题 | 交互图 |
|---|---|---|
| 8.1 | 旅行商与指派松弛 | 图 8-1 指派松弛的解（4 个小回路，198）与最优回路（255） |
| 8.2 | 子回路消除的割平面 | 图 8-2 割平面循环 198 → 219 → 235 → 255，用最大流分离；共 6 条约束（完整的有 247 条） |
| 8.3 | MTZ 与模型的强弱 | 图 8-3 指派松弛、MTZ、子回路约束的下界，客户数可调 |
| 8.4 | 车辆路径的骨架 | 图 8-4 CVRP：最优 360 与扫描法 419 |
| 8.5 | 启发式与局部搜索 | 图 8-5 最近邻 290 → 2-opt 262 → 最优 255 |
| 8.6 | 在项目里的位置 | — |
| 8.7–8.8 | 小结、Lab、自测 | — |

页面本身是一个发布用的 HTML 片段：[page/dist/ch08-tsp-vrp.html](page/dist/ch08-tsp-vrp.html)；离线阅读版在 [../offline/](../offline/)。

## 目录

```
page/
  src/                  页面源码：正文 body1–3.html、样式 ch8.css、脚本、数据
    core8.js            本章内核：Held–Karp、指派 LP、最大流分离与割平面循环、MTZ、最近邻/2-opt、CVRP 子集 DP、扫描法
    mapview.js          点与弧的画法
    fig1–5.js main.js   每个图一个文件；预测与自测
  build.py              拼成 dist/ch08-tsp-vrp.html；通用部件引用 ../ch05-assignment/page/src
  tests/                core8.test.js（Node 对拍）、fixtures.json、browser_check.py
lab/                    Lab 代码包（5 个练习 + 1 个挑战 + 参考答案 + pytest）
tools/                  gen_data.py、gen_fixtures.py、make_lab_zip.py
```

## 重新构建与测试

```bash
pip install numpy scipy pytest playwright
python3 tools/gen_data.py
python3 page/build.py
node --test page/tests/core8.test.js
python3 tools/gen_fixtures.py                    # 可选
python3 page/tests/browser_check.py              # 需要 chromium
python3 ../tools/build_offline.py ch08           # 离线版
```

## Lab

```bash
cd lab
pip install -r requirements.txt
pytest -q                          # 你的练习（起初全部失败）
LAB_TARGET=solutions pytest -q     # 参考答案，应当全部通过
```

| 练习 | 内容 | 对应 |
|---|---|---|
| ex1 | Held–Karp、指派松弛与拆回路；先填 4 个预测 | 8.1 |
| ex2 | 用最大流分离子回路约束，手写割平面循环；停下时的值等于完整约束的 LP | 8.2 |
| ex3 | MTZ 的 LP；验证 指派 ≤ MTZ ≤ 子回路 ≤ 最优 | 8.3 |
| ex4 | CVRP：检查路线、子集动态规划、扫描法 | 8.4 |
| ex5 | 审 5 个“AI 写的”旅行商函数 | 8.1 |
| 挑战 | 2-opt：按规定的扫描顺序，步数与页面一致 | 8.5 |

## 对拍了什么

- Held–Karp 与暴力枚举一致（30 个随机实例）；指派松弛、MTZ 的 LP 与 `linprog` 一致；割平面循环停下时的值等于加入全部子回路约束的 LP（与路径无关的唯一值）；下界顺序 指派 ≤ MTZ ≤ 子回路 ≤ 最优。
- CVRP：25 个随机实例，子集动态规划与暴力枚举一致。
- 页面数字：最优 255，指派 198（4 个回路），割循环 198 → 219 → 235 → 255（6 条约束），MTZ 203.25；CVRP 最优 360、扫描法 419；最近邻 290、2-opt 262。
