import time
import random
import copy
from typing import List, Dict, Any, Tuple, Callable, Optional
from backend.app.optimization.evaluator import RouteEvaluator
from backend.app.optimization.greedy import GreedyOptimizer

class GeneticOptimizer:
    """
    Genetic Algorithm for Multi-Vehicle Routing with capacity and time windows.
    - Representation: Order Permutation Chromosome with capacity-based greedy vehicle partitioning.
    - Crossover: Order Crossover (OX)
    - Mutation: Swap and Inversion Mutation
    - Selection: Tournament Selection with Elitism
    """
    def __init__(
        self,
        evaluator: RouteEvaluator = None,
        population_size: int = 50,
        generations: int = 80,
        crossover_rate: float = 0.85,
        mutation_rate: float = 0.20,
        tournament_size: int = 3,
        elitism_count: int = 2
    ):
        self.evaluator = evaluator or RouteEvaluator()
        self.population_size = population_size
        self.generations = generations
        self.crossover_rate = crossover_rate
        self.mutation_rate = mutation_rate
        self.tournament_size = tournament_size
        self.elitism_count = elitism_count

    def _decode_chromosome(
        self,
        chromosome: List[int],
        orders: List[Dict[str, Any]],
        vehicles: List[Dict[str, Any]]
    ) -> List[List[int]]:
        """
        Decodes a permutation of order indices into vehicle routes based on vehicle capacities.

        Every order is placed on the *least loaded* vehicle that still has room
        for it, considering the whole fleet instead of only moving forward. This
        lets the decoder come back to an earlier vehicle that still has spare
        capacity. Only when no vehicle can fit the order is the least loaded
        vehicle overloaded as a fallback so that no order is dropped.
        """
        num_vehicles = len(vehicles)
        routes: List[List[int]] = [[] for _ in range(num_vehicles)]
        if not chromosome or num_vehicles == 0:
            return routes

        loads = [0.0] * num_vehicles
        caps = [vehicles[v].get("max_capacity", 100.0) for v in range(num_vehicles)]

        for o_idx in chromosome:
            weight = orders[o_idx].get("package_weight", 0.0)

            # Vehicles that can still accommodate this order.
            fit_vehicles = [v for v in range(num_vehicles) if loads[v] + weight <= caps[v]]
            if fit_vehicles:
                # Balance the load: use the emptiest vehicle that still fits,
                # so no vehicle is left carrying avoidable spare capacity.
                v_idx = min(fit_vehicles, key=lambda v: loads[v])
            else:
                # No feasible vehicle, overload the least loaded one as fallback.
                v_idx = min(range(num_vehicles), key=lambda v: loads[v])

            routes[v_idx].append(o_idx)
            loads[v_idx] += weight

        return routes

    def _order_crossover(self, parent1: List[int], parent2: List[int]) -> Tuple[List[int], List[int]]:
        """Order Crossover (OX) for permutation chromosomes."""
        size = len(parent1)
        if size < 3:
            return list(parent1), list(parent2)

        cxpoint1 = random.randint(0, size - 2)
        cxpoint2 = random.randint(cxpoint1 + 1, size - 1)

        def ox_child(p1, p2):
            child = [-1] * size
            # Copy segment from p1
            child[cxpoint1:cxpoint2+1] = p1[cxpoint1:cxpoint2+1]
            copied_set = set(child[cxpoint1:cxpoint2+1])

            # Fill remaining positions from p2 in order
            p2_filtered = [item for item in p2 if item not in copied_set]
            fill_idx = 0
            for i in range(size):
                if child[i] == -1:
                    child[i] = p2_filtered[fill_idx]
                    fill_idx += 1
            return child

        return ox_child(parent1, parent2), ox_child(parent2, parent1)

    def _mutate(self, chromosome: List[int]) -> List[int]:
        """Performs swap or inversion mutation."""
        c = list(chromosome)
        n = len(c)
        if n < 2:
            return c

        if random.random() < 0.5:
            # Swap mutation
            i, j = random.sample(range(n), 2)
            c[i], c[j] = c[j], c[i]
        else:
            # Inversion mutation
            i = random.randint(0, n - 2)
            j = random.randint(i + 1, n - 1)
            c[i:j+1] = c[i:j+1][::-1]

        return c

    def solve(
        self,
        orders: List[Dict[str, Any]],
        vehicles: List[Dict[str, Any]],
        dist_matrix: List[List[float]],
        time_matrix: List[List[float]],
        depot_idx: int = 0,
        max_time_seconds: float = 30.0,
        progress_callback: Optional[Callable[[int, float], None]] = None
    ) -> Dict[str, Any]:
        start_time = time.time()
        num_orders = len(orders)
        num_vehicles = len(vehicles)

        if num_orders == 0 or num_vehicles == 0:
            return {
                "algorithm": "GENETIC",
                "routes": [[] for _ in range(num_vehicles)],
                "metrics": self.evaluator.evaluate_solution(
                    [[] for _ in range(num_vehicles)], orders, vehicles, dist_matrix, time_matrix, depot_idx
                ),
                "runtime_seconds": 0.0
            }

        # Initialize Population
        population: List[List[int]] = []

        # 1. Seed with Greedy solution permutation
        greedy_res = GreedyOptimizer(self.evaluator).solve(orders, vehicles, dist_matrix, time_matrix, depot_idx)
        greedy_chromosome = [o_idx for r in greedy_res["routes"] for o_idx in r]
        # Include any remaining
        for i in range(num_orders):
            if i not in greedy_chromosome:
                greedy_chromosome.append(i)
        if greedy_chromosome:
            population.append(greedy_chromosome)

        # 2. Fill rest with random permutations
        base_indices = list(range(num_orders))
        while len(population) < self.population_size:
            perm = list(base_indices)
            random.shuffle(perm)
            population.append(perm)

        def deadline_reached() -> bool:
            return (time.time() - start_time) > max_time_seconds

        def evaluate_ind(chrom: List[int]) -> Tuple[List[int], float, List[List[int]], Dict[str, Any]]:
            rts = self._decode_chromosome(chrom, orders, vehicles)
            ev = self.evaluator.evaluate_solution(rts, orders, vehicles, dist_matrix, time_matrix, depot_idx)
            fitness = 1.0 / (ev["total_cost"] + 1e-4)
            return chrom, fitness, rts, ev

        # Initial evaluation (stop early if the deadline passes, but always
        # score at least one individual so we have a usable solution).
        scored_pop = []
        for chrom in population:
            if scored_pop and deadline_reached():
                break
            scored_pop.append(evaluate_ind(chrom))

        best_chrom, best_fitness, best_routes, best_metrics = max(scored_pop, key=lambda x: x[1])

        # Evolution loop
        for gen in range(self.generations):
            if deadline_reached():
                break

            if progress_callback:
                pct = int(((gen + 1) / self.generations) * 100)
                progress_callback(pct, best_metrics["total_distance"])

            # Sort by fitness descending
            sorted_scored = sorted(scored_pop, key=lambda x: x[1], reverse=True)

            # Elitism: preserve top individuals (already scored, no re-evaluation)
            new_scored = list(sorted_scored[:self.elitism_count])

            # Breed new individuals
            while len(new_scored) < self.population_size:
                if deadline_reached():
                    break

                def tournament_select():
                    candidates = random.sample(range(len(scored_pop)), min(self.tournament_size, len(scored_pop)))
                    return max(candidates, key=lambda c: scored_pop[c][1])

                p1 = scored_pop[tournament_select()][0]
                p2 = scored_pop[tournament_select()][0]

                if random.random() < self.crossover_rate:
                    c1, c2 = self._order_crossover(p1, p2)
                else:
                    c1, c2 = list(p1), list(p2)

                if random.random() < self.mutation_rate:
                    c1 = self._mutate(c1)
                if random.random() < self.mutation_rate:
                    c2 = self._mutate(c2)

                for child in (c1, c2):
                    if len(new_scored) >= self.population_size or deadline_reached():
                        break
                    new_scored.append(evaluate_ind(child))

            if not new_scored:
                break

            scored_pop = new_scored
            gen_best = max(scored_pop, key=lambda x: x[1])
            if gen_best[1] > best_fitness:
                best_chrom, best_fitness, best_routes, best_metrics = gen_best

        runtime = round(time.time() - start_time, 4)

        return {
            "algorithm": "GENETIC",
            "routes": best_routes,
            "metrics": best_metrics,
            "runtime_seconds": runtime
        }
