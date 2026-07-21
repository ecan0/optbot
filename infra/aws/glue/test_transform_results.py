import copy
import importlib.util
import unittest
from decimal import Decimal
from pathlib import Path

MODULE_PATH = Path(__file__).with_name("transform_results.py")
SPEC = importlib.util.spec_from_file_location("transform_results", MODULE_PATH)
transform = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(transform)


def valid_item():
    return {
        "response_id": "response-1",
        "survey_id": "optbot-study-v1",
        "variant_id": "icon-led-disclosure",
        "submitted_at": "2026-07-20T12:05:00Z",
        "consent_version": "ai-training-consent-v1",
        "expires_at": 1_800_000_000,
        "answers": {
            "participation_consent": "consent_yes",
            "age_range": "25_34",
            "ai_usage_frequency": "daily",
            "visual_notice_review": "reviewed",
            "text_notice_review": "reviewed",
            "visual_willingness": 5,
            "visual_trust": 4,
            "visual_completeness": 3,
            "visual_ease_of_use": 5,
            "text_willingness": 2,
            "text_trust": 3,
            "text_completeness": 4,
            "text_ease_of_use": 1,
            "presentation_preference": "prefer_visual_notice",
            "notice_descriptions": "Notice A was clearer than Notice B overall.",
            "decision_influence": "Clarity and control most influenced my decision.",
        },
        "metadata": {
            "survey_flow_version": "paired-notice-attitudes-v1.0.0",
            "study_design": "within-participant-paired",
            "primary_outcome": "willingness_to_share",
            "started_at": "2026-07-20T12:00:00Z",
            "completed_at": "2026-07-20T12:04:00Z",
            "user_agent": "identifying browser value",
            "notice_presentation_order": "assigned-first",
            "assigned_notice_slot": "A",
            "shown_notice_variant": {
                "notice_variant_id": "icon-led-disclosure",
                "notice_variant_label": "Icon-led disclosure",
                "notice_format": "visual_disclosure_ledger",
                "visual_design_variant_id": "disclosure-ledger-v5",
                "assignment_method": "fixed-study-treatment",
                "visual_design_attributes": {
                    "colorway": "charcoal, ivory, and periwinkle",
                    "iconStyle": "large monoline section symbols",
                    "density": "spacious",
                    "sectionEmphasis": "four equal disclosure sections",
                    "layout": "vertical icon-led disclosure",
                },
            },
        },
    }


