from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator

# --- Base Models ---

class WarehouseBase(BaseModel):
    name: str
    address: str
    latitude: float
    longitude: float

class WarehouseResponse(WarehouseBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class CustomerBase(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: str
    latitude: float
    longitude: float

class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# --- Order Schemas ---

class OrderBase(BaseModel):
    customer_name: str
    address: str
    latitude: float
    longitude: float
    package_weight: float = Field(default=5.0, gt=0)
    priority: str = Field(default="NORMAL")  # LOW, NORMAL, HIGH, URGENT
    time_window_start: int = Field(default=540, ge=0, le=1440)  # minutes from 00:00 (540 = 09:00)
    time_window_end: int = Field(default=1080, ge=0, le=1440)   # minutes from 00:00 (1080 = 18:00)
    status: str = Field(default="PENDING")

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v):
        allowed = {"LOW", "NORMAL", "HIGH", "URGENT"}
        if v.upper() not in allowed:
            raise ValueError(f"Priority must be one of {allowed}")
        return v.upper()

    @field_validator("time_window_end")
    @classmethod
    def validate_time_window(cls, v, info):
        start = info.data.get("time_window_start")
        if start is not None and v < start:
            raise ValueError("time_window_end must be greater than or equal to time_window_start")
        return v

class OrderCreate(OrderBase):
    order_code: Optional[str] = None
    customer_id: Optional[int] = None
    warehouse_id: Optional[int] = None

class OrderUpdate(BaseModel):
    customer_name: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    package_weight: Optional[float] = Field(default=None, gt=0)
    priority: Optional[str] = None
    time_window_start: Optional[int] = None
    time_window_end: Optional[int] = None
    status: Optional[str] = None
    assigned_vehicle_id: Optional[int] = None

class OrderResponse(OrderBase):
    id: int
    order_code: str
    customer_id: Optional[int] = None
    warehouse_id: Optional[int] = None
    assigned_vehicle_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Vehicle Schemas ---

class VehicleBase(BaseModel):
    vehicle_number: str
    vehicle_type: str = "Delivery Van"
    max_capacity: float = Field(default=100.0, gt=0)
    current_latitude: float
    current_longitude: float
    status: str = "AVAILABLE"

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        allowed = {"AVAILABLE", "ASSIGNED", "IN_TRANSIT", "MAINTENANCE", "OFFLINE"}
        if v.upper() not in allowed:
            raise ValueError(f"Status must be one of {allowed}")
        return v.upper()

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    vehicle_number: Optional[str] = None
    vehicle_type: Optional[str] = None
    max_capacity: Optional[float] = None
    current_load: Optional[float] = None
    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None
    status: Optional[str] = None
    assigned_route_id: Optional[int] = None

class VehicleResponse(VehicleBase):
    id: int
    current_load: float
    assigned_route_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class VehicleTelemetryUpdate(BaseModel):
    latitude: float
    longitude: float
    speed: Optional[float] = 0.0
    timestamp: Optional[datetime] = None

# --- Route & Stops Schemas ---

class RouteStopResponse(BaseModel):
    id: int
    route_id: int
    order_id: Optional[int] = None
    stop_sequence: int
    stop_type: str
    address: str
    latitude: float
    longitude: float
    package_weight: float
    priority: str
    eta_minutes: float
    time_window_start: Optional[int] = None
    time_window_end: Optional[int] = None
    is_late: bool
    status: str
    arrival_time: Optional[datetime] = None

    class Config:
        from_attributes = True

class RouteResponse(BaseModel):
    id: int
    optimization_run_id: Optional[int] = None
    vehicle_id: int
    vehicle_number: Optional[str] = None
    total_distance_km: float
    estimated_duration_mins: float
    total_load_kg: float
    utilization_pct: float
    status: str
    polyline_geom: Optional[str] = None
    created_at: datetime
    stops: List[RouteStopResponse] = []

    class Config:
        from_attributes = True

# --- Geocoding Schemas ---

class GeocodeRequest(BaseModel):
    address: str

class GeocodeResponse(BaseModel):
    address: str
    latitude: float
    longitude: float
    display_name: str
    found: bool

# --- Complexity & ML Schemas ---

class ComplexityAnalysis(BaseModel):
    number_of_orders: int
    number_of_vehicles: int
    total_capacity: float
    total_package_weight: float
    capacity_utilization: float
    number_of_constraints: int
    priority_ratio: float
    time_window_ratio: float
    geographical_spread_km: float
    average_customer_distance_km: float
    complexity_score: float  # 0 to 100
    complexity_level: str    # LOW, MEDIUM, HIGH

class StrategyRecommendation(BaseModel):
    recommended_strategy: str  # GREEDY, LOCAL_SEARCH, GENETIC, HYBRID
    confidence: float
    reason: str
    safety_applied: bool
    final_strategy: str
    feature_importance: Dict[str, float] = {}

class OptimizationAnalyzeRequest(BaseModel):
    order_ids: Optional[List[int]] = None
    vehicle_ids: Optional[List[int]] = None

class OptimizationAnalyzeResponse(BaseModel):
    complexity: ComplexityAnalysis
    recommendation: StrategyRecommendation
    feasible: bool
    feasibility_notes: List[str]

# --- Optimization Run Schemas ---

class OptimizationRunRequest(BaseModel):
    order_ids: Optional[List[int]] = None
    vehicle_ids: Optional[List[int]] = None
    force_strategy: Optional[str] = None  # None means use ML recommendation
    distance_weight: float = 1.0
    time_weight: float = 0.2
    late_penalty: float = 50.0
    capacity_penalty: float = 100.0
    max_time_seconds: Optional[int] = 30

class BeforeAfterComparison(BaseModel):
    distance_before_km: float
    distance_after_km: float
    distance_saved_km: float
    pct_improvement: float
    vehicles_before: int
    vehicles_after: int
    late_orders_before: int
    late_orders_after: int
    runtime_seconds: float

class OptimizationRunResponse(BaseModel):
    run_id: int
    status: str
    complexity_score: float
    complexity_level: str
    ml_recommended_strategy: str
    final_strategy: str
    strategy_reason: str
    comparison: BeforeAfterComparison
    routes: List[RouteResponse]
    validation_status: Dict[str, Any]

# --- Dashboard & Metrics Schemas ---

class DashboardSummaryResponse(BaseModel):
    total_orders: int
    pending_orders: int
    assigned_orders: int
    delivered_orders: int
    active_vehicles: int
    total_vehicles: int
    total_distance_km: float
    avg_route_duration_mins: float
    avg_vehicle_utilization_pct: float
    on_time_delivery_pct: float
    current_optimization_status: str
    orders_by_status: Dict[str, int]
    vehicle_utilization_distribution: List[Dict[str, Any]]
    recent_optimizations: List[Dict[str, Any]]

class MLMetricsResponse(BaseModel):
    version_name: str
    algorithm_name: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    training_samples: int
    test_samples: int
    feature_importance: Dict[str, float]
    classes: List[str]
    trained_at: Optional[datetime] = None

# --- CSV Import Result ---

class OrderImportRowResult(BaseModel):
    row_number: int
    valid: bool
    error: Optional[str] = None
    order_code: Optional[str] = None

class OrderImportResponse(BaseModel):
    total_rows: int
    valid_count: int
    invalid_count: int
    imported_orders: List[OrderResponse] = []
    errors: List[str] = []
