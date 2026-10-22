"""
Tests for HydroSense-SWOT Four Geographic Highlights & Geometry Validation.
Part of Phase 3 Geographic Accuracy Audit.

Verifies:
1. Sourced Kanaighat gauge station (SW108) coordinates, river, datum, and provenance.
2. Sourced Surma River channel geometry, operational corridor status, and SWORD v16 center.
3. Sourced Kushiyara River channel geometry, contextual role, and scientific boundary.
4. Sourced Meghalaya upstream catchment polygon (HydroSHEDS v1.0) vs GPM IMERG 0.1° bounding box.
5. Explicit CRS declarations (EPSG:4326), valid coordinate ordering, and non-null values.
"""

import os
import json
import math
import pytest

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GEOM_PATH = os.path.join(REPO_ROOT, "ui", "public", "data", "reach_geometries.json")
HYDROSHEDS_PATH = os.path.join(REPO_ROOT, "data", "processed", "hydrosheds_basins.geojson")


@pytest.fixture
def geo_data():
    assert os.path.exists(GEOM_PATH), f"reach_geometries.json not found at {GEOM_PATH}"
    with open(GEOM_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def hydrosheds_data():
    assert os.path.exists(HYDROSHEDS_PATH), f"hydrosheds_basins.geojson not found at {HYDROSHEDS_PATH}"
    with open(HYDROSHEDS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def test_crs_declaration(geo_data, hydrosheds_data):
    """EPSG:4326 must be explicitly declared on geographic data sources."""
    assert "crs" in geo_data, "reach_geometries.json must declare CRS"
    assert "4326" in str(geo_data["crs"]), "reach_geometries.json CRS must be EPSG:4326"
    assert "crs" in hydrosheds_data, "hydrosheds_basins.geojson must declare CRS"
    assert "CRS84" in str(hydrosheds_data["crs"]) or "4326" in str(hydrosheds_data["crs"])


def test_kanaighat_station_coordinates_and_provenance(geo_data):
    """
    Feature A: Kanaighat gauge station SW108.
    Must sit at verified BWDB station location (lat: 24.9980°N, lon: 92.2594°E).
    Must NOT be placed at town center (25.017°N) or arbitrary foothill (25.060°N).
    """
    highlights = geo_data.get("four_geographic_highlights", {})
    assert "kanaighat_gauge" in highlights, "kanaighat_gauge must be defined in four_geographic_highlights"
    
    kg = highlights["kanaighat_gauge"]
    assert kg["id"] == "SW108"
    assert kg["bwdb_catalog_id"] == "SW266"
    assert kg["official_station_id"] == "SW266"
    assert kg["river"] == "Surma"
    assert kg["danger_level_m"] == 13.20
    assert "PWD" in kg["datum"]
    assert kg["provenance_status"] == "VERIFIED"
    assert "BWDB" in kg["source"]

    lat, lon = kg["coordinates"]
    # Verified BWDB / FFWC official registry coordinates: 24.9980°N, 92.2594°E
    assert math.isclose(lat, 24.9980, abs_tol=0.005), f"Kanaighat latitude {lat} deviates from verified 24.9980°N"
    assert math.isclose(lon, 92.2594, abs_tol=0.005), f"Kanaighat longitude {lon} deviates from verified 92.2594°E"

    # Also verify gauge_stations list matches
    stations = geo_data.get("gauge_stations", [])
    sw108 = next((s for s in stations if s["station_id"] == "SW108"), None)
    assert sw108 is not None, "SW108 missing from gauge_stations array"
    assert math.isclose(sw108["lat"], 24.9980, abs_tol=0.005)
    assert math.isclose(sw108["lon"], 92.2594, abs_tol=0.005)


def test_surma_river_operational_corridor_geometry(geo_data):
    """
    Feature B: Surma River operational reach.
    Must contain authentic river polyline vertices, pass through Kanaighat SW108,
    and match SWORD v16 center.
    """
    highlights = geo_data.get("four_geographic_highlights", {})
    assert "surma_river" in highlights, "surma_river must be defined in four_geographic_highlights"
    surma_meta = highlights["surma_river"]
    assert surma_meta["provenance_status"] == "VERIFIED_SWORD_V16"
    assert "22211000011" in surma_meta["operational_reach_ids"]

    reaches = geo_data.get("reaches", [])
    reach11 = next((r for r in reaches if r["reach_id"] == "22211000011"), None)
    assert reach11 is not None, "Reach 22211000011 (Surma Upper) not found"
    assert reach11["river_name"] == "Surma"
    assert reach11["has_gauge"] is True

    # Validate coordinate ordering: Leaflet array expects [latitude, longitude]
    coords = reach11["coordinates"]
    assert len(coords) >= 6, "Surma reach polyline must have >= 6 vertices"
    for pt in coords:
        lat, lon = pt[0], pt[1]
        assert 24.8 <= lat <= 25.2, f"Invalid Surma latitude {lat} out of study bounds"
        assert 92.0 <= lon <= 92.5, f"Invalid Surma longitude {lon} out of study bounds"

    # Confirms reach contains / passes through Kanaighat gauge station
    has_station_vertex = any(
        math.isclose(pt[0], 24.9980, abs_tol=0.005) and math.isclose(pt[1], 92.2594, abs_tol=0.005)
        for pt in coords
    )
    assert has_station_vertex, "Surma Upper reach 22211000011 must pass through Kanaighat SW108 gauge station"

    # Center must match SWORD v16 center (25.0125, 92.2612)
    assert math.isclose(reach11["center"][0], 25.0125, abs_tol=0.025)
    assert math.isclose(reach11["center"][1], 92.2612, abs_tol=0.025)


def test_kushiyara_river_contextual_geometry_and_boundary(geo_data):
    """
    Feature C: Kushiyara River.
    Must be distinguished as contextual drainage (not operational Surma routing).
    Must originate from the Amalshid bifurcation (24.871, 92.483).
    """
    highlights = geo_data.get("four_geographic_highlights", {})
    assert "kushiyara_river" in highlights, "kushiyara_river must be defined in four_geographic_highlights"
    k_meta = highlights["kushiyara_river"]
    assert k_meta["provenance_status"] == "VERIFIED_SWORD_V16"

    reaches = geo_data.get("reaches", [])
    k_reach = next((r for r in reaches if r["reach_id"] == "22211000021"), None)
    assert k_reach is not None, "Kushiyara Upper reach 22211000021 not found"
    assert k_reach["river_name"] == "Kushiyara"
    assert k_reach["role"] == "contextual_drainage"
    assert k_reach["has_gauge"] is False

    # Check origin at Amalshid bifurcation (verified 24.876°N, 92.489°E in OSM / 24.871°N, 92.483°E in SWORD v16)
    first_pt = k_reach["coordinates"][0]
    assert math.isclose(first_pt[0], 24.876, abs_tol=0.015), f"Kushiyara must branch at Amalshid (lat ~24.876, got {first_pt[0]})"
    assert (math.isclose(first_pt[1], 92.489, abs_tol=0.015) or math.isclose(first_pt[1], 92.483, abs_tol=0.015)), f"Kushiyara must branch at Amalshid (lon ~92.489, got {first_pt[1]})"


def test_meghalaya_catchment_geometry_vs_imerg_bbox(geo_data):
    """
    Feature D: Meghalaya upstream catchment.
    Must use HydroSHEDS v1.0 delineated sub-basin polygon (area 185.0 km²).
    Must NOT confuse physical polygon with IMERG satellite subset bounding box (23.5-26.0N, 91.0-93.5E).
    """
    highlights = geo_data.get("four_geographic_highlights", {})
    assert "meghalaya_catchment" in highlights, "meghalaya_catchment must be defined in four_geographic_highlights"
    m_meta = highlights["meghalaya_catchment"]
    assert m_meta["area_km2"] == 185.0
    assert m_meta["provenance_status"] == "VERIFIED_HYDROSHEDS"
    assert "footprint_note" in m_meta, "Must document difference between physical basin and satellite subset bounding box"

    subbasins = geo_data.get("subbasins", [])
    upper_surma = next((s for s in subbasins if s["id"] == "upper_surma_meghalaya"), None)
    assert upper_surma is not None, "upper_surma_meghalaya subbasin missing"
    assert upper_surma["area_km2"] == 185.0

    poly = upper_surma["coordinates"]
    assert len(poly) >= 8, "HydroSHEDS polygon must have >= 8 boundary vertices"
    # Polygon ring must be closed
    assert poly[0] == poly[-1], "Polygon boundary must be a closed ring (first vertex == last vertex)"

    # Coordinates must be within Meghalaya escarpment and NOT the entire 2.5x2.5 deg bounding box
    for pt in poly:
        lat, lon = pt[0], pt[1]
        assert 24.9 <= lat <= 25.4, f"Catchment latitude {lat} out of Meghalaya escarpment bounds"
        assert 92.0 <= lon <= 92.6, f"Catchment longitude {lon} out of Meghalaya escarpment bounds"


def test_four_geographic_highlights_provenance_schema(geo_data):
    """
    Validates complete provenance, CRS, and non-empty structure
    for all four required geographic highlights.
    """
    required_keys = ["kanaighat_gauge", "surma_river", "kushiyara_river", "meghalaya_catchment"]
    highlights = geo_data.get("four_geographic_highlights", {})
    for key in required_keys:
        assert key in highlights, f"Missing required highlight: {key}"
        entry = highlights[key]
        assert "feature_type" in entry, f"Missing feature_type in {key}"
        assert "role" in entry, f"Missing role in {key}"
        assert "source" in entry, f"Missing source in {key}"
        assert "provenance_status" in entry, f"Missing provenance_status in {key}"

    # Check that no coordinates in entire file are NaN, null, or -9999
    raw_str = json.dumps(geo_data)
    assert "NaN" not in raw_str
    assert "-9999" not in raw_str
    assert "null, null" not in raw_str


def test_no_duplicate_feature_identifiers(geo_data):
    """Ensures station IDs, reach IDs, and sub-basin IDs are strictly unique."""
    reach_ids = [r["reach_id"] for r in geo_data.get("reaches", [])]
    assert len(reach_ids) == len(set(reach_ids)), f"Duplicate reach IDs found: {reach_ids}"

    station_ids = [s["station_id"] for s in geo_data.get("gauge_stations", [])]
    assert len(station_ids) == len(set(station_ids)), f"Duplicate station IDs found: {station_ids}"

    subbasin_ids = [s["id"] for s in geo_data.get("subbasins", [])]
    assert len(subbasin_ids) == len(set(subbasin_ids)), f"Duplicate sub-basin IDs found: {subbasin_ids}"
