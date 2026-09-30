# 第 10 章 单机与并行机：一条规则为什么就是最优

第三部分“调度理论”的第二章。用交换论证证明 SPT、WSPT、EDD 分别是 ΣC<sub>j</sub>、Σw<sub>j</sub>C<sub>j</sub>、L<sub>max</sub> 的最优规则，Moore–Hodgson 让延误作业最少；再看并行机上列表调度（2 − 1/m）与 LPT（4/3 − 1/(3m)）的近似比，可中断时的 McNaughton 绕圈法，以及 P2 || C<sub>max</sub> 的伪多项式动态规划（弱 NP 难）。

## 内容

| 节 | 主题 | 交互图 |
|---|---|---|
| 10.1 | 交换论证与三条规则 | 图 10-1 相邻交换的动画：匹配的规则从不让目标变差，不匹配的会变差 |
| 10.2 | Moore–Hodgson | 图 10-2 两个例子的逐步过程（延误 1 个与 3 个） |
| 10.3 | 并行机：列表调度有多差 | 图 10-3 列表调度与 LPT 的最坏实例（比值 2 − 1/m、4/3 − 1/(3m)），m 可调 |
| 10.4 | 可中断与弱 NP 难 | 图 10-3 的绕圈法模式；P2 的子集和动态规划（Lab 挑战） |
| 10.5 | 在项目里的位置 | 场景到规则的对照表 |
| 10.6–10.7 | 小结、Lab、自测 | — |

页面本身是一个发布用的 HTML 片段：[page/dist/ch10-single-parallel.html](page/dist/ch10-single-parallel.html)；离线阅读版在 [../offline/](../offline/)。

## 目录

```
page/
  src/                  页面源码：正文 body1–3.html、样式 ch10.css、脚本、数据
    core10.js           本章内核（在第 9 章 core9.js 之上扩展）：相邻交换路径、Moore 过程、最坏实例与其最优排法、绕圈法、P2 的子集和 DP
    fig1–3.js util10.js main.js
  build.py              拼成 dist/ch10-single-parallel.html；通用部件引用 ../ch05-assignment/page/src 与 ../ch09-scheduling-language/page/src
  tests/                core10.test.js（Node 对拍）、fixtures.json、browser_check.py
lab/                    Lab 代码包（5 个练习 + 1 个挑战 + 参考答案 + pytest）
tools/                  gen_data.py、gen_fixtures.py、make_lab_zip.py
```

## 重新构建与测试

```bash
pip install numpy pytest playwright
python3 tools/gen_data.py
python3 page/build.py
node --test page/tests/core10.test.js
python3 tools/gen_fixtures.py                    # 可选
python3 page/tests/browser_check.py              # 需要 chromium
python3 ../tools/build_offline.py ch10           # 离线版
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
| ex1 | SPT、WSPT、EDD；先填 4 个预测 | 10.1 |
| ex2 | Moore–Hodgson | 10.2 |
| ex3 | 相邻交换的变化量；冒泡式交换到规则顺序，每步不变差 | 10.1 |
| ex4 | LPT、列表调度、最坏实例（2m−1 与 4m−1）、McNaughton 绕圈法 | 10.3、10.4 |
| ex5 | 审 5 个“AI 写的”单机排序规则 | 10.1、10.2 |
| 挑战 | P2 \|\| C<sub>max</sub> 的子集和动态规划，300 个作业也很快 | 10.4 |

## 对拍了什么

- 三条规则与 Moore–Hodgson：40 个随机实例取得枚举最优；相邻交换：匹配的目标从不变差，最终顺序是规则顺序，交换次数等于逆序对个数。
- 并行机：Graham 界与 LPT 界在 30 个随机实例上成立（枚举最优）；两个最坏实例的比值为 (2m−1)/m 与 (4m−1)/(3m)（m = 2…6），最优排法是构造的，并在 m ≤ 3 时用枚举核对。
- McNaughton：C = max(最长, 总量/m)，每台机器不超过 C，每个作业总时间正确，同一作业的两段不重叠；P2 的子集和 DP 与枚举一致。
- 页面数字：SPT 的 ΣC 路径 104 → 84（7 步）；WSPT 8 步 322 → 234；EDD 的 L<sub>max</sub> 16 → 7；Moore 例 1 延误 1 个、例 2 延误 3 个；m = 4 时列表调度 7 / 4，LPT 15 / 12。
