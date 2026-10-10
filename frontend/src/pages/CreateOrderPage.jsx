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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <button
            onClick={() => onNavigate('orders')}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', marginBottom: '6px' }}
          >
            <ArrowLeft size={16} /> Back to Orders
          </button>
          <h1 style={{ fontSize: '1.4rem', fontWeight: '700' }}>Add Delivery Orders</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '2px' }}>
            Simply enter human-friendly address, area, and pincode. Coordinates are resolved automatically by the backend.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={tab === 'single' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setTab('single')}
          >
            Single Order Form
          </button>
          <button
            className={tab === 'import' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setTab('import')}
          >
            <Upload size={16} /> Bulk CSV Import
          </button>
        </div>
      </div>

      {tab === 'single' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {/* Form Side */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>Order Details & Delivery Address</h2>

            {submitError && (
              <div style={{ padding: '12px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid #f43f5e', borderRadius: '8px', color: '#fb7185', fontSize: '0.85rem', marginBottom: '16px' }}>
                <AlertTriangle size={16} style={{ display: 'inline', marginRight: '6px' }} />
                {submitError}
              </div>
            )}

            <form onSubmit={handleSingleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Customer Name *</label>
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
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Street / Premise Address *</label>
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
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Area / Locality</label>
                  <input
                    type="text"
                    placeholder="e.g. Baner, Kothrud, Wakad"
                    className="form-input"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Pincode (6 digits)</label>
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid #1e293b', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  <MapPin size={14} style={{ display: 'inline', marginRight: '5px', color: '#6366f1' }} />
                  Coordinates will be generated automatically on save.
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  onClick={handleTestGeocode}
                  disabled={geocoding || !formData.address}
                >
                  <Search size={13} style={{ marginRight: '4px' }} />
                  {geocoding ? 'Verifying...' : 'Verify Address'}
                </button>
              </div>

              {geocodeMessage && (
                <div style={{
                  fontSize: '0.75rem',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: geocodeMessage.startsWith('✓') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: geocodeMessage.startsWith('✓') ? '#34d399' : '#f87171',
                  border: `1px solid ${geocodeMessage.startsWith('✓') ? '#10b981' : '#ef4444'}`
                }}>
                  {geocodeMessage}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Package Weight (kg) *</label>
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
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Priority Level</label>
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
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Time Window Start</label>
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
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Time Window End</label>
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

              <div style={{ marginTop: '12px' }}>
                <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={submitting}>
                  {submitting ? 'Geocoding & Creating Order...' : 'Save & Register Order'}
                </button>
              </div>
            </form>
          </div>

          {/* Map Preview Side */}
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '14px' }}>Internal Geocoding Map</h2>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '10px' }}>
              The backend uses Nominatim / OpenStreetMap to map human-readable addresses to coordinates for routing and optimization.
            </div>
            <div style={{ flex: 1, minHeight: '360px' }}>
              <DeliveryMap
                orders={geocodePreview ? [{
                  id: 999,
                  customer_name: formData.customer_name || 'Destination Preview',
                  address: formData.address,
                  area: formData.area,
                  pincode: formData.pincode,
                  latitude: geocodePreview.latitude,
                  longitude: geocodePreview.longitude,
                  package_weight: formData.package_weight,
                  priority: formData.priority,
                  status: 'PENDING'
                }] : []}
                height="380px"
              />
            </div>
          </div>
        </div>
      ) : (
        /* CSV Import Tab */
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '600' }}>Bulk Order CSV Import (No Coordinates Required)</h2>
            <a
              href={api.getOrdersTemplateUrl()}
              download="orders_sample_template.csv"
              className="btn-secondary"
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={15} /> Download Sample CSV Template
            </a>
          </div>

          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '20px' }}>
            Upload a CSV containing your delivery orders without latitude or longitude. The system validates fields and automatically resolves geographic coordinates.
          </p>

          <form onSubmit={handleImportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '640px' }}>
            <div style={{ border: '2px dashed #233554', borderRadius: '12px', padding: '30px', textAlign: 'center', background: '#0a1022' }}>
              <FileText size={36} style={{ color: '#6366f1', margin: '0 auto 10px auto' }} />
              <input
                type="file"
                accept=".csv"
                required
                onChange={(e) => setImportFile(e.target.files[0])}
                style={{ display: 'block', margin: '0 auto', fontSize: '0.85rem' }}
              />
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '10px', lineHeight: '1.4' }}>
                Required Format: <code>order_id, customer_id, customer_name, address, area, pincode, package_weight_kg, priority, time_window_start, time_window_end, order_status</code>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={importing || !importFile}>
              {importing ? 'Processing and Geocoding Addresses...' : 'Validate and Import Orders'}
            </button>
          </form>

          {importResult && (
            <div style={{ marginTop: '24px', borderTop: '1px solid #233554', paddingTop: '20px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px' }}>Import & Geocoding Results</h3>

              {/* Exact format required: 100 rows imported, 94 successfully geocoded, 6 addresses could not be geocoded */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                <div style={{ padding: '14px 20px', background: '#0b1329', borderRadius: '8px', border: '1px solid #233554' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Processed</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{importResult.total_rows} rows imported</div>
                </div>

                <div style={{ padding: '14px 20px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#34d399' }}>Successfully Geocoded</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>{importResult.geocoded_count} successfully geocoded</div>
                </div>

                <div style={{ padding: '14px 20px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#f87171' }}>Geocoding Failed</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ef4444' }}>{importResult.geocoding_failed_count} addresses could not be geocoded</div>
                </div>

                {importResult.invalid_count > 0 && (
                  <div style={{ padding: '14px 20px', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '8px', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#fb7185' }}>Invalid / Format Errors</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f43f5e' }}>{importResult.invalid_count} rejected rows</div>
                  </div>
                )}
              </div>

              {/* Failed Rows Viewer */}
              {importResult.failed_rows && importResult.failed_rows.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: '#f87171', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <XCircle size={16} /> Problematic Rows Detail ({importResult.failed_rows.length}):
                  </h4>
                  <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid #233554', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                      <thead style={{ background: '#0a1022', color: '#94a3b8' }}>
                        <tr>
                          <th style={{ padding: '8px 12px' }}>Row</th>
                          <th style={{ padding: '8px 12px' }}>Order ID</th>
                          <th style={{ padding: '8px 12px' }}>Customer</th>
                          <th style={{ padding: '8px 12px' }}>Address</th>
                          <th style={{ padding: '8px 12px' }}>Area / PIN</th>
                          <th style={{ padding: '8px 12px' }}>Failure Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importResult.failed_rows.map((row, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                            <td style={{ padding: '8px 12px', color: '#64748b' }}>#{row.row_number}</td>
                            <td style={{ padding: '8px 12px', fontWeight: '600', color: '#cbd5e1' }}>{row.order_id}</td>
                            <td style={{ padding: '8px 12px' }}>{row.customer_name}</td>
                            <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{row.address}</td>
                            <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{row.area || '-'} {row.pincode ? `(${row.pincode})` : ''}</td>
                            <td style={{ padding: '8px 12px', color: '#f87171' }}>{row.reason}</td>
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
