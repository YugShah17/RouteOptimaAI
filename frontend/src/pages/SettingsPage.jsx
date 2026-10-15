import React, { useState } from 'react';
import { api } from '../services/api';
import {
  Settings,
  Database,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Server,
  Globe,
  Sliders
} from 'lucide-react';

export default function SettingsPage() {
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const handleSeed = async () => {
    setSeeding(true);
    setStatusMsg('');
    try {
      const res = await api.seedDemo();
      setStatusMsg(`✓ Successfully seeded Pune Logistics Demo Data (${res.orders_seeded} orders, ${res.vehicles_seeded} vehicles).`);
    } catch (e) {
      setStatusMsg(`Error seeding: ${e.message}`);
    } finally {
      setSeeding(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Are you sure you want to clear all orders, routes, and optimizations?')) {
      return;
    }
    setClearing(true);
    setStatusMsg('');
    try {
      await api.clearDemo();
      setStatusMsg('✓ Database cleared.');
    } catch (e) {
      setStatusMsg(`Error clearing: ${e.message}`);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div className="card" style={{ padding: '18px 20px' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)' }}>
          System Configuration & Demo Controls
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '2px' }}>
          Manage database state, seed test scenarios, and review routing provider connections.
        </p>
      </div>

      {statusMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: 'var(--color-success-bg)',
            border: '1px solid var(--color-success-border)',
            borderRadius: '6px',
            color: 'var(--color-success-text)',
            fontSize: '0.8125rem',
          }}
        >
          {statusMsg}
        </div>
      )}

      {/* Demo Controls Card */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Database size={18} style={{ color: 'var(--accent-primary)' }} />
          <h2 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)' }}>
            Demo Environment Management
          </h2>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '16px', lineHeight: '1.5' }}>
          Load realistic logistics data centered around Pune, Maharashtra, India. Seeded data includes 2 regional warehouses, 60 customer coordinates, 12 delivery vehicles with realistic payloads, and 120 orders with varied priorities and time windows.
        </p>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn-primary"
            style={{ fontSize: '0.8125rem', padding: '6px 14px' }}
            onClick={handleSeed}
            disabled={seeding || clearing}
          >
            <RefreshCw size={14} className={seeding ? 'spin' : ''} />
            {seeding ? 'Seeding Pune Fleet...' : 'Seed Pune Demo Data'}
          </button>
          <button
            className="btn-outline-danger"
            style={{ fontSize: '0.8125rem', padding: '6px 14px' }}
            onClick={handleClear}
            disabled={seeding || clearing}
          >
            <Trash2 size={14} />
            {clearing ? 'Clearing...' : 'Clear All Orders & Routes'}
          </button>
        </div>
      </div>

      {/* Routing Services Status */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Globe size={18} style={{ color: 'var(--accent-primary)' }} />
          <h2 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)' }}>
            Open Routing & Geocoding Integrations
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          <div style={{ background: 'var(--bg-surface-secondary)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.875rem' }}>
              OpenStreetMap Nominatim
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Geocoding & Address Resolution
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
              https://nominatim.openstreetmap.org
            </div>
            <span className="badge badge-delivered" style={{ marginTop: '10px' }}>Active</span>
          </div>

          <div style={{ background: 'var(--bg-surface-secondary)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.875rem' }}>
              OSRM Routing Engine
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Road Distances & Turn-by-Turn Geometry
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
              https://router.project-osrm.org
            </div>
            <span className="badge badge-delivered" style={{ marginTop: '10px' }}>Active (Fallback Ready)</span>
          </div>

          <div style={{ background: 'var(--bg-surface-secondary)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.875rem' }}>
              Real-Time Telemetry Stream
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              WebSocket Bi-Directional Pipeline
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
              ws://localhost:8000/ws/live
            </div>
            <span className="badge badge-delivered" style={{ marginTop: '10px' }}>Operational</span>
          </div>
        </div>
      </div>
    </div>
  );
}
