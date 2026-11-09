"""
Tests for Module 1 Pipeline Mode Enforcement & Fail-Closed Guardrails.

Verifies:
1. Omitting --mode raises an error and halts execution (no mode => exits without running).
2. --mode real rejects missing files, missing manifest, bad hashes, missing metadata, and synthetic provenance.
3. A real-labelled output CANNOT be created from file existence alone.
4. --mode real strictly refuses to access or fall back to data/fixtures/.
5. --mode demo executes with explicit SYNTHETIC_DEMO labeling across outputs and logs.
"""

import json
import os
import sys
import tempfile
from pathlib import Path
import pytest
import pandas as pd

from pipeline.provenance import sha256_file
from pipeline.run_pipeline import parse_args, main


def test_missing_mode_flag_raises_system_exit():
    """Verify that omitting --mode exits immediately without running."""
    with pytest.raises(SystemExit) as exc_info:
        parse_args([])
    assert exc_info.value.code != 0


def test_invalid_mode_flag_raises_system_exit():
    """Verify that an invalid --mode choice exits immediately."""
    with pytest.raises(SystemExit) as exc_info:
        parse_args(["--mode", "unsupported_mode"])
    assert exc_info.value.code != 0


def test_real_mode_fails_closed_when_data_missing():
    """
    Verify that --mode real fails closed with exit code 1 when required real files are absent.
    """
    with tempfile.TemporaryDirectory() as empty_real_dir, tempfile.TemporaryDirectory() as tmp_out:
        with pytest.raises(SystemExit) as exc_info:
            main(["--mode", "real", "--real-dir", empty_real_dir, "--output-dir", tmp_out])
        assert exc_info.value.code == 1


def test_real_mode_fails_closed_on_file_existence_alone_without_manifest():
    """
    Verify that a present file is NOT proof of provenance.
    If physical files exist but PROVENANCE.json is missing, real mode MUST fail closed.
    """
    with tempfile.TemporaryDirectory() as tmp_real, tempfile.TemporaryDirectory() as tmp_out:
        # Create unverified dummy files
        for fname in ["swot_reaches.nc", "gauge_sw266.csv", "imerg_map.nc"]:
            (Path(tmp_real) / fname).write_text("unverified content", encoding="utf-8")

        with pytest.raises(SystemExit) as exc_info:
            main(["--mode", "real", "--real-dir", tmp_real, "--output-dir", tmp_out])
        assert exc_info.value.code == 1


def test_real_mode_fails_closed_on_checksum_mismatch():
    """
    Verify that if file content does not match declared SHA-256 hash in PROVENANCE.json,
    real mode fails closed immediately.
    """
    with tempfile.TemporaryDirectory() as tmp_real, tempfile.TemporaryDirectory() as tmp_out:
        real_path = Path(tmp_real)
        for fname in ["swot_reaches.nc", "gauge_sw266.csv", "imerg_map.nc"]:
            (real_path / fname).write_text("actual file content on disk", encoding="utf-8")

        # Create manifest with incorrect SHA-256 checksum
        bogus_sha = "0" * 64
        manifest_payload = {
            "schema_version": "1.0",
            "datasets": [
                {
                    "dataset_id": "swot",
                    "provenance": "REAL",
                    "file_path": "swot_reaches.nc",
                    "sha256": bogus_sha,
                    "variables": ["wse"],
                    "units": {"wse": "m"},
                    "temporal_coverage": "2024-05",
                    "processing_history": ["retrieved from PO.DAAC"],
                    "limitations": "none",
                    "source_organization": "NASA / PO.DAAC",
                    "product_version": "SWOT_L2_HR_RiverSP_reach_D",
                    "source_url": "https://podaac.jpl.nasa.gov",
                    "retrieval_timestamp": "2026-11-10T00:00:00Z",
                    "source_identifiers": ["SWOT_granule_1"],
                    "license": "NASA Open Data",
                },
                {
                    "dataset_id": "gauge",
                    "provenance": "REAL",
                    "file_path": "gauge_sw266.csv",
                    "sha256": bogus_sha,
                    "variables": ["water_level_m"],
                    "units": {"water_level_m": "m PWD"},
                    "temporal_coverage": "2024-05",
                    "processing_history": ["BWDB official bulletin"],
                    "limitations": "sparse",
                    "source_organization": "BWDB / FFWC",
                    "product_version": "SW266",
                    "source_url": "http://ffwc.gov.bd",
                    "retrieval_timestamp": "2026-11-10T00:00:00Z",
                    "source_identifiers": ["SW266"],
                    "license": "Open Government Data",
                },
                {
                    "dataset_id": "imerg",
                    "provenance": "REAL",
                    "file_path": "imerg_map.nc",
                    "sha256": bogus_sha,
                    "variables": ["precipitationCal"],
                    "units": {"precipitationCal": "mm/hr"},
                    "temporal_coverage": "2024-05",
                    "processing_history": ["retrieved from GES DISC"],
                    "limitations": "early run",
                    "source_organization": "NASA / GES DISC",
                    "product_version": "GPM_3IMERGHHE_07B",
                    "source_url": "https://disc.gsfc.nasa.gov",
                    "retrieval_timestamp": "2026-11-10T00:00:00Z",
                    "source_identifiers": ["3B-HHR-E"],
                    "license": "NASA Open Data",
                },
            ],
        }
        (real_path / "PROVENANCE.json").write_text(json.dumps(manifest_payload), encoding="utf-8")

        with pytest.raises(SystemExit) as exc_info:
            main(["--mode", "real", "--real-dir", tmp_real, "--output-dir", tmp_out])
        assert exc_info.value.code == 1


