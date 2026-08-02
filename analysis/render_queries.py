#!/usr/bin/env python3
"""Render snapshot-scoped Athena SQL without contacting AWS or reading response data."""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

SNAPSHOT_ID_PATTERN = re.compile(r"^\d{8}T\d{6}Z$")
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
        "query_versions",
        "source_binding",
    }
    missing = required - manifest.keys()
    if missing:
        raise ValueError(f"manifest missing fields: {', '.join(sorted(missing))}")
    if not SNAPSHOT_ID_PATTERN.fullmatch(str(manifest["snapshot_id"])):
        raise ValueError("snapshot_id must use YYYYMMDDTHHMMSSZ")
    if manifest["analysis_schema_version"] != "optbot-analysis-v1":
        raise ValueError("unsupported analysis schema version")
    binding = manifest["source_binding"]
    if not isinstance(binding, dict) or binding.get("immutable_location_verified") is not True:
        raise ValueError("refusing moving-table analysis: verify an immutable snapshot binding first")
    for key in ("quantitative_table", "quality_table"):
        if not IDENTIFIER_PATTERN.fullmatch(str(binding.get(key, ""))):
            raise ValueError(f"source_binding.{key} must be a safe Athena identifier")
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
