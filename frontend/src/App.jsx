import React, { useState, useEffect } from 'react';
import { createWebSocket, api } from './services/api';
import DashboardPage from './pages/DashboardPage';
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
  X
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
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'create-order', label: 'Create / Import', icon: PlusCircle },
    { id: 'vehicles', label: 'Vehicles Fleet', icon: Truck },
    { id: 'optimization', label: 'Optimization', icon: Zap },
    { id: 'tracking', label: 'Live Simulation', icon: Radio, badge: simulationStatus.is_running ? 'LIVE' : null },
    { id: 'history', label: 'Optimization History', icon: History },
    { id: 'ml-model', label: 'ML Strategy Model', icon: Brain },
    { id: 'settings', label: 'Settings & Demo', icon: Settings },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={setCurrentPage} />;
      case 'orders':
        return <OrdersPage onNavigate={setCurrentPage} />;
      case 'create-order':
        return <CreateOrderPage onNavigate={setCurrentPage} />;
      case 'vehicles':
        return <VehiclesPage />;
      case 'optimization':
        return <OptimizationPage onNavigate={setCurrentPage} />;
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
        return <DashboardPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar Navigation */}
      <aside
        style={{
          width: '260px',
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 100,
        }}
      >
        {/* App Logo */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)' }}>
            <Zap size={22} />
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '1rem', letterSpacing: '-0.02em', color: '#f8fafc' }}>
              RouteOptima<span style={{ color: '#818cf8' }}>AI</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Complexity-Aware
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: isActive ? '#818cf8' : '#94a3b8',
                  fontWeight: isActive ? '600' : '500',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="badge badge-delivered" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer with Live WebSocket Status */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: '#94a3b8' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: wsConnected ? '#10b981' : '#f59e0b',
                }}
              />
              <span>{wsConnected ? 'WebSocket Live' : 'Disconnected'}</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>v1.0.0</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header Bar */}
        <header
          style={{
            height: '64px',
            borderBottom: '1px solid var(--border-color)',
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 28px',
            position: 'sticky',
            top: 0,
            zIndex: 90,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Current Hub:</span>
            <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#f8fafc' }}>
              Pune Central Logistics Depot
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {simulationStatus.is_running && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  color: '#34d399',
                  cursor: 'pointer',
                }}
                onClick={() => setCurrentPage('tracking')}
              >
                <div className="pulse-dot" />
                <span>Simulation Active ({simulationStatus.speed}x)</span>
              </div>
            )}

            <button
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              onClick={() => setCurrentPage('optimization')}
            >
              <Zap size={14} /> Quick Optimize
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div style={{ padding: '28px', flex: 1 }}>{renderPage()}</div>
      </main>
    </div>
  );
}
