# 第 11 章 流水车间与作业车间：作业要走过好几台机器

第三部分“调度理论”的第三章。流水车间里所有作业走同样的机器次序：F2 有 Johnson 规则，F3 起是强 NP 难，用 NEH 启发式。作业车间里每个作业有自己的路线：用析取图表示，选定机器顺序后 C<sub>max</sub> 是最长路，有环即不可行。最后把同一个作业车间问题写成大 M 的 MIP 和 CP-SAT 两种模型，比较松弛强度与求解速度。

## 内容

| 节 | 主题 | 交互图 |
|---|---|---|
| 11.1 | 流水车间与 Johnson 规则 | 图 11-1 两台机器的甘特图，可手动调整顺序，套用 Johnson、最优、最差顺序（35 → 31，最差 41） |
| 11.2 | 三台以上：NEH | 图 11-2 NEH 逐步插入，点候选位置预览（52 → 44，最优 42） |
| 11.3 | 作业车间与析取图 | 图 11-3 选每台机器的作业顺序，看析取图、关键路径、甘特图，有环时给出环（21、最优 13、下界 12、216 种中 63 种可行） |
| 11.4 | MIP 与 CP-SAT | 表 11-1 实测对比（3×3 到 12×10），LP 松弛 9.0 对最优 13；Lab 参考实现的代码清单 |
| 11.5 | 在项目里的位置 | 入库 → 提升机 → 出库 = F3；有限缓冲、准备时间、陆续到达 |
| 11.6–11.7 | 小结、Lab、自测 | — |

页面本身是一个发布用的 HTML 片段：[page/dist/ch11-shop-scheduling.html](page/dist/ch11-shop-scheduling.html)；离线阅读版在 [../offline/](../offline/)。

## 目录

```
page/
  src/                  页面源码：正文 body1–3.html、样式 ch11.css、脚本、数据
    core11.js           本章内核：流水车间递推、Johnson、NEH、析取图求值（最长路与环检测）、作业车间枚举最优
    fig1–4.js util11.js main.js
  build.py              拼成 dist/ch11-shop-scheduling.html；通用部件引用 ../ch05-assignment/page/src
  tests/                core11.test.js（Node 对拍）、fixtures.json、browser_check.py
lab/                    Lab 代码包（5 个练习 + 1 个挑战 + 参考答案 + pytest）
tools/                  gen_data.py、gen_fixtures.py、make_lab_zip.py
```

## 重新构建与测试

```bash
pip install numpy scipy ortools pytest playwright
LAB_TARGET=solutions python3 tools/gen_data.py   # 会跑 MIP 与 CP-SAT 的对比（约 1–2 分钟）
python3 page/build.py
node --test page/tests/core11.test.js
python3 tools/gen_fixtures.py                    # 可选
python3 page/tests/browser_check.py              # 需要 chromium
python3 ../tools/build_offline.py ch11           # 离线版
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
| ex1 | 流水车间完工时间递推、Johnson 规则；先填 4 个预测 | 11.1 |
| ex2 | NEH，并列取靠前的位置 | 11.2 |
| ex3 | 析取图求值：给定机器顺序返回 C<sub>max</sub>，有环返回 None | 11.3 |
| ex4 | 大 M 的 MIP、LP 松弛值、CP-SAT，最优值必须相同 | 11.4 |
| ex5 | 审 5 个“AI 写的”流水车间函数 | 11.1 |
| 挑战 | 派工规则：最早能开始的工序优先，并列取时间短的，再取下标小的（例子得 15，最优 13） | 11.5 |

## 对拍了什么

- 流水车间：递推与暴力枚举一致；F2 的 Johnson 顺序取得枚举最优（随机实例）；页面例子 35 → 31，最差 41，最优顺序共 12 个。
- NEH：页面例子的每一步候选 C<sub>max</sub>（19；28、26；29、29、40；33、33、33、39；41、40、38、38、42；44 × 6）与 Python 实现一致，最终 44，枚举最优 42。
- 作业车间：析取图求值与 Python 一致；216 种机器顺序中 63 种无环，最优 13（三台机器的顺序 M1：J2 J3 J1；M2：J3 J2 J1；M3：J2 J1 J3），下界 12，全按 J1、J2、J3 得 21。
- MIP 与 CP-SAT：3 × 3、5 × 5、8 × 8 上最优值相同；LP 松弛 9.0；10 × 10、12 × 10 上 MIP 限时 30 秒未证明最优，CP-SAT 在 0.1 秒内证明（用时依赖机器）。
