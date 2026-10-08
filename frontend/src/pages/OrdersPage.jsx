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
  ArrowUpDown
} from 'lucide-react';

export default function OrdersPage({ onNavigate }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
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

  const formatTimeWindow = (startMins, endMins) => {
    const sH = Math.floor(startMins / 60);
    const sM = startMins % 60;
    const eH = Math.floor(endMins / 60);
    const eM = endMins % 60;
    return `${String(sH).padStart(2, '0')}:${String(sM).padStart(2, '0')} - ${String(eH).padStart(2, '0')}:${String(eM).padStart(2, '0')}`;
  };

  const paginatedOrders = orders.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(orders.length / pageSize) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Bar */}
      <div className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: '700' }}>Delivery Order Management</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '2px' }}>
            Manage customer requests, weights, delivery time windows, and priorities.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <a
            href="http://localhost:8000/api/orders/export"
            download="orders_export.csv"
            className="btn-secondary"
            style={{ textDecoration: 'none' }}
          >
            <Download size={16} /> Export CSV
          </a>
          <button className="btn-primary" onClick={() => onNavigate('create-order')}>
            <Plus size={16} /> New / Import Order
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', flex: '1', minWidth: '240px', gap: '8px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              placeholder="Search by customer name, address, or code..."
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

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '150px' }}
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
            style={{ width: '150px' }}
          >
            <option value="">All Priorities</option>
            <option value="LOW">LOW</option>
            <option value="NORMAL">NORMAL</option>
            <option value="HIGH">HIGH</option>
            <option value="URGENT">URGENT</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
            Showing <strong>{orders.length}</strong> orders
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading orders...</div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>
            <Package size={40} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
            <div style={{ fontSize: '1rem', fontWeight: '600' }}>No orders found</div>
            <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
              Create a new order or import the Pune demo data in Settings.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ color: '#64748b', borderBottom: '1px solid #233554' }}>
                  <th style={{ padding: '10px 8px' }}>Code</th>
                  <th style={{ padding: '10px 8px' }}>Customer</th>
                  <th style={{ padding: '10px 8px' }}>Address</th>
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
                  if (o.priority === 'URGENT') prioClass = 'badge-urgent';
                  if (o.priority === 'HIGH') prioClass = 'badge-high';

                  return (
                    <tr key={o.id} style={{ borderBottom: '1px solid rgba(35, 53, 84, 0.4)' }}>
                      <td style={{ padding: '12px 8px', fontWeight: '600', color: '#6366f1' }}>{o.order_code}</td>
                      <td style={{ padding: '12px 8px', fontWeight: '500' }}>{o.customer_name}</td>
                      <td style={{ padding: '12px 8px', color: '#94a3b8', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {o.address}
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
                        <button
                          onClick={() => handleDelete(o.id)}
                          style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer' }}
                          title="Delete Order"
                        >
                          <Trash2 size={16} />
                        </button>
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
