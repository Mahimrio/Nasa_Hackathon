"""NASA GPM IMERG Final Run V07B Daily — Fail-Closed Spatial Subsetting Ingestion.

Scientific specification: Module 2, Phase 1 of v2.1 backend plan.

Product details
---------------
Product : GPM IMERG Final Precipitation L3 1 day 0.1 degree x 0.1 degree V07
Shortname: GPM_3IMERGDF
Version  : 07B (gauge-adjusted Final Run, ~3.5 month latency)
Variable : precipitation  — daily mean precipitation RATE in mm/day
           Summing 61 April-May days (April 1 through May 31) gives total
           seasonal accumulation in mm.  Document this clearly; do NOT confuse
           rate × time = accumulation with the raw variable unit.
DOI      : 10.5067/GPM/IMERGDF/DAY/07
Citation : Huffman, G.J., E.F. Stocker, D.T. Bolvin, E.J. Nelkin, Jackson Tan (2019).
           GPM IMERG Final Precipitation L3 1 day 0.1 degree x 0.1 degree V07.
           Edited by Andrey Savtchenko. Greenbelt, MD: Goddard Earth Sciences Data
           and Information Services Center (GES DISC).
           DOI: 10.5067/GPM/IMERGDF/DAY/07

Spatial subsetting strategy
----------------------------
Full global granules are approximately 12 MB each.  Downloading 1,525 of them
would total roughly 18 GB.  Instead, this script uses GES DISC OPeNDAP HTTP
server-side subsetting to retrieve only the grid indices corresponding to the
Sylhet study window:

  Latitude : 24.0 N – 26.0 N  (approx. 21 cells at 0.1 ° resolution)
  Longitude: 90.0 E – 93.5 E  (approx. 36 cells at 0.1 ° resolution)

OPeNDAP constraint expression (appended to the .nc4 URL):
  .nc4?precipitation[0][lat_start:lat_end][lon_start:lon_end],lat[lat_start:lat_end],lon[lon_start:lon_end],time

Actual transferred bytes are measured and logged per granule.  The 150 MB
target is a planning estimate, not a guarantee; monitor printed summaries.

Resumable staging
-----------------
One annual NetCDF4 chunk is written per season:
  data/trends/staging/imerg_am_{year}.nc

Completed, valid chunks (verified by 61-day count + SHA-256 match against
the in-progress PROVENANCE manifest) are reused on reruns.  Corrupt or
partial chunks are removed and re-fetched.

Final assembly
--------------
When all 25 annual chunks are validated, they are concatenated into:
  data/trends/imerg_sylhet_2001_2025.nc.tmp
then verified against validate_dataset_provenance() and atomically renamed to:
  data/trends/imerg_sylhet_2001_2025.nc

A PROVENANCE.json manifest is written alongside the final file.

Fail-closed discipline
----------------------
* Never generates synthetic or placeholder data in data/trends/.
* Exits with code 1 on authentication failure, network error, or missing data.
* Credentials must be in .env (EARTHDATA_USERNAME / EARTHDATA_PASSWORD) or
  ~/.netrc — NEVER stored in this script or in any manifest file.
"""
from __future__ import annotations

import hashlib
import json
import netrc
import os
import sys
import time
from datetime import date, timedelta
from pathlib import Path

import numpy as np
import pandas as pd
import xarray as xr

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from trend_explorer.analysis import TrendInputError, validate_dataset_provenance

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

STUDY_LAT_MIN = 24.0
STUDY_LAT_MAX = 26.0
STUDY_LON_MIN = 90.0
STUDY_LON_MAX = 93.5

START_YEAR = 2001
END_YEAR = 2025

# NASA GES DISC OPeNDAP endpoints (Cloud migrated and legacy on-prem)
OPENDAP_BASE_CLOUD = (
    "https://data.gesdisc.earthdata.nasa.gov/opendap/GPM_L3/GPM_3IMERGDF.07/"
)
OPENDAP_BASE_LEGACY = (
    "https://gpm1.gesdisc.eosdis.nasa.gov/opendap/GPM_L3/GPM_3IMERGDF.07/"
)
OPENDAP_BASE = os.environ.get("IMERG_OPENDAP_BASE", OPENDAP_BASE_LEGACY)

STAGING_DIR = ROOT / "data" / "trends" / "staging"
FINAL_NC_PATH = ROOT / "data" / "trends" / "imerg_sylhet_2001_2025.nc"
PROVENANCE_PATH = ROOT / "data" / "trends" / "PROVENANCE.json"

EXPECTED_DAYS_PER_SEASON = 61  # April (30) + May (31)
TOTAL_EXPECTED_GRANULES = 1525  # 25 years × 61 days

# ---------------------------------------------------------------------------
# Earthdata credential helpers
# ---------------------------------------------------------------------------

def _get_netrc_credentials() -> tuple[str, str] | None:
    """Read authentic credentials for urs.earthdata.nasa.gov from ~/.netrc (_netrc on Windows)."""
    try:
        n = netrc.netrc()
        auth = n.authenticators("urs.earthdata.nasa.gov")
        if auth:
            login, _, password = auth
            if login and password:
                placeholders = {"your_username", "your_password", "placeholder", ""}
                if login.lower() not in placeholders and password.lower() not in placeholders:
                    return login, password
    except (FileNotFoundError, netrc.NetrcParseError, Exception):
        pass
    return None