def test_real_mode_fails_closed_on_synthetic_provenance():
    """
    Verify that if a manifest declares provenance as 'SYNTHETIC' or 'UNKNOWN',
    real mode strictly rejects it, even if hashes match.
    """
    with tempfile.TemporaryDirectory() as tmp_real, tempfile.TemporaryDirectory() as tmp_out:
        real_path = Path(tmp_real)
        datasets = []
        for fname in ["swot_reaches.nc", "gauge_sw266.csv", "imerg_map.nc"]:
            p = real_path / fname
            p.write_text(f"content of {fname}", encoding="utf-8")
            h = sha256_file(p)
            datasets.append({
                "dataset_id": fname,
                "provenance": "SYNTHETIC",  # Rejected in real mode!
                "file_path": fname,
                "sha256": h,
                "variables": ["v"],
                "units": {"v": "1"},
                "temporal_coverage": "2024-05",
                "processing_history": ["synthetic simulation"],
                "limitations": "not real",
                "generator": "scripts/generate_fixtures.py",
                "generator_version": "1.0",
                "random_seed": 42,
            })

        manifest = {"schema_version": "1.0", "datasets": datasets}
        (real_path / "PROVENANCE.json").write_text(json.dumps(manifest), encoding="utf-8")

        with pytest.raises(SystemExit) as exc_info:
            main(["--mode", "real", "--real-dir", tmp_real, "--output-dir", tmp_out])
        assert exc_info.value.code == 1


def test_real_mode_fails_closed_on_missing_source_metadata():
    """
    Verify that REAL records missing required metadata (e.g. source_organization or license)
    are rejected.
    """
    with tempfile.TemporaryDirectory() as tmp_real, tempfile.TemporaryDirectory() as tmp_out:
        real_path = Path(tmp_real)
        datasets = []
        for fname in ["swot_reaches.nc", "gauge_sw266.csv", "imerg_map.nc"]:
            p = real_path / fname
            p.write_text(f"content of {fname}", encoding="utf-8")
            h = sha256_file(p)
            datasets.append({
                "dataset_id": fname,
                "provenance": "REAL",
                "file_path": fname,
                "sha256": h,
                "variables": ["v"],
                "units": {"v": "1"},
                "temporal_coverage": "2024-05",
                "processing_history": ["downloaded"],
                "limitations": "none",
                # Intentionally missing source_organization, source_url, license!
            })

        manifest = {"schema_version": "1.0", "datasets": datasets}
        (real_path / "PROVENANCE.json").write_text(json.dumps(manifest), encoding="utf-8")

        with pytest.raises(SystemExit) as exc_info:
            main(["--mode", "real", "--real-dir", tmp_real, "--output-dir", tmp_out])
        assert exc_info.value.code == 1


def test_real_mode_rejects_absolute_path_in_manifest():
    """Verify that absolute paths in real manifest are rejected for security and isolation."""
    with tempfile.TemporaryDirectory() as tmp_real, tempfile.TemporaryDirectory() as tmp_out:
        real_path = Path(tmp_real)
        manifest = {
            "schema_version": "1.0",
            "datasets": [{
                "dataset_id": "swot",
                "provenance": "REAL",
                "file_path": "/etc/passwd" if os.name != "nt" else "C:/Windows/notepad.exe",
                "sha256": "0" * 64,
                "variables": ["v"],
                "units": {"v": "1"},
                "temporal_coverage": "2024-05",
                "processing_history": ["bad path"],
                "limitations": "none",
                "source_organization": "NASA",
                "product_version": "1.0",
                "source_url": "https://nasa.gov",
                "retrieval_timestamp": "2026-11-10T00:00:00Z",
                "source_identifiers": ["id1"],
                "license": "NASA",
            }],
        }
        (real_path / "PROVENANCE.json").write_text(json.dumps(manifest), encoding="utf-8")
        with pytest.raises(SystemExit) as exc_info:
            main(["--mode", "real", "--real-dir", tmp_real, "--output-dir", tmp_out])
        assert exc_info.value.code == 1


