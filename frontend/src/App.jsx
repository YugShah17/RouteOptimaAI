import React, { useState, useEffect } from 'react';
import { createWebSocket, api } from './services/api';
import DashboardPage from './pages/DashboardPage';
import PuneMapPage from './pages/PuneMapPage';
import OrdersPage from './pages/OrdersPage';
import CreateOrderPage from './pages/CreateOrderPage';
import VehiclesPage from './pages/VehiclesPage';
import OptimizationPage from './pages/OptimizationPage';
import LiveTrackingPage from './pages/LiveTrackingPage';
import OptimizationHistoryPage from './pages/OptimizationHistoryPage';
import MLModelPage from './pages/MLModelPage';
import SettingsPage from './pages/SettingsPage';

import {
  LayoutDashboard,
  Package,
  Truck,
  Zap,
  Radio,
  History,
  Brain,
  Settings,
  PlusCircle,
  Menu,
  X,
  MapPin
} from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [wsConnected, setWsConnected] = useState(false);
  const [liveVehicles, setLiveVehicles] = useState({});
  const [simulationStatus, setSimulationStatus] = useState({ is_running: false, speed: 1.0 });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Initialize WebSocket connection and event handling
  useEffect(() => {
    let ws = null;
    let reconnectTimeout = null;

    const connectWS = () => {
      ws = createWebSocket(
        (data) => {
          if (data.type === 'vehicle_location') {
            setLiveVehicles((prev) => ({
              ...prev,
              [data.vehicle_id]: data,
            }));
          } else if (data.type === 'simulation_status') {
            setSimulationStatus({
              is_running: data.is_running,
              speed: data.speed,
            });
          }
        },
        () => {
          setWsConnected(true);
        },
        () => {
          setWsConnected(false);
          // Try reconnect after 3 seconds
          reconnectTimeout = setTimeout(connectWS, 3000);
        }
      );
    };

    connectWS();

    // Check initial simulation status
    api.getSimulationStatus().then((st) => setSimulationStatus(st)).catch(() => {});

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pune-map', label: 'Pune City Map', icon: MapPin },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'create-order', label: 'Create / Import', icon: PlusCircle },
    { id: 'vehicles', label: 'Vehicles Fleet', icon: Truck },
    { id: 'optimization', label: 'Optimization', icon: Zap },
    { id: 'tracking', label: 'Live Simulation', icon: Radio, badge: simulationStatus.is_running ? 'LIVE' : null },
    { id: 'history', label: 'Optimization History', icon: History },
    { id: 'ml-model', label: 'ML Strategy Model', icon: Brain },
    { id: 'settings', label: 'Settings & Demo', icon: Settings },
  ];

  const handleNavigate = (pageId) => {
    setCurrentPage(pageId);
    setSidebarOpen(false);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;
      case 'pune-map':
        return <PuneMapPage onNavigate={handleNavigate} />;
      case 'orders':
        return <OrdersPage onNavigate={handleNavigate} />;
      case 'create-order':
        return <CreateOrderPage onNavigate={handleNavigate} />;
      case 'vehicles':
        return <VehiclesPage />;
      case 'optimization':
        return <OptimizationPage onNavigate={handleNavigate} />;
      case 'tracking':
        return (
          <LiveTrackingPage
            liveVehicles={liveVehicles}
            simulationStatus={simulationStatus}
            wsConnected={wsConnected}
          />
        );
      case 'history':
        return <OptimizationHistoryPage />;
      case 'ml-model':
        return <MLModelPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            zIndex: 140,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        style={{
          width: '260px',
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 150,
          transition: 'transform 0.2s ease-in-out',
        }}
        className={sidebarOpen ? 'sidebar-mobile-open' : 'sidebar-desktop'}
      >
        {/* App Logo */}
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                background: 'var(--accent-primary)',
                width: '34px',
                height: '34px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.1)',
              }}
            >
              <Truck size={19} />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '1rem', letterSpacing: '-0.01em', color: 'var(--text-main)' }}>
                RouteOptima<span style={{ color: 'var(--accent-primary)' }}>AI</span>
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: '500' }}>
                Logistics Dispatch
              </div>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'none',
              padding: '4px',
            }}
            className="mobile-close-btn"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav
          style={{
            padding: '12px 10px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            overflowY: 'auto',
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: isActive ? 'var(--accent-primary-light)' : 'transparent',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? '600' : '500',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.15s ease, color 0.15s ease',
                  borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={17} style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className="badge badge-delivered"
                    style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px' }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer with Live WebSocket Status */}
        <div
          style={{
            padding: '14px 18px',
            borderTop: '1px solid var(--border-color)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            background: 'var(--bg-surface-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <div
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: wsConnected ? 'var(--color-success)' : 'var(--color-warning)',
                }}
              />
              <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>
                {wsConnected ? 'System Online' : 'Connecting...'}
              </span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-faint)' }}>
              v1.0.0
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header Bar */}
        <header
          style={{
            height: '56px',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Hamburger button for mobile/tablet */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'none',
                padding: '4px',
                borderRadius: '4px',
              }}
              className="mobile-menu-btn"
              aria-label="Toggle Navigation Menu"
            >
              <Menu size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Depot Hub:</span>
              <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                Pune Central Logistics Depot
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {simulationStatus.is_running && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 9px',
                  background: 'var(--color-success-bg)',
                  border: '1px solid var(--color-success-border)',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  color: 'var(--color-success-text)',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
                onClick={() => setCurrentPage('tracking')}
              >
                <div className="pulse-dot" />
                <span>Simulation Active ({simulationStatus.speed}x)</span>
              </div>
            )}

            <button
              className="btn-primary"
              style={{ padding: '5px 12px', fontSize: '0.8125rem' }}
              onClick={() => setCurrentPage('optimization')}
            >
              <Zap size={14} /> Optimize Routes
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div style={{ padding: '24px', flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
