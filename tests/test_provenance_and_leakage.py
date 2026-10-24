import json
from pathlib import Path

import pandas as pd
import pytest

from pipeline.harvest_flag import compute_harvest_flags
from pipeline.provenance import validate_manifest


ROOT = Path(__file__).resolve().parents[1]


def test_checked_in_fixture_manifest_is_complete_and_hashes_match():
    manifest = validate_manifest(ROOT / "data/fixtures/PROVENANCE.json", ROOT)
    assert {item["provenance"] for item in manifest["datasets"]} == {"SYNTHETIC"}
    assert len(manifest["datasets"]) == 4


def test_operational_flags_reject_future_lookahead_and_are_causal():
    time = pd.date_range("2026-04-01", periods=3, freq="30min", tz="UTC")
    stages = pd.DataFrame({"timestamp": time, "modelled_stage": [8.0, 8.0, 14.0]})
    with pytest.raises(ValueError, match="Future look-ahead"):
        compute_harvest_flags(stages, lead_steps=2)
    result = compute_harvest_flags(stages)
    assert result.loc[0, "harvest_flag"] == "GREEN"
    assert result.loc[2, "harvest_flag"] == "RED"
    assert result.attrs["forecast_status"].startswith("retrospective")


def test_public_metrics_are_explicitly_synthetic_engineering_only():
    metrics = json.loads((ROOT / "ui/public/data/metrics_summary.json").read_text(encoding="utf-8"))
    assert metrics["provenance"] == "SYNTHETIC"
    assert metrics["validation_category"] == "synthetic_engineering_test"
    assert metrics["lead_time_h"] is None


def test_temp_directory_fixture_generation_is_deterministic(tmp_path):
    import subprocess
    import sys
    res = subprocess.run([
        sys.executable, str(ROOT / "scripts/generate_fixtures.py"),
        "--output-dir", str(tmp_path),
        "--seed", "42",
    ], capture_output=True, text=True, check=True)
    manifest = validate_manifest(tmp_path / "PROVENANCE.json", tmp_path)
    assert len(manifest["datasets"]) == 4
    for record in manifest["datasets"]:
        assert record["provenance"] == "SYNTHETIC"
        assert record["random_seed"] == 42


def test_real_mode_fails_closed_without_silent_substitution():
    import subprocess
    import sys
    res = subprocess.run([
        sys.executable, str(ROOT / "scripts/generate_fixtures.py"),
        "--mode", "real",
    ], capture_output=True, text=True)
    assert res.returncode != 0
    assert "fail-closed" in res.stderr.lower() or "fail-closed" in res.stdout.lower()