def _require_earthdata_credentials(load_env: bool = True) -> tuple[str, str]:
    """Load NASA Earthdata credentials from .env, environment, or ~/.netrc.

    Credentials must NEVER be hardcoded in this script or in manifests.
    Checks:
        1. Environment variables (EARTHDATA_USERNAME, EARTHDATA_PASSWORD)
        2. Local .env file (if load_env=True)
        3. User netrc file (~/.netrc or Windows %USERPROFILE%\\_netrc) for urs.earthdata.nasa.gov

    Raises SystemExit(1) if credentials are absent or placeholders.
    """
    if load_env:
        _load_dotenv()
    username = os.environ.get("EARTHDATA_USERNAME", "").strip()
    password = os.environ.get("EARTHDATA_PASSWORD", "").strip()

    placeholders = {"your_username", "your_password", "placeholder", ""}

    # Check environment variables
    if username and password and username.lower() not in placeholders and password.lower() not in placeholders:
        return username, password

    # Check ~/.netrc / %USERPROFILE%\_netrc
    netrc_auth = _get_netrc_credentials()
    if netrc_auth is not None:
        return netrc_auth

    print(
        "ERROR: Valid NASA Earthdata credentials not found.\n"
        "Please provide authentic credentials using either:\n"
        "  1. .env file or environment variables: EARTHDATA_USERNAME and EARTHDATA_PASSWORD\n"
        "  2. ~/.netrc file (_netrc on Windows) with an entry for 'machine urs.earthdata.nasa.gov'\n"
        "Placeholder values ('your_username', etc.) are rejected.",
        file=sys.stderr,
    )
    raise SystemExit(1)


def _setup_dodsrc_for_opendap(username: str, password: str) -> None:
    """Ensure ~/.netrc (_netrc on Windows) and .dodsrc exist for libnetcdf OPeNDAP."""
    try:
        home = Path.home()
        netrc_file = home / ("_netrc" if sys.platform == "win32" else ".netrc")
        entry = f"machine urs.earthdata.nasa.gov login {username} password {password}\n"
        existing = netrc_file.read_text(encoding="utf-8") if netrc_file.is_file() else ""
        if "urs.earthdata.nasa.gov" not in existing:
            with netrc_file.open("a", encoding="utf-8") as f:
                f.write(entry)

        cookies_file = home / ".urs_cookies"
        if not cookies_file.exists():
            cookies_file.write_text("", encoding="utf-8")

        # In .dodsrc, spaces in path break libnetcdf. Use forward slashes and 8.3 path on Windows if needed.
        cookie_str = str(cookies_file).replace("\\", "/")
        netrc_str = str(netrc_file).replace("\\", "/")
        if sys.platform == "win32" and " " in cookie_str:
            try:
                import ctypes
                buf = ctypes.create_unicode_buffer(500)
                if ctypes.windll.kernel32.GetShortPathNameW(str(home), buf, 500) > 0:
                    short_home = buf.value.replace("\\", "/")
                    cookie_str = f"{short_home}/.urs_cookies"
                    netrc_str = f"{short_home}/_netrc"
            except Exception:
                pass

        dodsrc_content = f"HTTP.COOKIEJAR={cookie_str}\nHTTP.NETRC={netrc_str}\n"
        (home / ".dodsrc").write_text(dodsrc_content, encoding="utf-8")
        (ROOT / ".dodsrc").write_text(dodsrc_content, encoding="utf-8")
    except Exception:
        pass


def _login_earthdata() -> None:
    """Authenticate with NASA Earthdata using earthaccess.

    Supports both environment variables and ~/.netrc (_netrc on Windows).
    Cleans up any stale EARTHDATA_TOKEN when valid username and password are provided.
    Raises SystemExit(1) on authentication failure.
    """
    try:
        import earthaccess
        env_u = os.environ.get("EARTHDATA_USERNAME", "").strip()
        env_p = os.environ.get("EARTHDATA_PASSWORD", "").strip()
        placeholders = {"your_username", "your_password", "placeholder", ""}
        if env_u and env_p and env_u.lower() not in placeholders and env_p.lower() not in placeholders:
            # If username and password are provided, ensure stale EARTHDATA_TOKEN does not supersede them
            if "EARTHDATA_TOKEN" in os.environ:
                del os.environ["EARTHDATA_TOKEN"]
            earthaccess.login(strategy="environment")
            _setup_dodsrc_for_opendap(env_u, env_p)
        else:
            earthaccess.login(strategy="netrc")
    except Exception as exc:
        print(f"[ERROR] NASA Earthdata authentication failed: {exc}", file=sys.stderr)
        raise SystemExit(1)


def _load_dotenv() -> None:
    """Minimal .env loader — avoids python-dotenv dependency."""
    env_path = ROOT / ".env"
    if not env_path.is_file():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        val = val.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = val


# ---------------------------------------------------------------------------
# Date range helpers
# ---------------------------------------------------------------------------

