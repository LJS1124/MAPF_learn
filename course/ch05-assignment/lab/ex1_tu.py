"""练习 1 · 全单模检查器（对应 5.4 节）

任务：写两个函数，然后用它们判断 6 种“给指派约束加一行”的做法，哪些还保持全单模。

  submatrix_dets(A)   枚举 A 的全部方子式，返回 {行列式的值: 个数}
  find_violation(A)   找出一个行列式绝对值 >= 2 的方子式，没有就返回 None（= 矩阵全单模）

做法提示：
- 方子式 = 取 k 行、k 列（k = 1 .. min(行数, 列数)）交叉出来的 k×k 子矩阵。
- 行列式用 numpy 算完取整（np.linalg.det 之后 round），小整数矩阵不会有精度问题。
- find_violation 请按 k 从小到大枚举，找到第一个就返回 (rows, cols, det)，rows 和 cols 是下标元组。

先填 PREDICTION，再动手写代码。取值：
    "TU"      预测这个矩阵全单模
    "NOT_TU"  预测它不是全单模
跑完 pytest 之后，终端最后会把你的预测和实际结果并排列出来。
"""
import numpy as np  # noqa: F401
from families import FAMILIES  # noqa: F401

PREDICTION = {
    "共享名额": None,
    "两个重叠名额": None,
    "冲突对": None,
    "同车冲突": None,
    "三条边冲突": None,
    "奇圈": None,
}


def submatrix_dets(A):
    """返回 {det: count}，det 是整数。"""
    raise NotImplementedError("练习 1：枚举全部方子式")


def find_violation(A):
    """返回 (rows, cols, det)，其中 |det| >= 2；矩阵全单模时返回 None。"""
    raise NotImplementedError("练习 1：找出一个反例")


def is_tu(A):
    return find_violation(A) is None
