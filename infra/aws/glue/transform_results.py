#!/usr/bin/env python3
from __future__ import annotations

import sys
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

ANALYSIS_SCHEMA_VERSION = "optbot-analysis-v1"
EXPECTED_TOP_LEVEL_KEYS = {
    "response_id", "survey_id", "variant_id", "submitted_at", "consent_version",
    "answers", "metadata", "expires_at",
}
EXPECTED_ANSWER_KEYS = {
    "participation_consent", "age_range", "ai_usage_frequency",
    "visual_notice_review", "text_notice_review",
    "visual_willingness", "visual_trust", "visual_completeness", "visual_ease_of_use",
    "text_willingness", "text_trust", "text_completeness", "text_ease_of_use",
    "presentation_preference", "notice_descriptions", "decision_influence",
}
REQUIRED_METADATA_KEYS = {
    "survey_flow_version", "study_design", "primary_outcome", "started_at", "completed_at",
    "notice_presentation_order", "assigned_notice_slot", "shown_notice_variant",
}
ALLOWED_METADATA_KEYS = REQUIRED_METADATA_KEYS | {"user_agent"}
RATING_KEYS = (
    "visual_willingness", "visual_trust", "visual_completeness", "visual_ease_of_use",
    "text_willingness", "text_trust", "text_completeness", "text_ease_of_use",
)
CATEGORIES = {
    "participation_consent": {"consent_yes"},
    "age_range": {"18_24", "25_34", "35_44", "45_54", "55_65", "prefer_not_age"},
    "ai_usage_frequency": {"rarely", "monthly", "weekly", "daily"},
    "visual_notice_review": {"reviewed"},
    "text_notice_review": {"reviewed"},
    "presentation_preference": {"prefer_visual_notice", "prefer_text_notice"},
}


def _parse_utc(value: Any) -> datetime | None:
    if not isinstance(value, str):
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return None
    return parsed.astimezone(timezone.utc)


def _iso(value: datetime) -> str:
    return value.isoformat().replace("+00:00", "Z")


def _integer(value: Any) -> int | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, Decimal) and value.is_finite() and value == value.to_integral_value():
        return int(value)
    return None


def _reason(reasons: list[str], condition: bool, value: str) -> None:
    if condition:
        reasons.append(value)


