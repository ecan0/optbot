#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path

ALLOWED_TURNSTILE_CHANGES = {
    "aws_iam_policy.submit_response": ("update",),
    "aws_lambda_function.submit_response": ("update",),
}
REQUIRED_TURNSTILE_CHANGES = {"aws_lambda_function.submit_response"}


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

    if enforce_turnstile:
        unexpected = {
            address: actions
            for address, actions in changed.items()
            if ALLOWED_TURNSTILE_CHANGES.get(address) != actions
        }
        missing = REQUIRED_TURNSTILE_CHANGES - changed.keys()
        if unexpected or missing:
            print("Turnstile plan rejected: expected only intended in-place Lambda and optional IAM policy updates.")
            return 1
        print("Turnstile plan contains only intended in-place resource updates.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
