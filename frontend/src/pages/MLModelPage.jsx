import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Brain,
  Cpu,
  BarChart2,
  CheckCircle2,
  Shield,
  Layers,
  Info
} from 'lucide-react';

export default function MLModelPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMetrics = async () => {
    try {
      const data = await api.getMLMetrics();
      setMetrics(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '10px', borderRadius: '10px', color: '#6366f1' }}>
            <Brain size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '700' }}>Machine Learning Strategy Classifier</h1>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '2px' }}>
              Local scikit-learn Random Forest model trained on simulated routing instances to predict the most effective optimization algorithm.
            </p>
          </div>
        </div>
      </div>

      {/* Model Performance KPIs */}
      {metrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div className="glass-card" style={{ padding: '20px' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Model Architecture</span>
            <div style={{ fontSize: '1.2rem', fontWeight: '700', marginTop: '6px', color: '#f8fafc' }}>
              {metrics.algorithm_name}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>{metrics.version_name}</div>
          </div>

          <div className="glass-card" style={{ padding: '20px' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Test Accuracy</span>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', marginTop: '6px', color: '#10b981' }}>
              {(metrics.accuracy * 100).toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>On held-out test split</div>
          </div>

          <div className="glass-card" style={{ padding: '20px' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Weighted F1 Score</span>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', marginTop: '6px', color: '#38bdf8' }}>
              {(metrics.f1_score * 100).toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>Macro balanced metric</div>
          </div>

          <div className="glass-card" style={{ padding: '20px' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Sample Size</span>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', marginTop: '6px', color: '#a855f7' }}>
              {metrics.training_samples + metrics.test_samples}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
              {metrics.training_samples} Train / {metrics.test_samples} Test
            </div>
          </div>
        </div>
      )}

      {/* Feature Importance & Explainability */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Feature Importance Bar Chart */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <BarChart2 size={18} style={{ color: '#6366f1' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: '600' }}>Model Feature Importances (Gini Impurity)</h3>
          </div>

          {metrics?.feature_importance && Object.keys(metrics.feature_importance).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {Object.entries(metrics.feature_importance).map(([feat, imp]) => {
                const pct = Math.round(imp * 100);
                return (
                  <div key={feat}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                      <span style={{ color: '#cbd5e1', fontFamily: 'var(--font-mono)' }}>{feat}</span>
                      <span style={{ fontWeight: '700', color: '#818cf8' }}>{(imp * 100).toFixed(1)}%</span>
                    </div>
                    <div style={{ height: '8px', background: '#0b1329', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${pct * 3.5}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #6366f1 0%, #38bdf8 100%)',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ color: '#64748b', fontSize: '0.85rem' }}>No feature importance data loaded.</div>
          )}
        </div>

        {/* Explainability & Algorithm Trade-offs */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Shield size={18} style={{ color: '#10b981' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: '600' }}>Algorithm Selection Decision Rules</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
            <div style={{ background: '#0b1329', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
              <div style={{ fontWeight: '700', color: '#34d399' }}>GREEDY / Nearest Neighbor</div>
              <div style={{ color: '#94a3b8', marginTop: '2px', fontSize: '0.8rem' }}>
                Triggered when problem complexity is LOW (&lt; 10 orders). Provides instant route construction in O(N²) time without the search overhead of population-based heuristics.
              </div>
            </div>

            <div style={{ background: '#0b1329', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #38bdf8' }}>
              <div style={{ fontWeight: '700', color: '#38bdf8' }}>LOCAL SEARCH (2-Opt & Relocation)</div>
              <div style={{ color: '#94a3b8', marginTop: '2px', fontSize: '0.8rem' }}>
                Recommended for MEDIUM complexity (10–35 orders). Iteratively untangles edge crossings and relocates deliveries across vehicles for rapid convergence.
              </div>
            </div>

            <div style={{ background: '#0b1329', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #a855f7' }}>
              <div style={{ fontWeight: '700', color: '#c084fc' }}>GENETIC ALGORITHM</div>
              <div style={{ color: '#94a3b8', marginTop: '2px', fontSize: '0.8rem' }}>
                Selected for HIGH complexity problems with tight delivery time windows and large clusters. Order Crossover (OX) and mutation explore diverse permutation space.
              </div>
            </div>

            <div style={{ background: '#0b1329', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontWeight: '700', color: '#fbbf24' }}>HYBRID (GA + 2-Opt)</div>
              <div style={{ color: '#94a3b8', marginTop: '2px', fontSize: '0.8rem' }}>
                Applied on extreme complexity instances to gain the global search advantages of genetic algorithms combined with the local fine-tuning of 2-opt.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
