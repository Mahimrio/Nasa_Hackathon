$surma = Get-Content "f:\Nasa\Nasa_Hackathon\data\surma_nominatim.json" -Raw | ConvertFrom-Json
$surmaRel = $surma.features | Where-Object { $_.properties.osm_type -eq "relation" }
Write-Host "Surma relation type: $($surmaRel.geometry.type)"
$coords = $surmaRel.geometry.coordinates[0]
Write-Host "Surma total points: $($coords.Count)"
Write-Host "First point: $($coords[0][0]), $($coords[0][1])"
Write-Host "Last point: $($coords[-1][0]), $($coords[-1][1])"

# Find Kanaighat station area (lon ~92.2594, lat ~24.9980)
$closestK = $null
$minDist = 9999
for ($i = 0; $i -lt $coords.Count; $i++) {
    $lon = $coords[$i][0]
    $lat = $coords[$i][1]
    $d = [Math]::Sqrt([Math]::Pow($lon - 92.2594, 2) + [Math]::Pow($lat - 24.9980, 2))
    if ($d -lt $minDist) {
        $minDist = $d
        $closestK = $i
    }
}
Write-Host "Closest point to Kanaighat gauge: index $closestK, coords: $($coords[$closestK][0]), $($coords[$closestK][1]) (dist: $minDist)"

# Find Sylhet City center (lon ~91.8719, lat ~24.8917)
$closestS = $null
$minDistS = 9999
for ($i = 0; $i -lt $coords.Count; $i++) {
    $lon = $coords[$i][0]
    $lat = $coords[$i][1]
    $d = [Math]::Sqrt([Math]::Pow($lon - 91.8719, 2) + [Math]::Pow($lat - 24.8917, 2))
    if ($d -lt $minDistS) {
        $minDistS = $d
        $closestS = $i
    }
}
Write-Host "Closest point to Sylhet center: index $closestS, coords: $($coords[$closestS][0]), $($coords[$closestS][1]) (dist: $minDistS)"
