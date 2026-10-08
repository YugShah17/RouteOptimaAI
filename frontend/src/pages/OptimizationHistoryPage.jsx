import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Layers,
  Calendar,
  Clock,
  Compass,
  Zap,
  TrendingDown,
  CheckCircle2
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: '700' }}>Optimization Execution History</h1>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '2px' }}>
          Audit trail of past route optimization executions, algorithm choices, and measured efficiency gains.
        </p>
      </div>

      {/* Runs Table */}
      <div className="glass-card" style={{ padding: '20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading execution history...</div>
        ) : runs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>
            <Layers size={40} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
            <div style={{ fontSize: '1rem', fontWeight: '600' }}>No optimization runs recorded</div>
            <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Execute an optimization run to view recorded runs.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ color: '#64748b', borderBottom: '1px solid #233554' }}>
                  <th style={{ padding: '12px 8px' }}>Run ID</th>
                  <th style={{ padding: '12px 8px' }}>Date & Time</th>
                  <th style={{ padding: '12px 8px' }}>Orders</th>
                  <th style={{ padding: '12px 8px' }}>Complexity</th>
                  <th style={{ padding: '12px 8px' }}>Strategy</th>
                  <th style={{ padding: '12px 8px' }}>Optimized Dist</th>
                  <th style={{ padding: '12px 8px' }}>Distance Saved</th>
                  <th style={{ padding: '12px 8px' }}>Improvement</th>
                  <th style={{ padding: '12px 8px' }}>Runtime</th>
                  <th style={{ padding: '12px 8px' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid rgba(35, 53, 84, 0.4)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: '700', color: '#6366f1' }}>#{r.id}</td>
                    <td style={{ padding: '12px 8px', color: '#cbd5e1' }}>
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 8px', fontWeight: '600' }}>{r.problem_orders_count}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span className={`badge ${r.complexity_level === 'HIGH' ? 'badge-complexity-high' : r.complexity_level === 'MEDIUM' ? 'badge-complexity-med' : 'badge-complexity-low'}`}>
                        {r.complexity_level} ({Math.round(r.complexity_score)})
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <span className="badge badge-assigned">{r.final_strategy}</span>
                    </td>
                    <td style={{ padding: '12px 8px', fontWeight: '700' }}>{r.total_distance_km} km</td>
                    <td style={{ padding: '12px 8px', color: '#10b981', fontWeight: '600' }}>-{r.distance_saved_km} km</td>
                    <td style={{ padding: '12px 8px', color: '#10b981', fontWeight: '700' }}>+{r.pct_improvement}%</td>
                    <td style={{ padding: '12px 8px', color: '#94a3b8' }}>{r.runtime_seconds}s</td>
                    <td style={{ padding: '12px 8px' }}>
                      <button
                        className="btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div className="glass-card" style={{ maxWidth: '560px', width: '100%', padding: '24px', background: '#0d1527' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Run #{selectedRun.id} Diagnostic Details</h2>
              <span className="badge badge-delivered">{selectedRun.status}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
              <div style={{ background: '#090e1a', padding: '12px', borderRadius: '8px' }}>
                <div style={{ color: '#64748b' }}>Algorithm Rationale:</div>
                <div style={{ color: '#e2e8f0', marginTop: '4px' }}>{selectedRun.strategy_reason || 'N/A'}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: '#090e1a', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ color: '#64748b' }}>Baseline Distance</div>
                  <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{selectedRun.distance_before_km} km</div>
                </div>
                <div style={{ background: '#090e1a', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ color: '#64748b' }}>Optimized Distance</div>
                  <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#10b981' }}>{selectedRun.total_distance_km} km</div>
                </div>
                <div style={{ background: '#090e1a', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ color: '#64748b' }}>Vehicles Deployed</div>
                  <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{selectedRun.vehicles_used}</div>
                </div>
                <div style={{ background: '#090e1a', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ color: '#64748b' }}>Late Delivery Violations</div>
                  <div style={{ fontWeight: '700', fontSize: '1.1rem', color: selectedRun.late_orders_count > 0 ? '#f59e0b' : '#10b981' }}>
                    {selectedRun.late_orders_count}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button className="btn-secondary" onClick={() => setSelectedRun(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