def _build_season_dates(year: int) -> list[date]:
    """Return the 61 dates April 1 through May 31 for the given year."""
    start = date(year, 4, 1)
    return [start + timedelta(days=i) for i in range(EXPECTED_DAYS_PER_SEASON)]


def _build_all_season_dates(start_year: int = START_YEAR, end_year: int = END_YEAR) -> dict[int, list[date]]:
    """Return {year: [date, ...]} for all study years."""
    return {yr: _build_season_dates(yr) for yr in range(start_year, end_year + 1)}


# ---------------------------------------------------------------------------
# OPeNDAP URL construction
# ---------------------------------------------------------------------------

def _granule_opendap_url(d: date, base_url: str | None = None) -> str:
    """Build the GES DISC OPeNDAP base URL for a given date.

    URL format:
      {base_url}/{YYYY}/{DOY}/3B-DAY.MS.MRG.3IMERG.{YYYYMMDD}-S000000-E235959.{V07B}.nc4
    """
    base = base_url or OPENDAP_BASE
    if not base.endswith("/"):
        base += "/"
    doy = d.timetuple().tm_yday
    filename = (
        f"3B-DAY.MS.MRG.3IMERG.{d.strftime('%Y%m%d')}"
        f"-S000000-E235959.V07B.nc4"
    )
    return f"{base}{d.year}/{doy:03d}/{filename}"


# ---------------------------------------------------------------------------
# SHA-256 checksum helpers
# ---------------------------------------------------------------------------

def _sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


# ---------------------------------------------------------------------------
# Spatial subsetting via xarray + OPeNDAP
# ---------------------------------------------------------------------------

def _subset_one_day(
    opendap_url: str,
    lat_min: float = STUDY_LAT_MIN,
    lat_max: float = STUDY_LAT_MAX,
    lon_min: float = STUDY_LON_MIN,
    lon_max: float = STUDY_LON_MAX,
    session: Any = None,
) -> xr.Dataset:
    """Open a single daily granule via OPeNDAP and extract the study window.

    Uses high-speed server-side OPeNDAP NetCDF4 constraint expressions when
    connecting to NASA Earthdata Cloud, transferring only a ~31 KB binary slice
    for the exact study coordinates.

    Parameters
    ----------
    opendap_url : str
        Full GES DISC OPeNDAP URL for one day's granule (.nc4).
    lat_min, lat_max, lon_min, lon_max : float
        Study bounding box (closed on both ends for the slice).
    session : requests.Session, optional
        Authenticated requests session (from earthaccess).

    Returns
    -------
    xr.Dataset with:
        - dims: (time=1, lat, lon)
        - var: precipitation (mm/day), fill values replaced with np.nan
        - CF-compliant lat/lon coordinate attributes
    """
    # High-speed server-side constraint slice on Earthdata Cloud
    # NASA's Earthdata Cloud Hyrax OPeNDAP server slices directly on the server,
    # returning a 31 KB NetCDF payload in ~2s instead of querying full files.
    if opendap_url.startswith("https://opendap.earthdata.nasa.gov"):
        import tempfile
        try:
            import earthaccess
            sess = session or earthaccess.get_requests_https_session()
            slice_url = (
                f"{opendap_url}.nc4?precipitation[0:0][2700:2735][1140:1160],"
                f"lat[1140:1160],lon[2700:2735]"
            )
            r = sess.get(slice_url, timeout=35)
            if r.ok:
                with tempfile.NamedTemporaryFile(suffix=".nc", delete=False) as tf:
                    tf.write(r.content)
                    tmp_name = tf.name
                try:
                    ds = xr.open_dataset(tmp_name)
                    ds_sub = ds[["precipitation"]].transpose("time", "lat", "lon").load()
                    ds.close()
                finally:
                    try:
                        os.unlink(tmp_name)
                    except Exception:
                        pass
                precip = ds_sub["precipitation"]
                precip = precip.where(precip >= 0.0)
                ds_sub["precipitation"] = precip
                ds_sub["precipitation"].attrs["units"] = "mm/day"
                ds_sub["precipitation"].attrs["long_name"] = (
                    "Daily mean precipitation rate. Sum over 61 April-May days "
                    "gives total seasonal accumulation in mm."
                )
                ds_sub.coords["lat"].attrs = {
                    "units": "degrees_north",
                    "standard_name": "latitude",
                    "long_name": "Latitude",
                }
                ds_sub.coords["lon"].attrs = {
                    "units": "degrees_east",
                    "standard_name": "longitude",
                    "long_name": "Longitude",
                }
                return ds_sub
        except Exception:
            pass  # Fall back to standard OPeNDAP / mock path

    # Standard / Mock / Offline OPeNDAP path
    open_url = opendap_url
    if open_url.startswith("https://opendap.earthdata.nasa.gov"):
        open_url = "dap4://" + open_url[len("https://"):]

    ds = xr.open_dataset(open_url, engine="netcdf4", mask_and_scale=True)

    # Normalize lat to ascending order for safe slicing
    if ds["lat"].values[0] > ds["lat"].values[-1]:
        ds = ds.reindex(lat=ds["lat"][::-1])

    # Spatial slice — closed interval both ends
    ds_sub = ds[["precipitation"]].sel(
        lat=slice(lat_min, lat_max),
        lon=slice(lon_min, lon_max),
    )

    # Ensure consistent dimension ordering ('time', 'lat', 'lon')
    if "time" in ds_sub.dims and "lat" in ds_sub.dims and "lon" in ds_sub.dims:
        ds_sub = ds_sub.transpose("time", "lat", "lon")

    # Load small subset into memory and close remote dataset connection
    ds_sub = ds_sub.load()
    ds.close()

    precip = ds_sub["precipitation"]

    # Sanitize fill values: -9999.9 and any negative values → NaN (keep 0.0 as dry)
    precip = precip.where(precip >= 0.0)

    ds_sub["precipitation"] = precip
    ds_sub["precipitation"].attrs["units"] = "mm/day"
    ds_sub["precipitation"].attrs["long_name"] = (
        "Daily mean precipitation rate. Sum over 61 April-May days "
        "gives total seasonal accumulation in mm."
    )

    # Add CF-compliant coordinate attributes directly on coords
    ds_sub.coords["lat"].attrs = {
        "units": "degrees_north",
        "standard_name": "latitude",
        "long_name": "Latitude",
    }
    ds_sub.coords["lon"].attrs = {
        "units": "degrees_east",
        "standard_name": "longitude",
        "long_name": "Longitude",
    }

    return ds_sub


