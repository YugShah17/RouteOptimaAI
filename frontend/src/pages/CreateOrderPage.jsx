import React, { useState } from 'react';
import { api } from '../services/api';
import DeliveryMap from '../components/DeliveryMap';
import {
  MapPin,
  Search,
  Upload,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  FileText,
  Download,
  XCircle,
  HelpCircle
} from 'lucide-react';

export default function CreateOrderPage({ onNavigate }) {
  const [tab, setTab] = useState('single'); // 'single' | 'import'

  // Single Form State - NO latitude or longitude fields requested from user
  const [formData, setFormData] = useState({
    customer_name: '',
    address: 'Baner Road',
    area: 'Baner',
    pincode: '411045',
    package_weight: 5.0,
    priority: 'NORMAL',
    time_window_start: 540,
    time_window_end: 1080
  });

  const [geocoding, setGeocoding] = useState(false);
  const [geocodePreview, setGeocodePreview] = useState(null);
  const [geocodeMessage, setGeocodeMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // CSV Import State
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // Optional manual test geocode button to preview internal location
  const handleTestGeocode = async () => {
    if (!formData.address) return;
    setGeocoding(true);
    setGeocodeMessage('');
    try {
      const res = await api.geocode({
        address: formData.address,
        area: formData.area,
        pincode: formData.pincode
      });
      if (res.status === 'SUCCESS' && res.latitude != null && res.longitude != null) {
        setGeocodePreview({ latitude: res.latitude, longitude: res.longitude });
        setGeocodeMessage(`✓ Location verified in ${res.matched_area || 'Pune'}: Coordinates resolved.`);
      } else {
        setGeocodePreview(null);
        setGeocodeMessage(`⚠️ Notice: This address could not be located. Please verify the address, area, or pincode.`);
      }
    } catch (e) {
      setGeocodePreview(null);
      setGeocodeMessage(`Geocoding error: ${e.message}`);
    } finally {
      setGeocoding(false);
    }
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    try {
      // Backend automatically geocodes address, area, pincode
      const created = await api.createOrder({
        customer_name: formData.customer_name,
        address: formData.address,
        area: formData.area,
        pincode: formData.pincode,
        package_weight: parseFloat(formData.package_weight),
        priority: formData.priority,
        time_window_start: parseInt(formData.time_window_start),
        time_window_end: parseInt(formData.time_window_end)
      });

      if (created.geocoding_status === 'FAILED') {
        alert(
          `Order created (#${created.order_code}), but location could not be verified automatically:\n"This address could not be located. Please verify the address, area, or pincode."\nYou can review it on the Orders page.`
        );
      } else {
        alert(`Order ${created.order_code} registered & geocoded successfully!`);
      }
      onNavigate('orders');
    } catch (e) {
      setSubmitError(e.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) return;
    setImporting(true);
    setImportResult(null);
    try {
      const res = await api.importOrders(importFile);
      setImportResult(res);
    } catch (e) {
      alert(`Import error: ${e.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Header */}
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
          <button
            onClick={() => onNavigate('orders')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              marginBottom: '4px',
              fontSize: '0.8125rem',
            }}
          >
            <ArrowLeft size={14} /> Back to Orders
          </button>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)' }}>
            Add Delivery Orders
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '2px' }}>
            Enter human-readable address, area, and pincode. Coordinates are resolved automatically by the backend.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={tab === 'single' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setTab('single')}
            style={{ fontSize: '0.8125rem', padding: '5px 12px' }}
          >
            Single Order Form
          </button>
          <button
            className={tab === 'import' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setTab('import')}
            style={{ fontSize: '0.8125rem', padding: '5px 12px' }}
          >
            <Upload size={14} /> Bulk CSV Import
          </button>
        </div>
      </div>

      {tab === 'single' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
          {/* Form Side */}
          <div className="card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px', color: 'var(--text-main)' }}>
              Order Consignment & Address
            </h2>

            {submitError && (
              <div
                style={{
                  padding: '10px 14px',
                  background: 'var(--color-danger-bg)',
                  border: '1px solid var(--color-danger-border)',
                  borderRadius: '6px',
                  color: 'var(--color-danger-text)',
                  fontSize: '0.8125rem',
                  marginBottom: '14px',
                }}
              >
                <AlertTriangle size={15} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                {submitError}
              </div>
            )}

            <form onSubmit={handleSingleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  className="form-input"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Street / Premise Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Baner Road, Near High Street"
                  className="form-input"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Area / Locality
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Baner, Kothrud, Wakad"
                    className="form-input"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Pincode (6 digits)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 411045"
                    maxLength={6}
                    className="form-input"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  />
                </div>
              </div>

              {/* Address verification test trigger */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  background: 'var(--bg-surface-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                }}
              >
                <div style={{ fontSize: '0.78125rem', color: 'var(--text-muted)' }}>
                  <MapPin size={13} style={{ display: 'inline', marginRight: '4px', color: 'var(--accent-primary)' }} />
                  Coordinates resolved automatically on save.
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  onClick={handleTestGeocode}
                  disabled={geocoding || !formData.address}
                >
                  <Search size={12} />
                  {geocoding ? 'Verifying...' : 'Verify Address'}
                </button>
              </div>

              {geocodeMessage && (
                <div
                  style={{
                    fontSize: '0.75rem',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: geocodeMessage.startsWith('✓') ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                    color: geocodeMessage.startsWith('✓') ? 'var(--color-success-text)' : 'var(--color-danger-text)',
                    border: `1px solid ${geocodeMessage.startsWith('✓') ? 'var(--color-success-border)' : 'var(--color-danger-border)'}`,
                  }}
                >
                  {geocodeMessage}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Package Weight (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    className="form-input"
                    value={formData.package_weight}
                    onChange={(e) => setFormData({ ...formData, package_weight: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Priority Level
                  </label>
                  <select
                    className="form-select"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="LOW">LOW</option>
                    <option value="NORMAL">NORMAL</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Time Window Start
                  </label>
                  <select
                    className="form-select"
                    value={formData.time_window_start}
                    onChange={(e) => setFormData({ ...formData, time_window_start: parseInt(e.target.value) })}
                  >
                    <option value={540}>09:00 AM</option>
                    <option value={600}>10:00 AM</option>
                    <option value={660}>11:00 AM</option>
                    <option value={720}>12:00 PM</option>
                    <option value={840}>02:00 PM</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Time Window End
                  </label>
                  <select
                    className="form-select"
                    value={formData.time_window_end}
                    onChange={(e) => setFormData({ ...formData, time_window_end: parseInt(e.target.value) })}
                  >
                    <option value={720}>12:00 PM</option>
                    <option value={840}>02:00 PM</option>
                    <option value={960}>04:00 PM</option>
                    <option value={1080}>06:00 PM</option>
                    <option value={1200}>08:00 PM</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '8px' }}>
                <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={submitting}>
                  {submitting ? 'Registering & Geocoding...' : 'Save & Register Order'}
                </button>
              </div>
            </form>
          </div>

          {/* Map Preview Side */}
          <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '4px', color: 'var(--text-main)' }}>
              Geocoding Location Preview
            </h2>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Nominatim resolves human-readable addresses to coordinates for routing and optimization.
            </div>
            <div style={{ flex: 1, minHeight: '360px' }}>
              <DeliveryMap
                orders={
                  geocodePreview
                    ? [
                        {
                          id: 999,
                          customer_name: formData.customer_name || 'Destination Preview',
                          address: formData.address,
                          area: formData.area,
                          pincode: formData.pincode,
                          latitude: geocodePreview.latitude,
                          longitude: geocodePreview.longitude,
                          package_weight: formData.package_weight,
                          priority: formData.priority,
                          status: 'PENDING',
                        },
                      ]
                    : []
                }
                height="380px"
              />
            </div>
          </div>
        </div>
      ) : (
        /* CSV Import Tab */
        <div className="card" style={{ padding: '24px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-main)' }}>
                Bulk Order CSV Import (No Coordinates Required)
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '2px' }}>
                Upload orders with standard addresses. Coordinates are determined automatically.
              </p>
            </div>
            <a
              href={api.getOrdersTemplateUrl()}
              download="orders_sample_template.csv"
              className="btn-secondary"
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8125rem', padding: '5px 11px' }}
            >
              <Download size={14} /> Download CSV Template
            </a>
          </div>

          <form onSubmit={handleImportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '640px', marginTop: '14px' }}>
            <div
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: '8px',
                padding: '28px',
                textAlign: 'center',
                background: 'var(--bg-surface-secondary)',
              }}
            >
              <FileText size={32} style={{ color: 'var(--accent-primary)', margin: '0 auto 10px auto' }} />
              <input
                type="file"
                accept=".csv"
                required
                onChange={(e) => setImportFile(e.target.files[0])}
                style={{ display: 'block', margin: '0 auto', fontSize: '0.8125rem' }}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.4' }}>
                Required Format: <code>order_id, customer_id, customer_name, address, area, pincode, package_weight_kg, priority, time_window_start, time_window_end, order_status</code>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={importing || !importFile}>
              {importing ? 'Processing and Geocoding Addresses...' : 'Validate and Import Orders'}
            </button>
          </form>

          {importResult && (
            <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '18px' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: '600', marginBottom: '12px', color: 'var(--text-main)' }}>
                Import & Geocoding Results
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '12px 16px', background: 'var(--bg-surface-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Processed</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '2px' }}>
                    {importResult.total_rows} rows imported
                  </div>
                </div>

                <div style={{ padding: '12px 16px', background: 'var(--color-success-bg)', borderRadius: '6px', border: '1px solid var(--color-success-border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-success-text)' }}>Successfully Geocoded</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-success)', marginTop: '2px' }}>
                    {importResult.geocoded_count} geocoded
                  </div>
                </div>

                <div style={{ padding: '12px 16px', background: 'var(--color-danger-bg)', borderRadius: '6px', border: '1px solid var(--color-danger-border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-danger-text)' }}>Geocoding Failed</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-danger)', marginTop: '2px' }}>
                    {importResult.geocoding_failed_count} unlocated
                  </div>
                </div>

                {importResult.invalid_count > 0 && (
                  <div style={{ padding: '12px 16px', background: '#fff1f2', borderRadius: '6px', border: '1px solid #fecdd3' }}>
                    <div style={{ fontSize: '0.75rem', color: '#9f1239' }}>Invalid / Format Errors</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#be123c', marginTop: '2px' }}>
                      {importResult.invalid_count} rejected
                    </div>
                  </div>
                )}
              </div>

              {/* Failed Rows Viewer */}
              {importResult.failed_rows && importResult.failed_rows.length > 0 && (
                <div style={{ marginTop: '14px' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--color-danger)', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <XCircle size={15} /> Problematic Rows Detail ({importResult.failed_rows.length}):
                  </h4>
                  <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Row</th>
                          <th>Order ID</th>
                          <th>Customer</th>
                          <th>Address</th>
                          <th>Area / PIN</th>
                          <th>Failure Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importResult.failed_rows.map((row, idx) => (
                          <tr key={idx}>
                            <td style={{ color: 'var(--text-muted)' }}>#{row.row_number}</td>
                            <td style={{ fontWeight: '600', color: 'var(--text-main)' }}>{row.order_id}</td>
                            <td>{row.customer_name}</td>
                            <td style={{ color: 'var(--text-secondary)' }}>{row.address}</td>
                            <td style={{ color: 'var(--text-muted)' }}>
                              {row.area || '-'} {row.pincode ? `(${row.pincode})` : ''}
                            </td>
                            <td style={{ color: 'var(--color-danger)', fontSize: '0.75rem' }}>{row.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {importResult.valid_count > 0 && (
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn-primary" onClick={() => onNavigate('orders')}>
                    View All Orders in System
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
