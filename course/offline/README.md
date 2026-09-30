# 离线阅读版

每章两份文件，不需要网络，也不需要任何服务：

| 章 | 网页（可交互，双击用浏览器打开） | PDF（静态，适合打印和手机） |
|---|---|---|
| 第 5 章 指派问题与匈牙利算法 | [ch05-assignment.html](ch05-assignment.html) | [ch05-assignment.pdf](ch05-assignment.pdf) |
| 第 6 章 最短路与网络流 | [ch06-network-flow.html](ch06-network-flow.html) | [ch06-network-flow.pdf](ch06-network-flow.pdf) |
| 第 7 章 带容量的指派与背包 | [ch07-capacitated.html](ch07-capacitated.html) | [ch07-capacitated.pdf](ch07-capacitated.pdf) |
| 第 8 章 旅行商与车辆路径入门 | [ch08-tsp-vrp.html](ch08-tsp-vrp.html) | [ch08-tsp-vrp.pdf](ch08-tsp-vrp.pdf) |
| 第 9 章 调度问题的语言 | [ch09-scheduling-language.html](ch09-scheduling-language.html) | [ch09-scheduling-language.pdf](ch09-scheduling-language.pdf) |

- **网页**是单个文件：样式、脚本、数据都在里面，不请求任何外部资源。图可以拖动、点击，数字实时计算。字体使用系统自带的中文字体。
- **PDF**里，“先预测”的题和自测已经展开了答案与解析，逐步回放的图停在有信息的位置（最后一步等），所以图是静态的；想自己操作图，请用网页版。
- Lab 代码包在各章目录的 `lab/` 里，用法见各章 README。

重新生成：先运行各章的 `page/build.py`，再运行 `python3 course/tools/build_offline.py`（需要 playwright 和 chromium）。

第 1–4 章是之前发布的页面和文本文档，不在本仓库里，所以这里没有它们的离线版。
