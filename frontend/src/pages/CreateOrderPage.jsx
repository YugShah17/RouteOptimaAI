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
  FileText
} from 'lucide-react';

export default function CreateOrderPage({ onNavigate }) {
  const [tab, setTab] = useState('single'); // 'single' | 'import'

  // Single Form State
  const [formData, setFormData] = useState({
    customer_name: '',
    address: 'Kothrud Vanaz Corner, Pune',
    latitude: 18.5074,
    longitude: 73.8077,
    package_weight: 8.5,
    priority: 'NORMAL',
    time_window_start: 540,
    time_window_end: 1080
  });

  const [geocoding, setGeocoding] = useState(false);
  const [geocodeMessage, setGeocodeMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // CSV Import State
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const handleGeocode = async () => {
    if (!formData.address) return;
    setGeocoding(true);
    setGeocodeMessage('');
    try {
      const res = await api.geocode(formData.address);
      if (res.found) {
        setFormData({
          ...formData,
          latitude: res.latitude,
          longitude: res.longitude,
        });
        setGeocodeMessage(`✓ Found coordinates: ${res.latitude.toFixed(4)}, ${res.longitude.toFixed(4)}`);
      } else {
        setGeocodeMessage(`Notice: Address not found in Nominatim; retained default coordinates.`);
      }
    } catch (e) {
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
      await api.createOrder({
        ...formData,
        package_weight: parseFloat(formData.package_weight),
        time_window_start: parseInt(formData.time_window_start),
        time_window_end: parseInt(formData.time_window_end)
      });
      alert('Order created successfully!');
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
      <div className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button
            onClick={() => onNavigate('orders')}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', marginBottom: '6px' }}
          >
            <ArrowLeft size={16} /> Back to Orders
          </button>
          <h1 style={{ fontSize: '1.4rem', fontWeight: '700' }}>Create or Import Delivery Orders</h1>
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
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>Order Details & Location</h2>

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
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Delivery Address *</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Baner High Street, Pune"
                    className="form-input"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ whiteSpace: 'nowrap' }}
                    onClick={handleGeocode}
                    disabled={geocoding}
                  >
                    <Search size={16} /> {geocoding ? 'Looking up...' : 'Geocode'}
                  </button>
                </div>
                {geocodeMessage && (
                  <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '4px' }}>
                    {geocodeMessage}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Latitude</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Longitude</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

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
                    <option value="URGENT">URGENT</option>
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
                  {submitting ? 'Creating Order...' : 'Save & Register Order'}
                </button>
              </div>
            </form>
          </div>

          {/* Map Preview Side */}
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '14px' }}>Location Preview</h2>
            <div style={{ flex: 1, minHeight: '360px' }}>
              <DeliveryMap
                orders={[{
                  id: 999,
                  customer_name: formData.customer_name || 'New Customer',
                  address: formData.address,
                  latitude: formData.latitude,
                  longitude: formData.longitude,
                  package_weight: formData.package_weight,
                  priority: formData.priority,
                  status: 'PENDING'
                }]}
                height="380px"
              />
            </div>
          </div>
        </div>
      ) : (
        /* CSV Import Tab */
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '12px' }}>Bulk Order CSV Import</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '20px' }}>
            Upload a CSV containing delivery destinations. Every row is strictly validated against weight, coordinates, and time windows.
          </p>

          <form onSubmit={handleImportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
            <div style={{ border: '2px dashed #233554', borderRadius: '12px', padding: '30px', textAlign: 'center', background: '#0a1022' }}>
              <FileText size={36} style={{ color: '#6366f1', margin: '0 auto 10px auto' }} />
              <input
                type="file"
                accept=".csv"
                required
                onChange={(e) => setImportFile(e.target.files[0])}
                style={{ display: 'block', margin: '0 auto', fontSize: '0.85rem' }}
              />
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '8px' }}>
                Columns: <code>customer_name, address, latitude, longitude, package_weight, priority, time_window_start, time_window_end</code>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={importing || !importFile}>
              {importing ? 'Processing CSV...' : 'Validate and Import Orders'}
            </button>
          </form>

          {importResult && (
            <div style={{ marginTop: '24px', borderTop: '1px solid #233554', paddingTop: '20px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px' }}>Import Summary</h3>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <div style={{ padding: '12px 20px', background: '#0b1329', borderRadius: '8px', border: '1px solid #233554' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Processed</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '700' }}>{importResult.total_rows}</div>
                </div>
                <div style={{ padding: '12px 20px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#34d399' }}>Successfully Imported</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#10b981' }}>{importResult.valid_count}</div>
                </div>
                <div style={{ padding: '12px 20px', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '8px', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#fb7185' }}>Invalid Rows</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#f43f5e' }}>{importResult.invalid_count}</div>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.85rem', color: '#fb7185', fontWeight: '600', marginBottom: '8px' }}>Validation Errors:</h4>
                  <div style={{ maxHeight: '160px', overflowY: 'auto', background: '#090e1a', padding: '12px', borderRadius: '8px', border: '1px solid rgba(244, 63, 94, 0.3)', fontSize: '0.8rem', color: '#fca5a5' }}>
                    {importResult.errors.map((err, i) => (
                      <div key={i} style={{ marginBottom: '4px' }}>• {err}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
