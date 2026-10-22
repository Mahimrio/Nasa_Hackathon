import json
import math

def process_rivers():
    with open("f:/Nasa/Nasa_Hackathon/data/surma_nominatim.json", "r", encoding="utf-8") as f:
        surma_data = json.load(f)
    
    with open("f:/Nasa/Nasa_Hackathon/data/kushiyara_nominatim.json", "r", encoding="utf-8") as f:
        kush_data = json.load(f)

    surma_rel = next(feat for feat in surma_data["features"] if feat["properties"].get("osm_type") == "relation")
    kush_rel = next(feat for feat in kush_data["features"] if feat["properties"].get("osm_type") == "relation")

    surma_coords = surma_rel["geometry"]["coordinates"][0] # [[lon, lat], ...]
    kush_coords = kush_rel["geometry"]["coordinates"][0]

    print(f"Total Surma points: {len(surma_coords)}")
    print(f"Total Kushiyara points: {len(kush_coords)}")

    # Check origin
    print(f"Surma first point (lon, lat): {surma_coords[0]}")
    print(f"Kushiyara first point (lon, lat): {kush_coords[0]}")

    # Find Kanaighat index
    kanaighat_lat, kanaighat_lon = 24.9980, 92.2594
    closest_k_idx = min(range(len(surma_coords)), key=lambda i: (surma_coords[i][0] - kanaighat_lon)**2 + (surma_coords[i][1] - kanaighat_lat)**2)
    print(f"Kanaighat index in Surma: {closest_k_idx}, coords: {surma_coords[closest_k_idx]}")

    # Find Sylhet Keane Bridge index (24.8917 N, 91.8719 E)
    sylhet_lat, sylhet_lon = 24.8917, 91.8719
    closest_s_idx = min(range(len(surma_coords)), key=lambda i: (surma_coords[i][0] - sylhet_lon)**2 + (surma_coords[i][1] - sylhet_lat)**2)
    print(f"Sylhet index in Surma: {closest_s_idx}, coords: {surma_coords[closest_s_idx]}")

    # Find Sheola index in Kushiyara (24.887 N, 92.316 E)
    sheola_lat, sheola_lon = 24.887, 92.316
    closest_sh_idx = min(range(len(kush_coords)), key=lambda i: (kush_coords[i][0] - sheola_lon)**2 + (kush_coords[i][1] - sheola_lat)**2)
    print(f"Sheola index in Kushiyara: {closest_sh_idx}, coords: {kush_coords[closest_sh_idx]}")

    # Find Sherpur index in Kushiyara (24.6283 N, 91.6742 E)
    sherpur_lat, sherpur_lon = 24.6283, 91.6742
    closest_sp_idx = min(range(len(kush_coords)), key=lambda i: (kush_coords[i][0] - sherpur_lon)**2 + (kush_coords[i][1] - sherpur_lat)**2)
    print(f"Sherpur index in Kushiyara: {closest_sp_idx}, coords: {kush_coords[closest_sp_idx]}")

if __name__ == "__main__":
    process_rivers()
