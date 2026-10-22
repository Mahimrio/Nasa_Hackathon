$surma = Get-Content "f:\Nasa\Nasa_Hackathon\data\surma_nominatim.json" -Raw | ConvertFrom-Json
$coords = $surma.features | Where-Object { $_.properties.osm_type -eq "relation" } | Select-Object -ExpandProperty geometry | Select-Object -ExpandProperty coordinates
$coords = $coords[0]

Write-Host "Total Surma points: $($coords.Count)"
# Let's inspect coordinates around Kanaighat (index ~338)
for ($i = 330; $i -le 345; $i++) {
    Write-Host "Index $i : lat=$($coords[$i][1]), lon=$($coords[$i][0])"
}

# Let's inspect coordinates around lon 92.13 (approx reach 1 / reach 2 split)
$split1 = $null
for ($i = 340; $i -lt $coords.Count; $i++) {
    if ($coords[$i][0] -lt 92.130) {
        $split1 = $i
        break
    }
}
Write-Host "Surma Reach 1 / Reach 2 split candidate at index $split1 : lat=$($coords[$split1][1]), lon=$($coords[$split1][0])"

# Let's inspect coordinates around lon 91.73 (approx reach 2 end)
$split2 = $null
for ($i = $split1; $i -lt $coords.Count; $i++) {
    if ($coords[$i][0] -lt 91.730) {
        $split2 = $i
        break
    }
}
Write-Host "Surma Reach 2 end candidate at index $split2 : lat=$($coords[$split2][1]), lon=$($coords[$split2][0])"
