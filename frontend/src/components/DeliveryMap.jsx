import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation } from 'lucide-react';

// Fix Leaflet default icon issues in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Color palette for distinct vehicle routes
const ROUTE_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#14b8a6', // Teal
  '#f97316', // Orange
];

// Custom HTML Markers
const createDepotIcon = (label = '🏢') => {
  return L.divIcon({
    className: 'custom-depot-marker',
    html: `
      <div style="background: #4f46e5; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
        ${label}
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
};

const createCustomerIcon = (seq, priority = 'NORMAL', isLate = false) => {
  let bg = '#3b82f6';
  if (priority === 'URGENT') bg = '#ef4444';
  else if (priority === 'HIGH') bg = '#f97316';
  else if (isLate) bg = '#dc2626';

  return L.divIcon({
    className: 'custom-customer-marker',
    html: `
      <div style="background: ${bg}; color: white; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 11px; border: 2px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.4);">
        ${seq || '•'}
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  });
};

const createVehicleIcon = (vNum) => {
  return L.divIcon({
    className: 'custom-vehicle-marker',
    html: `
      <div style="background: #10b981; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; border: 3px solid #ffffff; box-shadow: 0 0 14px rgba(16, 185, 129, 0.8);">
        🚚
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
};

// Component to handle dynamic center / pan
function MapController({ targetCenter, targetZoom }) {
  const map = useMap();
  useEffect(() => {
    if (targetCenter) {
      map.flyTo(targetCenter, targetZoom || 13, { duration: 1.2 });
    }
  }, [targetCenter, targetZoom, map]);
  return null;
}

// Component to auto-center map bounds
function BoundsUpdater({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points && points.length > 1) {
      try {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      } catch (e) {
        // Ignore bounds error if invalid
      }
    }
  }, [points, map]);
  return null;
}

// Major Pune Hubs and Localities for Quick Jump
const PUNE_LOCALITIES = [
  { name: 'Shivajinagar Depot', coords: [18.5308, 73.8475], zoom: 14 },
  { name: 'Hadapsar Hub', coords: [18.5089, 73.9260], zoom: 14 },
  { name: 'Kothrud', coords: [18.5074, 73.8077], zoom: 14 },
  { name: 'Baner / Aundh', coords: [18.5590, 73.7868], zoom: 14 },
  { name: 'Hinjewadi IT', coords: [18.5987, 73.7688], zoom: 14 },
  { name: 'Viman Nagar', coords: [18.5679, 73.9143], zoom: 14 },
  { name: 'Pune City (All)', coords: [18.5204, 73.8567], zoom: 11 },
];

export default function DeliveryMap({
  depot = { latitude: 18.5308, longitude: 73.8475, name: 'Shivajinagar Central Depot, Pune' },
  warehouses = [],
  orders = [],
  routes = [],
  vehicles = [],
  liveVehicles = {},
  height = '520px',
  showLocalityBar = true,
}) {
  const defaultCenter = [depot.latitude || 18.5308, depot.longitude || 73.8475];
  const [mapTarget, setMapTarget] = useState(null);
  const [mapZoom, setMapZoom] = useState(12);

  // Collect all points for fitBounds
  const allPoints = [[defaultCenter[0], defaultCenter[1]]];
  if (warehouses && warehouses.length > 0) {
    warehouses.forEach((w) => {
      if (w.latitude && w.longitude) allPoints.push([w.latitude, w.longitude]);
    });
  }
  orders.forEach((o) => {
    if (o.latitude && o.longitude) allPoints.push([o.latitude, o.longitude]);
  });
  routes.forEach((r) => {
    if (r.stops) {
      r.stops.forEach((s) => {
        if (s.latitude && s.longitude) allPoints.push([s.latitude, s.longitude]);
      });
    }
  });

  const activeWarehouses = warehouses && warehouses.length > 0 ? warehouses : [depot];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Pune Locality Quick-Jump Toolbar */}
      {showLocalityBar && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            padding: '6px 10px',
            background: '#090f1f',
            borderRadius: '8px',
            border: '1px solid #1e293b',
            fontSize: '0.75rem',
          }}
        >
          <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', fontWeight: '600' }}>
            <MapPin size={13} style={{ color: '#6366f1' }} /> Pune Jump:
          </span>
          {PUNE_LOCALITIES.map((loc) => (
            <button
              key={loc.name}
              type="button"
              className="btn-secondary"
              style={{
                padding: '3px 9px',
                fontSize: '0.75rem',
                borderRadius: '6px',
                whiteSpace: 'nowrap',
                background: '#131e36',
                borderColor: '#233554',
              }}
              onClick={() => {
                setMapTarget(loc.coords);
                setMapZoom(loc.zoom);
              }}
            >
              {loc.name}
            </button>
          ))}
        </div>
      )}

      {/* Map Container */}
      <div style={{ height, width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #233554', position: 'relative' }}>
        {/* City Overlay Badge */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '0.75rem',
            fontWeight: '600',
            color: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          }}
        >
          <span style={{ color: '#10b981' }}>●</span>
          <span>Pune City Delivery Grid (Maharashtra, India)</span>
        </div>

        <MapContainer
          center={defaultCenter}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            maxZoom={19}
          />

          <MapController targetCenter={mapTarget} targetZoom={mapZoom} />
          <BoundsUpdater points={allPoints} />

          {/* Warehouses / Depots */}
          {activeWarehouses.map((wh, idx) => (
            <Marker key={`wh-${wh.id || idx}`} position={[wh.latitude, wh.longitude]} icon={createDepotIcon('🏢')}>
              <Popup>
                <div style={{ minWidth: '180px' }}>
                  <div style={{ fontWeight: 'bold', color: '#6366f1', marginBottom: '4px' }}>
                    🏢 {wh.name || 'Logistics Depot'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#cbd5e1' }}>{wh.address}</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                    Coordinates: {wh.latitude?.toFixed(4)}, {wh.longitude?.toFixed(4)}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Unassigned or General Orders (if no routes provided) */}
          {routes.length === 0 &&
            orders.map((o, idx) => (
              <Marker
                key={`ord-${o.id || idx}`}
                position={[o.latitude, o.longitude]}
                icon={createCustomerIcon(idx + 1, o.priority)}
              >
                <Popup>
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                      {o.customer_name || `Order ${o.order_code}`}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{o.address}</div>
                    <div style={{ marginTop: '6px', fontSize: '11px' }}>
                      <strong>Weight:</strong> {o.package_weight} kg |{' '}
                      <strong>Priority:</strong> {o.priority}
                    </div>
                    <div style={{ fontSize: '11px' }}>
                      <strong>Status:</strong> {o.status}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* Route Polylines and Stop Markers */}
          {routes.map((route, rIdx) => {
            const color = ROUTE_COLORS[rIdx % ROUTE_COLORS.length];
            let polylineCoords = [];

            if (route.polyline_geom) {
              try {
                polylineCoords = JSON.parse(route.polyline_geom);
              } catch (e) {
                polylineCoords = [];
              }
            }

            // Fallback to straight lines connecting stops if geometry missing
            if (polylineCoords.length === 0 && route.stops) {
              polylineCoords = route.stops.map((s) => [s.latitude, s.longitude]);
            }

            return (
              <React.Fragment key={`route-group-${route.id || rIdx}`}>
                {polylineCoords.length > 1 && (
                  <Polyline
                    positions={polylineCoords}
                    pathOptions={{
                      color,
                      weight: 4,
                      opacity: 0.85,
                      dashArray: route.status === 'COMPLETED' ? '6, 8' : undefined,
                    }}
                  />
                )}

                {/* Sequential Stops */}
                {route.stops &&
                  route.stops.map((stop, sIdx) => {
                    if (stop.stop_type === 'DEPOT_START' || stop.stop_type === 'DEPOT_END') {
                      return null;
                    }
                    return (
                      <Marker
                        key={`stop-${stop.id || sIdx}`}
                        position={[stop.latitude, stop.longitude]}
                        icon={createCustomerIcon(stop.stop_sequence, stop.priority, stop.is_late)}
                      >
                        <Popup>
                          <div style={{ minWidth: '180px' }}>
                            <div style={{ fontWeight: 'bold', color, marginBottom: '2px' }}>
                              Stop #{stop.stop_sequence}: {stop.address}
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0' }}>
                              Vehicle: {route.vehicle_number || `Vehicle ${route.vehicle_id}`}
                            </div>
                            <div style={{ fontSize: '11px' }}>
                              <strong>Package:</strong> {stop.package_weight} kg
                            </div>
                            <div style={{ fontSize: '11px' }}>
                              <strong>ETA:</strong> {Math.floor(stop.eta_minutes / 60)}:
                              {String(Math.round(stop.eta_minutes % 60)).padStart(2, '0')}{' '}
                              {stop.is_late && <span style={{ color: '#ef4444' }}>(LATE)</span>}
                            </div>
                            <div style={{ fontSize: '11px' }}>
                              <strong>Status:</strong> {stop.status}
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
              </React.Fragment>
            );
          })}

          {/* Live Vehicles (Moving telemetry markers) */}
          {Object.values(liveVehicles).map((lv) => (
            <Marker
              key={`live-veh-${lv.vehicle_id}`}
              position={[lv.latitude, lv.longitude]}
              icon={createVehicleIcon(lv.vehicle_number)}
            >
              <Popup>
                <div style={{ minWidth: '180px' }}>
                  <div style={{ fontWeight: 'bold', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🚚 {lv.vehicle_number}</span>
                    <span style={{ fontSize: '10px', background: '#064e3b', color: '#6ee7b7', padding: '1px 6px', borderRadius: '4px' }}>
                      {lv.is_simulation ? 'SIMULATING' : 'LIVE GPS'}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', marginTop: '4px' }}>
                    <strong>Speed:</strong> {lv.speed} km/h | <strong>Load:</strong> {lv.current_load} kg
                  </div>
                  {lv.next_stop_address && (
                    <div style={{ fontSize: '11px', marginTop: '2px', color: '#94a3b8' }}>
                      <strong>Next Stop:</strong> #{lv.next_stop_sequence} ({lv.next_stop_address})
                    </div>
                  )}
                  <div style={{ fontSize: '11px', marginTop: '2px' }}>
                    <strong>Status:</strong> {lv.status}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
