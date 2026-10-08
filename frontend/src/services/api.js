const API_BASE = "http://localhost:8000/api";
const WS_BASE = "ws://localhost:8000/ws/live";

export const api = {
  // Health
  getHealth: async () => {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  // Dashboard
  getDashboard: async () => {
    const res = await fetch(`${API_BASE}/dashboard/summary`);
    return res.json();
  },

  // Orders
  getOrders: async (params = {}) => {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/orders?${q}`);
    return res.json();
  },

  createOrder: async (data) => {
    const res = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to create order");
    }
    return res.json();
  },

  updateOrder: async (id, data) => {
    const res = await fetch(`${API_BASE}/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  deleteOrder: async (id) => {
    const res = await fetch(`${API_BASE}/orders/${id}`, { method: "DELETE" });
    return res.json();
  },

  importOrders: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/orders/import`, {
      method: "POST",
      body: formData,
    });
    return res.json();
  },

  // Vehicles
  getVehicles: async () => {
    const res = await fetch(`${API_BASE}/vehicles`);
    return res.json();
  },

  createVehicle: async (data) => {
    const res = await fetch(`${API_BASE}/vehicles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to create vehicle");
    }
    return res.json();
  },

  // Geocoding
  geocode: async (address) => {
    const res = await fetch(`${API_BASE}/geocode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    return res.json();
  },

  // Optimization
  analyzeProblem: async (payload = {}) => {
    const res = await fetch(`${API_BASE}/optimization/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  runOptimization: async (payload = {}) => {
    const res = await fetch(`${API_BASE}/optimization/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Optimization failed");
    }
    return res.json();
  },

  getOptimizationRuns: async () => {
    const res = await fetch(`${API_BASE}/optimization/runs`);
    return res.json();
  },

  getRoutes: async () => {
    const res = await fetch(`${API_BASE}/routes`);
    return res.json();
  },

  // API Key Utilities
  getStoredApiKey: () => {
    return localStorage.getItem('telemetry_api_key') || 'dev-telemetry-key-2026';
  },

  setStoredApiKey: (key) => {
    localStorage.setItem('telemetry_api_key', key);
  },

  getSimulationApiKeyInfo: async () => {
    const res = await fetch(`${API_BASE}/simulation/api-key-info`);
    return res.json();
  },

  // Simulation Controls (API Key Protected)
  startSimulation: async (speed = 1.0, apiKey = null) => {
    const key = apiKey || api.getStoredApiKey();
    const res = await fetch(`${API_BASE}/simulation/start?speed=${speed}`, {
      method: "POST",
      headers: {
        "X-API-Key": key,
      },
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Unauthorized: Invalid or missing API key");
    }
    return res.json();
  },

  stopSimulation: async (apiKey = null) => {
    const key = apiKey || api.getStoredApiKey();
    const res = await fetch(`${API_BASE}/simulation/stop`, {
      method: "POST",
      headers: {
        "X-API-Key": key,
      },
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Unauthorized: Invalid or missing API key");
    }
    return res.json();
  },

  getSimulationStatus: async () => {
    const res = await fetch(`${API_BASE}/simulation/status`);
    return res.json();
  },

  // Real GPS Telemetry Ingestion (API Key Protected)
  sendVehicleTelemetry: async (vehicleId, telemetry, apiKey = null) => {
    const key = apiKey || api.getStoredApiKey();
    const res = await fetch(`${API_BASE}/vehicles/${vehicleId}/location`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": key,
      },
      body: JSON.stringify(telemetry),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Unauthorized: Telemetry rejected");
    }
    return res.json();
  },

  // ML Info
  getMLMetrics: async () => {
    const res = await fetch(`${API_BASE}/ml/metrics`);
    return res.json();
  },

  // Demo Seeder
  seedDemo: async () => {
    const res = await fetch(`${API_BASE}/demo/seed`, {
      method: "POST",
    });
    return res.json();
  },

  clearDemo: async () => {
    const res = await fetch(`${API_BASE}/demo/clear`, {
      method: "POST",
    });
    return res.json();
  },
};

export const createWebSocket = (onMessage, onOpen, onClose) => {
  let ws = null;
  try {
    ws = new WebSocket(WS_BASE);
    ws.onopen = () => {
      if (onOpen) onOpen();
    };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onMessage) onMessage(data);
      } catch (err) {
        console.error("Failed to parse WS event", err);
      }
    };
    ws.onclose = () => {
      if (onClose) onClose();
    };
  } catch (err) {
    console.error("WS error", err);
  }
  return ws;
};
