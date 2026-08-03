import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).with_name("render_queries.py")
SPEC = importlib.util.spec_from_file_location("render_queries", MODULE_PATH)
renderer = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(renderer)


class RenderQueriesTests(unittest.TestCase):
    def manifest(self):
        return {
            "snapshot_id": "20260802T120000Z",
            "extracted_at_utc": "2026-08-02T12:00:00Z",
            "glue_run_id": "private",
            "quantitative_row_count": 1,
            "restricted_row_count": 1,
            "quality_counts": {"valid": 1, "excluded_expired": 0, "invalid": 0},
            "analysis_schema_version": "optbot-analysis-v1",
            "source_git_sha": "a" * 40,
            "release_sha": None,
            "query_versions": {name: "1" for name in renderer.REQUIRED_QUERY_FILES},
            "source_binding": {
                "quantitative_table": "final_snapshot_quantitative",
                "quality_table": "final_snapshot_quality",
                "immutable_location_verified": True,
            },
        }

    def test_renders_all_snapshot_scoped_queries(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            manifest_path = root / "manifest.json"
            manifest_path.write_text(json.dumps(self.manifest()), encoding="utf-8")
            manifest = renderer.load_manifest(manifest_path)
            output_dir = root / "queries"
            renderer.render(manifest, MODULE_PATH.with_name("queries"), output_dir)
            self.assertEqual({path.name for path in output_dir.iterdir()}, set(renderer.REQUIRED_QUERY_FILES))
            for path in output_dir.iterdir():
                content = path.read_text(encoding="utf-8")
                self.assertIn("20260802T120000Z", content)
                self.assertNotIn("{{", content)

    def test_rejects_moving_source_tables(self):
        manifest = self.manifest()
        manifest["source_binding"]["immutable_location_verified"] = False
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "manifest.json"
            path.write_text(json.dumps(manifest), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "moving-table"):
                renderer.load_manifest(path)

    def test_rejects_current_table_even_when_marked_immutable(self):
        manifest = self.manifest()
        manifest["source_binding"]["quantitative_table"] = "responses_quantitative"
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "manifest.json"
            path.write_text(json.dumps(manifest), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "moving current table"):
                renderer.load_manifest(path)


if __name__ == "__main__":
    unittest.main()