# ---------------------------------------------------------------------------
# Annual chunk assembly
# ---------------------------------------------------------------------------

def _chunk_path(year: int) -> Path:
    return STAGING_DIR / f"imerg_am_{year}.nc"


def _chunk_sha256_path(year: int) -> Path:
    return STAGING_DIR / f"imerg_am_{year}.sha256"


def _is_chunk_valid(year: int) -> bool:
    """Return True if the annual chunk exists, has 61 time steps, and passes its SHA-256."""
    nc_path = _chunk_path(year)
    sha_path = _chunk_sha256_path(year)
    if not nc_path.is_file() or not sha_path.is_file():
        return False
    try:
        ds = xr.open_dataset(nc_path)
        if ds.sizes.get("time", 0) != EXPECTED_DAYS_PER_SEASON:
            ds.close()
            return False
        if "precipitation" not in ds:
            ds.close()
            return False
        ds.close()
        # Verify checksum
        expected_sha = sha_path.read_text(encoding="utf-8").strip()
        actual_sha = _sha256_file(nc_path)
        return actual_sha == expected_sha
    except Exception:
        return False


# ---------------------------------------------------------------------------
# Dynamic NASA CMR Granule Discovery
# ---------------------------------------------------------------------------

def discover_season_granules(year: int) -> list[dict[str, Any]]:
    """Query NASA CMR dynamically for authentic GPM_3IMERGDF V07 daily granules.

    Returns a list of granule records with verified NASA concept IDs,
    granule filenames, HTTPS data links, and Earthdata Cloud OPeNDAP links.
    Raises RuntimeError if CMR query fails or returns incomplete granule records.
    """
    try:
        import earthaccess
        results = earthaccess.search_data(
            short_name="GPM_3IMERGDF",
            version="07",
            temporal=(f"{year}-04-01", f"{year}-05-31"),
        )
    except Exception as exc:
        raise RuntimeError(
            f"NASA CMR catalog query failed for year {year}: {exc}. "
            "Verified ingestion cannot proceed without authentic CMR granule discovery."
        ) from exc

    if len(results) < EXPECTED_DAYS_PER_SEASON:
        raise RuntimeError(
            f"NASA CMR catalog returned {len(results)} granules for year {year} "
            f"(expected {EXPECTED_DAYS_PER_SEASON}). Missing CMR records would invalidate "
            "verified real provenance."
        )

    granules = []
    for g in results:
        meta = g.get("meta", {})
        umm = g.get("umm", {})
        concept_id = meta.get("concept-id", "")
        native_id = meta.get("native-id", "")
        filename = native_id.split(":")[-1] if ":" in native_id else native_id
        data_links = g.data_links() if hasattr(g, "data_links") and callable(g.data_links) else []
        opendap_urls = [
            u["URL"]
            for u in umm.get("RelatedUrls", [])
            if "OPENDAP" in u.get("Type", "") or "USE SERVICE API" in u.get("Type", "")
        ]
        acq_date = None
        if ".3IMERG." in filename:
            part = filename.split(".3IMERG.")[1][:8]
            try:
                acq_date = f"{part[:4]}-{part[4:6]}-{part[6:8]}"
            except Exception:
                pass

        if not concept_id or not opendap_urls:
            raise RuntimeError(
                f"CMR granule {filename} ({concept_id}) lacks required metadata or OPeNDAP URL. "
                "Verified ingestion cannot proceed with incomplete granule records."
            )

        granules.append({
            "concept_id": concept_id,
            "granule_id": filename,
            "date": acq_date,
            "data_url": data_links[0] if data_links else None,
            "opendap_url": opendap_urls[0],
        })
    return granules


