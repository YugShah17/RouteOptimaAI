import io
import csv
import json
import re
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Header, UploadFile, File, Response
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.config import settings
from backend.app.database import get_db
from backend.app.models.entities import (
    Warehouse, Customer, Order, Vehicle, Route, RouteStop,
    OptimizationRun, OptimizationMetric, VehicleLocation, ModelVersion, RoutingCache
)
from backend.app.schemas.schemas import (
    OrderCreate, OrderUpdate, OrderResponse,
    VehicleCreate, VehicleUpdate, VehicleResponse, VehicleTelemetryUpdate,
    GeocodeRequest, GeocodeResponse,
    OptimizationAnalyzeRequest, OptimizationAnalyzeResponse,
    OptimizationRunRequest, OptimizationRunResponse, BeforeAfterComparison,
    RouteResponse, RouteStopResponse,
    DashboardSummaryResponse, MLMetricsResponse, OrderImportResponse
)
from backend.app.services.routing import routing_service
from backend.app.services.geocoding import geocoding_service

# -------------------------------------------------------------
# API Key Verification Dependency
# -------------------------------------------------------------
def verify_simulation_api_key(
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    api_key: Optional[str] = Query(None, alias="api_key")
):
    expected_key = settings.SIMULATION_API_KEY
    provided_key = x_api_key or api_key
    if not provided_key or provided_key != expected_key:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: Invalid or missing Simulation/Telemetry API Key. Provide via 'X-API-Key' header or '?api_key=' parameter."
        )
    return provided_key
from backend.app.services.complexity import complexity_service
from backend.app.services.ml_service import ml_strategy_service
from backend.app.services.websocket_manager import ws_manager
from backend.app.services.simulation import simulation_service
from backend.app.optimization.evaluator import RouteEvaluator
from backend.app.optimization.greedy import GreedyOptimizer
from backend.app.optimization.local_search import LocalSearchOptimizer
from backend.app.optimization.genetic import GeneticOptimizer
from backend.app.optimization.hybrid import HybridOptimizer

logger = logging.getLogger("api")
router = APIRouter()

# -------------------------------------------------------------
# Health Check
# -------------------------------------------------------------
@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AI-Based Complexity-Aware Delivery Route Optimization System",
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/warehouses")
def get_warehouses(db: Session = Depends(get_db)):
    return db.query(Warehouse).all()

# -------------------------------------------------------------
# Dashboard Summary
# -------------------------------------------------------------
@router.get("/dashboard/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_orders = db.query(Order).count()
    pending_orders = db.query(Order).filter(Order.status == "PENDING").count()
    assigned_orders = db.query(Order).filter(Order.status.in_(["ASSIGNED", "OUT_FOR_DELIVERY"])).count()
    delivered_orders = db.query(Order).filter(Order.status == "DELIVERED").count()

    total_vehicles = db.query(Vehicle).count()
    active_vehicles = db.query(Vehicle).filter(Vehicle.status.in_(["ASSIGNED", "IN_TRANSIT"])).count()

    # Aggregate distances from completed or active routes
    total_dist = db.query(func.sum(Route.total_distance_km)).scalar() or 0.0
    avg_duration = db.query(func.avg(Route.estimated_duration_mins)).scalar() or 0.0
    avg_util = db.query(func.avg(Route.utilization_pct)).scalar() or 0.0

    # On-time delivery rate
    delivered_stops = db.query(RouteStop).filter(RouteStop.status == "COMPLETED", RouteStop.stop_type == "DELIVERY").all()
    if delivered_stops:
        on_time = sum(1 for s in delivered_stops if not s.is_late)
        on_time_pct = round((on_time / len(delivered_stops)) * 100.0, 1)
    else:
        on_time_pct = 100.0 if delivered_orders > 0 else 0.0

    # Status breakdown
    orders_by_status = {
        "PENDING": pending_orders,
        "ASSIGNED": db.query(Order).filter(Order.status == "ASSIGNED").count(),
        "OUT_FOR_DELIVERY": db.query(Order).filter(Order.status == "OUT_FOR_DELIVERY").count(),
        "DELIVERED": delivered_orders,
        "FAILED": db.query(Order).filter(Order.status == "FAILED").count(),
        "CANCELLED": db.query(Order).filter(Order.status == "CANCELLED").count()
    }

    # Vehicle utilization distribution
    vehicles = db.query(Vehicle).all()
    v_util_list = []
    for v in vehicles:
        util = round((v.current_load / v.max_capacity * 100.0), 1) if v.max_capacity > 0 else 0.0
        v_util_list.append({
            "vehicle_number": v.vehicle_number,
            "vehicle_type": v.vehicle_type,
            "current_load": v.current_load,
            "max_capacity": v.max_capacity,
            "utilization_pct": util,
            "status": v.status
        })

    # Recent optimization runs
    recent_runs = db.query(OptimizationRun).order_by(OptimizationRun.created_at.desc()).limit(5).all()
    recent_list = []
    for r in recent_runs:
        recent_list.append({
            "id": r.id,
            "algorithm": r.final_strategy,
            "orders": r.problem_orders_count,
            "complexity": r.complexity_level,
            "distance_km": r.total_distance_km,
            "saved_km": r.distance_saved_km,
            "improvement_pct": r.pct_improvement,
            "runtime_s": r.runtime_seconds,
            "created_at": r.created_at.strftime("%Y-%m-%d %H:%M")
        })

    return DashboardSummaryResponse(
        total_orders=total_orders,
        pending_orders=pending_orders,
        assigned_orders=assigned_orders,
        delivered_orders=delivered_orders,
        active_vehicles=active_vehicles,
        total_vehicles=total_vehicles,
        total_distance_km=round(total_dist, 2),
        avg_route_duration_mins=round(avg_duration, 1),
        avg_vehicle_utilization_pct=round(avg_util, 1),
        on_time_delivery_pct=on_time_pct,
        current_optimization_status="READY",
        orders_by_status=orders_by_status,
        vehicle_utilization_distribution=v_util_list,
        recent_optimizations=recent_list
    )

# -------------------------------------------------------------
# Orders CRUD & Import/Export
# -------------------------------------------------------------
@router.get("/orders", response_model=List[OrderResponse])
def get_orders(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(Order)
    if status:
        query = query.filter(Order.status == status.upper())
    if priority:
        query = query.filter(Order.priority == priority.upper())
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Order.customer_name.ilike(search_filter)) |
            (Order.order_code.ilike(search_filter)) |
            (Order.address.ilike(search_filter))
        )
    return query.order_by(Order.id.desc()).offset(offset).limit(limit).all()

