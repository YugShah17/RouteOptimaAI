import re
import logging
from typing import Dict, Any, Optional, Tuple
import httpx

logger = logging.getLogger("geocoding")

# Comprehensive ground-truth coordinates for Pune localities & PIN codes
PUNE_LOCALITIES: Dict[str, Tuple[float, float, str]] = {
    # Area name (lowercase) -> (latitude, longitude, formatted_name)
    "baner": (18.5590, 73.7868, "Baner, Pune, Maharashtra 411045"),
    "baner road": (18.5590, 73.7868, "Baner Road, Baner, Pune, Maharashtra 411045"),
    "wakad": (18.5987, 73.7688, "Wakad, Pimpri-Chinchwad, Pune, Maharashtra 411057"),
    "wakad road": (18.5987, 73.7688, "Wakad Road, Wakad, Pune, Maharashtra 411057"),
    "aundh": (18.5615, 73.8073, "Aundh, Pune, Maharashtra 411007"),
    "aundh road": (18.5615, 73.8073, "Aundh Road, Aundh, Pune, Maharashtra 411007"),
    "kothrud": (18.5074, 73.8077, "Kothrud, Pune, Maharashtra 411038"),
    "kothrud vanaz corner": (18.5074, 73.8077, "Kothrud Vanaz Corner, Pune, Maharashtra 411038"),
    "shivajinagar": (18.5308, 73.8475, "Shivajinagar, Pune, Maharashtra 411005"),
    "hadapsar": (18.5089, 73.9260, "Hadapsar, Pune, Maharashtra 411028"),
    "hadapsar hub": (18.5089, 73.9260, "Hadapsar Hub, Pune, Maharashtra 411028"),
    "hinjewadi": (18.5913, 73.7389, "Hinjewadi IT Park, Pune, Maharashtra 411057"),
    "hinjawadi": (18.5913, 73.7389, "Hinjawadi, Pune, Maharashtra 411057"),
    "viman nagar": (18.5679, 73.9143, "Viman Nagar, Pune, Maharashtra 411014"),
    "kalyani nagar": (18.5463, 73.9034, "Kalyani Nagar, Pune, Maharashtra 411006"),
    "magarpatta": (18.5144, 73.9272, "Magarpatta City, Hadapsar, Pune, Maharashtra 411028"),
    "deccan": (18.5173, 73.8415, "Deccan Gymkhana, Pune, Maharashtra 411004"),
    "deccan gymkhana": (18.5173, 73.8415, "Deccan Gymkhana, Pune, Maharashtra 411004"),
    "swargate": (18.5018, 73.8636, "Swargate, Pune, Maharashtra 411042"),
    "camp": (18.5167, 73.8792, "Pune Camp, Pune, Maharashtra 411001"),
    "mg road": (18.5190, 73.8770, "MG Road, Camp, Pune, Maharashtra 411001"),
    "katraj": (18.4575, 73.8677, "Katraj, Pune, Maharashtra 411046"),
    "kondhwa": (18.4756, 73.8943, "Kondhwa, Pune, Maharashtra 411048"),
    "pimpri": (18.6279, 73.8009, "Pimpri, Pimpri-Chinchwad, Pune, Maharashtra 411018"),
    "chinchwad": (18.6298, 73.7997, "Chinchwad, Pimpri-Chinchwad, Pune, Maharashtra 411033"),
    "bhosari": (18.6247, 73.8569, "Bhosari, Pune, Maharashtra 411026"),
    "bavdhan": (18.5113, 73.7745, "Bavdhan, Pune, Maharashtra 411021"),
    "pashan": (18.5401, 73.7915, "Pashan, Pune, Maharashtra 411021"),
    "nigdi": (18.6508, 73.7689, "Nigdi, Pimpri-Chinchwad, Pune, Maharashtra 411044"),
    "kharadi": (18.5514, 73.9349, "Kharadi, Pune, Maharashtra 411014"),
    "koregaon park": (18.5362, 73.8940, "Koregaon Park, Pune, Maharashtra 411001"),
    "senapati bapat road": (18.5320, 73.8298, "Senapati Bapat Road, Pune, Maharashtra 411016"),
    "law college road": (18.5165, 73.8290, "Law College Road, Pune, Maharashtra 411004"),
    "model colony": (18.5367, 73.8375, "Model Colony, Shivajinagar, Pune, Maharashtra 411016"),
    "yerwada": (18.5529, 73.8796, "Yerwada, Pune, Maharashtra 411006"),
    "pune station": (18.5284, 73.8743, "Pune Railway Station, Pune, Maharashtra 411001"),
    "pune junction": (18.5284, 73.8743, "Pune Junction, Pune, Maharashtra 411001"),
    "kasba peth": (18.5196, 73.8553, "Kasba Peth, Pune, Maharashtra 411011"),
    "shaniwar peth": (18.5194, 73.8517, "Shaniwar Peth, Pune, Maharashtra 411030"),
    "fc road": (18.5246, 73.8412, "Fergusson College Road, Pune, Maharashtra 411004"),
    "wagholi": (18.5793, 73.9806, "Wagholi, Pune, Maharashtra 412207"),
    "dhanori": (18.5833, 73.8897, "Dhanori, Pune, Maharashtra 411015"),
    "bibwewadi": (18.4735, 73.8601, "Bibwewadi, Pune, Maharashtra 411037"),
}

