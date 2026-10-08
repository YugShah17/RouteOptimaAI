# Machine Learning Pipeline Documentation

## 1. Role of ML in the System

Rather than acting as a generic black-box or relying on external LLM APIs, the Machine Learning component serves a focused decision-support role:

> **Predicting the most effective route optimization strategy (GREEDY, LOCAL_SEARCH, GENETIC, or HYBRID) according to the complexity and operational constraints of the current delivery problem.**

## 2. Feature Extraction

For any given set of pending delivery orders and available fleet vehicles, the `ComplexityService` extracts 8 normalized features:

| Feature Name | Type | Description |
| :--- | :---: | :--- |
| `number_of_orders` | Integer | Total count of orders requiring delivery |
| `number_of_vehicles` | Integer | Total count of active fleet vehicles |
| `number_of_constraints` | Integer | Combined count of vehicles, high-priority orders, and tight time windows |
| `average_distance` | Float (km) | Mean pairwise road/geographic distance between all stops |
| `geographical_spread` | Float (km) | Maximum distance separating any two destination points |
| `priority_ratio` | Float (0–1) | Proportion of orders marked as HIGH or URGENT |
| `time_window_ratio` | Float (0–1) | Proportion of orders with tight delivery windows (span &le; 180 min) |
| `capacity_utilization` | Float (%) | Aggregate order package weight divided by total fleet capacity |

## 3. Dataset Generation (`backend/ml/dataset_generator.py`)

To ensure realistic, grounded training data:
1. 500 simulated routing problems were generated across varied scales (5 to 50 orders, 1 to 7 vehicles) around Pune, Maharashtra.
2. For every scenario, candidate algorithms (Greedy, Local Search 2-opt, and Genetic Algorithm) were executed.
3. Solution distance, execution runtime, and feasibility were evaluated.
4. The winning algorithm based on trade-off metrics was recorded as the ground-truth target label `best_strategy`.
5. The dataset is persisted to `data/training_data.csv`.

## 4. Model Training & Evaluation (`backend/ml/train.py`)

- **Classifier:** `RandomForestClassifier(n_estimators=120, max_depth=10, random_state=42, class_weight='balanced')`
- **Data Split:** 80% Train (400 instances), 20% Held-Out Test (100 instances).
- **Test Metrics:**
  - Accuracy: **85.00%**
  - Weighted Precision: **80.83%**
  - Weighted Recall: **85.00%**
  - Weighted F1 Score: **82.54%**
- **Feature Importances:**
  1. `number_of_orders`: 24.6%
  2. `number_of_constraints`: 21.5%
  3. `geographical_spread`: 11.8%
  4. `capacity_utilization`: 10.4%
  5. `average_distance`: 9.3%
  6. `number_of_vehicles`: 8.1%
  7. `time_window_ratio`: 7.3%
  8. `priority_ratio`: 7.0%

Model artifact is saved as `backend/ml/model.joblib` and metrics as `backend/ml/metrics.json`.
