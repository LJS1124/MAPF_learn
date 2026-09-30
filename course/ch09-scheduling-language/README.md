# 第 9 章 调度问题的语言：一句话说清是什么问题，有多难

第三部分“调度理论”的第一章。学会读写三段式记号 α | β | γ，看清各个目标（C<sub>max</sub>、ΣC<sub>j</sub>、Σw<sub>j</sub>C<sub>j</sub>、L<sub>max</sub>、ΣT<sub>j</sub>、ΣU<sub>j</sub>）偏爱的排法，并用“特例与推广”推理一个问题的复杂度。

## 内容

| 节 | 主题 | 交互图 |
|---|---|---|
| 9.1 | 什么是调度问题 | 作业、机器、调度、甘特图；本章的 6 个托盘一台提升机的例子 |
| 9.2 | 三段式记号 | 表与例子 |
| 9.3 | 目标函数 | 图 9-1 同一台提升机上换顺序：7 个目标的当前值与枚举最优；SPT/WSPT/EDD/Moore 各自最优 |
| 9.4 | 机器环境 | 图 9-2 单机、P2、Q2、R2 上的列表调度与最优 C<sub>max</sub> |
| 9.5 | 复杂度地图 | 图 9-3 拼一个 α \| β \| γ，得到分类与理由；（机器 × 目标）的地图 |
| 9.6 | 在项目里的位置 | 场景到记号的对照表 |
| 9.7–9.8 | 小结、Lab、自测 | — |

页面本身是一个发布用的 HTML 片段：[page/dist/ch09-scheduling-language.html](page/dist/ch09-scheduling-language.html)；离线阅读版在 [../offline/](../offline/)。

## 目录

```
page/
  src/                  页面源码：正文 body1–3.html、样式 ch9.css、脚本、数据
    core9.js            本章内核：目标函数评估与枚举、规则（SPT/WSPT/EDD/Moore）、并行机列表调度、记号解析、复杂度推理
    fig1–3.js util9.js main.js
  build.py              拼成 dist/ch09-scheduling-language.html；通用部件引用 ../ch05-assignment/page/src
  tests/                core9.test.js（Node 对拍）、fixtures.json、browser_check.py
lab/                    Lab 代码包（5 个练习 + 1 个挑战 + 参考答案 + pytest）；complexity_table.py 是练习 4 用的已知结果表
tools/                  gen_data.py、gen_fixtures.py、make_lab_zip.py
```

## 重新构建与测试

```bash
pip install numpy pytest playwright
python3 tools/gen_data.py
python3 page/build.py
node --test page/tests/core9.test.js
python3 tools/gen_fixtures.py                    # 可选（内部用参考答案的复杂度推理）
python3 page/tests/browser_check.py              # 需要 chromium
python3 ../tools/build_offline.py ch09           # 离线版
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
| ex1 | 单机目标函数的评估（含释放时间）与枚举最优；先填 4 个预测 | 9.1、9.3 |
| ex2 | 并行机列表调度（P/Q/R 通用）、枚举最优 C<sub>max</sub>、下界 | 9.4 |
| ex3 | 解析 α \| β \| γ；“是不是特例” | 9.2、9.5 |
| ex4 | 用已知结果表沿特例与推广推理复杂度 | 9.5 |
| ex5 | 审 5 个“AI 写的”目标计算函数 | 9.3 |
| 挑战 | ΣC<sub>j</sub> 与 L<sub>max</sub> 的帕累托前沿 | 9.3 |

## 对拍了什么

- 目标函数：40 个随机实例（一半有释放时间）的 7 个指标与独立实现一致；枚举得到的各目标最小值一致。
- 并行机：30 个随机实例，枚举最优 C<sub>max</sub> 一致；列表调度满足负荷守恒且不优于最优。
- 复杂度地图：页面的推理（JS）与参考答案的推理（Python）在全部 2816 个（机器 × β 子集 × 目标）组合上给出完全相同的分类；表内不自相矛盾。
- 页面数字：SPT 的 ΣC = 84、WSPT 的 Σw<sub>j</sub>C<sub>j</sub> = 234、EDD 的 L<sub>max</sub> = 7、Moore 的 ΣU<sub>j</sub> = 1；帕累托前沿 8 点；P2 列表调度 16、最优 15。
