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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '700' }}>Pune Metropolitan Logistics Map</h1>
            <span className="badge badge-assigned">Maharashtra, India</span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '4px' }}>
            Interactive geographical map of delivery destinations, fulfillment depots, and vehicle routes across Pune city.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={loadData}>
            <RotateCcw size={16} /> Refresh Map
          </button>
          <button className="btn-primary" onClick={() => onNavigate('optimization')}>
            <Compass size={16} /> Optimize Routes
          </button>
        </div>
      </div>

      {/* Filter and Highlights Bar */}
      <div className="glass-card" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Filter size={14} /> Filter Markers:
          </span>

          <select
            className="form-select"
            style={{ width: '150px', padding: '4px 8px', fontSize: '0.8rem' }}
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
            style={{ width: '150px', padding: '4px 8px', fontSize: '0.8rem' }}
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent (Red)</option>
            <option value="HIGH">High (Orange)</option>
            <option value="NORMAL">Normal (Blue)</option>
          </select>
        </div>

        <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', gap: '14px' }}>
          <span>🏢 <strong>{warehouses.length}</strong> Depots</span>
          <span>📦 <strong>{filteredOrders.length}</strong> Deliveries</span>
          <span>🚚 <strong>{routes.length}</strong> Active Routes</span>
        </div>
      </div>

      {/* Full-Screen Map Container */}
      <div className="glass-card" style={{ padding: '20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <div className="glass-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6366f1', fontWeight: '700', fontSize: '0.9rem' }}>
            <Building2 size={18} /> Central Pune Depot (Shivajinagar)
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '6px' }}>
            Goods Terminal, Shivajinagar (18.5308, 73.8475). Serves West and Central Pune: Kothrud, Deccan, Baner, Aundh, and Wakad.
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: '700', fontSize: '0.9rem' }}>
            <Building2 size={18} /> East Pune Fulfillment Hub (Hadapsar)
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '6px' }}>
            Industrial Estate, Hadapsar (18.5089, 73.9260). Serves East and IT corridors: Magarpatta, Viman Nagar, Kharadi EON, and Camp.
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#06b6d4', fontWeight: '700', fontSize: '0.9rem' }}>
            <Truck size={18} /> Hinjewadi & Wakad Express Sector
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '6px' }}>
            Rajiv Gandhi Infotech Park (18.5987, 73.7688). High priority corporate and express parcel distribution corridor.
          </div>
        </div>
      </div>
    </div>
  );
}
