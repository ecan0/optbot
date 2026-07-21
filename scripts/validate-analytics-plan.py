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


def is_turnstile_enforcement(change: dict) -> bool:
    details = change.get("change", {})
    if details.get("actions") != ["update"]:
        return False
    before = details.get("before")
    after = details.get("after")
    if not isinstance(before, dict) or not isinstance(after, dict):
        return False

    before_copy = json.loads(json.dumps(before))
    after_copy = json.loads(json.dumps(after))
    try:
        before_variables = before_copy["environment"][0]["variables"]
        after_variables = after_copy["environment"][0]["variables"]
    except (KeyError, IndexError, TypeError):
        return False

    before_copy["environment"][0]["variables"] = {
        key: value
        for key, value in before_variables.items()
        if key not in {"REQUIRE_TURNSTILE", "TURNSTILE_SECRET_PARAMETER"}
    }
    after_copy["environment"][0]["variables"] = {
        key: value
        for key, value in after_variables.items()
        if key not in {"REQUIRE_TURNSTILE", "TURNSTILE_SECRET_PARAMETER"}
    }
    # archive_file ZIP metadata can change computed deployment fields across clean
    # CI checkouts even when submit_response.py is unchanged.
    for key in ("source_code_hash", "last_modified"):
        before_copy[key] = None
        after_copy[key] = None
    return (
        before_copy == after_copy
        and before_variables.get("REQUIRE_TURNSTILE") == "false"
        and after_variables.get("REQUIRE_TURNSTILE") == "true"
        and before_variables.get("TURNSTILE_SECRET_PARAMETER") in ("", None)
        and after_variables.get("TURNSTILE_SECRET_PARAMETER") == "/optbot/turnstile/secret"
    )


def changed_resources(plan: dict) -> dict[str, tuple[str, ...]]:
    return {
        change["address"]: tuple(change["change"]["actions"])
        for change in plan.get("resource_changes", [])
        if change["change"]["actions"] not in (["no-op"], ["read"])
    }


def validate(plan: dict) -> tuple[bool, dict[str, tuple[str, ...]], set[str]]:
    changed = changed_resources(plan)
    resource_changes = {
        change["address"]: change
        for change in plan.get("resource_changes", [])
        if change["change"]["actions"] not in (["no-op"], ["read"])
    }
    unexpected = {}
    for address, actions in changed.items():
        allowed_create = address in ALLOWED_ANALYTICS_CREATES and actions == ("create",)
        allowed_enforcement = (
            address == "aws_lambda_function.submit_response"
            and is_turnstile_enforcement(resource_changes[address])
        )
        if not allowed_create and not allowed_enforcement:
            unexpected[address] = actions
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
                if address == "aws_lambda_function.submit_response":
                    lambda_change = next(
                        change
                        for change in plan.get("resource_changes", [])
                        if change["address"] == address
                    )["change"]
                    before = lambda_change.get("before") or {}
                    after = lambda_change.get("after") or {}
                    changed_fields = sorted(
                        key for key in before.keys() | after.keys() if before.get(key) != after.get(key)
                    )
                    print(f"    changed fields: {','.join(changed_fields)}")
                    for label, value in (("before", before), ("after", after)):
                        variables = ((value.get("environment") or [{}])[0].get("variables") or {})
                        print(
                            f"    {label} Turnstile: "
                            f"required={variables.get('REQUIRE_TURNSTILE')!r}, "
                            f"parameter={variables.get('TURNSTILE_SECRET_PARAMETER')!r}"
                        )
        if missing:
            print("Missing analytics creates:")
            for address in sorted(missing):
                print(f"  {address}")
        print("Analytics plan rejected: production resources must remain unchanged.")
        return 1

    print("Analytics plan contains only the complete create set and optional exact Turnstile enforcement.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
