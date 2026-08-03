#!/usr/bin/env python3
"""Render snapshot-scoped Athena SQL without contacting AWS or reading response data."""
from __future__ import annotations

import argparse
import json
import re
from datetime import datetime
from pathlib import Path

SNAPSHOT_ID_PATTERN = re.compile(r"^\d{8}T\d{6}Z$")
SHA_PATTERN = re.compile(r"^[0-9a-f]{40}$")
IDENTIFIER_PATTERN = re.compile(r"^[a-z][a-z0-9_]{0,127}$")
REQUIRED_QUERY_FILES = (
    "00_snapshot_contract.sql",
    "01_quality_and_n.sql",
    "02_assignment_and_order_balance.sql",
    "03_rating_distributions.sql",
    "04_paired_deltas.sql",
    "05_categorical_outcomes.sql",
)


def load_manifest(path: Path) -> dict[str, object]:
    manifest = json.loads(path.read_text(encoding="utf-8"))
    required = {
        "snapshot_id",
        "extracted_at_utc",
        "glue_run_id",
        "quantitative_row_count",
        "restricted_row_count",
        "quality_counts",
        "analysis_schema_version",
        "source_git_sha",
        "release_sha",
        "query_versions",
        "source_binding",
    }
    missing = required - manifest.keys()
    if missing:
        raise ValueError(f"manifest missing fields: {', '.join(sorted(missing))}")
    if not SNAPSHOT_ID_PATTERN.fullmatch(str(manifest["snapshot_id"])):
        raise ValueError("snapshot_id must use YYYYMMDDTHHMMSSZ")
    try:
        extracted_at = datetime.fromisoformat(str(manifest["extracted_at_utc"]).replace("Z", "+00:00"))
    except ValueError as error:
        raise ValueError("extracted_at_utc must be ISO-8601") from error
    if extracted_at.tzinfo is None:
        raise ValueError("extracted_at_utc must include a timezone")
    if not SHA_PATTERN.fullmatch(str(manifest["source_git_sha"])):
        raise ValueError("source_git_sha must be a 40-character lowercase commit SHA")
    release_sha = manifest["release_sha"]
    if release_sha is not None and not SHA_PATTERN.fullmatch(str(release_sha)):
        raise ValueError("release_sha must be null or a 40-character lowercase commit SHA")
    for key in ("quantitative_row_count", "restricted_row_count"):
        value = manifest[key]
        if isinstance(value, bool) or not isinstance(value, int) or value < 0:
            raise ValueError(f"{key} must be a non-negative integer")
    quality_counts = manifest["quality_counts"]
    expected_quality_statuses = {"valid", "excluded_expired", "invalid"}
    if not isinstance(quality_counts, dict) or set(quality_counts) != expected_quality_statuses:
        raise ValueError("quality_counts must list valid, excluded_expired, and invalid")
    if any(isinstance(value, bool) or not isinstance(value, int) or value < 0 for value in quality_counts.values()):
        raise ValueError("quality_counts values must be non-negative integers")
    if manifest["analysis_schema_version"] != "optbot-analysis-v1":
        raise ValueError("unsupported analysis schema version")
    binding = manifest["source_binding"]
    if not isinstance(binding, dict) or binding.get("immutable_location_verified") is not True:
        raise ValueError("refusing moving-table analysis: verify an immutable snapshot binding first")
    current_tables = {
        "quantitative_table": "responses_quantitative",
        "quality_table": "response_quality",
    }
    for key in ("quantitative_table", "quality_table"):
        table_name = str(binding.get(key, ""))
        if not IDENTIFIER_PATTERN.fullmatch(table_name):
            raise ValueError(f"source_binding.{key} must be a safe Athena identifier")
        if table_name == current_tables[key]:
            raise ValueError(f"source_binding.{key} must not use the moving current table")
    versions = manifest["query_versions"]
    if not isinstance(versions, dict) or set(versions) != set(REQUIRED_QUERY_FILES):
        raise ValueError("query_versions must list exactly the staged queries")
    return manifest


def render(manifest: dict[str, object], query_dir: Path, output_dir: Path) -> None:
    binding = manifest["source_binding"]
    assert isinstance(binding, dict)
    substitutions = {
        "{{snapshot_id}}": str(manifest["snapshot_id"]),
        "{{quantitative_table}}": str(binding["quantitative_table"]),
        "{{quality_table}}": str(binding["quality_table"]),
    }
    output_dir.mkdir(parents=True, exist_ok=True)
    for name in REQUIRED_QUERY_FILES:
        query = (query_dir / name).read_text(encoding="utf-8")
        for token, value in substitutions.items():
            query = query.replace(token, value)
        if "{{" in query or "}}" in query:
            raise ValueError(f"unresolved template token in {name}")
        (output_dir / name).write_text(query, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()
    manifest = load_manifest(args.manifest)
    render(manifest, Path(__file__).with_name("queries"), args.output_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