# Pune PIN Code mapping
PUNE_PINCODES: Dict[str, Tuple[float, float, str]] = {
    "411001": (18.5204, 73.8785, "Pune Camp / Station G.P.O, 411001"),
    "411002": (18.5085, 73.8562, "Bajirao Road, Pune 411002"),
    "411004": (18.5173, 73.8415, "Deccan Gymkhana, Pune 411004"),
    "411005": (18.5308, 73.8475, "Shivajinagar, Pune 411005"),
    "411006": (18.5463, 73.9034, "Yerwada / Kalyani Nagar, Pune 411006"),
    "411007": (18.5615, 73.8073, "Aundh, Pune 411007"),
    "411011": (18.5196, 73.8553, "Kasba Peth, Pune 411011"),
    "411014": (18.5679, 73.9143, "Viman Nagar / Kharadi, Pune 411014"),
    "411015": (18.5833, 73.8897, "Dhanori, Pune 411015"),
    "411016": (18.5367, 73.8375, "Model Colony, Pune 411016"),
    "411018": (18.6279, 73.8009, "Pimpri, Pune 411018"),
    "411021": (18.5401, 73.7915, "Pashan / Bavdhan, Pune 411021"),
    "411026": (18.6247, 73.8569, "Bhosari, Pune 411026"),
    "411028": (18.5089, 73.9260, "Hadapsar / Magarpatta, Pune 411028"),
    "411030": (18.5194, 73.8517, "Shaniwar Peth, Pune 411030"),
    "411033": (18.6298, 73.7997, "Chinchwad, Pune 411033"),
    "411037": (18.4735, 73.8601, "Bibwewadi, Pune 411037"),
    "411038": (18.5074, 73.8077, "Kothrud, Pune 411038"),
    "411042": (18.5018, 73.8636, "Swargate, Pune 411042"),
    "411044": (18.6508, 73.7689, "Nigdi / Pradhikaran, Pune 411044"),
    "411045": (18.5590, 73.7868, "Baner, Pune 411045"),
    "411046": (18.4575, 73.8677, "Katraj, Pune 411046"),
    "411048": (18.4756, 73.8943, "Kondhwa, Pune 411048"),
    "411057": (18.5987, 73.7688, "Wakad / Hinjewadi, Pune 411057"),
    "412207": (18.5793, 73.9806, "Wagholi, Pune 412207"),
}