def normalize_item(
    item: dict[str, Any], snapshot_id: str, extracted_at_utc: str, extraction_epoch: int
) -> dict[str, Any]:
    source = item.get("Item", item) if isinstance(item, dict) else {}
    reasons: list[str] = []
    if not isinstance(source, dict):
        source = {}
        reasons.append("invalid_record")

    answers = source.get("answers")
    metadata = source.get("metadata")
    if not isinstance(answers, dict):
        answers = {}
        reasons.append("invalid_answers")
    if not isinstance(metadata, dict):
        metadata = {}
        reasons.append("invalid_metadata")

    _reason(reasons, set(source) != EXPECTED_TOP_LEVEL_KEYS, "unexpected_top_level_keys")
    _reason(reasons, set(answers) != EXPECTED_ANSWER_KEYS, "unexpected_answer_keys")
    _reason(
        reasons,
        not REQUIRED_METADATA_KEYS.issubset(metadata) or not set(metadata).issubset(ALLOWED_METADATA_KEYS),
        "unexpected_metadata_keys",
    )

    response_id = source.get("response_id")
    survey_id = source.get("survey_id")
    _reason(reasons, not isinstance(response_id, str) or not response_id.strip(), "invalid_response_id")
    _reason(reasons, not isinstance(survey_id, str) or not survey_id.strip(), "invalid_survey_id")

    expected_literals = {
        "variant_id": (source.get("variant_id"), "icon-led-disclosure"),
        "consent_version": (source.get("consent_version"), "ai-training-consent-v1"),
        "survey_flow_version": (metadata.get("survey_flow_version"), "paired-notice-attitudes-v1.0.0"),
        "study_design": (metadata.get("study_design"), "within-participant-paired"),
        "primary_outcome": (metadata.get("primary_outcome"), "willingness_to_share"),
        "assigned_notice_slot": (metadata.get("assigned_notice_slot"), "A"),
    }
    for name, (actual, expected) in expected_literals.items():
        _reason(reasons, actual != expected, f"invalid_{name}")

    order = metadata.get("notice_presentation_order")
    _reason(reasons, order not in {"assigned-first", "reference-first"}, "invalid_notice_presentation_order")
    for name, allowed in CATEGORIES.items():
        _reason(reasons, answers.get(name) not in allowed, f"invalid_{name}")
    rating_values: dict[str, int] = {}
    for name in RATING_KEYS:
        value = _integer(answers.get(name))
        _reason(reasons, value is None or not 1 <= value <= 5, f"invalid_{name}")
        if value is not None:
            rating_values[name] = value
    for name in ("notice_descriptions", "decision_influence"):
        value = answers.get(name)
        _reason(reasons, not isinstance(value, str) or not 1 <= len(value) <= 4000, f"invalid_{name}")

    shown = metadata.get("shown_notice_variant")
    if not isinstance(shown, dict):
        shown = {}
        reasons.append("invalid_shown_notice_variant")
    shown_literals = {
        "notice_variant_id": "icon-led-disclosure",
        "notice_format": "visual_disclosure_ledger",
        "visual_design_variant_id": "disclosure-ledger-v5",
        "assignment_method": "fixed-study-treatment",
    }
    for name, expected in shown_literals.items():
        _reason(reasons, shown.get(name) != expected, f"invalid_{name}")
    notice_label = shown.get("notice_variant_label")
    _reason(reasons, not isinstance(notice_label, str) or not notice_label.strip(), "invalid_notice_variant_label")

    attributes = shown.get("visual_design_attributes")
    if not isinstance(attributes, dict):
        attributes = {}
        reasons.append("invalid_visual_design_attributes")
    expected_attribute_keys = {"colorway", "iconStyle", "density", "sectionEmphasis", "layout"}
    _reason(reasons, set(attributes) != expected_attribute_keys, "unexpected_visual_design_attribute_keys")
    for name in expected_attribute_keys:
        value = attributes.get(name)
        _reason(reasons, not isinstance(value, str) or not value.strip(), f"invalid_visual_{name}")

    started = _parse_utc(metadata.get("started_at"))
    completed = _parse_utc(metadata.get("completed_at"))
    submitted = _parse_utc(source.get("submitted_at"))
    _reason(reasons, started is None, "invalid_started_at")
    _reason(reasons, completed is None, "invalid_completed_at")
    _reason(reasons, submitted is None, "invalid_submitted_at")
    duration = None
    if started and completed:
        duration = int((completed - started).total_seconds())
        _reason(reasons, duration < 0, "negative_completion_duration")
    if completed and submitted:
        _reason(reasons, (completed - submitted).total_seconds() > 86400, "completed_too_late")

    expires_at = _integer(source.get("expires_at"))
    expires_valid = expires_at is not None
    _reason(reasons, not expires_valid, "invalid_expires_at")
    expired = expires_valid and expires_at <= extraction_epoch
    if expired:
        reasons.append("expired_at_snapshot")

    reasons = sorted(set(reasons))
    safe = {
        "analysis_schema_version": ANALYSIS_SCHEMA_VERSION,
        "snapshot_id": snapshot_id,
        "extracted_at_utc": extracted_at_utc,
        "response_id": response_id if isinstance(response_id, str) else None,
        "survey_id": survey_id if isinstance(survey_id, str) else None,
        "submitted_at_utc": _iso(submitted) if submitted else None,
    }
    non_expiry_reasons = [reason for reason in reasons if reason != "expired_at_snapshot"]
    if reasons:
        quality_status = "excluded_expired" if expired and not non_expiry_reasons else "invalid"
        return {
            "quantitative": None,
            "restricted_text": None,
            "quality": {**safe, "quality_status": quality_status, "quality_reasons": reasons},
        }

    quantitative = {
        **safe,
        "quality_status": "valid",
        "variant_id": source["variant_id"],
        "consent_version": source["consent_version"],
        "survey_flow_version": metadata["survey_flow_version"],
        "source_expires_at_utc": _iso(datetime.fromtimestamp(expires_at, timezone.utc)),
        "started_at_utc": _iso(started),
        "completed_at_utc": _iso(completed),
        "completion_duration_seconds": duration,
        "study_design": metadata["study_design"],
        "primary_outcome": metadata["primary_outcome"],
        "notice_presentation_order": order,
        "assigned_notice_slot": metadata["assigned_notice_slot"],
        "notice_variant_id": shown["notice_variant_id"],
        "notice_variant_label": notice_label,
        "notice_format": shown["notice_format"],
        "visual_design_variant_id": shown["visual_design_variant_id"],
        "assignment_method": shown["assignment_method"],
        "visual_colorway": attributes["colorway"],
        "visual_icon_style": attributes["iconStyle"],
        "visual_density": attributes["density"],
        "visual_section_emphasis": attributes["sectionEmphasis"],
        "visual_layout": attributes["layout"],
        "age_range": answers["age_range"],
        "ai_usage_frequency": answers["ai_usage_frequency"],
        "visual_notice_reviewed": True,
        "text_notice_reviewed": True,
        "presentation_preference": answers["presentation_preference"],
    }
    for name in RATING_KEYS:
        quantitative[name] = rating_values[name]
    for outcome in ("willingness", "trust", "completeness", "ease_of_use"):
        quantitative[f"{outcome}_delta_visual_minus_text"] = (
            rating_values[f"visual_{outcome}"] - rating_values[f"text_{outcome}"]
        )

    restricted = {
        "analysis_schema_version": ANALYSIS_SCHEMA_VERSION,
        "snapshot_id": snapshot_id,
        "extracted_at_utc": extracted_at_utc,
        "response_id": response_id,
        "survey_id": survey_id,
        "survey_flow_version": metadata["survey_flow_version"],
        "notice_descriptions": answers["notice_descriptions"],
        "decision_influence": answers["decision_influence"],
    }
    return {"quantitative": quantitative, "restricted_text": restricted, "quality": None}


