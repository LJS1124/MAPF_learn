# 第 5 章 指派问题与匈牙利算法：LP 为什么自带整数解

第二部分“组合优化”的第一章。第 2 章的涨价拍卖只讲了思路，这一章把它写成完整的算法（一次加一个任务，沿一条改派链调整），证明指派约束矩阵全单模，再弄清楚加上哪种约束它就会失效。

## 内容

| 节 | 主题 | 交互图 |
|---|---|---|
| 5.1 | 任务陆续到达：一条改派链 | 图 5-1 地图上逐个放任务，看改派链与边际成本 |
| 5.2 | 一次插入的内部：约化成本上的最短路 | 图 5-2 Dijkstra 回放（标签、扫描、涨价、翻转） |
| 5.3 | 写成代码：O(n³) 是怎么来的 | 图 5-3 扫描/松弛次数的双对数图 + 实测耗时表 |
| 5.4 | 为什么 LP 自带整数解：全单模 | 图 5-4 全单模检查器（枚举全部方子式，找反例） |
| 5.5 | 加一行，整数性就没了：冲突对与奇圈 | 图 5-5 冲突对的 LP 与拉格朗日下界；三角形组队与奇集割 |
| 5.6 | 真实派车里的变形：车不够、走不通、可以等 | 图 5-6 延后罚金与虚拟车；禁行、Hall 证书与“1e6 写法” |
| 5.7 | 换个目标：最晚到达、Hall 证书与折中 | 图 5-7 阈值加匹配与帕累托阶梯 |
| 5.8–5.9 | 小结、Lab、自测 | — |

页面本身是一个发布用的 HTML 片段：[page/dist/ch05-assignment.html](page/dist/ch05-assignment.html)。

## 目录

```
page/
  src/                  页面源码：正文 body1–3.html、样式、脚本、数据
    core.js core2.js    第 1、2 章页面的计算内核（原样复用：几何、枚举、单纯形、匈牙利）
    core5.js            本章新增的内核：增量匈牙利、方子式行列式、带附加行的 LP、瓶颈与 Hall、变形包装…
    ui.js fig1–7.js     页面脚本（每个图一个文件）
  build.py              把 src 拼成 dist/ch05-assignment.html（发布用片段）和 dist/preview.html（本地预览）
  tests/
    core5.test.js       Node 对拍测试（读取 fixtures.json）
    fixtures.json       由 Python 生成的期望值（SciPy、暴力枚举、linprog、numpy）
    browser_check.py    无头 Chromium 检查：控制台错误、横向溢出、每个图的关键数字、截图
lab/                    Lab 代码包（5 个练习 + 1 个挑战 + 参考答案 + pytest）
tools/
  gen_data.py           生成 page/src/data.json（场景、环境版本、实测耗时）
  gen_cx.js             复杂度实验的静态序列（build.py 调用）
  gen_fixtures.py       生成 page/tests/fixtures.json
  make_lab_zip.py       打包 Lab：dist/ch05-assignment-lab.zip
```

## 重新构建与测试

```bash
pip install numpy scipy pytest playwright        # playwright 只用于浏览器检查
python3 tools/gen_data.py                        # 可选：重新实测耗时
python3 page/build.py                            # 生成 page/dist/*.html
node --test page/tests/core5.test.js             # JS 内核与 Python 夹具对拍
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
| ex1 | 全单模检查器：枚举方子式、找反例，判断 6 种“加一行”（先填 `PREDICTION`） | 5.4 |
| ex2 | 手写增量匈牙利：`insert(j)` 返回扫描过程、改派链、边际成本；通过证书检查与“黄金轨迹” | 5.1–5.3 |
| ex3 | 长方形、禁行、延后罚金的包装；无解时给出 Hall 证书 | 5.6 |
| ex4 | 瓶颈指派、字典序最优、帕累托阶梯 | 5.7 |
| ex5 | 审 5 个“AI 写的”派车函数（`ai_solvers.py`）：不看源码，只靠运行结果归类问题 | 5.6 |
| 挑战 | 冲突对的拉格朗日下界：在 λ 上二分，与 `linprog` 对拍 | 5.5 |

## 对拍了什么

- 增量匈牙利：250 组随机长方形矩阵、随机到达顺序，**每个前缀**的总时间与 `linear_sum_assignment` 一致；每次插入之后价格可行、配对的边紧、空闲车价格为 0、边际成本等于新任务的最终价格。
- `dispatch`（虚拟车、禁行、罚金）：400 组随机实例与暴力枚举一致；无解时 Hall 证书通过独立检查。
- 瓶颈、字典序、帕累托阶梯：200 组与暴力枚举一致。
- 冲突对：60 组的 LP 值与 `linprog`、整数最优与枚举、拉格朗日下界与 LP 值一致。
- 全单模：7 个矩阵的全部方子式行列式分布与 numpy 一致。
- 默认场景的黄金数字：最终价格 u = [8, 67, 38, 33, 54]、v = [0, 6, 2, 24, 44, 0]（与第 2 章 HiGHS 报告的顶点一致）；T5 的改派链 T5←V5、T2→V2、T3→V1，边际成本 54 = 10 + 44；帕累托阶梯 (49, 146)、(60, 136)、(61, 124)。
