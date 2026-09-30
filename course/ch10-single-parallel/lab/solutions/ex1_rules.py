"""练习 1 参考答案"""
from fractions import Fraction


def spt_order(p):
    return sorted(range(len(p)), key=lambda j: (p[j], j))


def wspt_order(p, w):
    return sorted(range(len(p)), key=lambda j: (Fraction(p[j], w[j]), j))


def edd_order(d):
    return sorted(range(len(d)), key=lambda j: (d[j], j))