class GeocodingService:
    """
    Production-grade Geocoding Service for Address -> Coordinates resolution.
    Features:
    - Normalization of address, area, and Indian PIN code.
    - Querying Nominatim (OpenStreetMap) with proper timeout and headers.
    - Local verified Pune locality dictionary for sub-millisecond, robust resolution.
    - Strict validation: Never invents coordinates if an address cannot be located.
    """

    def __init__(self, nominatim_url: str = "https://nominatim.openstreetmap.org"):
        self.nominatim_url = nominatim_url
        self._cache: Dict[str, Dict[str, Any]] = {}

    def _normalize(self, text: Optional[str]) -> str:
        if not text:
            return ""
        return re.sub(r"\s+", " ", text.strip().lower())

    def _extract_pincode(self, text: str) -> Optional[str]:
        match = re.search(r"\b([1-9][0-9]{5})\b", text)
        return match.group(1) if match else None

    def geocode(
        self,
        address: str,
        area: Optional[str] = None,
        pincode: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Geocodes address, area, and pincode into latitude & longitude.

        Returns:
            {
                "found": bool,
                "status": "SUCCESS" | "FAILED",
                "latitude": float or None,
                "longitude": float or None,
                "display_name": str or None,
                "error": str or None
            }
        """
        if not address or not address.strip():
            return {
                "found": False,
                "status": "FAILED",
                "latitude": None,
                "longitude": None,
                "display_name": None,
                "error": "Address is empty. Please provide a valid address."
            }

        # Build clean lookup key for caching
        clean_addr = self._normalize(address)
        clean_area = self._normalize(area)
        clean_pin = (pincode or "").strip()
        if not clean_pin:
            extracted = self._extract_pincode(address)
            if extracted:
                clean_pin = extracted

        cache_key = f"{clean_addr}|{clean_area}|{clean_pin}"
        if cache_key in self._cache:
            return self._cache[cache_key]

        # 1. First, check our local Pune locality database (instant, guaranteed accurate)
        combined_text = f"{clean_addr} {clean_area}".strip()
        matched_coords = None
        matched_name = None

        # Check exact or partial locality match
        for loc_key, (lat, lon, desc) in PUNE_LOCALITIES.items():
            # Check if locality keyword exists in address or area
            pattern = r"\b" + re.escape(loc_key) + r"\b"
            if re.search(pattern, combined_text):
                matched_coords = (lat, lon)
                matched_name = f"{address.strip()}, {desc}"
                break

        # 2. If not matched by locality text, check PIN code if available
        if not matched_coords and clean_pin and clean_pin in PUNE_PINCODES:
            lat, lon, desc = PUNE_PINCODES[clean_pin]
            matched_coords = (lat, lon)
            matched_name = f"{address.strip()}, {desc}"

        if matched_coords:
            res = {
                "found": True,
                "status": "SUCCESS",
                "latitude": matched_coords[0],
                "longitude": matched_coords[1],
                "display_name": matched_name,
                "error": None
            }
            self._cache[cache_key] = res
            return res

        # 3. Query OpenStreetMap Nominatim
        search_query_parts = [address.strip()]
        if area and area.strip() and area.strip().lower() not in address.lower():
            search_query_parts.append(area.strip())
        if clean_pin and clean_pin not in address:
            search_query_parts.append(clean_pin)
        search_query_parts.append("Pune")
        search_query_parts.append("Maharashtra")
        search_query_parts.append("India")

        full_query = ", ".join(search_query_parts)

        try:
            headers = {"User-Agent": "AI-Delivery-Route-Optimizer/2.0 (contact: admin@routeoptima.ai)"}
            params = {"q": full_query, "format": "json", "limit": 1}
            with httpx.Client(timeout=4.0) as client:
                resp = client.get(f"{self.nominatim_url}/search", params=params, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    if data and len(data) > 0:
                        top = data[0]
                        res = {
                            "found": True,
                            "status": "SUCCESS",
                            "latitude": float(top["lat"]),
                            "longitude": float(top["lon"]),
                            "display_name": top.get("display_name", full_query),
                            "error": None
                        }
                        self._cache[cache_key] = res
                        return res
        except Exception as e:
            logger.warning(f"Nominatim lookup failed for '{full_query}': {e}")

        # 4. Strict Failure: DO NOT invent fake coordinates
        res = {
            "found": False,
            "status": "FAILED",
            "latitude": None,
            "longitude": None,
            "display_name": None,
            "error": "This address could not be located. Please verify the address, area, or pincode."
        }
        self._cache[cache_key] = res
        return res


geocoding_service = GeocodingService()
