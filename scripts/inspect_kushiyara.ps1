$kush = Get-Content "f:\Nasa\Nasa_Hackathon\data\kushiyara_nominatim.json" -Raw | ConvertFrom-Json
$kushRel = $kush.features | Where-Object { $_.properties.osm_type -eq "relation" }
Write-Host "Kushiyara relation type: $($kushRel.geometry.type)"
$coords = $kushRel.geometry.coordinates[0]
Write-Host "Kushiyara total points: $($coords.Count)"
Write-Host "First point: $($coords[0][0]), $($coords[0][1])"
Write-Host "Last point: $($coords[-1][0]), $($coords[-1][1])"

# Find Sheola (lon ~92.3160, lat ~24.8870)
$closestSh = $null
$minDistSh = 9999
for ($i = 0; $i -lt $coords.Count; $i++) {
    $lon = $coords[$i][0]
    $lat = $coords[$i][1]
    $d = [Math]::Sqrt([Math]::Pow($lon - 92.3160, 2) + [Math]::Pow($lat - 24.8870, 2))
    if ($d -lt $minDistSh) {
        $minDistSh = $d
        $closestSh = $i
    }
}
Write-Host "Closest point to Sheola: index $closestSh, coords: $($coords[$closestSh][0]), $($coords[$closestSh][1]) (dist: $minDistSh)"

# Find Fenchuganj (lon ~91.940, lat ~24.708)
$closestF = $null
$minDistF = 9999
for ($i = 0; $i -lt $coords.Count; $i++) {
    $lon = $coords[$i][0]
    $lat = $coords[$i][1]
    $d = [Math]::Sqrt([Math]::Pow($lon - 91.940, 2) + [Math]::Pow($lat - 24.708, 2))
    if ($d -lt $minDistF) {
        $minDistF = $d
        $closestF = $i
    }
}
Write-Host "Closest point to Fenchuganj: index $closestF, coords: $($coords[$closestF][0]), $($coords[$closestF][1]) (dist: $minDistF)"

# Find Sherpur (lon ~91.6742, lat ~24.6283)
$closestSp = $null
$minDistSp = 9999
for ($i = 0; $i -lt $coords.Count; $i++) {
    $lon = $coords[$i][0]
    $lat = $coords[$i][1]
    $d = [Math]::Sqrt([Math]::Pow($lon - 91.6742, 2) + [Math]::Pow($lat - 24.6283, 2))
    if ($d -lt $minDistSp) {
        $minDistSp = $d
        $closestSp = $i
    }
}
Write-Host "Closest point to Sherpur: index $closestSp, coords: $($coords[$closestSp][0]), $($coords[$closestSp][1]) (dist: $minDistSp)"
