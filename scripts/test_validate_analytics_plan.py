import importlib.util
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).with_name("validate-analytics-plan.py")
SPEC = importlib.util.spec_from_file_location("validate_analytics_plan", MODULE_PATH)
validator = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(validator)


def plan_with(changes):
    return {
        "resource_changes": [
            {"address": address, "change": {"actions": list(actions)}}
            for address, actions in changes.items()
        ]
    }


class AnalyticsPlanValidatorTests(unittest.TestCase):
    def valid_changes(self):
        return {address: ("create",) for address in validator.ALLOWED_ANALYTICS_CREATES}

    def test_accepts_complete_create_only_analytics_plan(self):
        valid, unexpected, missing = validator.validate(plan_with(self.valid_changes()))
        self.assertTrue(valid)
        self.assertEqual(unexpected, {})
        self.assertEqual(missing, set())

    def test_rejects_existing_table_or_lambda_update(self):
        for address in ("aws_dynamodb_table.responses", "aws_lambda_function.submit_response"):
            with self.subTest(address=address):
                changes = self.valid_changes()
                changes[address] = ("update",)
                valid, unexpected, _ = validator.validate(plan_with(changes))
                self.assertFalse(valid)
                self.assertEqual(unexpected[address], ("update",))

    def test_rejects_unexpected_create(self):
        changes = self.valid_changes()
        changes["aws_s3_bucket.unreviewed"] = ("create",)
        valid, unexpected, _ = validator.validate(plan_with(changes))
        self.assertFalse(valid)
        self.assertIn("aws_s3_bucket.unreviewed", unexpected)

    def test_rejects_replacement_and_delete(self):
        for actions in (("delete", "create"), ("delete",)):
            with self.subTest(actions=actions):
                changes = self.valid_changes()
                changes["aws_glue_job.analytics_transform"] = actions
                valid, unexpected, _ = validator.validate(plan_with(changes))
                self.assertFalse(valid)
                self.assertEqual(unexpected["aws_glue_job.analytics_transform"], actions)

    def test_rejects_partial_plan(self):
        changes = self.valid_changes()
        omitted = changes.pop("aws_iam_role.analytics_snapshot")
        self.assertEqual(omitted, ("create",))
        valid, _, missing = validator.validate(plan_with(changes))
        self.assertFalse(valid)
        self.assertEqual(missing, {"aws_iam_role.analytics_snapshot"})


if __name__ == "__main__":
    unittest.main()