class NormalizeItemTests(unittest.TestCase):
    def normalize(self, item=None, epoch=1_700_000_000):
        source = valid_item() if item is None else item
        return transform.normalize_item(source, "20260720T120000Z", "2026-07-20T12:06:00Z", epoch)

    def test_splits_valid_record_and_calculates_paired_deltas(self):
        result = self.normalize()
        quantitative = result["quantitative"]
        restricted = result["restricted_text"]
        self.assertIsNone(result["quality"])
        self.assertEqual(quantitative["quality_status"], "valid")
        self.assertEqual(quantitative["willingness_delta_visual_minus_text"], 3)
        self.assertEqual(quantitative["trust_delta_visual_minus_text"], 1)
        self.assertEqual(quantitative["completeness_delta_visual_minus_text"], -1)
        self.assertEqual(quantitative["ease_of_use_delta_visual_minus_text"], 4)
        self.assertEqual(quantitative["completion_duration_seconds"], 240)
        self.assertNotIn("user_agent", quantitative)
        self.assertNotIn("notice_descriptions", quantitative)
        self.assertEqual(restricted["notice_descriptions"], valid_item()["answers"]["notice_descriptions"])

    def test_accepts_optional_user_agent_omission_but_rejects_unknown_metadata(self):
        item = valid_item()
        del item["metadata"]["user_agent"]
        self.assertIsNotNone(self.normalize(item)["quantitative"])
        item["metadata"]["fingerprint"] = "private"
        result = self.normalize(item)
        self.assertEqual(result["quality"]["quality_status"], "invalid")
        self.assertIn("unexpected_metadata_keys", result["quality"]["quality_reasons"])

    def test_rejects_rating_types_and_boundaries(self):
        for value in (0, 6, 3.5, "4", True):
            with self.subTest(value=value):
                item = valid_item()
                item["answers"]["visual_willingness"] = value
                quality = self.normalize(item)["quality"]
                self.assertIn("invalid_visual_willingness", quality["quality_reasons"])

    def test_accepts_integral_decimal_values_from_glue(self):
        item = valid_item()
        item["expires_at"] = Decimal("1800000000")
        for name in transform.RATING_KEYS:
            item["answers"][name] = Decimal(str(item["answers"][name]))
        quantitative = self.normalize(item)["quantitative"]
        self.assertIsNotNone(quantitative)
        self.assertEqual(quantitative["visual_willingness"], 5)
        self.assertIsInstance(quantitative["visual_willingness"], int)

    def test_accepts_all_categorical_boundaries(self):
        for age in ("18_24", "25_34", "35_44", "45_54", "55_65", "prefer_not_age"):
            item = valid_item()
            item["answers"]["age_range"] = age
            self.assertIsNotNone(self.normalize(item)["quantitative"])
        for frequency in ("rarely", "monthly", "weekly", "daily"):
            item = valid_item()
            item["answers"]["ai_usage_frequency"] = frequency
            self.assertIsNotNone(self.normalize(item)["quantitative"])

    def test_rejects_unexpected_answer_key_without_copying_sensitive_value(self):
        item = valid_item()
        item["answers"]["email"] = "participant@example.test"
        result = self.normalize(item)
        self.assertEqual(result["quality"]["quality_status"], "invalid")
        self.assertNotIn("participant@example.test", repr(result["quality"]))

    def test_rejects_missing_fields_and_unknown_versions(self):
        item = valid_item()
        del item["answers"]["age_range"]
        item["metadata"]["survey_flow_version"] = "future-version"
        reasons = self.normalize(item)["quality"]["quality_reasons"]
        self.assertIn("unexpected_answer_keys", reasons)
        self.assertIn("invalid_age_range", reasons)
        self.assertIn("invalid_survey_flow_version", reasons)
        self.assertEqual(reasons, sorted(reasons))

    def test_rejects_timestamp_failures(self):
        cases = (
            ("started_at", "not-a-date", "invalid_started_at"),
            ("completed_at", "2026-07-20T11:00:00Z", "negative_completion_duration"),
            ("completed_at", "2026-07-22T12:05:01Z", "completed_too_late"),
        )
        for key, value, reason in cases:
            with self.subTest(key=key, value=value):
                item = valid_item()
                item["metadata"][key] = value
                self.assertIn(reason, self.normalize(item)["quality"]["quality_reasons"])

    def test_expired_record_is_quality_only(self):
        item = valid_item()
        item["expires_at"] = 1_600_000_000
        result = self.normalize(item)
        self.assertIsNone(result["quantitative"])
        self.assertIsNone(result["restricted_text"])
        self.assertEqual(result["quality"]["quality_status"], "excluded_expired")
        self.assertEqual(result["quality"]["quality_reasons"], ["expired_at_snapshot"])

    def test_malformed_expired_record_is_invalid(self):
        item = valid_item()
        item["expires_at"] = 1_600_000_000
        item["variant_id"] = "unknown"
        quality = self.normalize(item)["quality"]
        self.assertEqual(quality["quality_status"], "invalid")
        self.assertNotIn("notice_descriptions", quality)

    def test_item_wrapper_and_empty_record(self):
        self.assertIsNotNone(self.normalize({"Item": valid_item()})["quantitative"])
        quality = self.normalize({})["quality"]
        self.assertEqual(quality["quality_status"], "invalid")
        self.assertIsNone(quality["response_id"])


if __name__ == "__main__":
    unittest.main()