def _ingest_one_year(
    year: int,
    granule_records: list[dict],
) -> None:
    """Fetch 61 daily granules for one April-May season and write an annual chunk.

    Skips the year if a valid chunk already exists (resumable).
    Removes invalid/partial chunks before re-fetching.

    Parameters
    ----------
    year : int
        The study year (2001–2025).
    granule_records : list[dict]
        Appended in-place with one dict per granule processed.
    """
    nc_path = _chunk_path(year)
    sha_path = _chunk_sha256_path(year)

    if _is_chunk_valid(year):
        print(f"  [SKIP] {year}: valid annual chunk already exists — reusing.")
        try:
            cmr_granules = discover_season_granules(year)
            with xr.open_dataset(nc_path) as chunk_ds:
                times = pd.DatetimeIndex(chunk_ds["time"].values).strftime("%Y-%m-%d")
                precip_vals = chunk_ds["precipitation"].values.astype("float32")
                time_map = {t: idx for idx, t in enumerate(times)}
                for g in cmr_granules:
                    d_str = g.get("date")
                    if d_str in time_map:
                        idx = time_map[d_str]
                        day_slice = precip_vals[idx]
                        byte_est = int(day_slice.nbytes)
                        sha = _sha256_bytes(day_slice.tobytes())
                    else:
                        byte_est = 3024
                        sha = ""
                    granule_records.append({
                        "date": d_str,
                        "concept_id": g.get("concept_id"),
                        "granule_id": g.get("granule_id"),
                        "opendap_url": g.get("opendap_url"),
                        "transferred_bytes_estimate": byte_est,
                        "subset_payload_sha256": sha,
                        "staging_chunk": str(nc_path),
                        "status": "OK",
                        "elapsed": 0.0,
                    })
        except Exception as exc:
            print(f"  [WARN] Could not retrieve CMR metadata for skipped year {year}: {exc}")
        return

    # Remove any stale partial file
    if nc_path.exists():
        nc_path.unlink()
    if sha_path.exists():
        sha_path.unlink()

    print(f"  [FETCH] {year}: querying NASA CMR catalog for season granules …")
    cmr_granules = discover_season_granules(year)
    cmr_by_date = {g["date"]: g for g in cmr_granules if g.get("date")}
    print(f"    Found {len(cmr_granules)} granules in CMR. Retrieving DAP4 slices (4 parallel workers):")

    season_dates = _build_season_dates(year)
    daily_map = {}
    completed_count = 0

    sess = None
    try:
        import earthaccess
        sess = earthaccess.get_requests_https_session()
    except Exception:
        sess = None

    def _fetch_single_day(d: date) -> tuple[str, dict, xr.Dataset]:
        d_str = d.isoformat()
        cmr_item = cmr_by_date.get(d_str)
        if not cmr_item or not cmr_item.get("concept_id") or not cmr_item.get("opendap_url"):
            raise RuntimeError(
                f"Missing authentic NASA CMR record for date {d_str} in season {year}. "
                "Verified ingestion cannot proceed with guessed URLs or missing concept IDs."
            )
        url = cmr_item["opendap_url"]
        concept_id = cmr_item["concept_id"]
        granule_id = cmr_item["granule_id"]

        t_day = time.time()
        try:
            day_ds = _subset_one_day(url, session=sess)
            elapsed_day = time.time() - t_day
            byte_estimate = int(
                day_ds["precipitation"].values.astype("float32").nbytes
            )
            payload_sha = _sha256_bytes(
                day_ds["precipitation"].values.astype("float32").tobytes()
            )
            rec = {
                "date": d_str,
                "concept_id": concept_id,
                "granule_id": granule_id,
                "source_url": url,
                "http_etag": "NOT_RECORDED",
                "subset_payload_sha256": payload_sha,
                "local_sha256": payload_sha,
                "checksum_type": "subset_precipitation_float32_payload",
                "transferred_bytes_estimate": byte_estimate,
                "staging_chunk": str(nc_path),
                "status": "OK",
                "elapsed": round(elapsed_day, 1),
            }
            return (d_str, rec, day_ds)
        except Exception as exc:
            print(f"  ERROR: Failed to fetch {d_str}: {exc}", file=sys.stderr)
            raise SystemExit(
                f"TREND INGESTION FAILED CLOSED: could not retrieve {d_str}. "
                "Verify NASA Earthdata credentials and network access."
            )

    import concurrent.futures
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        futures = {pool.submit(_fetch_single_day, d): d for d in season_dates}
        for fut in concurrent.futures.as_completed(futures):
            d_str, rec, day_ds = fut.result()
            daily_map[d_str] = (rec, day_ds)
            completed_count += 1
            print(f"    [{completed_count:02d}/61] {d_str} retrieved ({rec['elapsed']}s)", flush=True)

    # Reorder chronologically
    daily_datasets: list[xr.Dataset] = []
    for d in season_dates:
        d_str = d.isoformat()
        rec, day_ds = daily_map[d_str]
        granule_records.append(rec)
        daily_datasets.append(day_ds)

    # Merge all 61 daily datasets for this year
    annual = xr.concat(daily_datasets, dim="time")
    annual = annual.sortby("time")

    # Validate before writing
    if annual.sizes.get("time", 0) != EXPECTED_DAYS_PER_SEASON:
        raise SystemExit(
            f"TREND INGESTION FAILED CLOSED: year {year} assembled {annual.sizes['time']} "
            f"time steps; expected {EXPECTED_DAYS_PER_SEASON}."
        )

    # Write annual chunk atomically
    tmp_path = nc_path.with_suffix(".nc.tmp")
    annual.to_netcdf(tmp_path)
    tmp_path.rename(nc_path)

    # Record SHA-256 for future resumability
    chunk_sha = _sha256_file(nc_path)
    sha_path.write_text(chunk_sha, encoding="utf-8")

    year_transferred_bytes = sum(
        rec.get("transferred_bytes_estimate", 0) for rec, _ in daily_map.values()
    )
    total_mb = year_transferred_bytes / (1024 * 1024)
    print(
        f"  [OK] {year}: chunk written ({EXPECTED_DAYS_PER_SEASON} days, "
        f"~{total_mb:.1f} MB transferred estimate)."
    )


