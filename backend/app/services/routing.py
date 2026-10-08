import math
import json
import logging
from typing import Tuple, List, Dict, Any, Optional
import httpx
from backend.app.config import settings

logger = logging.getLogger("routing")

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points in km."""
    R = 6371.0 # Earth's radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 3)

class RoutingService:
    def __init__(self):
        self.provider = settings.ROUTING_PROVIDER
        self.osrm_url = settings.OSRM_URL.rstrip('/')
        self.nominatim_url = settings.NOMINATIM_URL.rstrip('/')
        self._memory_cache: Dict[str, Dict[str, Any]] = {}

    def _cache_key(self, lat1: float, lon1: float, lat2: float, lon2: float) -> str:
        return f"{lat1:.5f},{lon1:.5f}->{lat2:.5f},{lon2:.5f}"

    def get_route(
        self,
        lat1: float,
        lon1: float,
        lat2: float,
        lon2: float,
        db_session=None
    ) -> Dict[str, Any]:
        """
        Returns distance (km), duration (mins), provider, and polyline coordinates [[lat, lng], ...].
        """
        # Identical point check
        if abs(lat1 - lat2) < 1e-6 and abs(lon1 - lon2) < 1e-6:
            return {
                "distance_km": 0.0,
                "duration_mins": 0.0,
                "provider": "identical_point",
                "polyline": [[lat1, lon1]]
            }

        cache_k = self._cache_key(lat1, lon1, lat2, lon2)
        if cache_k in self._memory_cache:
            return self._memory_cache[cache_k]

        # Check DB routing cache if session given
        if db_session:
            try:
                from backend.app.models.entities import RoutingCache
                cached_entry = db_session.query(RoutingCache).filter(
                    RoutingCache.origin_lat == round(lat1, 5),
                    RoutingCache.origin_lng == round(lon1, 5),
                    RoutingCache.dest_lat == round(lat2, 5),
                    RoutingCache.dest_lng == round(lon2, 5)
                ).first()
                if cached_entry:
                    polyline = json.loads(cached_entry.polyline_json) if cached_entry.polyline_json else [[lat1, lon1], [lat2, lon2]]
                    res = {
                        "distance_km": cached_entry.distance_km,
                        "duration_mins": cached_entry.duration_mins,
                        "provider": cached_entry.provider,
                        "polyline": polyline
                    }
                    self._memory_cache[cache_k] = res
                    return res
            except Exception as e:
                logger.warning(f"Failed to check DB cache: {e}")

        # Try OSRM if configured
        if self.provider == "osrm":
            try:
                # OSRM coordinate order is {longitude},{latitude}
                url = f"{self.osrm_url}/route/v1/driving/{lon1},{lat1};{lon2},{lat2}?overview=full&geometries=geojson"
                with httpx.Client(timeout=3.0) as client:
                    resp = client.get(url)
                    if resp.status_code == 200:
                        data = resp.json()
                        if data.get("code") == "Ok" and data.get("routes"):
                            route_data = data["routes"][0]
                            dist_km = round(route_data["distance"] / 1000.0, 3)
                            dur_mins = round(route_data["duration"] / 60.0, 2)
                            # GeoJSON coordinates are [lon, lat], reverse to [lat, lon] for Leaflet
                            coords = [[c[1], c[0]] for c in route_data["geometry"]["coordinates"]]
                            result = {
                                "distance_km": dist_km,
                                "duration_mins": dur_mins,
                                "provider": "osrm",
                                "polyline": coords
                            }
                            self._save_cache(lat1, lon1, lat2, lon2, result, db_session)
                            return result
            except Exception as e:
                logger.info(f"OSRM service unavailable or timed out ({e}). Using straight-line fallback.")

        # Straight-line distance fallback
        dist = haversine_distance_km(lat1, lon1, lat2, lon2)
        # Assume road curvature factor ~ 1.3 and avg speed 35 km/h for urban delivery
        road_est_dist = round(dist * 1.3, 3)
        est_duration = round((road_est_dist / 35.0) * 60, 2)
        result = {
            "distance_km": road_est_dist,
            "duration_mins": est_duration,
            "provider": "straight_line_fallback",
            "polyline": [[lat1, lon1], [lat2, lon2]]
        }
        self._save_cache(lat1, lon1, lat2, lon2, result, db_session)
        return result

    def _save_cache(self, lat1: float, lon1: float, lat2: float, lon2: float, result: Dict[str, Any], db_session=None):
        cache_k = self._cache_key(lat1, lon1, lat2, lon2)
        self._memory_cache[cache_k] = result
        if db_session:
            try:
                from backend.app.models.entities import RoutingCache
                entry = RoutingCache(
                    origin_lat=round(lat1, 5),
                    origin_lng=round(lon1, 5),
                    dest_lat=round(lat2, 5),
                    dest_lng=round(lon2, 5),
                    distance_km=result["distance_km"],
                    duration_mins=result["duration_mins"],
                    provider=result["provider"],
                    polyline_json=json.dumps(result["polyline"])
                )
                db_session.add(entry)
                db_session.commit()
            except Exception as e:
                logger.warning(f"Could not persist routing cache: {e}")
                db_session.rollback()

    def get_distance_matrix(self, locations: List[Tuple[float, float]], db_session=None) -> Tuple[List[List[float]], List[List[float]]]:
        """
        Builds NxN distance (km) and duration (mins) matrix for the given locations.
        """
        n = len(locations)
        dist_matrix = [[0.0] * n for _ in range(n)]
        time_matrix = [[0.0] * n for _ in range(n)]

        for i in range(n):
            for j in range(n):
                if i == j:
                    dist_matrix[i][j] = 0.0
                    time_matrix[i][j] = 0.0
                else:
                    route_info = self.get_route(
                        locations[i][0], locations[i][1],
                        locations[j][0], locations[j][1],
                        db_session=db_session
                    )
                    dist_matrix[i][j] = route_info["distance_km"]
                    time_matrix[i][j] = route_info["duration_mins"]

        return dist_matrix, time_matrix

    def geocode(self, address: str) -> Dict[str, Any]:
        """
        Geocodes an address string using Nominatim OpenStreetMap with fallback.
        """
        try:
            headers = {"User-Agent": "DeliveryRouteOptimizer/1.0"}
            params = {"q": address, "format": "json", "limit": 1}
            with httpx.Client(timeout=4.0) as client:
                resp = client.get(f"{self.nominatim_url}/search", params=params, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    if data:
                        top = data[0]
                        return {
                            "found": True,
                            "address": address,
                            "latitude": float(top["lat"]),
                            "longitude": float(top["lon"]),
                            "display_name": top.get("display_name", address)
                        }
        except Exception as e:
            logger.warning(f"Geocoding service unavailable: {e}")

        # Fallback to Pune center area if geocoding fails
        return {
            "found": False,
            "address": address,
            "latitude": 18.5204,
            "longitude": 73.8567,
            "display_name": f"Coordinates not resolved for: {address}. Defaulted to Pune Center."
        }

routing_service = RoutingService()
