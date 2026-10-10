import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Search,
  Filter,
  Plus,
  Download,
  Trash2,
  Package,
  Clock,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  MapPin
} from 'lucide-react';

export default function OrdersPage({ onNavigate }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [geoFilter, setGeoFilter] = useState(''); // '' | 'FAILED' | 'SUCCESS'
  const [retryingId, setRetryingId] = useState(null);
  const [retryMessage, setRetryMessage] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = { limit: 150 };
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (search) params.search = search;
      const data = await api.getOrders(params);
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, priorityFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadOrders();
  };

  const handleDelete = async (id) => {
    if (window.confirm(`Are you sure you want to delete order #${id}?`)) {
      try {
        await api.deleteOrder(id);
        setOrders(orders.filter((o) => o.id !== id));
      } catch (e) {
        alert('Failed to delete order');
      }
    }
  };

  const handleRetryGeocode = async (id) => {
    setRetryingId(id);
    setRetryMessage(null);
    try {
      const updated = await api.retryGeocode(id);
      setOrders(orders.map((o) => (o.id === id ? updated : o)));
      if (updated.geocoding_status === 'SUCCESS') {
        setRetryMessage({ type: 'success', text: `Order #${updated.order_code} geocoded successfully!` });
      } else {
        setRetryMessage({
          type: 'error',
          text: `Order #${updated.order_code}: This address could not be located. Please verify the address, area, or pincode.`
        });
      }
    } catch (e) {
      setRetryMessage({ type: 'error', text: `Retry failed: ${e.message}` });
    } finally {
      setRetryingId(null);
      setTimeout(() => setRetryMessage(null), 6000);
    }
  };

  const formatTimeWindow = (startMins, endMins) => {
    const sH = Math.floor(startMins / 60);
    const sM = startMins % 60;
    const eH = Math.floor(endMins / 60);
    const eM = endMins % 60;
    return `${String(sH).padStart(2, '0')}:${String(sM).padStart(2, '0')} - ${String(eH).padStart(2, '0')}:${String(eM).padStart(2, '0')}`;
  };

  // Filter for geocoding status if active
  const filteredOrders = orders.filter((o) => {
    if (geoFilter && o.geocoding_status !== geoFilter) return false;
    return true;
  });

  const failedGeocodedCount = orders.filter((o) => o.geocoding_status === 'FAILED').length;
  const paginatedOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Bar */}
      <div className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: '700' }}>Delivery Order Management</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '2px' }}>
            Customer orders with human-friendly addresses and automated geocoding.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a
            href={api.getOrdersTemplateUrl()}
            download="orders_sample_template.csv"
            className="btn-secondary"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={15} /> Sample CSV Template
          </a>
          <a
            href={api.getOrdersExportUrl()}
            download="orders_export.csv"
            className="btn-secondary"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={15} /> Export CSV
          </a>
          <button className="btn-primary" onClick={() => onNavigate('create-order')}>
            <Plus size={16} /> New / Import Order
          </button>
        </div>
      </div>

      {/* Geocoding Warning Banner if any order failed */}
      {failedGeocodedCount > 0 && (
        <div style={{
          padding: '14px 18px',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid #ef4444',
          borderRadius: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fca5a5', fontSize: '0.9rem' }}>
            <AlertTriangle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
            <div>
              <strong>{failedGeocodedCount} address(es) could not be located.</strong> Please verify the address, area, or pincode.
              <span style={{ display: 'block', fontSize: '0.78rem', color: '#f87171', marginTop: '2px' }}>
                Unlocated orders are automatically excluded from route optimization until valid coordinates are resolved.
              </span>
            </div>
          </div>
          <button
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '6px 14px', background: 'rgba(239, 68, 68, 0.2)', borderColor: '#ef4444', color: '#fff' }}
            onClick={() => setGeoFilter(geoFilter === 'FAILED' ? '' : 'FAILED')}
          >
            {geoFilter === 'FAILED' ? 'Show All Orders' : `View ${failedGeocodedCount} Unlocated Orders`}
          </button>
        </div>
      )}

      {retryMessage && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          background: retryMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${retryMessage.type === 'success' ? '#10b981' : '#ef4444'}`,
          color: retryMessage.type === 'success' ? '#34d399' : '#fca5a5',
          fontSize: '0.85rem'
        }}>
          {retryMessage.text}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', flex: '1', minWidth: '240px', gap: '8px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              placeholder="Search by customer, address, area, or code..."
              className="form-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          </div>
          <button type="submit" className="btn-secondary" style={{ padding: '0 16px' }}>
            Search
          </button>
        </form>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="form-select"
            value={geoFilter}
            onChange={(e) => setGeoFilter(e.target.value)}
            style={{ width: '160px' }}
          >
            <option value="">All Locations</option>
            <option value="SUCCESS">Geocoded (Located)</option>
            <option value="FAILED">Failed / Unlocated</option>
            <option value="PENDING">Pending Geocode</option>
          </select>

          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '140px' }}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="FAILED">FAILED</option>
          </select>

          <select
            className="form-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{ width: '130px' }}
          >
            <option value="">All Priorities</option>
            <option value="LOW">LOW</option>
            <option value="NORMAL">NORMAL</option>
            <option value="HIGH">HIGH</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
            Showing <strong>{filteredOrders.length}</strong> orders {geoFilter && `(Filtered: ${geoFilter})`}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>
            <Package size={40} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
            <div style={{ fontSize: '1rem', fontWeight: '600' }}>No orders found</div>
            <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
              Create a new order or upload a CSV file without coordinates.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ color: '#64748b', borderBottom: '1px solid #233554' }}>
                  <th style={{ padding: '10px 8px' }}>Code</th>
                  <th style={{ padding: '10px 8px' }}>Customer</th>
                  <th style={{ padding: '10px 8px' }}>Address & Area</th>
                  <th style={{ padding: '10px 8px' }}>Geocoding Status</th>
                  <th style={{ padding: '10px 8px' }}>Weight</th>
                  <th style={{ padding: '10px 8px' }}>Priority</th>
                  <th style={{ padding: '10px 8px' }}>Time Window</th>
                  <th style={{ padding: '10px 8px' }}>Status</th>
                  <th style={{ padding: '10px 8px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((o) => {
                  let badgeClass = 'badge-pending';
                  if (o.status === 'ASSIGNED') badgeClass = 'badge-assigned';
                  if (o.status === 'DELIVERED') badgeClass = 'badge-delivered';
                  if (o.status === 'FAILED') badgeClass = 'badge-failed';

                  let prioClass = 'badge-assigned';
                  if (o.priority === 'HIGH') prioClass = 'badge-high';
                  if (o.priority === 'LOW') prioClass = 'badge-pending';

                  const isGeoSuccess = o.geocoding_status === 'SUCCESS' && o.latitude != null;
                  const isGeoFailed = o.geocoding_status === 'FAILED';

                  return (
                    <tr key={o.id} style={{ borderBottom: '1px solid rgba(35, 53, 84, 0.4)', background: isGeoFailed ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                      <td style={{ padding: '12px 8px', fontWeight: '600', color: '#6366f1' }}>{o.order_code}</td>
                      <td style={{ padding: '12px 8px', fontWeight: '500' }}>{o.customer_name}</td>
                      <td style={{ padding: '12px 8px', color: '#cbd5e1', maxWidth: '240px' }}>
                        <div>{o.address}</div>
                        {(o.area || o.pincode) && (
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            {o.area || ''}{o.area && o.pincode ? ' • ' : ''}{o.pincode || ''}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        {isGeoSuccess ? (
                          <span
                            className="badge badge-delivered"
                            title={`Internal coords: ${o.latitude?.toFixed(4)}, ${o.longitude?.toFixed(4)}`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'help' }}
                          >
                            <CheckCircle2 size={12} /> Geocoded
                          </span>
                        ) : isGeoFailed ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span
                              className="badge badge-failed"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <XCircle size={12} /> Not Located
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#f87171', maxWidth: '170px', lineHeight: '1.2' }}>
                              Verify address/area/pincode
                            </span>
                          </div>
                        ) : (
                          <span className="badge badge-pending">
                            Pending
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 8px', fontWeight: '600' }}>{o.package_weight} kg</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span className={`badge ${prioClass}`}>{o.priority}</span>
                      </td>
                      <td style={{ padding: '12px 8px', color: '#cbd5e1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} style={{ color: '#64748b' }} />
                          {formatTimeWindow(o.time_window_start, o.time_window_end)}
                        </div>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span className={`badge ${badgeClass}`}>{o.status}</span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isGeoFailed && (
                            <button
                              onClick={() => handleRetryGeocode(o.id)}
                              disabled={retryingId === o.id}
                              className="btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', color: '#38bdf8', borderColor: '#0284c7' }}
                              title="Retry Geocoding"
                            >
                              <RotateCw size={12} className={retryingId === o.id ? 'spin' : ''} />
                              {retryingId === o.id ? 'Retrying...' : 'Retry'}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(o.id)}
                            style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer' }}
                            title="Delete Order"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px', marginTop: '16px' }}>
            <button
              className="btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              Page {page} of {totalPages}
            </span>
            <button
              className="btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
