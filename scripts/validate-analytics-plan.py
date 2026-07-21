#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path

ALLOWED_ANALYTICS_CREATES = {
    "aws_s3_bucket.analytics",
    "aws_s3_bucket_ownership_controls.analytics",
    "aws_s3_bucket_public_access_block.analytics",
    "aws_s3_bucket_server_side_encryption_configuration.analytics",
    "aws_s3_bucket_lifecycle_configuration.analytics",
    "aws_s3_bucket_policy.analytics",
    "aws_glue_catalog_database.analytics",
    "aws_glue_catalog_table.responses_quantitative",
    "aws_glue_catalog_table.responses_restricted_text",
    "aws_glue_catalog_table.response_quality",
    "aws_athena_workgroup.quantitative",
    "aws_athena_workgroup.restricted",
    "aws_athena_named_query.current_quantitative",
    "aws_iam_role.analytics_transform",
    "aws_iam_role_policy.analytics_transform",
    "aws_s3_object.analytics_transform_script",
    "aws_glue_job.analytics_transform",
    "aws_iam_role.analytics_snapshot",
    "aws_iam_role_policy.analytics_snapshot",
    "aws_iam_policy.analytics_quantitative",
    "aws_iam_policy.analytics_restricted",
}


def changed_resources(plan: dict) -> dict[str, tuple[str, ...]]:
    return {
        change["address"]: tuple(change["change"]["actions"])
        for change in plan.get("resource_changes", [])
        if change["change"]["actions"] not in (["no-op"], ["read"])
    }


def validate(plan: dict) -> tuple[bool, dict[str, tuple[str, ...]], set[str]]:
    changed = changed_resources(plan)
    unexpected = {
        address: actions
        for address, actions in changed.items()
        if address not in ALLOWED_ANALYTICS_CREATES or actions != ("create",)
    }
    missing = ALLOWED_ANALYTICS_CREATES - changed.keys()
    return not unexpected and not missing, unexpected, missing


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: validate-analytics-plan.py <plan.json>")
        return 2

    plan = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    valid, unexpected, missing = validate(plan)
    print("Sanitized Terraform resource actions:")
    for address, actions in sorted(changed_resources(plan).items()):
        print(f"  {address}: {','.join(actions)}")

    if not valid:
        if unexpected:
            print("Unexpected or non-create actions:")
            for address, actions in sorted(unexpected.items()):
                print(f"  {address}: {','.join(actions)}")
        if missing:
            print("Missing analytics creates:")
            for address in sorted(missing):
                print(f"  {address}")
        print("Analytics plan rejected: production resources must remain unchanged.")
        return 1

    print("Analytics plan contains only the complete allowlisted create set.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