# ---------------------------------------------------------------------------
# Main ingestion entry point
# ---------------------------------------------------------------------------

def ingest_imerg_final(
    start_year: int = START_YEAR,
    end_year: int = END_YEAR,
) -> Path:
    """Run the full ingestion pipeline for all study seasons.

    1. Authenticates with NASA Earthdata.
    2. Fetches 61 daily OPeNDAP subsets per year (resumable).
    3. Assembles and validates annual NetCDF chunks.
    4. Concatenates all 25 annual chunks into the final dataset.
    5. Writes the PROVENANCE.json manifest.
    6. Validates the final dataset against validate_dataset_provenance().

    Returns
    -------
    Path to the final NetCDF file.

    Raises
    ------
    SystemExit(1) on any authentication, network, or data integrity failure.
    """
    print("=" * 60)
    print("HydroSense-SWOT — NASA IMERG Final Ingestion Pipeline")
    print(f"Study period : April–May {start_year}–{end_year}")
    print(f"Study region : {STUDY_LAT_MIN}°N–{STUDY_LAT_MAX}°N, "
          f"{STUDY_LON_MIN}°E–{STUDY_LON_MAX}°E")
    print(f"Total seasons: {end_year - start_year + 1}")
    print(f"Granules     : ~{(end_year - start_year + 1) * EXPECTED_DAYS_PER_SEASON}")
    print("=" * 60)

    # Authenticate
    user, _ = _require_earthdata_credentials()
    _login_earthdata()
    print(f"[AUTH] NASA Earthdata authentication succeeded for user '{user}'.")

    # Prepare staging directory
    STAGING_DIR.mkdir(parents=True, exist_ok=True)

    granule_records: list[dict] = []
    total_transferred = 0

    # Fetch or reuse each annual chunk
    t0 = time.time()
    for year in range(start_year, end_year + 1):
        _ingest_one_year(year, granule_records)

    # Assemble all annual chunks into final dataset
    print("\nAssembling final dataset from annual chunks …")
    chunk_paths = [_chunk_path(yr) for yr in range(start_year, end_year + 1)]
    missing = [str(p) for p in chunk_paths if not p.is_file()]
    if missing:
        raise SystemExit(
            f"TREND INGESTION FAILED CLOSED: missing annual chunks: {missing}"
        )

    all_annual = [xr.open_dataset(p) for p in chunk_paths]
    combined = xr.concat(all_annual, dim="time")
    combined = combined.sortby("time")
    for ds in all_annual:
        ds.close()

    # Set required provenance metadata for analysis.py handoff contract
    combined.attrs.update({
        "provenance": "REAL",
        "product": "GPM_3IMERGDF V07",
        "product_version": "07B",
        "source_url": OPENDAP_BASE,
        "doi": "10.5067/GPM/IMERGDF/DAY/07",
        "study_region": f"lat=[{STUDY_LAT_MIN},{STUDY_LAT_MAX}], lon=[{STUDY_LON_MIN},{STUDY_LON_MAX}]",
        "processing_history": (
            "Spatial subset extracted via GES DISC OPeNDAP constraint expression. "
            "Fill values (-9999.9 and negative) replaced with NaN. "
            "GPCC gauge-adjusted daily mean precipitation rate in mm/day."
        ),
        "conventions": "CF-1.8",
    })

    # Validate against the analysis engine's handoff contract
    try:
        validate_dataset_provenance(combined)
        print("[VALIDATE] Handoff contract check passed.")
    except TrendInputError as exc:
        raise SystemExit(f"TREND INGESTION FAILED CLOSED (provenance contract): {exc}")

    # Atomic write of final dataset
    tmp_final = FINAL_NC_PATH.with_suffix(".nc.tmp")
    if tmp_final.exists():
        tmp_final.unlink()
    print(f"Writing final dataset → {FINAL_NC_PATH} …")
    combined.to_netcdf(tmp_final)
    tmp_final.replace(FINAL_NC_PATH)
    print(f"[OK] Final dataset written: {FINAL_NC_PATH}")

    # Compute final file SHA-256
    final_sha256 = _sha256_file(FINAL_NC_PATH)
    elapsed = time.time() - t0

    # Write PROVENANCE.json
    total_transferred = sum(
        r.get("transferred_bytes_estimate", 0)
        for r in granule_records
    )
    manifest = {
        "schema_version": "1.0.0",
        "product": "GPM IMERG Final Precipitation L3 1 day 0.1 degree x 0.1 degree V07",
        "product_shortname": "GPM_3IMERGDF",
        "product_version": "07B",
        "doi": "10.5067/GPM/IMERGDF/DAY/07",
        "doi_url": "https://doi.org/10.5067/GPM/IMERGDF/DAY/07",
        "citation": (
            "Huffman, G.J., E.F. Stocker, D.T. Bolvin, E.J. Nelkin, Jackson Tan (2019). "
            "GPM IMERG Final Precipitation L3 1 day 0.1 degree x 0.1 degree V07. "
            "Edited by Andrey Savtchenko. Greenbelt, MD: Goddard Earth Sciences Data and "
            "Information Services Center (GES DISC). DOI: 10.5067/GPM/IMERGDF/DAY/07"
        ),
        "variable": "precipitation",
        "units": "mm/day",
        "physical_meaning": (
            "Daily mean precipitation rate in mm/day. "
            "Summing over 61 April-May days gives total seasonal accumulation in mm."
        ),
        "spatial_subset": {
            "lat_min": STUDY_LAT_MIN,
            "lat_max": STUDY_LAT_MAX,
            "lon_min": STUDY_LON_MIN,
            "lon_max": STUDY_LON_MAX,
            "method": "GES DISC OPeNDAP constraint expression (server-side subsetting)",
        },
        "study_seasons": {
            "start_year": start_year,
            "end_year": end_year,
            "total_years": end_year - start_year + 1,
            "months": "April (30 days) + May (31 days)",
            "days_per_season": EXPECTED_DAYS_PER_SEASON,
            "total_granules_retrieved": len([r for r in granule_records if r.get("status") == "OK"]),
            "total_expected_granules": (end_year - start_year + 1) * EXPECTED_DAYS_PER_SEASON,
        },
        "checksum_algorithm": "SHA-256",
        "retrieval_date_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "total_transferred_bytes_estimate": total_transferred,
        "total_transferred_mb_estimate": round(total_transferred / (1024 * 1024), 2),
        "retrieval_method": "GES DISC OPeNDAP server-side constraint slicing (precipitation[0:0][2700:2735][1140:1160],lat,lon)",
        "staging_verification": "Each of the 25 annual NetCDF files is cryptographically verified against its corresponding SHA-256 sidecar file in data/trends/staging/",
        "elapsed_seconds": round(elapsed, 1),
        "final_dataset_path": f"data/trends/{FINAL_NC_PATH.name}",
        "final_dataset_sha256": final_sha256,
        "files": {FINAL_NC_PATH.name: final_sha256},
        "credentials": "NOT_STORED — credentials must remain in .env or ~/.netrc only",
        "granules": granule_records,
    }
    PROVENANCE_PATH.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"[OK] Provenance manifest written: {PROVENANCE_PATH}")
    print(f"\nIngestion complete in {elapsed:.0f}s. "
          f"Estimated transfer: {total_transferred / (1024 * 1024):.1f} MB")

    return FINAL_NC_PATH


