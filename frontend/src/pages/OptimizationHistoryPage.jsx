import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Layers,
  Calendar,
  Clock,
  Compass,
  Zap,
  TrendingDown,
  CheckCircle2,
  X
} from 'lucide-react';

export default function OptimizationHistoryPage() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState(null);

  const loadRuns = async () => {
    try {
      const data = await api.getOptimizationRuns();
      setRuns(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRuns();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div className="card" style={{ padding: '18px 20px' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)' }}>
          Optimization Execution History
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '2px' }}>
          Audit trail of past route optimization executions, algorithm choices, and measured efficiency gains.
        </p>
      </div>

      {/* Runs Table */}
      <div className="card" style={{ padding: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Loading execution history...
          </div>
        ) : runs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Layers size={36} style={{ margin: '0 auto 10px auto', opacity: 0.4 }} />
            <div style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text-main)' }}>No optimization runs recorded</div>
            <div style={{ fontSize: '0.8125rem', marginTop: '2px' }}>Execute an optimization run to view recorded runs.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
            <table>
              <thead>
                <tr>
                  <th>Run ID</th>
                  <th>Date & Time</th>
                  <th>Orders</th>
                  <th>Complexity</th>
                  <th>Strategy</th>
                  <th>Optimized Dist</th>
                  <th>Distance Saved</th>
                  <th>Improvement</th>
                  <th>Runtime</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>#{r.id}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td style={{ fontWeight: '500', color: 'var(--text-main)' }}>{r.problem_orders_count}</td>
                    <td>
                      <span
                        className={`badge ${
                          r.complexity_level === 'HIGH'
                            ? 'badge-complexity-high'
                            : r.complexity_level === 'MEDIUM'
                            ? 'badge-complexity-med'
                            : 'badge-complexity-low'
                        }`}
                      >
                        {r.complexity_level} ({Math.round(r.complexity_score)})
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-assigned">{r.final_strategy}</span>
                    </td>
                    <td style={{ fontWeight: '600', color: 'var(--text-main)' }}>{r.total_distance_km} km</td>
                    <td style={{ color: 'var(--color-success)', fontWeight: '500' }}>-{r.distance_saved_km} km</td>
                    <td style={{ color: 'var(--color-success)', fontWeight: '600' }}>+{r.pct_improvement}%</td>
                    <td style={{ color: 'var(--text-muted)' }}>{r.runtime_seconds}s</td>
                    <td>
                      <button
                        className="btn-secondary"
                        style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                        onClick={() => setSelectedRun(r)}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Modal */}
      {selectedRun && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              background: '#ffffff',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  Run #{selectedRun.id} Diagnostic Details
                </h2>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(selectedRun.created_at).toLocaleString()}
                </div>
              </div>
              <span className="badge badge-delivered">{selectedRun.status}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem' }}>
              <div style={{ background: 'var(--bg-surface-secondary)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '500' }}>Algorithm Strategy Rationale:</div>
                <div style={{ color: 'var(--text-main)', marginTop: '3px', lineHeight: '1.4' }}>
                  {selectedRun.strategy_reason || 'N/A'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ background: 'var(--bg-surface-secondary)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Baseline Distance</div>
                  <div style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--text-main)', marginTop: '2px' }}>
                    {selectedRun.distance_before_km} km
                  </div>
                </div>
                <div style={{ background: 'var(--bg-surface-secondary)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Optimized Distance</div>
                  <div style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--color-success)', marginTop: '2px' }}>
                    {selectedRun.total_distance_km} km
                  </div>
                </div>
                <div style={{ background: 'var(--bg-surface-secondary)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Vehicles Deployed</div>
                  <div style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--text-main)', marginTop: '2px' }}>
                    {selectedRun.vehicles_used} Vans
                  </div>
                </div>
                <div style={{ background: 'var(--bg-surface-secondary)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Late Delivery Violations</div>
                  <div
                    style={{
                      fontWeight: '700',
                      fontSize: '1.1rem',
                      color: selectedRun.late_orders_count > 0 ? 'var(--color-warning)' : 'var(--color-success)',
                      marginTop: '2px',
                    }}
                  >
                    {selectedRun.late_orders_count}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '18px', textAlign: 'right' }}>
              <button
                className="btn-secondary"
                style={{ padding: '5px 14px', fontSize: '0.8125rem' }}
                onClick={() => setSelectedRun(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
