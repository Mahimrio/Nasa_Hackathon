[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}

function Fetch-NominatimGeoJSON($query, $outputFile) {
    Write-Host "Fetching $query..."
    $url = "https://nominatim.openstreetmap.org/search?q=$query&format=geojson&polygon_geojson=1"
    $req = [System.Net.HttpWebRequest]::Create($url)
    $req.UserAgent = "HydroSenseSWOT-Geospatial-Audit/1.0"
    $req.Timeout = 15000
    try {
        $res = $req.GetResponse()
        $reader = New-Object System.IO.StreamReader($res.GetResponseStream())
        $content = $reader.ReadToEnd()
        [System.IO.File]::WriteAllText($outputFile, $content)
        Write-Host "Successfully saved to $outputFile (bytes: $($content.Length))"
    } catch {
        Write-Host "Error fetching $query"
        Write-Host $_.Exception.Message
    }
}

Fetch-NominatimGeoJSON "Surma+River" "f:\Nasa\Nasa_Hackathon\data\surma_nominatim.json"
Start-Sleep -Seconds 2
Fetch-NominatimGeoJSON "Kushiyara+River" "f:\Nasa\Nasa_Hackathon\data\kushiyara_nominatim.json"
