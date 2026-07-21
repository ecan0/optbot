#!/usr/bin/env python3
"""Print actionable Terraform errors without infrastructure identifiers."""

from __future__ import annotations

import re
import sys
from pathlib import Path


def sanitize(message: str) -> str:
    message = re.sub(r"arn:[^\s,]+", "[redacted-arn]", message)
    message = re.sub(r"\b\d{12}\b", "[redacted-account]", message)
    message = re.sub(r"https?://\S+", "[redacted-url]", message)
    return message


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: sanitize-terraform-errors.py <terraform.log>", file=sys.stderr)
        return 2
    found = False
    for line in Path(sys.argv[1]).read_text(encoding="utf-8", errors="replace").splitlines():
        if line.startswith("Error: "):
            print(sanitize(line))
            found = True
    if not found:
        print("Terraform apply failed without a structured error message.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
