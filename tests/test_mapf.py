import os, sys, unittest
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from mapf import (Grid, Instance, astar, space_time_astar, ConstraintTable,
                  prioritized_planning, cbs, validate, sum_of_costs, random_instance)

ROOT = os.path.join(os.path.dirname(__file__), "..")
def load(name): return Grid.from_file(os.path.join(ROOT, "maps", name))


class TestSingleAgent(unittest.TestCase):
    def test_astar_shortest(self):
        p = astar(load("empty-8x8.map"), (0, 0), (7, 7))
        self.assertEqual(len(p) - 1, 14)

    def test_astar_unreachable(self):
        g = Grid([".@.", ".@.", ".@."])
        self.assertIsNone(astar(g, (0, 0), (0, 2)))
        self.assertIsNone(space_time_astar(g, (0, 0), (0, 2)))

    def test_st_astar_matches_astar_without_constraints(self):
        g = load("maze-10x10.map")
        self.assertEqual(len(astar(g, (0, 0), (8, 9))),
                         len(space_time_astar(g, (0, 0), (8, 9))))

    def test_vertex_constraint_forces_wait(self):
        g = Grid(["..."])
        ct = ConstraintTable(); ct.add_vertex((0, 1), 1)
        p = space_time_astar(g, (0, 0), (0, 2), ct)
        self.assertEqual(len(p) - 1, 3)  # 必须等一步
        self.assertNotEqual(p[1], (0, 1))

    def test_goal_constraint_later_in_time(self):
        g = Grid(["..."])
        ct = ConstraintTable(); ct.add_vertex((0, 2), 5)
        p = space_time_astar(g, (0, 0), (0, 2), ct)
        self.assertGreaterEqual(len(p) - 1, 6)  # 不能在 t=5 前“停”在终点


class TestMultiAgent(unittest.TestCase):
    def setUp(self):
        self.swap = Instance(load("corridor.map"), [(2, 0), (2, 6)], [(2, 6), (2, 0)])

    def test_cbs_swap_is_valid_and_optimal(self):
        paths = cbs(self.swap)
        self.assertTrue(validate(self.swap, paths)[0])
        self.assertEqual(sum_of_costs(paths), 15)  # 独立最短 6+6，错开需额外 1 步等待 + 进出岔路 2 步

    def test_pp_incomplete_on_swap(self):
        # 高优先级智能体直接穿过并停在终点，低优先级永远过不去：PP 不完备
        self.assertIsNone(prioritized_planning(self.swap))
        self.assertIsNone(prioritized_planning(self.swap, order=[1, 0]))

    def test_cbs_no_worse_than_pp(self):
        g = load("empty-8x8.map")
        for seed in range(15):
            inst = random_instance(g, 5, seed)
            c, p = cbs(inst, 5000), prioritized_planning(inst)
            if c is None:
                continue
            self.assertTrue(validate(inst, c)[0], seed)
            if p is not None:
                self.assertTrue(validate(inst, p)[0], seed)
                self.assertLessEqual(sum_of_costs(c), sum_of_costs(p), seed)

    def test_infeasible_returns_none(self):
        g = Grid(["..."])
        inst = Instance(g, [(0, 0), (0, 2)], [(0, 2), (0, 0)])  # 单行走廊无法交换
        self.assertIsNone(cbs(inst, 200))
        self.assertIsNone(prioritized_planning(inst))


if __name__ == "__main__":
    unittest.main()
