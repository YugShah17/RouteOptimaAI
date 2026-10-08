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
        """
        num_vehicles = len(vehicles)
        routes: List[List[int]] = [[] for _ in range(num_vehicles)]
        if not chromosome or num_vehicles == 0:
            return routes

        v_idx = 0
        current_load = 0.0
        v_cap = vehicles[v_idx].get("max_capacity", 100.0)

        for o_idx in chromosome:
            weight = orders[o_idx].get("package_weight", 0.0)
            if current_load + weight <= v_cap:
                routes[v_idx].append(o_idx)
                current_load += weight
            else:
                # Try next vehicle
                if v_idx + 1 < num_vehicles:
                    v_idx += 1
                    routes[v_idx].append(o_idx)
                    current_load = weight
                    v_cap = vehicles[v_idx].get("max_capacity", 100.0)
                else:
                    # All vehicles at capacity, assign to the vehicle with smallest load
                    min_v = min(range(num_vehicles), key=lambda v: sum(orders[i].get("package_weight", 0.0) for i in routes[v]))
                    routes[min_v].append(o_idx)

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

        def evaluate_ind(chrom: List[int]) -> Tuple[float, List[List[int]], Dict[str, Any]]:
            rts = self._decode_chromosome(chrom, orders, vehicles)
            ev = self.evaluator.evaluate_solution(rts, orders, vehicles, dist_matrix, time_matrix, depot_idx)
            fitness = 1.0 / (ev["total_cost"] + 1e-4)
            return fitness, rts, ev

        # Initial evaluation
        scored_pop = [evaluate_ind(ind) for ind in population]
        best_fitness, best_routes, best_metrics = max(scored_pop, key=lambda x: x[0])
        best_chromosome = population[scored_pop.index((best_fitness, best_routes, best_metrics))]

        # Evolution loop
        for gen in range(self.generations):
            elapsed = time.time() - start_time
            if elapsed > max_time_seconds:
                break

            if progress_callback:
                pct = int(((gen + 1) / self.generations) * 100)
                progress_callback(pct, best_metrics["total_distance"])

            # Sort by fitness descending
            sorted_indices = sorted(range(len(population)), key=lambda i: scored_pop[i][0], reverse=True)
            new_population = []

            # Elitism: preserve top individuals
            for e in range(min(self.elitism_count, len(population))):
                new_population.append(population[sorted_indices[e]])

            # Breed new individuals
            while len(new_population) < self.population_size:
                # Tournament selection
                def tournament_select():
                    candidates = random.sample(range(len(population)), self.tournament_size)
                    best_c = max(candidates, key=lambda c: scored_pop[c][0])
                    return population[best_c]

                p1 = tournament_select()
                p2 = tournament_select()

                if random.random() < self.crossover_rate:
                    c1, c2 = self._order_crossover(p1, p2)
                else:
                    c1, c2 = list(p1), list(p2)

                if random.random() < self.mutation_rate:
                    c1 = self._mutate(c1)
                if random.random() < self.mutation_rate:
                    c2 = self._mutate(c2)

                new_population.append(c1)
                if len(new_population) < self.population_size:
                    new_population.append(c2)

            population = new_population
            scored_pop = [evaluate_ind(ind) for ind in population]
            gen_best_fitness, gen_best_routes, gen_best_metrics = max(scored_pop, key=lambda x: x[0])

            if gen_best_fitness > best_fitness:
                best_fitness = gen_best_fitness
                best_routes = gen_best_routes
                best_metrics = gen_best_metrics
                best_chromosome = population[scored_pop.index((gen_best_fitness, gen_best_routes, gen_best_metrics))]

        runtime = round(time.time() - start_time, 4)

        return {
            "algorithm": "GENETIC",
            "routes": best_routes,
            "metrics": best_metrics,
            "runtime_seconds": runtime
        }