@router.post("/orders", response_model=OrderResponse)
def create_order(order_in: OrderCreate, db: Session = Depends(get_db)):
    code = order_in.order_code or order_in.order_id
    if not code:
        count = db.query(Order).count() + 1
        code = f"ORD-{count:04d}"

    # Verify unique code
    existing = db.query(Order).filter(Order.order_code == code).first()
    if existing:
        code = f"ORD-{db.query(Order).count() + 10:04d}"

    # Default warehouse if none specified
    wh = db.query(Warehouse).first()
    warehouse_id = order_in.warehouse_id or (wh.id if wh else None)

    # Resolve package weight (support package_weight or package_weight_kg)
    pkg_weight = order_in.package_weight_kg if order_in.package_weight_kg is not None else (order_in.package_weight or 5.0)

    # Automatic Geocoding
    lat = order_in.latitude
    lon = order_in.longitude
    geo_status = "PENDING"
    geo_error = None

    if lat is not None and lon is not None:
        geo_status = "SUCCESS"
    else:
        # Perform automatic geocoding using dedicated geocoding service
        geo_res = geocoding_service.geocode(order_in.address, area=order_in.area, pincode=order_in.pincode)
        if geo_res.get("found") and geo_res.get("latitude") is not None and geo_res.get("longitude") is not None:
            lat = geo_res["latitude"]
            lon = geo_res["longitude"]
            geo_status = "SUCCESS"
        else:
            lat = None
            lon = None
            geo_status = "FAILED"
            geo_error = geo_res.get("error") or "This address could not be located. Please verify the address, area, or pincode."

    order = Order(
        order_code=code,
        customer_id=order_in.customer_id,
        warehouse_id=warehouse_id,
        customer_name=order_in.customer_name,
        address=order_in.address,
        area=order_in.area,
        pincode=order_in.pincode,
        latitude=lat,
        longitude=lon,
        geocoding_status=geo_status,
        geocoding_error=geo_error,
        package_weight=pkg_weight,
        priority=order_in.priority,
        time_window_start=order_in.time_window_start,
        time_window_end=order_in.time_window_end,
        status=order_in.order_status or order_in.status or "PENDING"
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order

@router.get("/orders/template")
def get_orders_template():
    """
    Returns downloadable sample CSV template for bulk order uploads without coordinates.
    """
    csv_content = (
        "order_id,customer_id,customer_name,address,area,pincode,package_weight_kg,priority,time_window_start,time_window_end,order_status\n"
        "ORD001,C001,Customer 1,Baner Road,Baner,411045,2.5,HIGH,10:00,12:00,PENDING\n"
        "ORD002,C002,Customer 2,Wakad Road,Wakad,411057,1.8,NORMAL,12:00,14:00,PENDING\n"
        "ORD003,C003,Customer 3,Aundh Road,Aundh,411007,3.2,HIGH,14:00,16:00,PENDING\n"
        "ORD004,C004,Customer 4,Kothrud Vanaz Corner,Kothrud,411038,4.0,NORMAL,11:00,15:00,PENDING\n"
        "ORD005,C005,Customer 5,Viman Nagar Central,Viman Nagar,411014,1.5,LOW,13:00,17:00,PENDING\n"
    )
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=orders_sample_template.csv"}
    )

