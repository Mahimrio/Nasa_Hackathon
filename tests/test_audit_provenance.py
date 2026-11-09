"""Hermetic unit tests for scripts/audit_provenance.py using isolated tmp_path roots."""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from pipeline.provenance import ProvenanceError
from scripts.audit_provenance import ROOT, audit_module2_trends


def test_audit_passes_on_current_repo():
    """Verify that the current checked-in repository passes the Module 2 audit."""
    count = audit_module2_trends(ROOT)
    assert count >= 1  # At minimum ui/public/data/trend_summary.json is audited


def test_audit_allows_template_in_trends(tmp_path):
    """Verify PROVENANCE.json.template and .gitkeep are explicitly allowed."""
    trends = tmp_path / "data" / "trends"
    trends.mkdir(parents=True)
    (trends / "PROVENANCE.json.template").write_text("{}", encoding="utf-8")
    (trends / ".gitkeep").write_text("", encoding="utf-8")

    # Should not raise
    count = audit_module2_trends(tmp_path)
    assert count == 0


def test_audit_fails_on_unregistered_file_in_trends(tmp_path):
    """Verify unlisted data file in data/trends/ causes fail-closed audit rejection."""
    trends = tmp_path / "data" / "trends"
    trends.mkdir(parents=True)
    (trends / "rogue_data.nc").write_bytes(b"unregistered_data_bytes")

    with pytest.raises(ProvenanceError, match="Unverified data file found in data/trends/"):
        audit_module2_trends(tmp_path)


def test_audit_fails_on_falsified_fixture_status(tmp_path):
    """Verify synthetic fixture claiming COMPUTED analysis_status is rejected."""
    ui_data = tmp_path / "ui" / "public" / "data"
    ui_data.mkdir(parents=True)
    falsified = {
        "input_provenance": "SYNTHETIC_DEVELOPMENT_FIXTURE",
        "analysis_status": "COMPUTED",  # FORBIDDEN: synthetic fixture must be DEVELOPMENT_PREVIEW
    }
    (ui_data / "trend_summary.json").write_text(json.dumps(falsified), encoding="utf-8")

    with pytest.raises(ProvenanceError, match="must have analysis_status='DEVELOPMENT_PREVIEW'"):
        audit_module2_trends(tmp_path)


def test_audit_fails_on_checksum_mismatch_in_trends(tmp_path):
    """Verify checksum mismatch in data/trends/ causes fail-closed rejection."""
    trends = tmp_path / "data" / "trends"
    trends.mkdir(parents=True)

    data_file = trends / "imerg_sylhet.nc"
    data_file.write_bytes(b"actual_retrieved_data_bytes")

    manifest = {
        "files": {
            "imerg_sylhet.nc": "wrong_expected_sha256_hash_here",
        }
    }
    (trends / "PROVENANCE.json").write_text(json.dumps(manifest), encoding="utf-8")

    with pytest.raises(ProvenanceError, match="SHA-256 checksum mismatch"):
        audit_module2_trends(tmp_path)

