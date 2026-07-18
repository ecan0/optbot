# CI And Release

The default CI path is safe for public pull requests and does not create AWS resources.

## Pull Request Checks

CI runs on pushes to `main` and pull requests:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run audit:deps`
- `python scripts/check-public-boundary.py`
- `terraform -chdir=infra/aws fmt -check`
- `terraform -chdir=infra/aws init -backend=false`
- `terraform -chdir=infra/aws validate`

These checks are local/static. They do not deploy the site, upload assets to AWS, create resources, or assume an AWS role.

## Build Artifacts

CI uploads the built `dist/` directory as a short-lived artifact. This matches a cloud delivery pattern where the tested build is the thing that later gets promoted, while still keeping deployment manual.

## Branches And Tags

Use `main` as the protected integration branch. All routine changes should land through pull requests from short-lived `feature/*`, `fix/*`, or `chore/*` branches.

Deployable versions are annotated SemVer tags such as `v0.1.0`. Pushing a matching tag runs the release workflow, rebuilds the app, and creates a GitHub Release with the static artifact attached.

See `docs/git-strategy.md` for the full branching and tagging policy.

## Manual Terraform Plan

`.github/workflows/terraform-plan.yml` is manual and has no apply step. It uses GitHub OIDC when `AWS_ROLE_TO_ASSUME` is configured.

Required repository or environment variables:

| Variable | Purpose |
| --- | --- |
| `AWS_ROLE_TO_ASSUME` | IAM role ARN that GitHub Actions can assume with OIDC. |
| `AWS_REGION` | AWS workload region, currently `us-west-2`. |
| `TF_BACKEND_CONFIG_B64` | Optional base64-encoded `backend.hcl` for remote Terraform state. |

The workflow can run with `terraform init -backend=false` for an account-backed speculative plan, or with remote state when `use_remote_state` is selected and backend config exists.

## Manual Static Deploy

`.github/workflows/deploy-static.yml` is manual and deploys through the selected GitHub Environment. It runs the full app check suite, builds `dist/`, uploads to S3, and creates a CloudFront invalidation.

Dev deploys may use a branch, tag, or SHA in the `release_ref` input. Production deploys must use an immutable SemVer tag. The workflow rejects non-tag production deploys.

Required environment variables:

| Variable | Purpose |
| --- | --- |
| `AWS_ROLE_TO_ASSUME` | IAM role ARN for deploy. |
| `AWS_REGION` | AWS workload region, currently `us-west-2`. |
| `SITE_BUCKET` | S3 bucket for static assets. |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution to invalidate. |
| `VITE_PUBLIC_SITE_URL` | Site URL baked into the frontend. Required for `dev`; production defaults to `https://optbot.study` if unset. |
| `VITE_PUBLIC_API_BASE_URL` | Response API base URL. Required only when collection mode is `live`. |
| `VITE_PUBLIC_COLLECTION_MODE` | Explicit submission gate. Defaults to `preview`; set to `live` only for approved response collection with an API endpoint. |

For `dev`, `VITE_PUBLIC_SITE_URL` must not be `https://optbot.study`. Use a dev CloudFront URL or a subdomain such as `https://dev.optbot.study`. If the dev URL should only be visible to selected people, enforce that at the hosting front door, for example with Cloudflare Access, AWS WAF, or a temporary CloudFront Function gate.

## Release Path

1. Merge app or infrastructure changes after CI passes.
2. Create and push an annotated SemVer tag from `main`.
3. Let the release workflow create the GitHub Release artifact.
4. Run the manual Terraform plan workflow when AWS credentials are ready.
5. Review the plan output.
6. Apply Terraform from a trusted local machine or a separately approved workflow.
7. Run the manual static deploy workflow for the tag after infrastructure exists.
8. Point `optbot.study` at the CloudFront distribution after the certificate and alias are ready.

For survey iteration before public launch, production SemVer tags below `v1.0.0` deploy to `optbot.study` as non-collecting live-site previews. The deploy workflow requires `VITE_PUBLIC_COLLECTION_MODE=preview` for these tags.

The `v1.0.0` tag starts the public survey lifecycle. Production deploys at `v1.0.0` and later require `VITE_PUBLIC_COLLECTION_MODE=live` plus a configured response API. The workflow also injects the checked-out release ref and commit SHA into the frontend build.

## Cost Guardrails

No AWS cost starts from CI alone. Costs begin when Terraform is applied, remote state resources are created, static assets are uploaded, or CloudFront invalidations are requested. Keep `terraform apply` out of public CI until the release process has an explicit approval gate.
