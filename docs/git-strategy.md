# Git Strategy

OptBot uses a lightweight trunk-based workflow. It is intended to be easy for a small open-source project to follow while still supporting real production deployments.

This differs from private infrastructure repositories that may use a long-lived `dev` branch and promote to `master`. For OptBot, `main` is the shared integration branch and release tags mark deployable versions.

## Branches

| Branch | Purpose |
| --- | --- |
| `main` | Protected integration branch. All normal changes land here through pull requests. |
| `survey/<short-name>` | Short-lived branches for participant-facing survey flow, content, and UI work. |
| `feature/<short-name>` | Short-lived branches for app capabilities that are not specifically survey-flow work. |
| `fix/<short-name>` | Short-lived branches for bug fixes. |
| `chore/<short-name>` | Short-lived branches for maintenance, tooling, and dependency updates. |
| `docs/<short-name>` | Short-lived branches for documentation-only changes. |

Use project-oriented names even for Codex-assisted work. The `codex/` prefix is optional for disposable agent bookkeeping, but it is not part of the normal branch strategy and is not required for verified commits.

Avoid long-lived release branches unless the project has multiple supported production lines. For the expected project size, release tags are simpler.

## Pull Requests

- Open pull requests against `main`.
- Keep branches small enough to review in one sitting.
- Require CI to pass before merge.
- Prefer squash merge for contributor branches so `main` stays readable.
- Use merge commits only when preserving a multi-commit history is useful.

Recommended branch protection for `main`:

- Require pull request before merging.
- Require status checks to pass.
- Require branch to be up to date before merging.
- Block force pushes.
- Block deletions.
- Require conversation resolution.

## Review Gates

OptBot does not use a long-lived `dev` branch. Review happens at the boundary where risk changes:

- Pull requests review app, documentation, CI, and Terraform source changes before they merge to `main`.
- The manual Terraform workflow creates a speculative plan only. Review the plan output before any apply happens from a trusted local machine or a separately approved apply path.
- Production static deploys use protected GitHub Environments and immutable SemVer tags, not a branch tip.

## Versions And Tags

Use SemVer tags for deployable versions:

```text
vMAJOR.MINOR.PATCH
```

Examples:

- `v0.1.0` for the first usable study preview.
- `v0.2.0` for a new participant-facing flow or schema addition.
- `v0.2.1` for a small fix that does not change expected data shape.
- `v1.0.0` when the study site is stable enough to treat as a real production baseline.

Create annotated tags:

```bash
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0
```

Do not move published tags. If a release is wrong, publish a new patch tag.

## Deployment Rule

Production deploys should use immutable SemVer tags, not a branch tip. The manual static deploy workflow enforces this by requiring `release_ref` to look like `v0.1.0` for the `production` environment.

The intended flow is:

1. Merge PR to `main`.
2. Confirm CI passes.
3. Create an annotated tag from the commit on `main`.
4. Push the tag.
5. Let the release workflow create the GitHub Release artifact.
6. Manually deploy that tag through the protected production environment when ready.

## Hotfixes

For a small project, hotfixes still go through `main`:

```bash
git switch main
git pull --ff-only origin main
git switch -c fix/<short-name>
```

After review and merge, tag a patch release such as `v0.2.2`.

Only create a temporary `release/<version>` branch if production needs an urgent fix while `main` has unreleased changes that cannot ship.

## Survey Rebuild Branches

Use `survey/<short-name>` for the React rebuild and related participant-facing work. Good examples:

- `survey/rebuild-flow`
- `survey/consent-copy`
- `survey/choice-layout`
- `survey/turnstile`

Keep backend or infrastructure-only work separate unless the change must land atomically with the survey UI.

## Pre-Release Tags

Use pre-release tags only when helpful:

```text
v0.3.0-rc.1
```

Release candidate tags are for review builds, not production deploys, unless the production workflow is intentionally changed to allow them.
