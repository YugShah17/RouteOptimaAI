import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Truck,
  Plus,
  BatteryCharging,
  Gauge,
  MapPin,
  CheckCircle,
  AlertCircle
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: '700' }}>Fleet Management & Vehicle Telemetry</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '2px' }}>
            Monitor delivery vans, carrying capacities, payload utilization, and GPS locations.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Add Vehicle
        </button>
      </div>

      {/* Grid of Vehicles */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading fleet...</div>
      ) : vehicles.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>
          <Truck size={40} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
          <div style={{ fontSize: '1rem', fontWeight: '600' }}>No vehicles registered</div>
          <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Add a new vehicle or load the Pune demo data in Settings.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {vehicles.map((v) => {
            const util = Math.round((v.current_load / v.max_capacity) * 100) || 0;
            let badgeClass = 'badge-available';
            if (v.status === 'ASSIGNED') badgeClass = 'badge-assigned';
            if (v.status === 'IN_TRANSIT') badgeClass = 'badge-transit';
            if (v.status === 'MAINTENANCE') badgeClass = 'badge-failed';

            return (
              <div key={v.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '1.05rem', color: '#f8fafc' }}>{v.vehicle_number}</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>{v.vehicle_type}</div>
                  </div>
                  <span className={`badge ${badgeClass}`}>{v.status}</span>
                </div>

                {/* Capacity Progress Bar */}
                <div style={{ background: '#0b1329', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                    <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Gauge size={14} /> Payload Utilization
                    </span>
                    <span style={{ fontWeight: '700', color: util > 85 ? '#f59e0b' : '#38bdf8' }}>
                      {v.current_load} / {v.max_capacity} kg ({util}%)
                    </span>
                  </div>
                  <div style={{ height: '6px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, util)}%`,
                        height: '100%',
                        background: util > 90 ? '#ef4444' : util > 70 ? '#f59e0b' : '#10b981',
                        transition: 'width 0.3s'
                      }}
                    />
                  </div>
                </div>

                {/* Coordinates & Assigned Route */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', borderTop: '1px solid #233554', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} />
                    {v.current_latitude.toFixed(4)}, {v.current_longitude.toFixed(4)}
                  </div>
                  <div>
                    {v.assigned_route_id ? (
                      <span style={{ color: '#6366f1', fontWeight: '600' }}>Route #{v.assigned_route_id}</span>
                    ) : (
                      'No Active Route'
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div className="glass-card" style={{ maxWidth: '450px', width: '100%', padding: '24px', background: '#0d1527' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '16px' }}>Add New Fleet Vehicle</h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Vehicle Number / Plate *</label>
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
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Vehicle Type</label>
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
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Maximum Capacity (kg) *</label>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Depot Latitude</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    value={formData.current_latitude}
                    onChange={(e) => setFormData({ ...formData, current_latitude: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Depot Longitude</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    value={formData.current_longitude}
                    onChange={(e) => setFormData({ ...formData, current_longitude: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>
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