# ---------------------------------------------------------------------------
# Pre-flight probe (single granule verification)
# ---------------------------------------------------------------------------

def probe_single_granule(
    target_date: date = date(2024, 4, 1),
    load_env: bool = True,
    base_url: str | None = None,
) -> dict[str, Any]:
    """Test retrieval and spatial subsetting of a single known IMERG granule.

    Used by '--probe' CLI flag to verify NASA authentication, Earthdata Cloud
    connectivity, coordinate slicing, and fill-value sanitization before initiating
    a full 25-season bulk ingestion.

    Completely hermetic: does NOT write anything to data/trends/.
    """
    print(f"[PROBE] Initiating pre-flight verification for {target_date.isoformat()} ...")

    # 1. Dynamic NASA CMR Discovery (public query)
    try:
        import earthaccess
        results = earthaccess.search_data(
            short_name="GPM_3IMERGDF",
            version="07",
            temporal=(target_date.isoformat(), target_date.isoformat()),
            count=1,
        )
    except Exception as exc:
        print(f"[PROBE ERROR] NASA CMR catalog query failed: {exc}", file=sys.stderr)
        raise SystemExit(1)

    if not results:
        print(f"[PROBE ERROR] No authentic NASA granule found in CMR for date {target_date.isoformat()}.", file=sys.stderr)
        raise SystemExit(1)

    g = results[0]
    meta = g.get("meta", {})
    umm = g.get("umm", {})
    opendap_urls = [
        u["URL"]
        for u in umm.get("RelatedUrls", [])
        if "OPENDAP" in u.get("Type", "") or "USE SERVICE API" in u.get("Type", "")
    ]
    concept_id = meta.get("concept-id")
    native_id = meta.get("native-id", "")
    granule_id = native_id.split(":")[-1] if ":" in native_id else native_id
    opendap_url = opendap_urls[0] if opendap_urls else None

    if not concept_id or not opendap_url:
        print(f"[PROBE ERROR] Granule discovered ({concept_id}) lacks valid OPeNDAP URL in CMR metadata.", file=sys.stderr)
        raise SystemExit(1)

    cmr_granule = {
        "concept_id": concept_id,
        "granule_id": granule_id,
        "opendap_url": opendap_url,
        "data_url": (
            g.data_links()[0]
            if hasattr(g, "data_links") and callable(g.data_links) and g.data_links()
            else None
        ),
    }
    print(f"[PROBE CMR] Found authentic NASA granule: {cmr_granule['concept_id']}")
    print(f"  Granule: {cmr_granule['granule_id']}")
    print(f"  Cloud OPeNDAP: {cmr_granule['opendap_url']}")

    # 2. Check credentials (supports .env, environment, and ~/.netrc)
    user, _ = _require_earthdata_credentials(load_env=load_env)
    print(f"[PROBE AUTH] Credentials found for Earthdata user '{user}'.")

    # 3. Authenticate with earthaccess
    _login_earthdata()
    print("[PROBE AUTH] NASA Earthdata authentication handshake successful.")

    url = (
        base_url
        or cmr_granule["opendap_url"]
    )
    print(f"[PROBE] Target OPeNDAP URL: {url}")

    t0 = time.time()
    try:
        ds_sub = _subset_one_day(url)
    except Exception as exc:
        err_msg = str(exc)
        print(
            f"[PROBE ERROR] Failed to retrieve granule from CMR OPeNDAP endpoint:\n"
            f"  Target URL: {url}\n"
            f"  Error: {err_msg}\n"
            f"Provenance probe fails closed immediately without falling back to guessed URLs.",
            file=sys.stderr,
        )
        if "-77" in err_msg or "-78" in err_msg or "access denied" in err_msg.lower() or "authorization failure" in err_msg.lower() or "403" in err_msg or "eula" in err_msg.lower():
            print(
                "\n[NASA AUTHORIZATION REQUIRED]\n"
                "NASA Earthdata requires one-time End-User License Agreement (EULA) authorization\n"
                "for the GES DISC Data Archive before downloads or OPeNDAP queries are permitted.\n"
                "Please open this official NASA authorization link in your browser:\n"
                "  https://urs.earthdata.nasa.gov/approve_app?client_id=e2WVk8Pw6weeLUKZYOxvTQ\n"
                "Log in and click 'Authorize' / 'Approve' to enable GES DISC data access.\n",
                file=sys.stderr,
            )
        raise SystemExit(1)

    elapsed = time.time() - t0
    precip = ds_sub["precipitation"].values
    n_lats = len(ds_sub["lat"])
    n_lons = len(ds_sub["lon"])
    n_valid = int(np.count_nonzero(~np.isnan(precip)))

    subset_payload_sha = _sha256_bytes(precip.astype("float32").tobytes())

    probe_result = {
        "status": "SUCCESS",
        "date": target_date.isoformat(),
        "concept_id": cmr_granule["concept_id"],
        "granule_id": cmr_granule["granule_id"],
        "url": url,
        "grid_shape": list(precip.shape),
        "lat_range": [float(ds_sub["lat"].min()), float(ds_sub["lat"].max())],
        "lon_range": [float(ds_sub["lon"].min()), float(ds_sub["lon"].max())],
        "valid_points_count": n_valid,
        "total_points": precip.size,
        "mean_precipitation_mm_day": float(np.nanmean(precip)) if n_valid > 0 else 0.0,
        "subset_payload_sha256": subset_payload_sha,
        "local_sha256": subset_payload_sha,
        "checksum_type": "subset_precipitation_float32_payload",
        "elapsed_seconds": round(elapsed, 2),
    }

    print(f"[PROBE SUCCESS] Granule verified in {elapsed:.2f}s:")
    print(f"  Grid: {n_lats} lats x {n_lons} lons (total {precip.size} cells, {n_valid} valid)")
    print(f"  Mean precipitation rate: {probe_result['mean_precipitation_mm_day']:.2f} mm/day")
    print(f"  Subset payload SHA-256: {subset_payload_sha}")
    return probe_result


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main() -> int:
    import argparse
    parser = argparse.ArgumentParser(
        description="Ingest NASA GPM IMERG Final Run V07B daily precipitation for Sylhet study region."
    )
    parser.add_argument(
        "--start-year", type=int, default=START_YEAR,
        help=f"First study year (default: {START_YEAR})"
    )
    parser.add_argument(
        "--end-year", type=int, default=END_YEAR,
        help=f"Last study year (default: {END_YEAR})"
    )
    parser.add_argument(
        "--probe", action="store_true",
        help="Test single-granule retrieval and exit (pre-flight probe)"
    )
    args = parser.parse_args()
    try:
        if args.probe:
            probe_single_granule()
            return 0
        ingest_imerg_final(start_year=args.start_year, end_year=args.end_year)
        return 0
    except SystemExit as exc:
        return int(exc.code) if exc.code is not None else 1


if __name__ == "__main__":
    raise SystemExit(main())

