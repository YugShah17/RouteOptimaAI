import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Layers } from 'lucide-react';

// Reliable Map Tile Providers
const MAP_PROVIDERS = {
  osm: {
    id: 'osm',
    name: 'OSM Streets',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
  esri: {
    id: 'esri',
    name: 'Esri Modern',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    maxZoom: 19,
  },
  satellite: {
    id: 'satellite',
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri World Imagery',
    maxZoom: 19,
  },
};

// Fix Leaflet default icon issues in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Color palette for distinct vehicle routes - clean saturated logistics colors
const ROUTE_COLORS = [
  '#2563eb', // Blue
  '#16a34a', // Emerald
  '#d97706', // Amber
  '#0284c7', // Sky
  '#9333ea', // Purple
  '#dc2626', // Red
  '#0d9488', // Teal
  '#ea580c', // Orange
];

// Custom HTML Markers
const createDepotIcon = (label = '🏢') => {
  return L.divIcon({
    className: 'custom-depot-marker',
    html: `
      <div style="background: #2563eb; color: white; width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 15px; border: 2px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.25);">
        ${label}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

const createCustomerIcon = (seq, priority = 'NORMAL', isLate = false) => {
  let bg = '#2563eb';
  if (priority === 'URGENT') bg = '#dc2626';
  else if (priority === 'HIGH') bg = '#ea580c';
  else if (isLate) bg = '#b91c1c';

  return L.divIcon({
    className: 'custom-customer-marker',
    html: `
      <div style="background: ${bg}; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 10px; border: 2px solid #ffffff; box-shadow: 0 1px 4px rgba(0,0,0,0.25);">
        ${seq || '•'}
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

const createVehicleIcon = (vNum) => {
  return L.divIcon({
    className: 'custom-vehicle-marker',
    html: `
      <div style="background: #16a34a; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid #ffffff; box-shadow: 0 2px 8px rgba(22, 163, 74, 0.4);">
        🚚
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
};

// Component to handle dynamic center / pan
function MapController({ targetCenter, targetZoom }) {
  const map = useMap();
  useEffect(() => {
    if (targetCenter) {
      map.flyTo(targetCenter, targetZoom || 13, { duration: 1.0 });
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
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
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
  const [mapStyle, setMapStyle] = useState('osm');

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
            gap: '6px',
            overflowX: 'auto',
            padding: '6px 8px',
            background: 'var(--bg-surface)',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            fontSize: '0.75rem',
          }}
        >
          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap', fontWeight: '600' }}>
            <MapPin size={12} style={{ color: 'var(--accent-primary)' }} /> Jump to:
          </span>
          {PUNE_LOCALITIES.map((loc) => (
            <button
              key={loc.name}
              type="button"
              className="btn-secondary"
              style={{
                padding: '2px 8px',
                fontSize: '0.72rem',
                borderRadius: '4px',
                whiteSpace: 'nowrap',
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
      <div style={{ height, width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative' }}>
        {/* City Overlay Badge */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            zIndex: 1000,
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '5px 10px',
            fontSize: '0.75rem',
            fontWeight: '600',
            color: 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          <span style={{ color: 'var(--color-success)' }}>●</span>
          <span>Pune City Delivery Grid</span>
        </div>

        {/* Layer Switcher Pill Toolbar */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 1000,
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '3px',
            display: 'flex',
            gap: '3px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          {Object.entries(MAP_PROVIDERS).map(([key, provider]) => (
            <button
              key={key}
              type="button"
              onClick={() => setMapStyle(key)}
              style={{
                padding: '3px 8px',
                fontSize: '0.72rem',
                fontWeight: mapStyle === key ? '600' : '500',
                color: mapStyle === key ? '#ffffff' : 'var(--text-secondary)',
                background: mapStyle === key ? 'var(--accent-primary)' : 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {provider.name}
            </button>
          ))}
        </div>

        <MapContainer
          center={defaultCenter}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          attributionControl={false}
        >
          <TileLayer
            key={mapStyle}
            url={MAP_PROVIDERS[mapStyle]?.url || MAP_PROVIDERS.osm.url}
            attribution={MAP_PROVIDERS[mapStyle]?.attribution || MAP_PROVIDERS.osm.attribution}
            maxZoom={MAP_PROVIDERS[mapStyle]?.maxZoom || 19}
          />

          <MapController targetCenter={mapTarget} targetZoom={mapZoom} />
          <BoundsUpdater points={allPoints} />

          {/* Warehouses / Depots */}
          {activeWarehouses.map((wh, idx) => (
            <Marker key={`wh-${wh.id || idx}`} position={[wh.latitude, wh.longitude]} icon={createDepotIcon('🏢')}>
              <Popup>
                <div style={{ minWidth: '180px' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--accent-primary)', marginBottom: '3px' }}>
                    🏢 {wh.name || 'Logistics Depot'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{wh.address}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>
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
                    <div style={{ fontWeight: 'bold', marginBottom: '2px', color: 'var(--text-main)' }}>
                      {o.customer_name || `Order ${o.order_code}`}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{o.address}</div>
                    <div style={{ marginTop: '5px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <strong>Weight:</strong> {o.package_weight} kg |{' '}
                      <strong>Priority:</strong> {o.priority}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
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
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '3px 0' }}>
                              Vehicle: {route.vehicle_number || `Vehicle ${route.vehicle_id}`}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                              <strong>Package:</strong> {stop.package_weight} kg
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                              <strong>ETA:</strong> {Math.floor(stop.eta_minutes / 60)}:
                              {String(Math.round(stop.eta_minutes % 60)).padStart(2, '0')}{' '}
                              {stop.is_late && <span style={{ color: 'var(--color-danger)' }}>(LATE)</span>}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
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
                  <div style={{ fontWeight: 'bold', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🚚 {lv.vehicle_number}</span>
                    <span style={{ fontSize: '10px', background: 'var(--color-success-bg)', color: 'var(--color-success-text)', padding: '1px 5px', borderRadius: '3px', border: '1px solid var(--color-success-border)' }}>
                      {lv.is_simulation ? 'SIMULATING' : 'LIVE GPS'}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', marginTop: '4px', color: 'var(--text-secondary)' }}>
                    <strong>Speed:</strong> {lv.speed} km/h | <strong>Load:</strong> {lv.current_load} kg
                  </div>
                  {lv.next_stop_address && (
                    <div style={{ fontSize: '11px', marginTop: '2px', color: 'var(--text-muted)' }}>
                      <strong>Next Stop:</strong> #{lv.next_stop_sequence} ({lv.next_stop_address})
                    </div>
                  )}
                  <div style={{ fontSize: '11px', marginTop: '2px', color: 'var(--text-secondary)' }}>
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
