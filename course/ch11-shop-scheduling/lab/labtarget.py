"""按环境变量 LAB_TARGET 选择被测代码：默认测你写的练习，LAB_TARGET=solutions 测参考答案。"""
import importlib
import os

TARGET = os.environ.get("LAB_TARGET", "student")


def load(name: str):
    if TARGET == "solutions":
        return importlib.import_module(f"solutions.{name}")
    return importlib.import_module(name)
