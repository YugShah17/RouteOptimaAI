import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import DeliveryMap from '../components/DeliveryMap';
import {
  MapPin,
  Layers,
  Filter,
  Package,
  Building2,
  Truck,
  Compass,
  RotateCcw
} from 'lucide-react';

export default function PuneMapPage({ onNavigate }) {
  const [orders, setOrders] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersData, whData, routesData] = await Promise.all([
        api.getOrders({ limit: 200 }),
        api.getWarehouses(),
        api.getRoutes()
      ]);
      setOrders(ordersData);
      setWarehouses(whData);
      setRoutes(routesData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredOrders = orders.filter((o) => {
    if (filterPriority && o.priority !== filterPriority) return false;
    if (filterStatus && o.status !== filterStatus) return false;
    return true;
  });

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)' }}>
              Pune Metropolitan Logistics Map
            </h1>
            <span className="badge badge-assigned">Maharashtra, India</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '2px' }}>
            Interactive geographical map of delivery destinations, fulfillment depots, and vehicle routes across Pune city.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={loadData} style={{ fontSize: '0.8125rem', padding: '5px 12px' }}>
            <RotateCcw size={14} /> Refresh Map
          </button>
          <button className="btn-primary" onClick={() => onNavigate('optimization')} style={{ fontSize: '0.8125rem', padding: '5px 14px' }}>
            <Compass size={14} /> Optimize Routes
          </button>
        </div>
      </div>

      {/* Filter and Highlights Bar */}
      <div
        className="card"
        style={{
          padding: '12px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
            <Filter size={13} /> Filter Markers:
          </span>

          <select
            className="form-select"
            style={{ width: '140px', padding: '4px 8px', fontSize: '0.8125rem', height: '32px' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="DELIVERED">Delivered</option>
          </select>

          <select
            className="form-select"
            style={{ width: '140px', padding: '4px 8px', fontSize: '0.8125rem', height: '32px' }}
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent (Red)</option>
            <option value="HIGH">High (Orange)</option>
            <option value="NORMAL">Normal (Blue)</option>
          </select>
        </div>

        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', gap: '14px' }}>
          <span>🏢 <strong>{warehouses.length}</strong> Depots</span>
          <span>📦 <strong>{filteredOrders.length}</strong> Deliveries</span>
          <span>🚚 <strong>{routes.length}</strong> Active Routes</span>
        </div>
      </div>

      {/* Full-Screen Map Container */}
      <div className="card" style={{ padding: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Loading Pune map coordinates...
          </div>
        ) : (
          <DeliveryMap
            warehouses={warehouses}
            orders={filteredOrders}
            routes={routes}
            height="580px"
            showLocalityBar={true}
          />
        )}
      </div>

      {/* Pune Hubs Legend & Directory */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', fontWeight: '600', fontSize: '0.875rem' }}>
            <Building2 size={16} /> Central Pune Depot (Shivajinagar)
          </div>
          <div style={{ fontSize: '0.78125rem', color: 'var(--text-muted)', marginTop: '5px', lineHeight: '1.4' }}>
            Goods Terminal, Shivajinagar (18.5308, 73.8475). Serves West and Central Pune: Kothrud, Deccan, Baner, Aundh, and Wakad.
          </div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-success)', fontWeight: '600', fontSize: '0.875rem' }}>
            <Building2 size={16} /> East Pune Fulfillment Hub (Hadapsar)
          </div>
          <div style={{ fontSize: '0.78125rem', color: 'var(--text-muted)', marginTop: '5px', lineHeight: '1.4' }}>
            Industrial Estate, Hadapsar (18.5089, 73.9260). Serves East and IT corridors: Magarpatta, Viman Nagar, Kharadi EON, and Camp.
          </div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0284c7', fontWeight: '600', fontSize: '0.875rem' }}>
            <Truck size={16} /> Hinjewadi & Wakad Express Sector
          </div>
          <div style={{ fontSize: '0.78125rem', color: 'var(--text-muted)', marginTop: '5px', lineHeight: '1.4' }}>
            Rajiv Gandhi Infotech Park (18.5987, 73.7688). High-priority corporate and express parcel distribution corridor.
          </div>
        </div>
      </div>
    </div>
  );
}
