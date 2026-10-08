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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: '700' }}>System Configuration & Demo Controls</h1>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '2px' }}>
          Manage database state, seed test scenarios, and review routing provider connections.
        </p>
      </div>

      {statusMsg && (
        <div style={{ padding: '14px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: '8px', color: '#34d399', fontSize: '0.875rem' }}>
          {statusMsg}
        </div>
      )}

      {/* Demo Controls Card */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Database size={20} style={{ color: '#6366f1' }} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Demo Environment Management</h2>
        </div>

        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '20px' }}>
          Load realistic logistics data centered around Pune, Maharashtra, India. Seeded data includes 2 regional warehouses, 60 customer coordinates, 12 delivery vehicles with realistic payloads, and 120 orders with varied priorities and time windows.
        </p>

        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={handleSeed} disabled={seeding || clearing}>
            <RefreshCw size={16} /> {seeding ? 'Seeding Pune Fleet...' : 'Seed Pune Demo Data'}
          </button>
          <button className="btn-outline-danger" onClick={handleClear} disabled={seeding || clearing}>
            <Trash2 size={16} /> {clearing ? 'Clearing...' : 'Clear All Orders & Routes'}
          </button>
        </div>
      </div>

      {/* Routing Services Status */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Globe size={20} style={{ color: '#06b6d4' }} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Open Routing & Geocoding Integrations</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          <div style={{ background: '#0b1329', padding: '16px', borderRadius: '8px', border: '1px solid #1e293b' }}>
            <div style={{ fontWeight: '600', color: '#f8fafc', fontSize: '0.9rem' }}>OpenStreetMap Nominatim</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>Geocoding & Address Resolution</div>
            <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '6px' }}>
              Endpoint: <code>https://nominatim.openstreetmap.org</code>
            </div>
            <span className="badge badge-delivered" style={{ marginTop: '10px' }}>Active</span>
          </div>

          <div style={{ background: '#0b1329', padding: '16px', borderRadius: '8px', border: '1px solid #1e293b' }}>
            <div style={{ fontWeight: '600', color: '#f8fafc', fontSize: '0.9rem' }}>OSRM Routing Engine</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>Road Distances & Turn-by-Turn Geometry</div>
            <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '6px' }}>
              Endpoint: <code>https://router.project-osrm.org</code>
            </div>
            <span className="badge badge-delivered" style={{ marginTop: '10px' }}>Active (Straight-Line Fallback Ready)</span>
          </div>

          <div style={{ background: '#0b1329', padding: '16px', borderRadius: '8px', border: '1px solid #1e293b' }}>
            <div style={{ fontWeight: '600', color: '#f8fafc', fontSize: '0.9rem' }}>Real-Time Telemetry Stream</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>WebSocket Bi-Directional Pipeline</div>
            <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '6px' }}>
              Endpoint: <code>ws://localhost:8000/ws/live</code>
            </div>
            <span className="badge badge-delivered" style={{ marginTop: '10px' }}>Operational</span>
          </div>
        </div>
      </div>
    </div>
  );
}
