#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path

ALLOWED_CHANGES = {"aws_lambda_function.submit_response": ("update",)}
REQUIRED_CHANGES = {"aws_lambda_function.submit_response"}


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: validate-collection-close-plan.py <plan.json>")
        return 2

    plan = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    changes = {
        change["address"]: change
        for change in plan.get("resource_changes", [])
        if change["change"]["actions"] not in (["no-op"], ["read"])
    }
    actions = {
        address: tuple(change["change"]["actions"])
        for address, change in changes.items()
    }

    print("Sanitized Terraform resource actions:")
    for address, action in sorted(actions.items()):
        print(f"  {address}: {','.join(action)}")

    unexpected = {
        address: action
        for address, action in actions.items()
        if ALLOWED_CHANGES.get(address) != action
    }
    missing = REQUIRED_CHANGES - actions.keys()
    if unexpected or missing:
        print("Collection-close plan rejected: expected only an in-place submission Lambda update.")
        return 1

    variables = changes["aws_lambda_function.submit_response"]["change"]["after"]["environment"][0]["variables"]
    if variables.get("ACCEPT_RESPONSES") != "false":
        print("Collection-close plan rejected: submission Lambda must set ACCEPT_RESPONSES=false.")
        return 1

    print("Collection-close plan contains only the required Lambda closure.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
