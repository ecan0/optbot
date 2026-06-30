#!/usr/bin/env python3
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXCLUDED_DIRS = {
    '.git',
    '.terraform',
    'coverage',
    'dist',
    'node_modules',
}
EXCLUDED_FILES = {
    'README.md',
    'docs/public-repo-boundary.md',
    'scripts/check-public-boundary.py',
}
PATTERNS = {
    'private IPv4 address': re.compile(
        r'\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\b'
    ),
    'placeholder private domain marker': re.compile(r'private-domain|internal-host|tunnel-token|private-pki', re.IGNORECASE),
}
TEXT_SUFFIXES = {
    '.css',
    '.hcl',
    '.html',
    '.js',
    '.json',
    '.md',
    '.py',
    '.sh',
    '.tf',
    '.toml',
    '.ts',
    '.tsx',
    '.txt',
    '.yml',
    '.yaml',
}


def is_excluded(path: Path) -> bool:
    relative = path.relative_to(ROOT).as_posix()
    if relative in EXCLUDED_FILES:
        return True
    return any(part in EXCLUDED_DIRS for part in path.parts)


def iter_files() -> list[Path]:
    return [
        path
        for path in ROOT.rglob('*')
        if path.is_file() and path.suffix in TEXT_SUFFIXES and not is_excluded(path)
    ]


def main() -> int:
    findings: list[str] = []
    for path in iter_files():
        text = path.read_text(encoding='utf-8', errors='ignore')
        for label, pattern in PATTERNS.items():
            for match in pattern.finditer(text):
                line = text.count('\n', 0, match.start()) + 1
                findings.append(f'{path.relative_to(ROOT)}:{line}: {label}')

    if findings:
        print('Public boundary check failed:')
        for finding in findings:
            print(f'  {finding}')
        return 1

    print('Public boundary check passed.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
