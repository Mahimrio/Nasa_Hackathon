import json
import math

def analyze_slices():
    with open("f:/Nasa/Nasa_Hackathon/data/surma_nominatim.json", "r", encoding="utf-8") as f:
        surma_data = json.load(f)
    with open("f:/Nasa/Nasa_Hackathon/data/kushiyara_nominatim.json", "r", encoding="utf-8") as f:
        kush_data = json.load(f)

    surma_coords = surma_data["features"][1]["geometry"]["coordinates"][0] # [[lon, lat], ...]
    kush_coords = kush_data["features"][0]["geometry"]["coordinates"][0]

    # Convert to Leaflet [lat, lon]
    surma_latlon = [[round(pt[1], 6), round(pt[0], 6)] for pt in surma_coords]
    kush_latlon = [[round(pt[1], 6), round(pt[0], 6)] for pt in kush_coords]

    # Reach 11: Surma Upper
    # From index 0 (Amalshid [24.8759, 92.4891]) to index 468 (lat ~25.035, lon ~92.14)
    r11 = surma_latlon[0:469]
    print(f"Reach 11 points: {len(r11)}")
    print(f"Reach 11 start: {r11[0]}, end: {r11[-1]}")
    r11_lats = [p[0] for p in r11]
    r11_lons = [p[1] for p in r11]
    print(f"Reach 11 lat range: [{min(r11_lats)}, {max(r11_lats)}], lon range: [{min(r11_lons)}, {max(r11_lons)}]")

    # Check Kanaighat station in r11
    k_in_r11 = any(math.isclose(p[0], 24.9980, abs_tol=0.005) and math.isclose(p[1], 92.2594, abs_tol=0.005) for p in r11)
    print(f"Kanaighat gauge vertex in Reach 11? {k_in_r11}")

    # Reach 12: Surma Mid
    # From index 468 to index 865
    r12 = surma_latlon[468:866]
    print(f"\nReach 12 points: {len(r12)}")
    print(f"Reach 12 start: {r12[0]}, end: {r12[-1]}")
    # Sylhet Keane Bridge is in r12
    s_in_r12 = any(math.isclose(p[0], 24.8917, abs_tol=0.01) and math.isclose(p[1], 91.8719, abs_tol=0.01) for p in r12)
    print(f"Sylhet center vertex in Reach 12? {s_in_r12}")

    # Reach 21: Kushiyara Upper
    # From index 0 to index 450
    r21 = kush_latlon[0:451]
    print(f"\nReach 21 points: {len(r21)}")
    print(f"Reach 21 start: {r21[0]}, end: {r21[-1]}")
    sh_in_r21 = any(math.isclose(p[0], 24.887, abs_tol=0.015) and math.isclose(p[1], 92.316, abs_tol=0.015) for p in r21)
    print(f"Sheola in Reach 21? {sh_in_r21}")

    # Reach 22: Kushiyara Mid
    # From index 450 to index 850
    r22 = kush_latlon[450:851]
    print(f"\nReach 22 points: {len(r22)}")
    print(f"Reach 22 start: {r22[0]}, end: {r22[-1]}")
    sp_in_r22 = any(math.isclose(p[0], 24.6283, abs_tol=0.015) and math.isclose(p[1], 91.6742, abs_tol=0.015) for p in r22)
    print(f"Sherpur in Reach 22? {sp_in_r22}")

if __name__ == "__main__":
    analyze_slices()
