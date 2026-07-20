#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path

EXPECTED_TURNSTILE_CHANGES = {
    "aws_iam_policy.submit_response": ("update",),
    "aws_lambda_function.submit_response": ("update",),
}


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: validate-turnstile-plan.py <plan.json> <enforce-turnstile>")
        return 2

    plan_path = Path(sys.argv[1])
    enforce_turnstile = sys.argv[2].lower() == "true"
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    changed = {
        change["address"]: tuple(change["change"]["actions"])
        for change in plan.get("resource_changes", [])
        if change["change"]["actions"] not in (["no-op"], ["read"])
    }

    print("Sanitized Terraform resource actions:")
    if not changed:
        print("  no changes")
    for address, actions in sorted(changed.items()):
        print(f"  {address}: {','.join(actions)}")

    if enforce_turnstile and changed != EXPECTED_TURNSTILE_CHANGES:
        print("Turnstile plan rejected: expected only in-place Lambda configuration/code and IAM policy updates.")
        return 1

    if enforce_turnstile:
        print("Turnstile plan contains only the two intended in-place resource updates.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
