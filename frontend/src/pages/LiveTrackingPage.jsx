import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import DeliveryMap from '../components/DeliveryMap';
import {
  Play,
  Square,
  FastForward,
  Radio,
  Truck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Compass,
  Key,
  Lock,
  Copy,
  Send,
  Code
} from 'lucide-react';

export default function LiveTrackingPage({ liveVehicles, simulationStatus, wsConnected }) {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simSpeed, setSimSpeed] = useState(1.0);
  const [controlling, setControlling] = useState(false);

  // API Key State
  const [apiKey, setApiKey] = useState(api.getStoredApiKey());
  const [apiKeyInfo, setApiKeyInfo] = useState(null);
  const [keySaved, setKeySaved] = useState(false);
  const [testPingStatus, setTestPingStatus] = useState('');
  const [pinging, setPinging] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadData = async () => {
    try {
      const [routesData, keyInfo] = await Promise.all([
        api.getRoutes(),
        api.getSimulationApiKeyInfo()
      ]);
      setRoutes(routesData);
      setApiKeyInfo(keyInfo);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveKey = () => {
    api.setStoredApiKey(apiKey);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2500);
  };

  const handleStart = async (spd) => {
    setControlling(true);
    try {
      await api.startSimulation(spd || simSpeed, apiKey);
    } catch (e) {
      alert(`Simulation start error: ${e.message}`);
    } finally {
      setControlling(false);
    }
  };

  const handleStop = async () => {
    setControlling(true);
    try {
      await api.stopSimulation(apiKey);
    } catch (e) {
      alert(`Simulation stop error: ${e.message}`);
    } finally {
      setControlling(false);
    }
  };

  // Send a real GPS telemetry ping with the active API Key
  const handleSendTestPing = async () => {
    setPinging(true);
    setTestPingStatus('');
    try {
      // Pick first vehicle or ID 1
      const vId = Object.keys(liveVehicles)[0] || 1;
      const testLat = 18.5308 + (Math.random() - 0.5) * 0.03;
      const testLng = 73.8475 + (Math.random() - 0.5) * 0.03;

      await api.sendVehicleTelemetry(
        vId,
        {
          latitude: parseFloat(testLat.toFixed(5)),
          longitude: parseFloat(testLng.toFixed(5)),
          speed: 42.5,
          timestamp: new Date().toISOString()
        },
        apiKey
      );
      setTestPingStatus(`✓ Authenticated GPS ping sent for Vehicle #${vId} (${testLat.toFixed(4)}, ${testLng.toFixed(4)})`);
    } catch (e) {
      setTestPingStatus(`❌ Telemetry Rejected: ${e.message}`);
    } finally {
      setPinging(false);
    }
  };

  const curlExample = `curl -X POST "http://localhost:8000/api/vehicles/1/location" \\
  -H "X-API-Key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"latitude": 18.5308, "longitude": 73.8475, "speed": 38.0}'`;

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlExample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isSimRunning = simulationStatus?.is_running;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Simulation Header */}
      <div
        className="card"
        style={{
          padding: '18px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span className="badge badge-delivered" style={{ fontSize: '0.75rem' }}>
              <Radio size={12} className={isSimRunning ? 'pulse-dot' : ''} /> Simulation Mode
            </span>
            <span style={{ fontSize: '0.8125rem', color: wsConnected ? 'var(--color-success)' : 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
              WebSocket: {wsConnected ? 'Connected (Live)' : 'Reconnecting...'}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--accent-primary-light)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--accent-primary-border)' }}>
              <Lock size={11} /> API Key Protected
            </span>
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '6px', color: 'var(--text-main)' }}>
            Live Fleet Movement & Telemetry Tracking
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '2px' }}>
            Vehicles traverse generated routes, update GPS coordinates, and complete customer deliveries in real time.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!isSimRunning ? (
            <button
              className="btn-primary"
              style={{ fontSize: '0.8125rem', padding: '6px 14px' }}
              onClick={() => handleStart(simSpeed)}
              disabled={controlling}
            >
              <Play size={14} /> Start Simulation
            </button>
          ) : (
            <button
              className="btn-outline-danger"
              style={{ fontSize: '0.8125rem', padding: '6px 14px' }}
              onClick={handleStop}
              disabled={controlling}
            >
              <Square size={14} /> Pause / Stop
            </button>
          )}

          {/* Speed Selector */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--bg-surface-secondary)',
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
            }}
          >
            <FastForward size={14} style={{ color: 'var(--text-muted)' }} />
            <select
              className="form-select"
              style={{ padding: '2px 6px', width: '75px', fontSize: '0.8125rem', height: '28px', border: 'none', background: 'transparent' }}
              value={simSpeed}
              onChange={(e) => {
                const s = parseFloat(e.target.value);
                setSimSpeed(s);
                if (isSimRunning) handleStart(s);
              }}
            >
              <option value={1.0}>1x</option>
              <option value={2.0}>2x</option>
              <option value={4.0}>4x</option>
              <option value={8.0}>8x</option>
            </select>
          </div>
        </div>
      </div>

      {/* API Key & Telemetry Ingestion Integration Card */}
      <div className="card" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={16} style={{ color: 'var(--accent-primary)' }} />
            <h2 style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text-main)' }}>
              GPS Telemetry & Simulation API Key Security
            </h2>
          </div>
          <span className="badge badge-assigned" style={{ fontSize: '0.72rem' }}>
            Header: X-API-Key
          </span>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '14px' }}>
          Simulation controls and external IoT vehicle telemetry ingestion endpoints require authentication via the configured secret API key.
        </p>

        {/* Key Input & Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px', alignItems: 'start' }}>
          <div style={{ background: 'var(--bg-surface-secondary)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <label style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Active Telemetry API Key
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                className="form-input"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', height: '34px' }}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter telemetry API key..."
              />
              <button
                className="btn-secondary"
                onClick={handleSaveKey}
                style={{ whiteSpace: 'nowrap', fontSize: '0.78125rem', padding: '0 10px', height: '34px' }}
              >
                {keySaved ? 'Saved ✓' : 'Save'}
              </button>
            </div>

            <div style={{ marginTop: '10px' }}>
              <button
                className="btn-primary"
                style={{ padding: '5px 12px', fontSize: '0.78125rem' }}
                onClick={handleSendTestPing}
                disabled={pinging}
              >
                <Send size={13} /> {pinging ? 'Sending Ping...' : 'Send Test GPS Ping'}
              </button>
            </div>

            {testPingStatus && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  background: testPingStatus.startsWith('✓') ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                  color: testPingStatus.startsWith('✓') ? 'var(--color-success-text)' : 'var(--color-danger-text)',
                  border: `1px solid ${testPingStatus.startsWith('✓') ? 'var(--color-success-border)' : 'var(--color-danger-border)'}`,
                }}
              >
                {testPingStatus}
              </div>
            )}
          </div>

          {/* cURL Snippet for physical trackers */}
          <div style={{ background: '#0f172a', padding: '14px', borderRadius: '6px', border: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Code size={13} /> Physical GPS Device Integration (cURL)
              </span>
              <button
                onClick={handleCopyCurl}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#38bdf8',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <Copy size={11} /> {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre
              style={{
                background: '#020617',
                padding: '8px',
                borderRadius: '4px',
                fontSize: '0.72rem',
                color: '#38bdf8',
                overflowX: 'auto',
                fontFamily: 'var(--font-mono)',
                margin: 0,
                lineHeight: '1.4',
              }}
            >
              {curlExample}
            </pre>
          </div>
        </div>
      </div>

      {/* Map Display */}
      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text-main)' }}>Live Fleet Map</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {Object.keys(liveVehicles).length} active vehicle streams
          </span>
        </div>
        <DeliveryMap routes={routes} liveVehicles={liveVehicles} height="520px" />
      </div>

      {/* Live Vehicle Telemetry Cards */}
      <div className="card" style={{ padding: '18px 20px' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: '600', marginBottom: '14px', color: 'var(--text-main)' }}>
          Active Vehicle Telemetry Stream
        </h3>

        {Object.keys(liveVehicles).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
            <Truck size={32} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
            <div style={{ fontSize: '0.875rem' }}>No active vehicle telemetries currently broadcasting.</div>
            <div style={{ fontSize: '0.78125rem', marginTop: '3px' }}>
              Ensure routes have been generated and click <strong>Start Simulation</strong> or <strong>Send Test GPS Ping</strong> above.
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {Object.values(liveVehicles).map((lv) => (
              <div
                key={lv.vehicle_id}
                style={{
                  background: 'var(--bg-surface-secondary)',
                  padding: '14px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: '600', fontSize: '0.9375rem', color: 'var(--text-main)' }}>
                    🚚 {lv.vehicle_number}
                  </div>
                  <span className="badge badge-transit" style={{ fontSize: '0.6875rem' }}>
                    {lv.status}
                  </span>
                </div>

                <div style={{ marginTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.78125rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>GPS Speed:</span>
                    <div style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>{lv.speed} km/h</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Payload:</span>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{lv.current_load} kg</div>
                  </div>
                </div>

                {lv.next_stop_address && (
                  <div style={{ marginTop: '8px', padding: '6px 8px', background: '#ffffff', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.72rem' }}>
                    <div style={{ color: 'var(--text-muted)' }}>En Route To:</div>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Stop #{lv.next_stop_sequence}: {lv.next_stop_address}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: '8px', fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Lat: {lv.latitude?.toFixed(4)}</span>
                  <span>Lon: {lv.longitude?.toFixed(4)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
