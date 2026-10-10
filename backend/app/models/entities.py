from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    address = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    orders = relationship("Order", back_populates="warehouse")

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(50), nullable=True)
    email = Column(String(100), nullable=True)
    address = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    orders = relationship("Order", back_populates="customer")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_code = Column(String(50), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=True)
    customer_name = Column(String(100), nullable=False)
    address = Column(String(255), nullable=False)
    area = Column(String(100), nullable=True)
    pincode = Column(String(10), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    geocoding_status = Column(String(20), nullable=False, default="PENDING")  # PENDING, SUCCESS, FAILED
    geocoding_error = Column(String(255), nullable=True)
    package_weight = Column(Float, nullable=False, default=5.0)  # in kg
    priority = Column(String(20), nullable=False, default="NORMAL")  # LOW, NORMAL, HIGH, URGENT
    time_window_start = Column(Integer, nullable=False, default=540)  # minutes from 00:00 (e.g. 540 = 09:00)
    time_window_end = Column(Integer, nullable=False, default=1080)   # minutes from 00:00 (e.g. 1080 = 18:00)
    status = Column(String(30), nullable=False, default="PENDING")   # PENDING, ASSIGNED, OUT_FOR_DELIVERY, DELIVERED, FAILED, CANCELLED
    assigned_vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = relationship("Customer", back_populates="orders")
    warehouse = relationship("Warehouse", back_populates="orders")
    vehicle = relationship("Vehicle", back_populates="orders")
    route_stops = relationship("RouteStop", back_populates="order")

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_number = Column(String(50), unique=True, index=True, nullable=False)
    vehicle_type = Column(String(50), nullable=False, default="Delivery Van")
    max_capacity = Column(Float, nullable=False, default=100.0)  # kg
    current_load = Column(Float, nullable=False, default=0.0)
    current_latitude = Column(Float, nullable=False)
    current_longitude = Column(Float, nullable=False)
    status = Column(String(30), nullable=False, default="AVAILABLE")  # AVAILABLE, ASSIGNED, IN_TRANSIT, MAINTENANCE, OFFLINE
    assigned_route_id = Column(Integer, ForeignKey("routes.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    orders = relationship("Order", back_populates="vehicle")
    routes = relationship("Route", foreign_keys="Route.vehicle_id", back_populates="vehicle")
    locations = relationship("VehicleLocation", back_populates="vehicle")

class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    optimization_run_id = Column(Integer, ForeignKey("optimization_runs.id"), nullable=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    total_distance_km = Column(Float, nullable=False, default=0.0)
    estimated_duration_mins = Column(Float, nullable=False, default=0.0)
    total_load_kg = Column(Float, nullable=False, default=0.0)
    utilization_pct = Column(Float, nullable=False, default=0.0)
    status = Column(String(30), nullable=False, default="DRAFT")  # DRAFT, APPROVED, IN_PROGRESS, COMPLETED
    polyline_geom = Column(Text, nullable=True)  # JSON string of coordinates [[lat, lng], ...]
    created_at = Column(DateTime, default=datetime.utcnow)

    vehicle = relationship("Vehicle", foreign_keys=[vehicle_id], back_populates="routes")
    optimization_run = relationship("OptimizationRun", back_populates="routes")
    stops = relationship("RouteStop", back_populates="route", cascade="all, delete-orphan", order_by="RouteStop.stop_sequence")

class RouteStop(Base):
    __tablename__ = "route_stops"

    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey("routes.id"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    stop_sequence = Column(Integer, nullable=False)
    stop_type = Column(String(20), nullable=False, default="DELIVERY")  # DEPOT_START, DELIVERY, DEPOT_END
    address = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    package_weight = Column(Float, nullable=False, default=0.0)
    priority = Column(String(20), nullable=False, default="NORMAL")
    eta_minutes = Column(Float, nullable=False, default=0.0)
    time_window_start = Column(Integer, nullable=True)
    time_window_end = Column(Integer, nullable=True)
    is_late = Column(Boolean, default=False)
    status = Column(String(30), nullable=False, default="PENDING")  # PENDING, COMPLETED, FAILED
    arrival_time = Column(DateTime, nullable=True)
    departure_time = Column(DateTime, nullable=True)

    route = relationship("Route", back_populates="stops")
    order = relationship("Order", back_populates="route_stops")

class OptimizationRun(Base):
    __tablename__ = "optimization_runs"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(30), nullable=False, default="COMPLETED")  # PENDING, RUNNING, COMPLETED, FAILED
    problem_orders_count = Column(Integer, nullable=False, default=0)
    problem_vehicles_count = Column(Integer, nullable=False, default=0)
    complexity_score = Column(Float, nullable=False, default=0.0)
    complexity_level = Column(String(20), nullable=False, default="LOW")  # LOW, MEDIUM, HIGH
    ml_recommended_strategy = Column(String(50), nullable=False, default="GREEDY")
    final_strategy = Column(String(50), nullable=False, default="GREEDY")
    strategy_reason = Column(Text, nullable=True)
    total_distance_km = Column(Float, nullable=False, default=0.0)
    distance_before_km = Column(Float, nullable=False, default=0.0)
    distance_saved_km = Column(Float, nullable=False, default=0.0)
    pct_improvement = Column(Float, nullable=False, default=0.0)
    vehicles_used = Column(Integer, nullable=False, default=0)
    late_orders_count = Column(Integer, nullable=False, default=0)
    capacity_violations = Column(Integer, nullable=False, default=0)
    runtime_seconds = Column(Float, nullable=False, default=0.0)

    routes = relationship("Route", back_populates="optimization_run")
    metrics = relationship("OptimizationMetric", back_populates="optimization_run")

class OptimizationMetric(Base):
    __tablename__ = "optimization_metrics"

    id = Column(Integer, primary_key=True, index=True)
    optimization_run_id = Column(Integer, ForeignKey("optimization_runs.id"), nullable=False)
    metric_key = Column(String(100), nullable=False)
    metric_value = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    optimization_run = relationship("OptimizationRun", back_populates="metrics")

class VehicleLocation(Base):
    __tablename__ = "vehicle_locations"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    speed = Column(Float, nullable=False, default=0.0)
    timestamp = Column(DateTime, default=datetime.utcnow)

    vehicle = relationship("Vehicle", back_populates="locations")

class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    version_name = Column(String(100), nullable=False)
    algorithm_name = Column(String(100), nullable=False, default="Random Forest Classifier")
    accuracy = Column(Float, nullable=False, default=0.0)
    f1_score = Column(Float, nullable=False, default=0.0)
    precision = Column(Float, nullable=False, default=0.0)
    recall = Column(Float, nullable=False, default=0.0)
    training_samples = Column(Integer, nullable=False, default=0)
    test_samples = Column(Integer, nullable=False, default=0)
    feature_importance_json = Column(Text, nullable=True)
    trained_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

class RoutingCache(Base):
    __tablename__ = "routing_cache"

    id = Column(Integer, primary_key=True, index=True)
    origin_lat = Column(Float, nullable=False, index=True)
    origin_lng = Column(Float, nullable=False, index=True)
    dest_lat = Column(Float, nullable=False, index=True)
    dest_lng = Column(Float, nullable=False, index=True)
    distance_km = Column(Float, nullable=False)
    duration_mins = Column(Float, nullable=False)
    provider = Column(String(50), nullable=False, default="osrm")
    polyline_json = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
