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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div className="card" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              background: 'var(--accent-primary-light)',
              padding: '8px',
              borderRadius: '6px',
              color: 'var(--accent-primary)',
            }}
          >
            <Brain size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)' }}>
              Machine Learning Strategy Classifier
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '2px' }}>
              Local scikit-learn Random Forest model trained on routing instances to predict the most effective optimization algorithm.
            </p>
          </div>
        </div>
      </div>

      {/* Model Performance KPIs */}
      {metrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <div className="card" style={{ padding: '16px 18px' }}>
            <span style={{ fontSize: '0.78125rem', color: 'var(--text-muted)' }}>Model Architecture</span>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', marginTop: '4px', color: 'var(--text-main)' }}>
              {metrics.algorithm_name}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginTop: '2px' }}>{metrics.version_name}</div>
          </div>

          <div className="card" style={{ padding: '16px 18px' }}>
            <span style={{ fontSize: '0.78125rem', color: 'var(--text-muted)' }}>Test Accuracy</span>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '4px', color: 'var(--color-success)' }}>
              {(metrics.accuracy * 100).toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginTop: '2px' }}>On held-out test split</div>
          </div>

          <div className="card" style={{ padding: '16px 18px' }}>
            <span style={{ fontSize: '0.78125rem', color: 'var(--text-muted)' }}>Weighted F1 Score</span>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '4px', color: 'var(--accent-primary)' }}>
              {(metrics.f1_score * 100).toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginTop: '2px' }}>Macro balanced metric</div>
          </div>

          <div className="card" style={{ padding: '16px 18px' }}>
            <span style={{ fontSize: '0.78125rem', color: 'var(--text-muted)' }}>Sample Size</span>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '4px', color: 'var(--text-main)' }}>
              {metrics.training_samples + metrics.test_samples}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginTop: '2px' }}>
              {metrics.training_samples} Train / {metrics.test_samples} Test
            </div>
          </div>
        </div>
      )}

      {/* Feature Importance & Explainability */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
        {/* Feature Importance Bar Chart */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <BarChart2 size={16} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text-main)' }}>
              Feature Importances (Gini Impurity)
            </h3>
          </div>

          {metrics?.feature_importance && Object.keys(metrics.feature_importance).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(metrics.feature_importance).map(([feat, imp]) => {
                const pct = Math.round(imp * 100);
                return (
                  <div key={feat}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{feat}</span>
                      <span style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>{(imp * 100).toFixed(1)}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--bg-surface-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${pct * 3.5}%`,
                          height: '100%',
                          background: 'var(--accent-primary)',
                          borderRadius: '4px',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>No feature importance data loaded.</div>
          )}
        </div>

        {/* Explainability & Algorithm Trade-offs */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Shield size={16} style={{ color: 'var(--color-success)' }} />
            <h3 style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text-main)' }}>
              Algorithm Selection Decision Rules
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem' }}>
            <div style={{ background: 'var(--bg-surface-secondary)', padding: '11px 13px', borderRadius: '6px', borderLeft: '3px solid var(--color-success)' }}>
              <div style={{ fontWeight: '600', color: 'var(--color-success-text)' }}>GREEDY / Nearest Neighbor</div>
              <div style={{ color: 'var(--text-muted)', marginTop: '2px', fontSize: '0.78125rem', lineHeight: '1.4' }}>
                Triggered when problem complexity is LOW (&lt; 10 orders). Provides rapid route construction in O(N²) time without heuristic search overhead.
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface-secondary)', padding: '11px 13px', borderRadius: '6px', borderLeft: '3px solid var(--accent-primary)' }}>
              <div style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>LOCAL SEARCH (2-Opt & Relocation)</div>
              <div style={{ color: 'var(--text-muted)', marginTop: '2px', fontSize: '0.78125rem', lineHeight: '1.4' }}>
                Recommended for MEDIUM complexity (10–35 orders). Iteratively untangles edge crossings and relocates deliveries across vehicles for rapid convergence.
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface-secondary)', padding: '11px 13px', borderRadius: '6px', borderLeft: '3px solid #7c3aed' }}>
              <div style={{ fontWeight: '600', color: '#7c3aed' }}>GENETIC ALGORITHM</div>
              <div style={{ color: 'var(--text-muted)', marginTop: '2px', fontSize: '0.78125rem', lineHeight: '1.4' }}>
                Selected for HIGH complexity problems with tight delivery time windows and large clusters. Order Crossover (OX) explores diverse permutation space.
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface-secondary)', padding: '11px 13px', borderRadius: '6px', borderLeft: '3px solid var(--color-warning)' }}>
              <div style={{ fontWeight: '600', color: 'var(--color-warning-text)' }}>HYBRID (GA + 2-Opt)</div>
              <div style={{ color: 'var(--text-muted)', marginTop: '2px', fontSize: '0.78125rem', lineHeight: '1.4' }}>
                Applied on extreme complexity instances to combine the global exploration of genetic algorithms with the local fine-tuning of 2-opt.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