@router.post("/orders/import", response_model=OrderImportResponse)
async def import_orders_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()
    decoded = contents.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))

    wh = db.query(Warehouse).first()
    warehouse_id = wh.id if wh else None

    total_rows = 0
    valid_count = 0
    geocoded_count = 0
    geocoding_failed_count = 0
    invalid_count = 0
    errors = []
    failed_rows = []
    created_orders = []

    def parse_time_minutes(val_str: str, default: int) -> int:
        if not val_str:
            return default
        val = val_str.strip()
        if ":" in val:
            parts = val.split(":")
            return int(parts[0]) * 60 + int(parts[1])
        return int(val) if val.isdigit() else default

    for row_idx, row in enumerate(reader, start=1):
        total_rows += 1
        # Case-insensitive header matching
        normalized = {k.strip().lower() if k else "": v.strip() if v else "" for k, v in row.items()}

        try:
            # 1. Required fields: customer_name, address
            cust_name = normalized.get("customer_name") or normalized.get("customer")
            address = normalized.get("address")
            if not cust_name:
                raise ValueError("Customer name is required")
            if not address:
                raise ValueError("Address is required")

            area = normalized.get("area") or None
            pincode = normalized.get("pincode") or None

            # 2. Validate pincode
            if pincode:
                if not re.match(r"^[1-9][0-9]{5}$", pincode):
                    raise ValueError(f"Invalid Indian PIN code format '{pincode}'. Must be 6 digits.")

            # 3. Validate package weight
            weight_str = (
                normalized.get("package_weight_kg") or
                normalized.get("package_weight") or
                normalized.get("weight") or
                "5.0"
            )
            try:
                weight = float(weight_str)
                if weight <= 0:
                    raise ValueError("Package weight must be greater than 0")
            except ValueError as ve:
                raise ValueError(f"Invalid package weight '{weight_str}': {str(ve)}")

            # 4. Validate priority
            prio = (normalized.get("priority") or "NORMAL").upper()
            if prio not in ("LOW", "NORMAL", "HIGH", "URGENT"):
                prio = "NORMAL"

            # 5. Validate time window
            tw_s_raw = normalized.get("time_window_start") or "540"
            tw_e_raw = normalized.get("time_window_end") or "1080"
            tw_start = parse_time_minutes(tw_s_raw, 540)
            tw_end = parse_time_minutes(tw_e_raw, 1080)
            if tw_end < tw_start:
                raise ValueError(f"Time window end ({tw_e_raw}) must be >= start ({tw_s_raw})")

            # 6. Automatic geocoding (use coordinates if supplied, otherwise lookup)
            lat_str = normalized.get("latitude") or normalized.get("lat")
            lon_str = normalized.get("longitude") or normalized.get("lng") or normalized.get("lon")
            lat = None
            lon = None
            geo_status = "PENDING"
            geo_error = None

            if lat_str and lon_str:
                try:
                    lat = float(lat_str)
                    lon = float(lon_str)
                    geo_status = "SUCCESS"
                except Exception:
                    lat = None
                    lon = None

            if lat is None or lon is None:
                geo_res = geocoding_service.geocode(address, area=area, pincode=pincode)
                if geo_res.get("found") and geo_res.get("latitude") is not None and geo_res.get("longitude") is not None:
                    lat = geo_res["latitude"]
                    lon = geo_res["longitude"]
                    geo_status = "SUCCESS"
                else:
                    lat = None
                    lon = None
                    geo_status = "FAILED"
                    geo_error = geo_res.get("error") or "This address could not be located. Please verify the address, area, or pincode."

            # Order code
            code = (
                normalized.get("order_id") or
                normalized.get("order_code") or
                f"IMP-{row_idx:04d}-{int(datetime.utcnow().timestamp())}"
            )
            if db.query(Order).filter(Order.order_code == code).first():
                code = f"IMP-{row_idx:04d}-{int(datetime.utcnow().timestamp())}"

            ord_status = (normalized.get("order_status") or normalized.get("status") or "PENDING").upper()
            if ord_status not in ("PENDING", "ASSIGNED", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED", "CANCELLED"):
                ord_status = "PENDING"

            ord_obj = Order(
                order_code=code,
                warehouse_id=warehouse_id,
                customer_name=cust_name,
                address=address,
                area=area,
                pincode=pincode,
                latitude=lat,
                longitude=lon,
                geocoding_status=geo_status,
                geocoding_error=geo_error,
                package_weight=weight,
                priority=prio,
                time_window_start=tw_start,
                time_window_end=tw_end,
                status=ord_status
            )
            db.add(ord_obj)
            created_orders.append(ord_obj)
            valid_count += 1
            if geo_status == "SUCCESS":
                geocoded_count += 1
            else:
                geocoding_failed_count += 1
                failed_rows.append({
                    "row_number": row_idx,
                    "order_id": code,
                    "customer_name": cust_name,
                    "address": address,
                    "area": area,
                    "pincode": pincode,
                    "reason": geo_error
                })

        except Exception as e:
            invalid_count += 1
            err_msg = f"Row {row_idx}: {str(e)}"
            errors.append(err_msg)
            failed_rows.append({
                "row_number": row_idx,
                "order_id": normalized.get("order_id") or f"Row {row_idx}",
                "customer_name": normalized.get("customer_name") or "",
                "address": normalized.get("address") or "",
                "area": normalized.get("area") or "",
                "pincode": normalized.get("pincode") or "",
                "reason": str(e)
            })

    db.commit()
    for o in created_orders:
        db.refresh(o)

    return OrderImportResponse(
        total_rows=total_rows,
        valid_count=valid_count,
        geocoded_count=geocoded_count,
        geocoding_failed_count=geocoding_failed_count,
        invalid_count=invalid_count,
        imported_orders=created_orders,
        errors=errors,
        failed_rows=failed_rows
    )

@router.get("/orders/export")
def export_orders_csv(db: Session = Depends(get_db)):
    orders = db.query(Order).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "order_id", "order_code", "customer_name", "address", "area", "pincode",
        "latitude", "longitude", "geocoding_status", "package_weight_kg",
        "priority", "time_window_start", "time_window_end", "order_status"
    ])
    for o in orders:
        s_h = f"{o.time_window_start // 60:02d}:{o.time_window_start % 60:02d}"
        e_h = f"{o.time_window_end // 60:02d}:{o.time_window_end % 60:02d}"
        writer.writerow([
            o.id,
            o.order_code,
            o.customer_name,
            o.address,
            o.area or "",
            o.pincode or "",
            round(o.latitude, 6) if o.latitude is not None else "",
            round(o.longitude, 6) if o.longitude is not None else "",
            o.geocoding_status,
            o.package_weight,
            o.priority,
            s_h,
            e_h,
            o.status
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=orders_export.csv"}
    )

@router.get("/orders/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.put("/orders/{order_id}", response_model=OrderResponse)
def update_order(order_id: int, order_in: OrderUpdate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    update_data = order_in.model_dump(exclude_unset=True)
    address_changed = "address" in update_data or "area" in update_data or "pincode" in update_data

    for field, val in update_data.items():
        setattr(order, field, val)

    # Re-geocode if address changed and coordinates were not manually supplied
    if address_changed and "latitude" not in update_data and "longitude" not in update_data:
        geo_res = geocoding_service.geocode(order.address, area=order.area, pincode=order.pincode)
        if geo_res.get("found") and geo_res.get("latitude") is not None and geo_res.get("longitude") is not None:
            order.latitude = geo_res["latitude"]
            order.longitude = geo_res["longitude"]
            order.geocoding_status = "SUCCESS"
            order.geocoding_error = None
        else:
            order.latitude = None
            order.longitude = None
            order.geocoding_status = "FAILED"
            order.geocoding_error = geo_res.get("error") or "This address could not be located. Please verify the address, area, or pincode."

    db.commit()
    db.refresh(order)
    return order

@router.post("/orders/{order_id}/retry-geocode", response_model=OrderResponse)
def retry_order_geocode(order_id: int, db: Session = Depends(get_db)):
    """
    Retries geocoding for an order that previously failed.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    geo_res = geocoding_service.geocode(order.address, area=order.area, pincode=order.pincode)
    if geo_res.get("found") and geo_res.get("latitude") is not None and geo_res.get("longitude") is not None:
        order.latitude = geo_res["latitude"]
        order.longitude = geo_res["longitude"]
        order.geocoding_status = "SUCCESS"
        order.geocoding_error = None
    else:
        order.latitude = None
        order.longitude = None
        order.geocoding_status = "FAILED"
        order.geocoding_error = geo_res.get("error") or "This address could not be located. Please verify the address, area, or pincode."

    db.commit()
    db.refresh(order)
    return order

@router.delete("/orders/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    db.delete(order)
    db.commit()
    return {"message": f"Order {order_id} deleted successfully"}

# -------------------------------------------------------------
# Vehicles CRUD & Telemetry
# -------------------------------------------------------------
@router.get("/vehicles", response_model=List[VehicleResponse])
def get_vehicles(db: Session = Depends(get_db)):
    return db.query(Vehicle).order_by(Vehicle.id.asc()).all()

@router.post("/vehicles", response_model=VehicleResponse)
def create_vehicle(v_in: VehicleCreate, db: Session = Depends(get_db)):
    existing = db.query(Vehicle).filter(Vehicle.vehicle_number == v_in.vehicle_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Vehicle number already exists")

    veh = Vehicle(
        vehicle_number=v_in.vehicle_number,
        vehicle_type=v_in.vehicle_type,
        max_capacity=v_in.max_capacity,
        current_load=0.0,
        current_latitude=v_in.current_latitude,
        current_longitude=v_in.current_longitude,
        status=v_in.status
    )
    db.add(veh)
    db.commit()
    db.refresh(veh)
    return veh

@router.get("/vehicles/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    veh = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not veh:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return veh

@router.put("/vehicles/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(vehicle_id: int, v_in: VehicleUpdate, db: Session = Depends(get_db)):
    veh = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not veh:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    update_data = v_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(veh, field, val)

    db.commit()
    db.refresh(veh)
    return veh

@router.post("/vehicles/{vehicle_id}/location")
async def update_vehicle_location(
    vehicle_id: int,
    telemetry: VehicleTelemetryUpdate,
    auth_key: str = Depends(verify_simulation_api_key),
    db: Session = Depends(get_db)
):
    veh = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not veh:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    veh.current_latitude = telemetry.latitude
    veh.current_longitude = telemetry.longitude

    v_loc = VehicleLocation(
        vehicle_id=veh.id,
        latitude=telemetry.latitude,
        longitude=telemetry.longitude,
        speed=telemetry.speed or 0.0,
        timestamp=telemetry.timestamp or datetime.utcnow()
    )
    db.add(v_loc)
    db.commit()

    # Broadcast telemetry
    await ws_manager.broadcast({
        "type": "vehicle_location",
        "vehicle_id": veh.id,
        "vehicle_number": veh.vehicle_number,
        "latitude": telemetry.latitude,
        "longitude": telemetry.longitude,
        "speed": telemetry.speed or 0.0,
        "status": veh.status,
        "is_simulation": False
    })

    return {"message": "Location updated successfully"}

# -------------------------------------------------------------
# Geocoding
# -------------------------------------------------------------
@router.post("/geocode", response_model=GeocodeResponse)
def geocode_address(req: GeocodeRequest):
    res = geocoding_service.geocode(req.address, area=req.area, pincode=req.pincode)
    return GeocodeResponse(
        address=req.address,
        area=req.area,
        pincode=req.pincode,
        latitude=res.get("latitude"),
        longitude=res.get("longitude"),
        display_name=res.get("display_name"),
        status=res.get("status", "FAILED"),
        found=res.get("found", False),
        error=res.get("error")
    )

# -------------------------------------------------------------
# Optimization Analysis & Execution
# -------------------------------------------------------------
@router.post("/optimization/analyze", response_model=OptimizationAnalyzeResponse)
def analyze_optimization_problem(req: Optional[OptimizationAnalyzeRequest] = None, db: Session = Depends(get_db)):
    if req is None:
        req = OptimizationAnalyzeRequest()

    # Fetch orders to optimize
    if req.order_ids:
        all_orders = db.query(Order).filter(Order.id.in_(req.order_ids)).all()
    else:
        all_orders = db.query(Order).filter(Order.status == "PENDING").all()

    # Exclude orders that could not be geocoded
    orders_db = [
        o for o in all_orders
        if o.latitude is not None and o.longitude is not None and o.geocoding_status != "FAILED"
    ]
    unlocated_count = len(all_orders) - len(orders_db)

    # Fetch available vehicles
    if req.vehicle_ids:
        vehicles_db = db.query(Vehicle).filter(Vehicle.id.in_(req.vehicle_ids)).all()
    else:
        vehicles_db = db.query(Vehicle).filter(Vehicle.status.in_(["AVAILABLE", "ASSIGNED"])).all()

    wh = db.query(Warehouse).first()
    depot = {
        "latitude": wh.latitude if wh else 18.5204,
        "longitude": wh.longitude if wh else 73.8567
    }

    orders_data = [
        {
            "id": o.id,
            "latitude": o.latitude,
            "longitude": o.longitude,
            "package_weight": o.package_weight,
            "priority": o.priority,
            "time_window_start": o.time_window_start,
            "time_window_end": o.time_window_end
        }
        for o in orders_db
    ]

    vehicles_data = [
        {
            "id": v.id,
            "max_capacity": v.max_capacity
        }
        for v in vehicles_db
    ]

    complexity = complexity_service.analyze(orders_data, vehicles_data, depot)
    recommendation = ml_strategy_service.predict_strategy(complexity)

    # Feasibility checks
    feasibility_notes = []
    is_feasible = True

    if len(orders_db) == 0:
        is_feasible = False
        if unlocated_count > 0:
            feasibility_notes.append(f"{unlocated_count} order(s) require valid address geocoding before optimization.")
        else:
            feasibility_notes.append("No pending delivery orders available.")

    if len(vehicles_db) == 0:
        is_feasible = False
        feasibility_notes.append("No available vehicles in fleet.")

    if unlocated_count > 0:
        feasibility_notes.append(f"{unlocated_count} order(s) excluded from routing due to unlocated addresses.")

    if complexity.total_package_weight > complexity.total_capacity:
        is_feasible = False
        diff = round(complexity.total_package_weight - complexity.total_capacity, 1)
        feasibility_notes.append(f"Insufficient fleet capacity! Demand exceeds total capacity by {diff} kg. Please add vehicles.")
    else:
        feasibility_notes.append(f"Capacity check passed: {complexity.total_package_weight} kg demand across {complexity.total_capacity} kg capacity.")

    if is_feasible:
        feasibility_notes.append(f"Coordinates verified for {len(orders_db)} orders. Time windows verified. Ready for route optimization.")

    return OptimizationAnalyzeResponse(
        complexity=complexity,
        recommendation=recommendation,
        feasible=is_feasible,
        feasibility_notes=feasibility_notes
    )

@router.post("/optimization/run", response_model=OptimizationRunResponse)
async def run_optimization(req: OptimizationRunRequest, db: Session = Depends(get_db)):
    # 1. Fetch Orders
    if req.order_ids:
        all_orders = db.query(Order).filter(Order.id.in_(req.order_ids)).all()
    else:
        all_orders = db.query(Order).filter(Order.status == "PENDING").all()

    # Exclude orders with missing coordinates or failed geocoding
    orders_db = [
        o for o in all_orders
        if o.latitude is not None and o.longitude is not None and o.geocoding_status != "FAILED"
    ]

    if not orders_db:
        if len(all_orders) > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot optimize: {len(all_orders)} pending order(s) could not be geocoded. Please verify addresses."
            )
        raise HTTPException(status_code=400, detail="No orders found to optimize.")

    # 2. Fetch Vehicles
    if req.vehicle_ids:
        vehicles_db = db.query(Vehicle).filter(Vehicle.id.in_(req.vehicle_ids)).all()
    else:
        vehicles_db = db.query(Vehicle).filter(Vehicle.status.in_(["AVAILABLE", "ASSIGNED"])).all()

    if not vehicles_db:
        raise HTTPException(status_code=400, detail="No available vehicles found for routing.")

    # 3. Warehouse Depot
    wh = db.query(Warehouse).first()
    if not wh:
        wh = Warehouse(name="Central Depot Pune", address="Pune City Center", latitude=18.5204, longitude=73.8567)
        db.add(wh)
        db.commit()
        db.refresh(wh)

    depot = {"latitude": wh.latitude, "longitude": wh.longitude}

    # 4. Map objects for solvers
    orders_data = []
    for idx, o in enumerate(orders_db):
        orders_data.append({
            "id": o.id,
            "order_code": o.order_code,
            "loc_idx": idx + 1,  # 0 is depot
            "latitude": o.latitude,
            "longitude": o.longitude,
            "address": o.address,
            "package_weight": o.package_weight,
            "priority": o.priority,
            "time_window_start": o.time_window_start,
            "time_window_end": o.time_window_end
        })

    vehicles_data = [
        {
            "id": v.id,
            "vehicle_number": v.vehicle_number,
            "max_capacity": v.max_capacity
        }
        for v in vehicles_db
    ]

    # 5. Problem Complexity & ML Recommendation
    complexity = complexity_service.analyze(orders_data, vehicles_data, depot)
    ml_rec = ml_strategy_service.predict_strategy(complexity)
    strategy = req.force_strategy or ml_rec.final_strategy

    # Check total capacity feasibility
    if complexity.total_package_weight > complexity.total_capacity:
        raise HTTPException(
            status_code=400,
            detail=f"Fleet capacity exceeded: Demand ({complexity.total_package_weight} kg) > Capacity ({complexity.total_capacity} kg)."
        )

    # 6. Build Distance & Time Matrices
    locations = [(depot["latitude"], depot["longitude"])] + [(o["latitude"], o["longitude"]) for o in orders_data]
    dist_matrix, time_matrix = routing_service.get_distance_matrix(locations, db_session=db)

    # Initialize Evaluator
    evaluator = RouteEvaluator(
        distance_weight=req.distance_weight,
        time_weight=req.time_weight,
        late_penalty=req.late_penalty,
        capacity_penalty=req.capacity_penalty
    )

    # 7. Baseline: Simple Unoptimized / Nearest Neighbor (Before)
    greedy_solver = GreedyOptimizer(evaluator)
    baseline_result = greedy_solver.solve(orders_data, vehicles_data, dist_matrix, time_matrix, depot_idx=0)
    baseline_dist = baseline_result["metrics"]["total_distance"]
    baseline_late = baseline_result["metrics"]["total_late"]
    baseline_vehicles = baseline_result["metrics"]["vehicles_used"]

    # 8. Create OptimizationRun record
    run_record = OptimizationRun(
        status="RUNNING",
        problem_orders_count=len(orders_data),
        problem_vehicles_count=len(vehicles_data),
        complexity_score=complexity.complexity_score,
        complexity_level=complexity.complexity_level,
        ml_recommended_strategy=ml_rec.recommended_strategy,
        final_strategy=strategy,
        strategy_reason=ml_rec.reason,
        distance_before_km=baseline_dist
    )
    db.add(run_record)
    db.commit()
    db.refresh(run_record)

    await ws_manager.broadcast({
        "type": "optimization_progress",
        "run_id": run_record.id,
        "progress": 25,
        "stage": f"Running {strategy} Optimization..."
    })

    # 9. Run Chosen Strategy
    timeout = req.max_time_seconds or 30
    if strategy == "GREEDY":
        optimized_result = baseline_result
    elif strategy == "LOCAL_SEARCH":
        ls_solver = LocalSearchOptimizer(evaluator)
        optimized_result = ls_solver.solve(
            orders_data, vehicles_data, dist_matrix, time_matrix, depot_idx=0,
            initial_routes=baseline_result["routes"], max_time_seconds=timeout
        )
    elif strategy == "GENETIC":
        ga_solver = GeneticOptimizer(evaluator)
        optimized_result = ga_solver.solve(
            orders_data, vehicles_data, dist_matrix, time_matrix, depot_idx=0,
            max_time_seconds=timeout
        )
    elif strategy == "HYBRID":
        hybrid_solver = HybridOptimizer(evaluator)
        optimized_result = hybrid_solver.solve(
            orders_data, vehicles_data, dist_matrix, time_matrix, depot_idx=0,
            max_time_seconds=timeout
        )
    else:
        # Default fallback
        optimized_result = baseline_result

    opt_metrics = optimized_result["metrics"]
    opt_dist = opt_metrics["total_distance"]
    dist_saved = max(0.0, round(baseline_dist - opt_dist, 3))
    pct_imp = round((dist_saved / baseline_dist * 100.0), 2) if baseline_dist > 0 else 0.0

    # 10. Persist Routes & Stops
    created_routes_res = []

    for v_idx, route_indices in enumerate(optimized_result["routes"]):
        if not route_indices:
            continue

        veh = vehicles_db[v_idx]
        eval_v = opt_metrics["route_evaluations"][v_idx]

        # Detailed polyline geometry
        stop_locs = [(wh.latitude, wh.longitude)] + [
            (orders_data[i]["latitude"], orders_data[i]["longitude"]) for i in route_indices
        ] + [(wh.latitude, wh.longitude)]

        full_polyline = []
        for p in range(len(stop_locs) - 1):
            leg_info = routing_service.get_route(
                stop_locs[p][0], stop_locs[p][1],
                stop_locs[p+1][0], stop_locs[p+1][1],
                db_session=db
            )
            full_polyline.extend(leg_info["polyline"])

        route_record = Route(
            optimization_run_id=run_record.id,
            vehicle_id=veh.id,
            total_distance_km=eval_v["distance"],
            estimated_duration_mins=eval_v["travel_time"],
            total_load_kg=eval_v["total_weight"],
            utilization_pct=round((eval_v["total_weight"] / veh.max_capacity * 100.0), 1),
            status="APPROVED",
            polyline_geom=json.dumps(full_polyline)
        )
        db.add(route_record)
        db.commit()
        db.refresh(route_record)

        veh.assigned_route_id = route_record.id
        veh.status = "ASSIGNED"
        veh.current_load = eval_v["total_weight"]

        # Save Stops
        stop_responses = []
        for stop_d in eval_v["stop_details"]:
            st_obj = RouteStop(
                route_id=route_record.id,
                order_id=stop_d.get("order_id"),
                stop_sequence=stop_d["stop_sequence"],
                stop_type=stop_d["stop_type"],
                address=stop_d.get("address") or wh.address,
                latitude=stop_d.get("latitude") or wh.latitude,
                longitude=stop_d.get("longitude") or wh.longitude,
                package_weight=stop_d["weight"],
                priority=stop_d["priority"],
                eta_minutes=stop_d["eta_minutes"],
                is_late=stop_d["is_late"],
                status="PENDING"
            )
            db.add(st_obj)
            db.commit()
            db.refresh(st_obj)

            # Update Order Status
            if stop_d.get("order_id"):
                ord_in_db = db.query(Order).filter(Order.id == stop_d["order_id"]).first()
                if ord_in_db:
                    ord_in_db.status = "ASSIGNED"
                    ord_in_db.assigned_vehicle_id = veh.id

            stop_responses.append(RouteStopResponse.model_validate(st_obj))

        r_res = RouteResponse(
            id=route_record.id,
            optimization_run_id=run_record.id,
            vehicle_id=veh.id,
            vehicle_number=veh.vehicle_number,
            total_distance_km=route_record.total_distance_km,
            estimated_duration_mins=route_record.estimated_duration_mins,
            total_load_kg=route_record.total_load_kg,
            utilization_pct=route_record.utilization_pct,
            status=route_record.status,
            polyline_geom=route_record.polyline_geom,
            created_at=route_record.created_at,
            stops=stop_responses
        )
        created_routes_res.append(r_res)

    # 11. Update Run Record
    run_record.status = "COMPLETED"
    run_record.total_distance_km = opt_dist
    run_record.distance_saved_km = dist_saved
    run_record.pct_improvement = pct_imp
    run_record.vehicles_used = opt_metrics["vehicles_used"]
    run_record.late_orders_count = opt_metrics["total_late"]
    run_record.capacity_violations = opt_metrics["total_capacity_violations"]
    run_record.runtime_seconds = optimized_result["runtime_seconds"]

    # Save metrics
    m1 = OptimizationMetric(optimization_run_id=run_record.id, metric_key="distance_saved_km", metric_value=dist_saved)
    m2 = OptimizationMetric(optimization_run_id=run_record.id, metric_key="pct_improvement", metric_value=pct_imp)
    db.add_all([m1, m2])
    db.commit()

    comparison = BeforeAfterComparison(
        distance_before_km=baseline_dist,
        distance_after_km=opt_dist,
        distance_saved_km=dist_saved,
        pct_improvement=pct_imp,
        vehicles_before=baseline_vehicles,
        vehicles_after=opt_metrics["vehicles_used"],
        late_orders_before=baseline_late,
        late_orders_after=opt_metrics["total_late"],
        runtime_seconds=optimized_result["runtime_seconds"]
    )

    # Broadcast completion
    await ws_manager.broadcast({
        "type": "optimization_completed",
        "run_id": run_record.id,
        "strategy": strategy,
        "pct_improvement": pct_imp,
        "distance_saved_km": dist_saved
    })

    return OptimizationRunResponse(
        run_id=run_record.id,
        status="COMPLETED",
        complexity_score=complexity.complexity_score,
        complexity_level=complexity.complexity_level,
        ml_recommended_strategy=ml_rec.recommended_strategy,
        final_strategy=strategy,
        strategy_reason=ml_rec.reason,
        comparison=comparison,
        routes=created_routes_res,
        validation_status={
            "capacity_valid": opt_metrics["total_capacity_violations"] == 0,
            "coverage_valid": opt_metrics["unassigned_count"] == 0,
            "late_orders": opt_metrics["total_late"],
            "all_depot_returns_valid": True
        }
    )

@router.get("/optimization/runs")
def get_optimization_runs(db: Session = Depends(get_db)):
    runs = db.query(OptimizationRun).order_by(OptimizationRun.id.desc()).all()
    return runs

@router.get("/optimization/runs/{run_id}")
def get_optimization_run(run_id: int, db: Session = Depends(get_db)):
    run = db.query(OptimizationRun).filter(OptimizationRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run

# -------------------------------------------------------------
# Routes Retrieval
# -------------------------------------------------------------
@router.get("/routes", response_model=List[RouteResponse])
def get_routes(db: Session = Depends(get_db)):
    routes = db.query(Route).order_by(Route.id.desc()).all()
    res = []
    for r in routes:
        stops = db.query(RouteStop).filter(RouteStop.route_id == r.id).order_by(RouteStop.stop_sequence).all()
        res.append(RouteResponse(
            id=r.id,
            optimization_run_id=r.optimization_run_id,
            vehicle_id=r.vehicle_id,
            vehicle_number=r.vehicle.vehicle_number if r.vehicle else None,
            total_distance_km=r.total_distance_km,
            estimated_duration_mins=r.estimated_duration_mins,
            total_load_kg=r.total_load_kg,
            utilization_pct=r.utilization_pct,
            status=r.status,
            polyline_geom=r.polyline_geom,
            created_at=r.created_at,
            stops=[RouteStopResponse.model_validate(s) for s in stops]
        ))
    return res

@router.get("/routes/{route_id}", response_model=RouteResponse)
def get_route_by_id(route_id: int, db: Session = Depends(get_db)):
    r = db.query(Route).filter(Route.id == route_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Route not found")
    stops = db.query(RouteStop).filter(RouteStop.route_id == r.id).order_by(RouteStop.stop_sequence).all()
    return RouteResponse(
        id=r.id,
        optimization_run_id=r.optimization_run_id,
        vehicle_id=r.vehicle_id,
        vehicle_number=r.vehicle.vehicle_number if r.vehicle else None,
        total_distance_km=r.total_distance_km,
        estimated_duration_mins=r.estimated_duration_mins,
        total_load_kg=r.total_load_kg,
        utilization_pct=r.utilization_pct,
        status=r.status,
        polyline_geom=r.polyline_geom,
        created_at=r.created_at,
        stops=[RouteStopResponse.model_validate(s) for s in stops]
    )

# -------------------------------------------------------------
# Simulation Controls & API Key Protected Telemetry
# -------------------------------------------------------------
@router.get("/simulation/api-key-info")
def get_simulation_api_key_info():
    return {
        "api_key_required": True,
        "configured_key": settings.SIMULATION_API_KEY,
        "header_name": "X-API-Key",
        "query_param": "api_key",
        "curl_example": f'curl -X POST "http://localhost:8000/api/vehicles/1/location" -H "X-API-Key: {settings.SIMULATION_API_KEY}" -H "Content-Type: application/json" -d \'{{"latitude": 18.5308, "longitude": 73.8475, "speed": 35.0}}\''
    }

@router.post("/simulation/start")
async def start_simulation(
    speed: float = Query(1.0, ge=0.2, le=10.0),
    auth_key: str = Depends(verify_simulation_api_key)
):
    await simulation_service.start(speed=speed)
    return {
        "message": "Simulation started",
        "speed": speed,
        "mode": "Simulation Mode",
        "authenticated_via": "API Key"
    }

@router.post("/simulation/stop")
async def stop_simulation(
    auth_key: str = Depends(verify_simulation_api_key)
):
    await simulation_service.stop()
    return {"message": "Simulation stopped", "authenticated_via": "API Key"}

@router.get("/simulation/status")
def get_simulation_status():
    status = simulation_service.get_status()
    status["api_key_protected"] = True
    return status

# -------------------------------------------------------------
# ML Model & Explainability
# -------------------------------------------------------------
@router.get("/ml/metrics", response_model=MLMetricsResponse)
def get_ml_metrics():
    info = ml_strategy_service.get_model_info()
    return MLMetricsResponse(
        version_name=info.get("version_name", "v1.0"),
        algorithm_name=info.get("algorithm_name", "Random Forest Classifier"),
        accuracy=info.get("accuracy", 0.0),
        precision=info.get("precision", 0.0),
        recall=info.get("recall", 0.0),
        f1_score=info.get("f1_score", 0.0),
        training_samples=info.get("training_samples", 0),
        test_samples=info.get("test_samples", 0),
        feature_importance=info.get("feature_importance", {}),
        classes=info.get("classes", ["GREEDY", "LOCAL_SEARCH", "GENETIC"]),
        trained_at=datetime.fromisoformat(info["trained_at"]) if info.get("trained_at") else None
    )

@router.get("/ml/model-info")
def get_ml_model_info():
    return ml_strategy_service.get_model_info()

# -------------------------------------------------------------
# Demo Seeding & Resetting
# -------------------------------------------------------------
@router.post("/demo/seed")
def seed_demo(db: Session = Depends(get_db)):
    from backend.seed import run_seed
    result = run_seed(db)
    return result

@router.post("/demo/clear")
def clear_demo(db: Session = Depends(get_db)):
    db.query(RouteStop).delete()
    db.query(Route).delete()
    db.query(OptimizationMetric).delete()
    db.query(OptimizationRun).delete()
    db.query(Order).delete()
    db.query(VehicleLocation).delete()
    db.commit()
    return {"message": "Orders, routes, and optimizations cleared."}
