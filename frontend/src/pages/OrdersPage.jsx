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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header Bar */}
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
            Delivery Orders
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '2px' }}>
            Customer delivery consignments with human-readable addresses and automatic geocoding.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <a
            href={api.getOrdersTemplateUrl()}
            download="orders_sample_template.csv"
            className="btn-secondary"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8125rem', padding: '5px 11px' }}
          >
            <Download size={14} /> CSV Template
          </a>
          <a
            href={api.getOrdersExportUrl()}
            download="orders_export.csv"
            className="btn-secondary"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8125rem', padding: '5px 11px' }}
          >
            <Download size={14} /> Export CSV
          </a>
          <button
            className="btn-primary"
            style={{ fontSize: '0.8125rem', padding: '5px 13px' }}
            onClick={() => onNavigate('create-order')}
          >
            <Plus size={15} /> New / Import Order
          </button>
        </div>
      </div>

      {/* Geocoding Warning Banner if any order failed */}
      {failedGeocodedCount > 0 && (
        <div
          style={{
            padding: '12px 16px',
            background: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger-border)',
            borderRadius: '6px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-danger-text)', fontSize: '0.875rem' }}>
            <AlertTriangle size={18} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
            <div>
              <strong>{failedGeocodedCount} address(es) could not be located.</strong> Please verify the address, area, or pincode.
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#b91c1c', marginTop: '1px' }}>
                Unlocated orders are excluded from route calculations until valid coordinates are resolved.
              </span>
            </div>
          </div>
          <button
            className="btn-secondary"
            style={{
              fontSize: '0.75rem',
              padding: '4px 10px',
              borderColor: 'var(--color-danger-border)',
              color: 'var(--color-danger-text)',
            }}
            onClick={() => setGeoFilter(geoFilter === 'FAILED' ? '' : 'FAILED')}
          >
            {geoFilter === 'FAILED' ? 'Show All Orders' : `View ${failedGeocodedCount} Unlocated Orders`}
          </button>
        </div>
      )}

      {retryMessage && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '6px',
            background: retryMessage.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
            border: `1px solid ${retryMessage.type === 'success' ? 'var(--color-success-border)' : 'var(--color-danger-border)'}`,
            color: retryMessage.type === 'success' ? 'var(--color-success-text)' : 'var(--color-danger-text)',
            fontSize: '0.8125rem',
          }}
        >
          {retryMessage.text}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '12px 16px',
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <form onSubmit={handleSearch} style={{ display: 'flex', flex: '1', minWidth: '220px', gap: '8px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              placeholder="Search by customer, address, area, or code..."
              className="form-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '34px', height: '36px' }}
            />
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '11px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
          </div>
          <button type="submit" className="btn-secondary" style={{ padding: '0 14px', height: '36px' }}>
            Search
          </button>
        </form>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="form-select"
            value={geoFilter}
            onChange={(e) => setGeoFilter(e.target.value)}
            style={{ width: '160px', height: '36px' }}
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
            style={{ width: '140px', height: '36px' }}
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
            style={{ width: '130px', height: '36px' }}
          >
            <option value="">All Priorities</option>
            <option value="LOW">LOW</option>
            <option value="NORMAL">NORMAL</option>
            <option value="HIGH">HIGH</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing <strong>{filteredOrders.length}</strong> orders {geoFilter && `(Filtered: ${geoFilter})`}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Loading orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Package size={36} style={{ margin: '0 auto 10px auto', opacity: 0.4 }} />
            <div style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text-main)' }}>No orders found</div>
            <div style={{ fontSize: '0.8125rem', marginTop: '3px' }}>
              Create a new order or upload a CSV file without coordinates.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Customer</th>
                  <th>Address & Area</th>
                  <th>Location Status</th>
                  <th>Weight</th>
                  <th>Priority</th>
                  <th>Time Window</th>
                  <th>Status</th>
                  <th>Actions</th>
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
                    <tr
                      key={o.id}
                      style={{
                        background: isGeoFailed ? 'var(--color-danger-bg)' : undefined,
                      }}
                    >
                      <td style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>{o.order_code}</td>
                      <td style={{ fontWeight: '500', color: 'var(--text-main)' }}>{o.customer_name}</td>
                      <td style={{ maxWidth: '240px' }}>
                        <div style={{ color: 'var(--text-secondary)' }}>{o.address}</div>
                        {(o.area || o.pincode) && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {o.area || ''}{o.area && o.pincode ? ' • ' : ''}{o.pincode || ''}
                          </div>
                        )}
                      </td>
                      <td>
                        {isGeoSuccess ? (
                          <span
                            className="badge badge-delivered"
                            title={`Internal coords: ${o.latitude?.toFixed(4)}, ${o.longitude?.toFixed(4)}`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', cursor: 'help' }}
                          >
                            <CheckCircle2 size={11} /> Located
                          </span>
                        ) : isGeoFailed ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span
                              className="badge badge-failed"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                            >
                              <XCircle size={11} /> Not Located
                            </span>
                            <span style={{ fontSize: '0.6875rem', color: 'var(--color-danger)', maxWidth: '160px' }}>
                              Verify address/area/PIN
                            </span>
                          </div>
                        ) : (
                          <span className="badge badge-pending">Pending</span>
                        )}
                      </td>
                      <td style={{ fontWeight: '500', color: 'var(--text-main)' }}>{o.package_weight} kg</td>
                      <td>
                        <span className={`badge ${prioClass}`}>{o.priority}</span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} style={{ color: 'var(--text-muted)' }} />
                          {formatTimeWindow(o.time_window_start, o.time_window_end)}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${badgeClass}`}>{o.status}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isGeoFailed && (
                            <button
                              onClick={() => handleRetryGeocode(o.id)}
                              disabled={retryingId === o.id}
                              className="btn-secondary"
                              style={{ padding: '3px 7px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '3px' }}
                              title="Retry Geocoding"
                            >
                              <RotateCw size={11} className={retryingId === o.id ? 'spin' : ''} />
                              {retryingId === o.id ? '...' : 'Retry'}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(o.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                            }}
                            title="Delete Order"
                          >
                            <Trash2 size={14} style={{ color: '#ef4444' }} />
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
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '8px',
              marginTop: '14px',
            }}
          >
            <button
              className="btn-secondary"
              style={{ padding: '3px 9px', fontSize: '0.75rem' }}
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Page {page} of {totalPages}
            </span>
            <button
              className="btn-secondary"
              style={{ padding: '3px 9px', fontSize: '0.75rem' }}
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
