import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import DeliveryMap from '../components/DeliveryMap';
import {
  Package,
  Truck,
  Compass,
  TrendingUp,
  Clock,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  Layers,
  MapPin
} from 'lucide-react';

export default function DashboardPage({ onNavigate }) {
  const [data, setData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [summary, ordersData, whData, routesData] = await Promise.all([
        api.getDashboard(),
        api.getOrders({ limit: 100 }),
        api.getWarehouses(),
        api.getRoutes()
      ]);
      setData(summary);
      setOrders(ordersData);
      setWarehouses(whData);
      setRoutes(routesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 5000);
    return () => clearInterval(timer);
  }, []);

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '350px', color: '#94a3b8' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="pulse-dot" style={{ margin: '0 auto 12px auto' }}></div>
          <div>Loading Dashboard Metrics...</div>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Orders',
      value: data?.total_orders || 0,
      sub: `${data?.pending_orders || 0} Pending dispatch`,
      icon: Package,
      color: '#6366f1',
      action: () => onNavigate('orders')
    },
    {
      title: 'Active Fleet',
      value: `${data?.active_vehicles || 0} / ${data?.total_vehicles || 0}`,
      sub: 'Vehicles on route',
      icon: Truck,
      color: '#10b981',
      action: () => onNavigate('vehicles')
    },
    {
      title: 'Total Optimized Distance',
      value: `${data?.total_distance_km || 0} km`,
      sub: `Avg duration: ${data?.avg_route_duration_mins || 0}m`,
      icon: Compass,
      color: '#06b6d4',
      action: () => onNavigate('optimization')
    },
    {
      title: 'Avg Fleet Utilization',
      value: `${data?.avg_vehicle_utilization_pct || 0}%`,
      sub: 'Payload capacity used',
      icon: TrendingUp,
      color: '#a855f7',
      action: () => onNavigate('vehicles')
    },
    {
      title: 'On-Time Delivery Rate',
      value: `${data?.on_time_delivery_pct || 100}%`,
      sub: 'Window compliance',
      icon: Clock,
      color: '#f59e0b',
      action: () => onNavigate('tracking')
    },
    {
      title: 'Optimization Engine',
      value: data?.current_optimization_status || 'READY',
      sub: 'ML Strategy Classifier Active',
      icon: Zap,
      color: '#ec4899',
      action: () => onNavigate('optimization')
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div className="glass-card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Logistics Dispatch & Route Intelligence</h1>
            <span className="badge badge-assigned">Live Pune Fleet</span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '4px' }}>
            Complexity-aware algorithm selector dynamically minimizes travel distance and late penalties.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={() => onNavigate('history')}>
            <Layers size={16} /> View History
          </button>
          <button className="btn-primary" onClick={() => onNavigate('optimization')}>
            <Zap size={16} /> Run Optimization
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="glass-card"
              style={{ padding: '20px', cursor: 'pointer', position: 'relative' }}
              onClick={kpi.action}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '500' }}>{kpi.title}</span>
                <div style={{ background: `${kpi.color}20`, padding: '8px', borderRadius: '8px', color: kpi.color }}>
                  <Icon size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: '800', marginTop: '12px', letterSpacing: '-0.02em' }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                {kpi.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pune Logistics Network Map Card */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '700' }}>🗺️ Pune City Fleet & Delivery Network Map</h2>
              <span className="badge badge-assigned">Interactive Pune Grid</span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '2px' }}>
              Real-world hubs in Shivajinagar & Hadapsar connecting 60+ customer locations across Pune, Maharashtra.
            </p>
          </div>
          <button
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            onClick={() => onNavigate('pune-map')}
          >
            Open Full Screen Pune Map <ArrowUpRight size={14} />
          </button>
        </div>
        <DeliveryMap
          warehouses={warehouses}
          orders={orders}
          routes={routes}
          height="450px"
          showLocalityBar={true}
        />
      </div>

      {/* Charts & Status Breakdown Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
        {/* Orders by Status */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>Orders by Status</h3>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Total: {data?.total_orders || 0}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data?.orders_by_status && Object.entries(data.orders_by_status).map(([st, count]) => {
              const total = data.total_orders || 1;
              const pct = Math.round((count / total) * 100);
              let color = '#3b82f6';
              if (st === 'DELIVERED') color = '#10b981';
              if (st === 'PENDING') color = '#f59e0b';
              if (st === 'ASSIGNED') color = '#06b6d4';
              if (st === 'FAILED') color = '#f43f5e';

              return (
                <div key={st}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <span style={{ color: '#94a3b8' }}>{st}</span>
                    <span style={{ fontWeight: '600' }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: '6px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.4s ease' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vehicle Fleet Utilization Distribution */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>Fleet Payload Utilization</h3>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Top active vehicles</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data?.vehicle_utilization_distribution && data.vehicle_utilization_distribution.slice(0, 5).map((veh, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#0b1329', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{veh.vehicle_number}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{veh.vehicle_type} ({veh.current_load} / {veh.max_capacity} kg)</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem', color: veh.utilization_pct > 80 ? '#f59e0b' : '#10b981' }}>
                    {veh.utilization_pct}%
                  </div>
                  <span className={`badge ${veh.status === 'AVAILABLE' ? 'badge-available' : 'badge-transit'}`} style={{ fontSize: '0.65rem' }}>
                    {veh.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Optimization Performance */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>Recent Optimization Runs</h3>
          <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => onNavigate('history')}>
            View All Runs <ArrowUpRight size={12} />
          </button>
        </div>

        {data?.recent_optimizations && data.recent_optimizations.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ color: '#64748b', borderBottom: '1px solid #233554', paddingBottom: '8px' }}>
                  <th style={{ padding: '8px' }}>Run</th>
                  <th style={{ padding: '8px' }}>Strategy</th>
                  <th style={{ padding: '8px' }}>Orders</th>
                  <th style={{ padding: '8px' }}>Complexity</th>
                  <th style={{ padding: '8px' }}>Final Dist</th>
                  <th style={{ padding: '8px' }}>Distance Saved</th>
                  <th style={{ padding: '8px' }}>Improvement</th>
                  <th style={{ padding: '8px' }}>Runtime</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_optimizations.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid rgba(35, 53, 84, 0.4)' }}>
                    <td style={{ padding: '10px 8px', fontWeight: '600', color: '#6366f1' }}>#{r.id}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <span className="badge badge-assigned">{r.algorithm}</span>
                    </td>
                    <td style={{ padding: '10px 8px' }}>{r.orders}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <span className={`badge ${r.complexity === 'HIGH' ? 'badge-complexity-high' : r.complexity === 'MEDIUM' ? 'badge-complexity-med' : 'badge-complexity-low'}`}>
                        {r.complexity}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px', fontWeight: '600' }}>{r.distance_km} km</td>
                    <td style={{ padding: '10px 8px', color: '#10b981' }}>-{r.saved_km} km</td>
                    <td style={{ padding: '10px 8px', color: '#10b981', fontWeight: '700' }}>+{r.improvement_pct}%</td>
                    <td style={{ padding: '10px 8px', color: '#94a3b8' }}>{r.runtime_s}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '0.875rem' }}>
            No recent optimization runs recorded. Run an optimization to benchmark before vs after metrics.
          </div>
        )}
      </div>
    </div>
  );
}