def test_real_mode_rejects_directory_traversal_in_manifest():
    """Verify that directory traversal (..) in real manifest is rejected."""
    with tempfile.TemporaryDirectory() as tmp_real, tempfile.TemporaryDirectory() as tmp_out:
        real_path = Path(tmp_real)
        manifest = {
            "schema_version": "1.0",
            "datasets": [{
                "dataset_id": "swot",
                "provenance": "REAL",
                "file_path": "../../secret.nc",
                "sha256": "0" * 64,
                "variables": ["v"],
                "units": {"v": "1"},
                "temporal_coverage": "2024-05",
                "processing_history": ["bad traversal"],
                "limitations": "none",
                "source_organization": "NASA",
                "product_version": "1.0",
                "source_url": "https://nasa.gov",
                "retrieval_timestamp": "2026-11-10T00:00:00Z",
                "source_identifiers": ["id1"],
                "license": "NASA",
            }],
        }
        (real_path / "PROVENANCE.json").write_text(json.dumps(manifest), encoding="utf-8")
        with pytest.raises(SystemExit) as exc_info:
            main(["--mode", "real", "--real-dir", tmp_real, "--output-dir", tmp_out])
        assert exc_info.value.code == 1


def test_real_mode_rejects_fixture_path_in_manifest():
    """Verify that real manifest cannot point to fixture files."""
    with tempfile.TemporaryDirectory() as tmp_real, tempfile.TemporaryDirectory() as tmp_out:
        real_path = Path(tmp_real)
        manifest = {
            "schema_version": "1.0",
            "datasets": [{
                "dataset_id": "swot",
                "provenance": "REAL",
                "file_path": "data/fixtures/swot_reaches.nc",
                "sha256": "0" * 64,
                "variables": ["v"],
                "units": {"v": "1"},
                "temporal_coverage": "2024-05",
                "processing_history": ["points to fixtures"],
                "limitations": "none",
                "source_organization": "NASA",
                "product_version": "1.0",
                "source_url": "https://nasa.gov",
                "retrieval_timestamp": "2026-11-10T00:00:00Z",
                "source_identifiers": ["id1"],
                "license": "NASA",
            }],
        }
        (real_path / "PROVENANCE.json").write_text(json.dumps(manifest), encoding="utf-8")
        with pytest.raises(SystemExit) as exc_info:
            main(["--mode", "real", "--real-dir", tmp_real, "--output-dir", tmp_out])
        assert exc_info.value.code == 1


def test_real_mode_never_reads_fixtures(monkeypatch):
    """
    Verify that --mode real NEVER accesses files under data/fixtures/.
    """
    import pipeline.run_pipeline as rp

    accessed_fixtures = []
    original_exists = os.path.exists

    def guarded_exists(path):
        p_str = str(path).replace("\\", "/")
        if "data/fixtures" in p_str:
            accessed_fixtures.append(p_str)
        return original_exists(path)

    monkeypatch.setattr(os.path, "exists", guarded_exists)

    with tempfile.TemporaryDirectory() as tmp_real, tempfile.TemporaryDirectory() as tmp_out:
        with pytest.raises(SystemExit):
            rp.main(["--mode", "real", "--real-dir", tmp_real, "--output-dir", tmp_out])

    assert len(accessed_fixtures) == 0, f"Real mode illegally accessed fixtures: {accessed_fixtures}"


def test_demo_mode_labels_outputs_as_synthetic():
    """
    Verify that --mode demo explicitly labels all outputs as SYNTHETIC_DEMO
    and succeeds without polluting the tracked repository state.
    """
    with tempfile.TemporaryDirectory() as tmp_dir:
        main(["--mode", "demo", "--output-dir", tmp_dir])

        # Verify output files exist
        results_csv = os.path.join(tmp_dir, "event_results.csv")
        cal_json = os.path.join(tmp_dir, "calibration_results.json")
        assert os.path.exists(results_csv)
        assert os.path.exists(cal_json)

        # Verify explicit synthetic labeling in event results
        df = pd.read_csv(results_csv)
        assert "provenance" in df.columns
        assert (df["provenance"] == "SYNTHETIC_DEMO").all()

        # Verify explicit synthetic labeling in calibration JSON
        with open(cal_json, "r", encoding="utf-8") as f:
            cal_data = json.load(f)
        for reach_id, params in cal_data.items():
            assert params.get("provenance") == "SYNTHETIC_DEMO"
