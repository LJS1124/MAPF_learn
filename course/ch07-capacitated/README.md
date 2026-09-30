# 第 7 章 带容量的指派与背包：LP 不再自带整数解

第二部分“组合优化”的第三章。第 5、6 章的问题约束矩阵全单模，LP 直接给整数解。这一章给车加上载重上限，第一次碰到例外：0-1 背包的 LP 上界与分支定界，广义指派（GAP）为什么不再自带整数解，覆盖割怎样把根节点的下界拉近整数最优，以及装载（装箱）里启发式与最优的差距。

## 内容

| 节 | 主题 | 交互图 |
|---|---|---|
| 7.1 | 背包与 LP 上界 | 图 7-1 拖动载重：Dantzig 上界与整数最优（DP）的对比 |
| 7.2 | 背包的分支定界 | 图 7-2 逐个节点回放搜索树：分支、剪枝、整数解 |
| 7.3 | 广义指派：载重让整数性消失 | 图 7-3 拖动每辆车的载重：LP 值、整数最优、分数任务 |
| 7.4 | 覆盖割 | 图 7-4 根节点割平面循环：下界 220 → 229 → 233（整数最优 234），分支定界节点数 55 → 23 |
| 7.5 | 装载与启发式 | 图 7-5 FFD 与最优车次、下界 |
| 7.6 | 在项目里的位置 | — |
| 7.7–7.8 | 小结、Lab、自测 | — |

页面本身是一个发布用的 HTML 片段：[page/dist/ch07-capacitated.html](page/dist/ch07-capacitated.html)；离线阅读版在 [../offline/](../offline/)。

## 目录

```
page/
  src/                  页面源码：正文 body1–3.html、样式 ch7.css、脚本、数据
    core7.js            本章内核：背包上界/DP/分支定界、GAP 的 LP/枚举/覆盖割循环/分支定界、装箱
    gapview.js          广义指派表格的画法
    fig1–5.js main.js   每个图一个文件；预测与自测
  build.py              拼成 dist/ch07-capacitated.html；通用部件（shared.css、ch5.css、core*.js、ui.js）引用 ../ch05-assignment/page/src
  tests/
    core7.test.js       Node 对拍测试（读取 fixtures.json）
    fixtures.json       由 Python 生成的期望值（暴力枚举、DP、linprog）
    browser_check.py    无头 Chromium 检查
lab/                    Lab 代码包（5 个练习 + 1 个挑战 + 参考答案 + pytest）
tools/
  gen_data.py           生成 page/src/data.json
  gen_fixtures.py       生成 page/tests/fixtures.json
  make_lab_zip.py       打包 Lab
```

## 重新构建与测试

```bash
pip install numpy scipy pytest playwright
python3 tools/gen_data.py
python3 page/build.py
node --test page/tests/core7.test.js
python3 tools/gen_fixtures.py                    # 可选：重新生成夹具
python3 page/tests/browser_check.py              # 需要 chromium
python3 ../tools/build_offline.py ch07           # 离线版（单文件网页 + PDF）
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
| ex1 | 背包：Dantzig 上界（支持固定变量）与动态规划；先填 4 个预测 | 7.1 |
| ex2 | 背包的分支定界：按规定的规则，节点数要与判分数据一致（页面例子 15） | 7.2 |
| ex3 | 广义指派：LP 松弛（可带割）与回溯枚举 | 7.3 |
| ex4 | 覆盖割：分离极小覆盖，根节点割平面循环；验证割对每个整数可行解有效 | 7.4 |
| ex5 | 审 5 个“AI 写的”GAP 函数（`ai_solvers.py`） | 7.3 |
| 挑战 | 松弛载重的拉格朗日下界：次梯度上升，追近 LP 值 | 7.4 |

## 对拍了什么

- 背包：60 个随机背包，LP 上界与 `linprog`、DP 与分支定界与暴力枚举一致；LP 至多一个分数变量。
- GAP：40 个随机实例，LP 值与 `linprog`、整数最优与暴力枚举一致；覆盖割下界只增不减、不超过整数最优，且每个整数可行派法都满足所有割。
- 装箱：50 个随机实例，FFD、回溯最优与独立实现一致；FFD ≥ 最优 ≥ 下界。
- 默认数字：背包（载重 22）LP 106.857、最优 104、分支定界 15 个节点；GAP LP 220、整数最优 234，覆盖割三轮 220 → 229 → 233（4 条割），分支定界节点数 55 → 23；装箱 FFD 4、最优 3。