def main() -> None:
    from awsglue.context import GlueContext
    from awsglue.dynamicframe import DynamicFrame
    from awsglue.job import Job
    from awsglue.utils import getResolvedOptions
    from pyspark.context import SparkContext
    from pyspark.sql.types import (
        ArrayType, BooleanType, IntegerType, LongType, StringType, StructField, StructType,
    )

    args = getResolvedOptions(
        sys.argv,
        ["JOB_NAME", "table_arn", "analytics_bucket", "snapshot_id", "extracted_at_utc", "analysis_schema_version"],
    )
    if args["analysis_schema_version"] != ANALYSIS_SCHEMA_VERSION:
        raise ValueError("Unsupported analysis schema version")
    extracted = _parse_utc(args["extracted_at_utc"])
    if extracted is None:
        raise ValueError("extracted_at_utc must be an ISO-8601 timestamp")

    sc = SparkContext.getOrCreate()
    glue = GlueContext(sc)
    job = Job(glue)
    job.init(args["JOB_NAME"], args)
    bucket = args["analytics_bucket"]
    snapshot_id = args["snapshot_id"]
    source = glue.create_dynamic_frame.from_options(
        connection_type="dynamodb",
        connection_options={
            "dynamodb.export": "ddb",
            "dynamodb.tableArn": args["table_arn"],
            "dynamodb.s3.bucket": bucket,
            "dynamodb.s3.prefix": f"raw/{snapshot_id}/",
            "dynamodb.simplifyDDBJson": True,
        },
    )
    normalized = source.toDF().rdd.map(
        lambda row: normalize_item(row.asDict(recursive=True), snapshot_id, args["extracted_at_utc"], int(extracted.timestamp()))
    ).cache()

    response_ids = normalized.filter(lambda item: item["quantitative"] is not None).map(
        lambda item: item["quantitative"]["response_id"]
    )
    if response_ids.count() != response_ids.distinct().count():
        raise ValueError("Duplicate response_id values found in snapshot")

    string_fields = [
        "analysis_schema_version", "snapshot_id", "extracted_at_utc", "quality_status", "response_id",
        "survey_id", "variant_id", "consent_version", "survey_flow_version", "submitted_at_utc",
        "source_expires_at_utc", "started_at_utc", "completed_at_utc", "study_design", "primary_outcome",
        "notice_presentation_order", "assigned_notice_slot", "notice_variant_id", "notice_variant_label",
        "notice_format", "visual_design_variant_id", "assignment_method", "visual_colorway",
        "visual_icon_style", "visual_density", "visual_section_emphasis", "visual_layout", "age_range",
        "ai_usage_frequency", "presentation_preference",
    ]
    quantitative_schema = StructType(
        [StructField(name, StringType(), False) for name in string_fields]
        + [StructField("completion_duration_seconds", LongType(), False)]
        + [StructField("visual_notice_reviewed", BooleanType(), False), StructField("text_notice_reviewed", BooleanType(), False)]
        + [StructField(name, IntegerType(), False) for name in RATING_KEYS]
        + [StructField(f"{name}_delta_visual_minus_text", IntegerType(), False) for name in ("willingness", "trust", "completeness", "ease_of_use")]
    )
    restricted_schema = StructType([
        StructField(name, StringType(), False) for name in (
            "analysis_schema_version", "snapshot_id", "extracted_at_utc", "response_id", "survey_id",
            "survey_flow_version", "notice_descriptions", "decision_influence",
        )
    ])
    quality_schema = StructType([
        StructField("analysis_schema_version", StringType(), False),
        StructField("snapshot_id", StringType(), False),
        StructField("extracted_at_utc", StringType(), False),
        StructField("response_id", StringType(), True),
        StructField("survey_id", StringType(), True),
        StructField("submitted_at_utc", StringType(), True),
        StructField("quality_status", StringType(), False),
        StructField("quality_reasons", ArrayType(StringType(), False), False),
    ])

    outputs = (
        ("quantitative", quantitative_schema, f"s3://{bucket}/curated/quantitative/{snapshot_id}/"),
        ("restricted_text", restricted_schema, f"s3://{bucket}/curated/restricted-text/{snapshot_id}/"),
        ("quality", quality_schema, f"s3://{bucket}/curated/quality/{snapshot_id}/"),
    )
    for key, schema, path in outputs:
        rows = normalized.filter(lambda item, key=key: item[key] is not None).map(lambda item, key=key: item[key])
        frame = glue.spark_session.createDataFrame(rows, schema)
        glue.write_dynamic_frame.from_options(
            frame=DynamicFrame.fromDF(frame, glue, key),
            connection_type="s3",
            connection_options={"path": path},
            format="parquet",
            format_options={"compression": "snappy"},
        )
    job.commit()


if __name__ == "__main__":
    main()
