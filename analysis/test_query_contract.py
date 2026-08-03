import unittest
from pathlib import Path

QUERY_DIR = Path(__file__).with_name("queries")


class QueryContractTests(unittest.TestCase):
    def test_queries_are_snapshot_scoped_and_quantitative_only(self):
        for query_path in QUERY_DIR.glob("*.sql"):
            query = query_path.read_text(encoding="utf-8")
            self.assertIn("{{snapshot_id}}", query, query_path.name)
            self.assertNotIn("responses_restricted_text", query, query_path.name)
            self.assertNotIn("notice_descriptions", query, query_path.name)
            self.assertNotIn("decision_influence", query, query_path.name)

    def test_paired_query_uses_transform_defined_delta_columns(self):
        query = (QUERY_DIR / "04_paired_deltas.sql").read_text(encoding="utf-8")
        expected = {
            "willingness_delta_visual_minus_text",
            "trust_delta_visual_minus_text",
            "completeness_delta_visual_minus_text",
            "ease_of_use_delta_visual_minus_text",
        }
        for column in expected:
            self.assertIn(column, query)

    def test_rating_query_uses_all_eight_curated_rating_columns(self):
        query = (QUERY_DIR / "03_rating_distributions.sql").read_text(encoding="utf-8")
        expected = {
            "visual_willingness", "visual_trust", "visual_completeness", "visual_ease_of_use",
            "text_willingness", "text_trust", "text_completeness", "text_ease_of_use",
        }
        for column in expected:
            self.assertIn(column, query)


if __name__ == "__main__":
    unittest.main()
