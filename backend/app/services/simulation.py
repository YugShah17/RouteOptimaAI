import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from backend.app.database import SessionLocal
from backend.app.models.entities import Vehicle, Route, RouteStop, Order, VehicleLocation
from backend.app.services.websocket_manager import ws_manager

logger = logging.getLogger("simulation")

class SimulationService:
    def __init__(self):
        self.is_running: bool = False
        self.speed: float = 1.0
        self._task: Optional[asyncio.Task] = None
        # State tracking per route: {route_id: {"stop_idx": int, "step": int, "max_steps": 10}}
        self._route_progress: Dict[int, Dict[str, Any]] = {}

    def get_status(self) -> Dict[str, Any]:
        return {
            "is_running": self.is_running,
            "speed": self.speed,
            "mode": "Simulation Mode"
        }

    async def start(self, speed: float = 1.0):
        if self.is_running:
            self.speed = speed
            return
        self.is_running = True
        self.speed = max(0.2, min(10.0, speed))
        self._task = asyncio.create_task(self._run_loop())
        await ws_manager.broadcast({
            "type": "simulation_status",
            "is_running": True,
            "speed": self.speed,
            "mode": "Simulation Mode"
        })
        logger.info(f"Vehicle Simulation started at speed {self.speed}x")

    async def stop(self):
        self.is_running = False
        if self._task and not self._task.done():
            self._task.cancel()
            self._task = None
        await ws_manager.broadcast({
            "type": "simulation_status",
            "is_running": False,
            "speed": self.speed,
            "mode": "Simulation Mode"
        })
        logger.info("Vehicle Simulation stopped")

    async def _run_loop(self):
        while self.is_running:
            try:
                await self._tick()
                # Tick interval adjusted by speed
                interval = max(0.2, 1.5 / self.speed)
                await asyncio.sleep(interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in simulation loop: {e}")
                await asyncio.sleep(2.0)

    async def _tick(self):
        db = SessionLocal()
        try:
            # Find routes that are approved or in progress
            active_routes = db.query(Route).filter(
                Route.status.in_(["APPROVED", "IN_PROGRESS"])
            ).all()

            if not active_routes:
                return

            for route in active_routes:
                route_id = route.id
                vehicle = db.query(Vehicle).filter(Vehicle.id == route.vehicle_id).first()
                if not vehicle:
                    continue

                stops = db.query(RouteStop).filter(
                    RouteStop.route_id == route_id
                ).order_by(RouteStop.stop_sequence).all()

                if not stops:
                    continue

                # Initialize progress if needed
                if route_id not in self._route_progress:
                    self._route_progress[route_id] = {
                        "from_stop_idx": 0,
                        "to_stop_idx": 1 if len(stops) > 1 else 0,
                        "step": 0,
                        "steps_per_leg": 6
                    }
                    route.status = "IN_PROGRESS"
                    vehicle.status = "IN_TRANSIT"
                    db.commit()

                prog = self._route_progress[route_id]
                from_idx = prog["from_stop_idx"]
                to_idx = prog["to_stop_idx"]

                if to_idx >= len(stops):
                    # Route completed!
                    route.status = "COMPLETED"
                    vehicle.status = "AVAILABLE"
                    db.commit()
                    await ws_manager.broadcast({
                        "type": "route_status",
                        "route_id": route_id,
                        "status": "COMPLETED",
                        "vehicle_id": vehicle.id
                    })
                    continue

                from_stop = stops[from_idx]
                to_stop = stops[to_idx]

                # Move vehicle towards to_stop
                steps = prog["steps_per_leg"]
                step = prog["step"] + 1
                prog["step"] = step

                t = min(1.0, step / float(steps))
                curr_lat = from_stop.latitude + (to_stop.latitude - from_stop.latitude) * t
                curr_lng = from_stop.longitude + (to_stop.longitude - from_stop.longitude) * t

                # Update vehicle location in DB
                vehicle.current_latitude = round(curr_lat, 6)
                vehicle.current_longitude = round(curr_lng, 6)

                # Record telemetry
                v_loc = VehicleLocation(
                    vehicle_id=vehicle.id,
                    latitude=curr_lat,
                    longitude=curr_lng,
                    speed=round(35.0 * self.speed, 1),
                    timestamp=datetime.utcnow()
                )
                db.add(v_loc)

                # Check if arrived at stop
                if step >= steps:
                    prog["step"] = 0
                    prog["from_stop_idx"] = to_idx
                    prog["to_stop_idx"] = to_idx + 1

                    to_stop.status = "COMPLETED"
                    to_stop.arrival_time = datetime.utcnow()

                    if to_stop.order_id:
                        order = db.query(Order).filter(Order.id == to_stop.order_id).first()
                        if order:
                            order.status = "DELIVERED"
                            vehicle.current_load = max(0.0, vehicle.current_load - order.package_weight)
                            await ws_manager.broadcast({
                                "type": "order_status",
                                "order_id": order.id,
                                "status": "DELIVERED"
                            })

                db.commit()

                # Broadcast live vehicle update
                await ws_manager.broadcast({
                    "type": "vehicle_location",
                    "vehicle_id": vehicle.id,
                    "vehicle_number": vehicle.vehicle_number,
                    "latitude": round(curr_lat, 6),
                    "longitude": round(curr_lng, 6),
                    "speed": round(35.0 * self.speed, 1),
                    "current_stop_sequence": from_stop.stop_sequence,
                    "next_stop_sequence": to_stop.stop_sequence,
                    "next_stop_address": to_stop.address,
                    "eta_minutes": max(0.0, to_stop.eta_minutes - (step * 2.0)),
                    "status": vehicle.status,
                    "current_load": round(vehicle.current_load, 1),
                    "is_simulation": True
                })

        except Exception as e:
            logger.error(f"Tick error: {e}")
            db.rollback()
        finally:
            db.close()

simulation_service = SimulationService()
