import json
import math

def build():
    # Load source Nominatim GeoJSONs
    with open("f:/Nasa/Nasa_Hackathon/data/surma_nominatim.json", "r", encoding="utf-8") as f:
        surma_data = json.load(f)
    with open("f:/Nasa/Nasa_Hackathon/data/kushiyara_nominatim.json", "r", encoding="utf-8") as f:
        kush_data = json.load(f)

    surma_coords = surma_data["features"][1]["geometry"]["coordinates"][0] # [[lon, lat], ...]
    kush_coords = kush_data["features"][0]["geometry"]["coordinates"][0]

    # Convert to Leaflet [latitude, longitude]
    surma_latlon = [[round(pt[1], 6), round(pt[0], 6)] for pt in surma_coords]
    kush_latlon = [[round(pt[1], 6), round(pt[0], 6)] for pt in kush_coords]

    # Reach 22211000011: Surma Upper (Amalshid bifurcation to Jaintiapur/Sylhet boundary)
    # Index 0 to 468
    reach11_coords = surma_latlon[0:469]
    # Insert / ensure exact Kanaighat station vertex at index 338
    reach11_coords[338] = [24.9980, 92.2594]

    # Reach 22211000012: Surma Mid (Jaintiapur/Sylhet boundary through Sylhet City to Biswanath/Haor rim)
    # Index 468 to 865
    reach12_coords = surma_latlon[468:866]

    # Reach 22211000021: Kushiyara Upper (Amalshid bifurcation through Sheola to Fenchuganj approach)
    # Index 0 to 450
    reach21_coords = kush_latlon[0:451]

    # Reach 22211000022: Kushiyara Mid (Fenchuganj approach through Sherpur to downstream)
    # Index 450 to 850
    reach22_coords = kush_latlon[450:851]

    print(f"Reach 11 (Surma Upper) points: {len(reach11_coords)}")
    print(f"Reach 12 (Surma Mid) points: {len(reach12_coords)}")
    print(f"Reach 21 (Kushiyara Upper) points: {len(reach21_coords)}")
    print(f"Reach 22 (Kushiyara Mid) points: {len(reach22_coords)}")

    # Load existing reach_geometries.json to preserve all metadata, study area, four_geographic_highlights, subbasins, border
    with open("f:/Nasa/Nasa_Hackathon/ui/public/data/reach_geometries.json", "r", encoding="utf-8") as f:
        existing_data = json.load(f)

    # Update reach coordinates
    for r in existing_data["reaches"]:
        if r["reach_id"] == "22211000011":
            r["coordinates"] = reach11_coords
        elif r["reach_id"] == "22211000012":
            r["coordinates"] = reach12_coords
        elif r["reach_id"] == "22211000021":
            r["coordinates"] = reach21_coords
        elif r["reach_id"] == "22211000022":
            r["coordinates"] = reach22_coords

    # Save to ui/public/data/reach_geometries.json
    out_path = "f:/Nasa/Nasa_Hackathon/ui/public/data/reach_geometries.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(existing_data, f, indent=2, ensure_ascii=False)
    print(f"Successfully updated {out_path} with genuine OSM river geometries!")

if __name__ == "__main__":
    build()
