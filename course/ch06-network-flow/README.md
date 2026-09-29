# 第 6 章 最短路与网络流：网络矩阵为什么不需要分支

第二部分“组合优化”的第二章。把第 5 章匈牙利算法里的“最短路加价格”放回一般的网络：最短路、最大流、最小费用流，证明点弧关联矩阵全单模，再弄清哪种加法会让整数性失效（共用限额、多商品流）。

## 内容

| 节 | 主题 | 交互图 |
|---|---|---|
| 6.1 | 最短路与 Dijkstra | 图 6-1 三种算法在同一张网络上逐步回放（可加负费用弧、负环） |
| 6.2 | 负费用、势与 Johnson | 同上（切换 Bellman–Ford、Johnson） |
| 6.3 | 最大流与最小割 | 图 6-2 增广路、残量图与回退弧、最小割；最短增广路与随手选的对比 |
| 6.4 | 最小费用流 | 图 6-3 滑块选流量：逐次最短路、势、凸的费用曲线 |
| 6.5 | 网络矩阵与整数性 | 图 6-4 点弧关联矩阵的全单模检查；加一行共用限额后 LP 与整数最优的差 |
| 6.6 | 多商品流 | 图 6-5 三个商品、两个三角形：LP 值 6，整数无解 |
| 6.7 | 在项目里的位置 | — |
| 6.8–6.9 | 小结、Lab、自测 | — |

页面本身是一个发布用的 HTML 片段：[page/dist/ch06-network-flow.html](page/dist/ch06-network-flow.html)。

## 目录

```
page/
  src/                  页面源码：正文 body1–3.html、样式 ch6.css、脚本、数据
    core6.js            本章内核：Dijkstra、Bellman–Ford、Johnson、最大流、最小费用流、网络 LP、多商品流
    netview.js          网络图的通用画法
    fig1–5.js main.js   每个图一个文件；预测与自测
  build.py              拼成 dist/ch06-network-flow.html（发布用）和 dist/preview.html（本地预览）
                        通用部件（shared.css、ch5.css、core.js、core2.js、core5.js、ui.js）直接引用 ../ch05-assignment/page/src
  tests/
    core6.test.js       Node 对拍测试（读取 fixtures.json）
    fixtures.json       由 Python 生成的期望值（Floyd、枚举割、linprog、numpy 枚举行列式）
    browser_check.py    无头 Chromium 检查：控制台错误、横向溢出、每个图的关键数字、截图
lab/                    Lab 代码包（5 个练习 + 1 个挑战 + 参考答案 + pytest）
tools/
  gen_data.py           生成 page/src/data.json（网络、加一行以后的 LP/整数最优表、环境版本）
  gen_fixtures.py       生成 page/tests/fixtures.json
  make_lab_zip.py       打包 Lab：dist/ch06-network-flow-lab.zip
```

## 重新构建与测试

```bash
pip install numpy scipy pytest playwright        # playwright 只用于浏览器检查
python3 tools/gen_data.py                        # 可选：重新生成静态数据
python3 page/build.py                            # 生成 page/dist/*.html
node --test page/tests/core6.test.js             # JS 内核与 Python 夹具对拍
python3 tools/gen_fixtures.py                    # 可选：重新生成夹具
python3 page/tests/browser_check.py              # 需要 chromium；输出截图到 page/dist/shots
```

## Lab

```bash
cd lab
pip install -r requirements.txt
pytest -q                          # 你的练习（起初全部失败，因为还没写）
LAB_TARGET=solutions pytest -q     # 参考答案，应当全部通过
```

| 练习 | 内容 | 对应 |
|---|---|---|
| ex1 | 最短路：Dijkstra（遇负费用抛异常）、Bellman–Ford（返回负环）、Johnson；先填 4 个预测 | 6.1–6.2 |
| ex2 | 最大流：残量图、Edmonds–Karp 与随手选两种选路规则，同时返回最小割 | 6.3 |
| ex3 | 最小费用流：逐次最短路加势，支持负费用，返回势作为最优性证书；费用曲线 | 6.4 |
| ex4 | 把指派写成网络并解出 124 s；点容量的拆点变换 | 6.4、6.7 |
| ex5 | 审 5 个“AI 写的”最大流函数（`ai_solvers.py`）：不看源码，只靠运行结果归类问题 | 6.3 |
| 挑战 | 循环取消：找残量图里的负环，逐步降低费用，与逐次最短路对拍 | 6.4 |

## 对拍了什么

- 最短路：60 张非负随机图的 Dijkstra、60 张含负费用（无负环）随机图的 Bellman–Ford 与 Johnson，都与 Floyd–Warshall 一致；30 张含负环的图，报出的环真的是负的。
- 最大流：80 张随机网络，两种选路规则的值都等于枚举全部割得到的最小割；流合法；割的容量等于流量。
- 最小费用流：80 张随机网络（40% 含负费用），每个整数流量的最小费用与 `linprog` 一致；费用曲线凸；返回的势通过证书检查。
- 全单模：点弧关联矩阵及加一行之后的行列式分布，与 numpy 的独立枚举逐项一致（8007 与 19447 个方子式）。
- 多商品流：三角形算例的 LP 值 6（分数解），整数无解（枚举 8 种方案，并用 HiGHS 核对）。
- 默认网络的黄金数字：S 到 T 最短 7（加 c→b 后 Dijkstra 7、正确值 6）；最大流 12 = 最小割 {S,a,b}；最小费用流 12 个单位的边际成本 7×4、8×2、9×4、10×2，总费用 100。
