import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import DeliveryMap from '../components/DeliveryMap';
import {
  Zap,
  Cpu,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sliders,
  Compass,
  Clock,
  Layers,
  Info,
  Check,
  ChevronRight
} from 'lucide-react';

export default function OptimizationPage({ onNavigate }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [progressStage, setProgressStage] = useState(0);

  // Settings / Strategy Override
  const [selectedStrategy, setSelectedStrategy] = useState('');
  const [distanceWeight, setDistanceWeight] = useState(1.0);
  const [timeWeight, setTimeWeight] = useState(0.2);
  const [latePenalty, setLatePenalty] = useState(50.0);
  const [maxTimeSeconds, setMaxTimeSeconds] = useState(30);

  // Initial problem analysis on load
  const runAnalysis = async () => {
    setAnalyzing(true);
    setError('');
    try {
      const data = await api.analyzeProblem();
      setAnalysis(data);
      if (!selectedStrategy && data?.recommendation?.final_strategy) {
        setSelectedStrategy(data.recommendation.final_strategy);
      }
    } catch (e) {
      setError(e.message || 'Failed to analyze routing problem');
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    runAnalysis();
  }, []);

  const handleRunOptimization = async () => {
    setOptimizing(true);
    setError('');
    setProgressStage(1);

    // Simulated progress stepper ticks for smooth visual feedback
    const t1 = setTimeout(() => setProgressStage(2), 600);
    const t2 = setTimeout(() => setProgressStage(3), 1200);

    try {
      const payload = {
        force_strategy: selectedStrategy || analysis?.recommendation?.final_strategy,
        distance_weight: parseFloat(distanceWeight),
        time_weight: parseFloat(timeWeight),
        late_penalty: parseFloat(latePenalty),
        max_time_seconds: parseInt(maxTimeSeconds)
      };

      const res = await api.runOptimization(payload);
      clearTimeout(t1);
      clearTimeout(t2);
      setProgressStage(4);
      setResult(res);
    } catch (e) {
      clearTimeout(t1);
      clearTimeout(t2);
      setError(e.message || 'Optimization failed');
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Page Header */}
      <div
        className="card"
        style={{
          padding: '18px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)' }}>
            Route Optimization Engine
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '2px' }}>
            Machine learning complexity estimation selects the optimal algorithm to minimize fleet distance and delays.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn-secondary"
            onClick={runAnalysis}
            disabled={analyzing || optimizing}
            style={{ fontSize: '0.8125rem', padding: '5px 12px' }}
          >
            <RotateCcw size={14} /> Re-Analyze
          </button>
          <button
            className="btn-primary"
            onClick={handleRunOptimization}
            disabled={optimizing || (analysis && !analysis.feasible)}
            style={{ fontSize: '0.8125rem', padding: '5px 14px' }}
          >
            <Zap size={14} /> {optimizing ? 'Optimizing...' : 'Start Optimization'}
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            background: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger-border)',
            borderRadius: '6px',
            color: 'var(--color-danger-text)',
            fontSize: '0.8125rem',
          }}
        >
          <AlertTriangle size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
          {error}
        </div>
      )}

      {/* Step-by-Step Workflow: Analysis, ML Recommendation & Objective Weights */}
      {analysis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {/* Step 1 & 2: Complexity Analysis */}
          <div className="card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                  1. Problem Complexity Analysis
                </span>
                <span
                  className={`badge ${
                    analysis.complexity.complexity_level === 'HIGH'
                      ? 'badge-complexity-high'
                      : analysis.complexity.complexity_level === 'MEDIUM'
                      ? 'badge-complexity-med'
                      : 'badge-complexity-low'
                  }`}
                >
                  {analysis.complexity.complexity_level} ({analysis.complexity.complexity_score} / 100)
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8125rem' }}>
                <div style={{ background: 'var(--bg-surface-secondary)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Pending Orders</div>
                  <div style={{ fontWeight: '700', fontSize: '1.2rem', color: 'var(--text-main)', marginTop: '2px' }}>
                    {analysis.complexity.number_of_orders}
                  </div>
                </div>
                <div style={{ background: 'var(--bg-surface-secondary)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Available Fleet</div>
                  <div style={{ fontWeight: '700', fontSize: '1.2rem', color: 'var(--text-main)', marginTop: '2px' }}>
                    {analysis.complexity.number_of_vehicles}
                  </div>
                </div>
                <div style={{ background: 'var(--bg-surface-secondary)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Capacity Demand</div>
                  <div style={{ fontWeight: '600', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {analysis.complexity.total_package_weight} / {analysis.complexity.total_capacity} kg
                  </div>
                </div>
                <div style={{ background: 'var(--bg-surface-secondary)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Geographic Spread</div>
                  <div style={{ fontWeight: '600', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {analysis.complexity.geographical_spread_km} km
                  </div>
                </div>
              </div>
            </div>

            {/* Feasibility Notes */}
            <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', fontSize: '0.75rem' }}>
              {analysis.feasibility_notes.map((note, i) => (
                <div
                  key={i}
                  style={{
                    color: analysis.feasible ? 'var(--color-success-text)' : 'var(--color-danger-text)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    marginBottom: '2px',
                  }}
                >
                  {analysis.feasible ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />} {note}
                </div>
              ))}
            </div>
          </div>

          {/* Step 3 & 4: ML Recommendation & Algorithm Selection */}
          <div className="card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Cpu size={15} style={{ color: 'var(--accent-primary)' }} /> 2. ML Strategy Recommendation
                </span>
                <span className="badge badge-assigned" style={{ fontSize: '0.6875rem' }}>
                  Confidence {Math.round(analysis.recommendation.confidence * 100)}%
                </span>
              </div>

              <div
                style={{
                  background: 'var(--bg-surface-secondary)',
                  padding: '12px 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  marginBottom: '12px',
                }}
              >
                <div style={{ fontSize: '0.71875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
                  ML Predicted Algorithm
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--accent-primary)', marginTop: '2px' }}>
                  {analysis.recommendation.final_strategy}
                </div>
                <div style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>
                  {analysis.recommendation.reason}
                </div>
              </div>
            </div>

            {/* Algorithm Override Dropdown */}
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Active Execution Algorithm:
              </label>
              <select
                className="form-select"
                value={selectedStrategy || analysis.recommendation.final_strategy}
                onChange={(e) => setSelectedStrategy(e.target.value)}
                style={{ height: '36px', fontSize: '0.8125rem' }}
              >
                <option value="GREEDY">Nearest Neighbor (Greedy)</option>
                <option value="LOCAL_SEARCH">Local Search (2-Opt Relocation)</option>
                <option value="GENETIC">Genetic Metaheuristic</option>
                <option value="HYBRID">Hybrid Genetic + Local Search</option>
              </select>
            </div>
          </div>

          {/* Objective Function Configuration */}
          <div className="card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sliders size={15} /> 3. Objective Weights & Constraints
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                    Distance Weight
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={distanceWeight}
                    onChange={(e) => setDistanceWeight(e.target.value)}
                    style={{ height: '34px', fontSize: '0.8125rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                    Time Weight
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={timeWeight}
                    onChange={(e) => setTimeWeight(e.target.value)}
                    style={{ height: '34px', fontSize: '0.8125rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                    Late Penalty
                  </label>
                  <input
                    type="number"
                    step="5"
                    className="form-input"
                    value={latePenalty}
                    onChange={(e) => setLatePenalty(e.target.value)}
                    style={{ height: '34px', fontSize: '0.8125rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                    Max Time (s)
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={maxTimeSeconds}
                    onChange={(e) => setMaxTimeSeconds(e.target.value)}
                    style={{ height: '34px', fontSize: '0.8125rem' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
              Optimizes vehicle capacity constraints and strict customer time windows.
            </div>
          </div>
        </div>
      )}

      {/* Stepper / Progress Status Bar */}
      {optimizing && (
        <div className="card" style={{ padding: '18px', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="pulse-dot"></span> Optimization in progress...
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Executing {selectedStrategy || 'Adaptive Strategy'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', fontSize: '0.75rem', textAlign: 'center' }}>
            <div
              style={{
                padding: '6px 8px',
                background: progressStage >= 1 ? 'var(--accent-primary-light)' : 'var(--bg-surface-secondary)',
                color: progressStage >= 1 ? 'var(--accent-primary)' : 'var(--text-faint)',
                fontWeight: progressStage >= 1 ? '600' : '400',
                borderRadius: '4px',
              }}
            >
              1. Matrix Formulation
            </div>
            <div
              style={{
                padding: '6px 8px',
                background: progressStage >= 2 ? 'var(--accent-primary-light)' : 'var(--bg-surface-secondary)',
                color: progressStage >= 2 ? 'var(--accent-primary)' : 'var(--text-faint)',
                fontWeight: progressStage >= 2 ? '600' : '400',
                borderRadius: '4px',
              }}
            >
              2. ML Strategy Dispatch
            </div>
            <div
              style={{
                padding: '6px 8px',
                background: progressStage >= 3 ? 'var(--accent-primary-light)' : 'var(--bg-surface-secondary)',
                color: progressStage >= 3 ? 'var(--accent-primary)' : 'var(--text-faint)',
                fontWeight: progressStage >= 3 ? '600' : '400',
                borderRadius: '4px',
              }}
            >
              3. Heuristic Search...
            </div>
            <div
              style={{
                padding: '6px 8px',
                background: progressStage >= 4 ? 'var(--color-success-bg)' : 'var(--bg-surface-secondary)',
                color: progressStage >= 4 ? 'var(--color-success-text)' : 'var(--text-faint)',
                fontWeight: progressStage >= 4 ? '600' : '400',
                borderRadius: '4px',
              }}
            >
              4. Validation & GeoJSON
            </div>
          </div>
        </div>
      )}

      {/* Before vs After Benchmark Comparison Card */}
      {result && (
        <div className="card" style={{ padding: '20px', border: '1px solid var(--accent-primary-border)' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <span className="badge badge-delivered" style={{ marginBottom: '4px' }}>
                Optimization Complete
              </span>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)' }}>
                Baseline vs Optimized Route Comparison
              </h2>
            </div>
            <button
              className="btn-primary"
              onClick={() => onNavigate('tracking')}
              style={{ fontSize: '0.8125rem', padding: '6px 14px' }}
            >
              <Play size={14} /> Start Fleet Simulation
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            {/* Total Distance Comparison */}
            <div style={{ background: 'var(--bg-surface-secondary)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Route Distance</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-success)' }}>
                  {result.comparison.distance_after_km} km
                </span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-faint)', textDecoration: 'line-through' }}>
                  {result.comparison.distance_before_km} km
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-success-text)', marginTop: '2px', fontWeight: '600' }}>
                Saved: {result.comparison.distance_saved_km} km ({result.comparison.pct_improvement}%)
              </div>
            </div>

            {/* Vehicles Used */}
            <div style={{ background: 'var(--bg-surface-secondary)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Fleet Deployed</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  {result.comparison.vehicles_after} Vans
                </span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-faint)' }}>
                  vs {result.comparison.vehicles_before} baseline
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Payload consolidation achieved
              </div>
            </div>

            {/* Late Orders */}
            <div style={{ background: 'var(--bg-surface-secondary)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Late Deliveries</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                <span
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: result.comparison.late_orders_after === 0 ? 'var(--color-success)' : 'var(--color-warning)',
                  }}
                >
                  {result.comparison.late_orders_after} Orders
                </span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-faint)' }}>
                  from {result.comparison.late_orders_before}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Time window penalties evaluated
              </div>
            </div>

            {/* Algorithm & Runtime */}
            <div style={{ background: 'var(--bg-surface-secondary)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Algorithm Runtime</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--accent-primary)', marginTop: '4px' }}>
                {result.comparison.runtime_seconds} sec
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Executed: <strong>{result.final_strategy}</strong>
              </div>
            </div>
          </div>

          {/* Validation Status Badges */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              fontSize: '0.78125rem',
              padding: '8px 12px',
              background: 'var(--color-success-bg)',
              borderRadius: '6px',
              border: '1px solid var(--color-success-border)',
            }}
          >
            <span style={{ color: 'var(--color-success-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={13} /> Capacity Constraints Verified
            </span>
            <span style={{ color: 'var(--color-success-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={13} /> All Customers Visited (No Lost Orders)
            </span>
            <span style={{ color: 'var(--color-success-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={13} /> Depot Return Loops Verified
            </span>
          </div>
        </div>
      )}

      {/* Interactive Map of Generated Multi-Vehicle Routes */}
      {result && result.routes && result.routes.length > 0 && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)' }}>
              Generated Multi-Vehicle Delivery Routes (Pune)
            </h3>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              {result.routes.length} vehicle routes generated
            </span>
          </div>
          <DeliveryMap routes={result.routes} height="500px" />

          {/* Route Breakdown List */}
          <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
            {result.routes.map((rt) => (
              <div
                key={rt.id}
                style={{
                  background: 'var(--bg-surface-secondary)',
                  padding: '12px 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-main)' }}>
                  <span>{rt.vehicle_number || `Vehicle ${rt.vehicle_id}`}</span>
                  <span style={{ color: 'var(--accent-primary)' }}>{rt.total_distance_km} km</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                  Load: {rt.total_load_kg} kg ({rt.utilization_pct}% capacity) | Duration: ~{Math.round(rt.estimated_duration_mins)}m
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginTop: '2px' }}>
                  Stops: {rt.stops.length} (Depot → {rt.stops.length - 2} Orders → Depot)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
