import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import DeliveryMap from '../components/DeliveryMap';
import {
  Package,
  Truck,
  Compass,
  TrendingUp,
  Clock,
  Zap,
  ArrowUpRight,
  Layers,
  MapPin,
  CheckCircle2
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '350px', color: 'var(--text-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="pulse-dot" style={{ margin: '0 auto 12px auto' }}></div>
          <div style={{ fontSize: '0.9rem' }}>Loading dashboard metrics...</div>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Orders',
      value: data?.total_orders || 0,
      sub: `${data?.pending_orders || 0} pending dispatch`,
      icon: Package,
      action: () => onNavigate('orders')
    },
    {
      title: 'Active Fleet',
      value: `${data?.active_vehicles || 0} / ${data?.total_vehicles || 0}`,
      sub: 'Vehicles on active route',
      icon: Truck,
      action: () => onNavigate('vehicles')
    },
    {
      title: 'Total Route Distance',
      value: `${data?.total_distance_km || 0} km`,
      sub: `Avg duration: ${data?.avg_route_duration_mins || 0}m`,
      icon: Compass,
      action: () => onNavigate('optimization')
    },
    {
      title: 'Avg Fleet Utilization',
      value: `${data?.avg_vehicle_utilization_pct || 0}%`,
      sub: 'Payload capacity used',
      icon: TrendingUp,
      action: () => onNavigate('vehicles')
    },
    {
      title: 'On-Time Delivery Rate',
      value: `${data?.on_time_delivery_pct || 100}%`,
      sub: 'Window compliance',
      icon: Clock,
      action: () => onNavigate('tracking')
    },
    {
      title: 'Optimization Engine',
      value: data?.current_optimization_status || 'READY',
      sub: 'ML Strategy Model active',
      icon: Zap,
      action: () => onNavigate('optimization')
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <div
        className="card"
        style={{
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)' }}>
              Logistics Dispatch & Route Intelligence
            </h1>
            <span className="badge badge-assigned">Pune Hub Active</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '3px' }}>
            Complexity-aware algorithm selector dynamically minimizes travel distance and late penalties across Pune city.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={() => onNavigate('history')}>
            <Layers size={15} /> History
          </button>
          <button className="btn-primary" onClick={() => onNavigate('optimization')}>
            <Zap size={15} /> Run Optimization
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="card"
              style={{
                padding: '18px 20px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              onClick={kpi.action}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                  {kpi.title}
                </span>
                <div
                  style={{
                    background: 'var(--accent-primary-light)',
                    color: 'var(--accent-primary)',
                    padding: '6px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={16} />
                </div>
              </div>
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                  {kpi.value}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginTop: '3px' }}>
                  {kpi.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pune Logistics Network Map Card */}
      <div className="card" style={{ padding: '20px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--text-main)' }}>
                Pune Fleet & Delivery Network Map
              </h2>
              <span className="badge badge-assigned">Interactive</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '2px' }}>
              Central Depot (Shivajinagar) and East Hub (Hadapsar) serving delivery locations across Pune.
            </p>
          </div>
          <button
            className="btn-secondary"
            style={{ fontSize: '0.8125rem', padding: '5px 12px' }}
            onClick={() => onNavigate('pune-map')}
          >
            Open Full Map <ArrowUpRight size={14} />
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
        {/* Orders by Status */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text-main)' }}>Orders by Status</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total: {data?.total_orders || 0}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data?.orders_by_status &&
              Object.entries(data.orders_by_status).map(([st, count]) => {
                const total = data.total_orders || 1;
                const pct = Math.round((count / total) * 100);
                let barColor = 'var(--accent-primary)';
                if (st === 'DELIVERED') barColor = 'var(--color-success)';
                if (st === 'PENDING') barColor = 'var(--color-warning)';
                if (st === 'ASSIGNED') barColor = '#0284c7';
                if (st === 'FAILED') barColor = 'var(--color-danger)';

                return (
                  <div key={st}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '5px' }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>{st}</span>
                      <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--bg-surface-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: barColor,
                          transition: 'width 0.3s ease',
                          borderRadius: '4px',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Vehicle Fleet Utilization Distribution */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text-main)' }}>Fleet Payload Utilization</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active fleet snapshot</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data?.vehicle_utilization_distribution &&
              data.vehicle_utilization_distribution.slice(0, 5).map((veh, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    background: 'var(--bg-surface-secondary)',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                      {veh.vehicle_number}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {veh.vehicle_type} ({veh.current_load} / {veh.max_capacity} kg)
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontWeight: '700',
                        fontSize: '0.875rem',
                        color: veh.utilization_pct > 85 ? 'var(--color-warning)' : 'var(--color-success)',
                      }}
                    >
                      {veh.utilization_pct}%
                    </div>
                    <span
                      className={`badge ${veh.status === 'AVAILABLE' ? 'badge-available' : 'badge-transit'}`}
                      style={{ fontSize: '0.6875rem', marginTop: '2px' }}
                    >
                      {veh.status}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Recent Optimization Performance */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text-main)' }}>
              Recent Optimization Runs
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Algorithm benchmark results and distance reduction history
            </p>
          </div>
          <button
            className="btn-secondary"
            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            onClick={() => onNavigate('history')}
          >
            View All Runs <ArrowUpRight size={12} />
          </button>
        </div>

        {data?.recent_optimizations && data.recent_optimizations.length > 0 ? (
          <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
            <table>
              <thead>
                <tr>
                  <th>Run</th>
                  <th>Algorithm</th>
                  <th>Orders</th>
                  <th>Complexity</th>
                  <th>Final Dist</th>
                  <th>Distance Saved</th>
                  <th>Improvement</th>
                  <th>Runtime</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_optimizations.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>#{r.id}</td>
                    <td>
                      <span className="badge badge-assigned">{r.algorithm}</span>
                    </td>
                    <td>{r.orders}</td>
                    <td>
                      <span
                        className={`badge ${
                          r.complexity === 'HIGH'
                            ? 'badge-complexity-high'
                            : r.complexity === 'MEDIUM'
                            ? 'badge-complexity-med'
                            : 'badge-complexity-low'
                        }`}
                      >
                        {r.complexity}
                      </span>
                    </td>
                    <td style={{ fontWeight: '600', color: 'var(--text-main)' }}>{r.distance_km} km</td>
                    <td style={{ color: 'var(--color-success)', fontWeight: '500' }}>-{r.saved_km} km</td>
                    <td style={{ color: 'var(--color-success)', fontWeight: '600' }}>+{r.improvement_pct}%</td>
                    <td style={{ color: 'var(--text-muted)' }}>{r.runtime_s}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            No recent optimization runs recorded. Run an optimization to benchmark before vs after metrics.
          </div>
        )}
      </div>
    </div>
  );
}
