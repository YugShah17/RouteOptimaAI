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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Simulation & API Key Header */}
      <div className="glass-card" style={{ padding: '20px', border: '1px solid #10b981' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge badge-delivered" style={{ fontSize: '0.8rem' }}>
                <Radio size={14} className={isSimRunning ? 'pulse-dot' : ''} /> Simulation Mode
              </span>
              <span style={{ fontSize: '0.8rem', color: wsConnected ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                WebSocket: {wsConnected ? 'Connected (Live)' : 'Reconnecting...'}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(99, 102, 241, 0.15)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                <Lock size={12} /> API Key Protected
              </span>
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '700', marginTop: '6px' }}>
              Live Fleet Movement & Telemetry Tracking
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '2px' }}>
              Vehicles dynamically traverse generated routes, update GPS coordinates, and complete customer deliveries in real time.
            </p>
          </div>

          {/* Action Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {!isSimRunning ? (
              <button className="btn-primary" onClick={() => handleStart(simSpeed)} disabled={controlling}>
                <Play size={16} /> Start Simulation
              </button>
            ) : (
              <button className="btn-secondary" style={{ color: '#f43f5e', borderColor: '#f43f5e' }} onClick={handleStop} disabled={controlling}>
                <Square size={16} /> Pause / Stop
              </button>
            )}

            {/* Speed Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0b1329', padding: '6px 12px', borderRadius: '8px', border: '1px solid #233554' }}>
              <FastForward size={14} style={{ color: '#94a3b8' }} />
              <select
                className="form-select"
                style={{ padding: '2px 8px', width: '80px', fontSize: '0.8rem' }}
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
      </div>

      {/* API Key & Telemetry Ingestion Integration Card */}
      <div className="glass-card" style={{ padding: '20px', border: '1px solid #4f46e5' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={18} style={{ color: '#818cf8' }} />
            <h2 style={{ fontSize: '1.05rem', fontWeight: '700' }}>GPS Telemetry & Simulation API Key Security</h2>
          </div>
          <span className="badge badge-assigned" style={{ fontSize: '0.75rem' }}>
            Header: X-API-Key
          </span>
        </div>

        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '16px' }}>
          Live simulation controls and external IoT vehicle telemetry ingestion endpoints require authentication via the configured secret API key.
        </p>

        {/* Key Input & Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', alignItems: 'start' }}>
          <div style={{ background: '#0b1329', padding: '16px', borderRadius: '8px', border: '1px solid #233554' }}>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
              Active Telemetry API Key (Sent with simulation & GPS requests)
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter telemetry API key..."
              />
              <button className="btn-secondary" onClick={handleSaveKey} style={{ whiteSpace: 'nowrap' }}>
                {keySaved ? 'Saved ✓' : 'Save Key'}
              </button>
            </div>

            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                className="btn-primary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                onClick={handleSendTestPing}
                disabled={pinging}
              >
                <Send size={14} /> {pinging ? 'Sending Ping...' : 'Send Test GPS Ping with Key'}
              </button>
            </div>

            {testPingStatus && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  background: testPingStatus.startsWith('✓') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                  color: testPingStatus.startsWith('✓') ? '#34d399' : '#fb7185',
                  border: testPingStatus.startsWith('✓') ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)'
                }}
              >
                {testPingStatus}
              </div>
            )}
          </div>

          {/* cURL Snippet for physical trackers */}
          <div style={{ background: '#0b1329', padding: '16px', borderRadius: '8px', border: '1px solid #233554' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Code size={14} /> Physical GPS Device Integration (cURL)
              </span>
              <button
                onClick={handleCopyCurl}
                style={{ background: 'transparent', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Copy size={12} /> {copied ? 'Copied!' : 'Copy cURL'}
              </button>
            </div>
            <pre
              style={{
                background: '#070b14',
                padding: '10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: '#38bdf8',
                overflowX: 'auto',
                fontFamily: 'var(--font-mono)',
                margin: 0
              }}
            >
              {curlExample}
            </pre>
          </div>
        </div>
      </div>

      {/* Map Display */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>Live Fleet Map</h3>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            {Object.keys(liveVehicles).length} active vehicle streams
          </span>
        </div>
        <DeliveryMap routes={routes} liveVehicles={liveVehicles} height="520px" />
      </div>

      {/* Live Vehicle Telemetry Cards */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>Active Vehicle Telemetry Stream</h3>

        {Object.keys(liveVehicles).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
            <Truck size={36} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
            <div>No active vehicle telemetries currently broadcasting.</div>
            <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
              Ensure routes have been generated and click <strong>Start Simulation</strong> or <strong>Send Test GPS Ping</strong> above.
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
            {Object.values(liveVehicles).map((lv) => (
              <div key={lv.vehicle_id} style={{ background: '#0b1329', padding: '16px', borderRadius: '10px', border: '1px solid #1e293b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: '700', fontSize: '1rem', color: '#f8fafc' }}>
                    🚚 {lv.vehicle_number}
                  </div>
                  <span className="badge badge-transit" style={{ fontSize: '0.7rem' }}>
                    {lv.status}
                  </span>
                </div>

                <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>GPS Speed:</span>
                    <div style={{ fontWeight: '600', color: '#38bdf8' }}>{lv.speed} km/h</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Payload Load:</span>
                    <div style={{ fontWeight: '600', color: '#cbd5e1' }}>{lv.current_load} kg</div>
                  </div>
                </div>

                {lv.next_stop_address && (
                  <div style={{ marginTop: '10px', padding: '8px', background: '#090e1a', borderRadius: '6px', fontSize: '0.75rem' }}>
                    <div style={{ color: '#94a3b8' }}>En Route To:</div>
                    <div style={{ fontWeight: '600', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Stop #{lv.next_stop_sequence}: {lv.next_stop_address}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: '10px', fontSize: '0.75rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
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
