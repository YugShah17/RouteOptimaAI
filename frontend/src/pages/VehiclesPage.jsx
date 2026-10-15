import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Truck,
  Plus,
  BatteryCharging,
  Gauge,
  MapPin,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_number: '',
    vehicle_type: 'Standard Delivery Van',
    max_capacity: 150.0,
    current_latitude: 18.5308,
    current_longitude: 73.8475,
    status: 'AVAILABLE'
  });

  const loadVehicles = async () => {
    try {
      const data = await api.getVehicles();
      setVehicles(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.createVehicle({
        ...formData,
        max_capacity: parseFloat(formData.max_capacity)
      });
      setShowAddModal(false);
      setFormData({
        vehicle_number: '',
        vehicle_type: 'Standard Delivery Van',
        max_capacity: 150.0,
        current_latitude: 18.5308,
        current_longitude: 73.8475,
        status: 'AVAILABLE'
      });
      loadVehicles();
    } catch (e) {
      alert(`Error creating vehicle: ${e.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
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
            Vehicle Fleet Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '2px' }}>
            Monitor delivery vans, carrying capacities, payload utilization, and base hubs.
          </p>
        </div>
        <button
          className="btn-primary"
          style={{ fontSize: '0.8125rem', padding: '5px 13px' }}
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={15} /> Add Vehicle
        </button>
      </div>

      {/* Grid of Vehicles */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Loading fleet...
        </div>
      ) : vehicles.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          <Truck size={36} style={{ margin: '0 auto 10px auto', opacity: 0.4 }} />
          <div style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text-main)' }}>No vehicles registered</div>
          <div style={{ fontSize: '0.8125rem', marginTop: '2px' }}>
            Add a new vehicle or load Pune demo data in Settings.
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {vehicles.map((v) => {
            const util = Math.round((v.current_load / v.max_capacity) * 100) || 0;
            let badgeClass = 'badge-available';
            if (v.status === 'ASSIGNED') badgeClass = 'badge-assigned';
            if (v.status === 'IN_TRANSIT') badgeClass = 'badge-transit';
            if (v.status === 'MAINTENANCE') badgeClass = 'badge-failed';

            return (
              <div
                key={v.id}
                className="card"
                style={{
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.9375rem', color: 'var(--text-main)' }}>
                      {v.vehicle_number}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                      {v.vehicle_type}
                    </div>
                  </div>
                  <span className={`badge ${badgeClass}`}>{v.status}</span>
                </div>

                {/* Capacity Progress Bar */}
                <div
                  style={{
                    background: 'var(--bg-surface-secondary)',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '5px' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Gauge size={13} /> Payload Utilization
                    </span>
                    <span
                      style={{
                        fontWeight: '600',
                        color: util > 85 ? 'var(--color-warning)' : 'var(--text-main)',
                      }}
                    >
                      {v.current_load} / {v.max_capacity} kg ({util}%)
                    </span>
                  </div>
                  <div style={{ height: '5px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, util)}%`,
                        height: '100%',
                        background: util > 90 ? 'var(--color-danger)' : util > 70 ? 'var(--color-warning)' : 'var(--color-success)',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>

                {/* Coordinates & Assigned Route */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <MapPin size={12} />
                    <span>
                      {v.current_latitude?.toFixed(4)}, {v.current_longitude?.toFixed(4)}
                    </span>
                  </div>
                  <div>
                    {v.assigned_route_id ? (
                      <span style={{ color: 'var(--accent-primary)', fontWeight: '600' }}>
                        Route #{v.assigned_route_id}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-faint)' }}>No active route</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showAddModal && (
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
              maxWidth: '440px',
              width: '100%',
              padding: '24px',
              background: '#ffffff',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>
                Add New Fleet Vehicle
              </h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Vehicle Plate / Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MH-12-DEL-2045"
                  className="form-input"
                  value={formData.vehicle_number}
                  onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Vehicle Type
                </label>
                <select
                  className="form-select"
                  value={formData.vehicle_type}
                  onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                >
                  <option value="Electric Van EV-200">Electric Van EV-200 (120 kg)</option>
                  <option value="Standard Delivery Van">Standard Delivery Van (150 kg)</option>
                  <option value="Heavy Courier Truck">Heavy Courier Truck (250 kg)</option>
                  <option value="Compact Express Cargo">Compact Express Cargo (80 kg)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Maximum Capacity (kg) *
                </label>
                <input
                  type="number"
                  required
                  min="10"
                  step="5"
                  className="form-input"
                  value={formData.max_capacity}
                  onChange={(e) => setFormData({ ...formData, max_capacity: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Base Operating Hub
                </label>
                <select
                  className="form-select"
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'hadapsar') {
                      setFormData({ ...formData, current_latitude: 18.5089, current_longitude: 73.9259 });
                    } else if (val === 'kothrud') {
                      setFormData({ ...formData, current_latitude: 18.5074, current_longitude: 73.8077 });
                    } else {
                      setFormData({ ...formData, current_latitude: 18.5308, current_longitude: 73.8475 });
                    }
                  }}
                >
                  <option value="shivajinagar">Central Depot (Shivajinagar, Pune)</option>
                  <option value="hadapsar">East Hub (Hadapsar)</option>
                  <option value="kothrud">West Hub (Kothrud)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
