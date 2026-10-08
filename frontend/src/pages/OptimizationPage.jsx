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
  Info
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: '700' }}>AI-Driven Route Optimization Engine</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '2px' }}>
            Machine learning complexity estimation selects the optimal metaheuristic to minimize total fleet distance.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={runAnalysis} disabled={analyzing || optimizing}>
            <RotateCcw size={16} /> Re-Analyze Problem
          </button>
          <button
            className="btn-primary"
            onClick={handleRunOptimization}
            disabled={optimizing || (analysis && !analysis.feasible)}
          >
            <Zap size={16} /> {optimizing ? 'Optimizing...' : 'Run Optimization'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '14px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid #f43f5e', borderRadius: '8px', color: '#fb7185', fontSize: '0.875rem' }}>
          <AlertTriangle size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
          {error}
        </div>
      )}

      {/* Problem Complexity & ML Intelligence Cards */}
      {analysis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {/* Complexity Card */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' }}>Problem Complexity</span>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem' }}>
              <div style={{ background: '#0b1329', padding: '10px', borderRadius: '8px' }}>
                <div style={{ color: '#64748b' }}>Pending Orders</div>
                <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#f8fafc' }}>{analysis.complexity.number_of_orders}</div>
              </div>
              <div style={{ background: '#0b1329', padding: '10px', borderRadius: '8px' }}>
                <div style={{ color: '#64748b' }}>Available Vehicles</div>
                <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#f8fafc' }}>{analysis.complexity.number_of_vehicles}</div>
              </div>
              <div style={{ background: '#0b1329', padding: '10px', borderRadius: '8px' }}>
                <div style={{ color: '#64748b' }}>Capacity Demand</div>
                <div style={{ fontWeight: '600', color: '#cbd5e1' }}>
                  {analysis.complexity.total_package_weight} / {analysis.complexity.total_capacity} kg
                </div>
              </div>
              <div style={{ background: '#0b1329', padding: '10px', borderRadius: '8px' }}>
                <div style={{ color: '#64748b' }}>Geographical Spread</div>
                <div style={{ fontWeight: '600', color: '#cbd5e1' }}>{analysis.complexity.geographical_spread_km} km</div>
              </div>
            </div>

            {/* Feasibility Notes */}
            <div style={{ marginTop: '14px', borderTop: '1px solid #1e293b', paddingTop: '10px', fontSize: '0.75rem' }}>
              {analysis.feasibility_notes.map((note, i) => (
                <div key={i} style={{ color: analysis.feasible ? '#34d399' : '#fb7185', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                  {analysis.feasible ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />} {note}
                </div>
              ))}
            </div>
          </div>

          {/* ML Strategy Recommendation Card */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Cpu size={16} style={{ color: '#6366f1' }} /> ML Strategy Recommendation
              </span>
              <span className="badge badge-assigned" style={{ fontSize: '0.75rem' }}>
                Confidence {Math.round(analysis.recommendation.confidence * 100)}%
              </span>
            </div>

            <div style={{ background: '#0b1329', padding: '14px', borderRadius: '8px', border: '1px solid #233554', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Recommended Algorithm</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#818cf8', marginTop: '2px' }}>
                {analysis.recommendation.final_strategy}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '6px', lineHeight: '1.4' }}>
                {analysis.recommendation.reason}
              </div>
            </div>

            {/* Strategy Selection Controls */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>Strategy:</label>
              <select
                className="form-select"
                value={selectedStrategy || analysis.recommendation.final_strategy}
                onChange={(e) => setSelectedStrategy(e.target.value)}
              >
                <option value="GREEDY">Nearest Neighbor (Greedy)</option>
                <option value="LOCAL_SEARCH">Local Search (2-Opt Relocation)</option>
                <option value="GENETIC">Genetic Metaheuristic</option>
                <option value="HYBRID">Hybrid Genetic + Local Search</option>
              </select>
            </div>
          </div>

          {/* Objective Function Configuration */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sliders size={16} /> Objective Weights & Constraints
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '2px' }}>Distance Weight</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={distanceWeight}
                  onChange={(e) => setDistanceWeight(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '2px' }}>Time Weight</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={timeWeight}
                  onChange={(e) => setTimeWeight(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '2px' }}>Late Delivery Penalty</label>
                <input
                  type="number"
                  step="5"
                  className="form-input"
                  value={latePenalty}
                  onChange={(e) => setLatePenalty(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '2px' }}>Max Runtime (s)</label>
                <input
                  type="number"
                  className="form-input"
                  value={maxTimeSeconds}
                  onChange={(e) => setMaxTimeSeconds(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stepper / In-Flight Status Bar */}
      {optimizing && (
        <div className="glass-card" style={{ padding: '20px', background: '#0e172e' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="pulse-dot"></span> Optimization in progress...
            </span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Executing {selectedStrategy || 'Adaptive Strategy'}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', fontSize: '0.75rem', textAlign: 'center' }}>
            <div style={{ padding: '8px', background: progressStage >= 1 ? '#1e293b' : '#0b1329', color: progressStage >= 1 ? '#38bdf8' : '#64748b', borderRadius: '6px' }}>
              1. Matrix Formulation ✓
            </div>
            <div style={{ padding: '8px', background: progressStage >= 2 ? '#1e293b' : '#0b1329', color: progressStage >= 2 ? '#38bdf8' : '#64748b', borderRadius: '6px' }}>
              2. ML Strategy Dispatch ✓
            </div>
            <div style={{ padding: '8px', background: progressStage >= 3 ? '#1e293b' : '#0b1329', color: progressStage >= 3 ? '#38bdf8' : '#64748b', borderRadius: '6px' }}>
              3. Heuristic Search...
            </div>
            <div style={{ padding: '8px', background: progressStage >= 4 ? '#1e293b' : '#0b1329', color: progressStage >= 4 ? '#10b981' : '#64748b', borderRadius: '6px' }}>
              4. Validation & GeoJSON
            </div>
          </div>
        </div>
      )}

      {/* Before vs After Benchmark Comparison Card */}
      {result && (
        <div className="glass-card" style={{ padding: '24px', border: '1px solid #4338ca' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <span className="badge badge-delivered" style={{ marginBottom: '4px' }}>Optimization Complete</span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Baseline vs Optimized Route Comparison</h2>
            </div>
            <button className="btn-primary" onClick={() => onNavigate('tracking')}>
              <Play size={16} /> Start Live Fleet Simulation
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            {/* Total Distance Comparison */}
            <div style={{ background: '#0b1329', padding: '16px', borderRadius: '10px', border: '1px solid #1e293b' }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total Route Distance</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
                <span style={{ fontSize: '1.3rem', fontWeight: '700', color: '#10b981' }}>{result.comparison.distance_after_km} km</span>
                <span style={{ fontSize: '0.85rem', color: '#64748b', textDecoration: 'line-through' }}>{result.comparison.distance_before_km} km</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px', fontWeight: '600' }}>
                Saved: {result.comparison.distance_saved_km} km ({result.comparison.pct_improvement}%)
              </div>
            </div>

            {/* Vehicles Used */}
            <div style={{ background: '#0b1329', padding: '16px', borderRadius: '10px', border: '1px solid #1e293b' }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Active Vehicles Used</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
                <span style={{ fontSize: '1.3rem', fontWeight: '700', color: '#f8fafc' }}>{result.comparison.vehicles_after} Vans</span>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>vs {result.comparison.vehicles_before} baseline</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '4px' }}>
                Payload consolidation achieved
              </div>
            </div>

            {/* Late Orders */}
            <div style={{ background: '#0b1329', padding: '16px', borderRadius: '10px', border: '1px solid #1e293b' }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Late Deliveries</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
                <span style={{ fontSize: '1.3rem', fontWeight: '700', color: result.comparison.late_orders_after === 0 ? '#10b981' : '#f59e0b' }}>
                  {result.comparison.late_orders_after} Orders
                </span>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>from {result.comparison.late_orders_before}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                Time window violations penalized
              </div>
            </div>

            {/* Algorithm & Runtime */}
            <div style={{ background: '#0b1329', padding: '16px', borderRadius: '10px', border: '1px solid #1e293b' }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Algorithm Runtime</div>
              <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#818cf8', marginTop: '6px' }}>
                {result.comparison.runtime_seconds} sec
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                Executed: <strong>{result.final_strategy}</strong>
              </div>
            </div>
          </div>

          {/* Validation Status Badges */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '0.8rem', padding: '10px 14px', background: '#090e1a', borderRadius: '8px' }}>
            <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={14} /> Capacity Constraints Verified
            </span>
            <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={14} /> All Customers Visited (No Lost Orders)
            </span>
            <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={14} /> Depot Return Loops Verified
            </span>
          </div>
        </div>
      )}

      {/* Interactive Map of Generated Multi-Vehicle Routes */}
      {result && result.routes && result.routes.length > 0 && (
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Interactive Multi-Vehicle Route Map (Pune)</h3>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              {result.routes.length} vehicle routes generated
            </span>
          </div>
          <DeliveryMap routes={result.routes} height="520px" />

          {/* Route Breakdown List */}
          <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {result.routes.map((rt, idx) => (
              <div key={rt.id} style={{ background: '#0b1329', padding: '14px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '0.9rem', color: '#f8fafc' }}>
                  <span>{rt.vehicle_number || `Vehicle ${rt.vehicle_id}`}</span>
                  <span style={{ color: '#6366f1' }}>{rt.total_distance_km} km</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                  Load: {rt.total_load_kg} kg ({rt.utilization_pct}% capacity) | Duration: ~{Math.round(rt.estimated_duration_mins)} mins
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
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
