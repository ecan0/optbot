# Cloud Delivery Pattern

OptBot uses a cloud-first delivery model, but CI must not create infrastructure by accident.

## Promotion Model

1. Pull requests run static checks only.
2. `main` produces a short-lived build artifact, still with no AWS writes.
3. Dev static deploys can be run manually from a branch or other review ref.
4. SemVer tags create GitHub Release artifacts.
5. Terraform plan is manual and uses GitHub OIDC instead of static AWS keys.
6. Terraform apply stays local or behind a separate protected approval path.
7. Production static deployment is manual, tag-based, and protected by a GitHub Environment.

## GitHub Environments

Create these environments before enabling cloud workflows:

| Environment | Purpose | Required reviewers |
| --- | --- | --- |
| `dev` | Optional cloud plan testing and branch-based survey preview. | Optional. |
| `production` | Production plan and static deploy. | Yes. |

GitHub Environment configuration:

| Variable | Environment | Purpose |
| --- | --- | --- |
| `AWS_ROLE_TO_ASSUME` | `dev`, `production` | IAM role ARN for GitHub OIDC. |
| `AWS_REGION` | `dev`, `production` | Regional AWS workload region, currently `us-west-2`. |
| `TF_BACKEND_CONFIG_B64` | `production` | Base64-encoded Terraform backend config. |
| `SITE_BUCKET` | `dev`, `production` | S3 bucket that receives built assets. Use separate buckets per environment. |
| `CLOUDFRONT_DISTRIBUTION_ID` | `dev`, `production` | CloudFront distribution invalidated after upload. Use separate distributions per environment. |
| `VITE_PUBLIC_SITE_URL` | `dev`, `production` | Public URL baked into the frontend build. Dev must use a non-production URL. |
| `VITE_PUBLIC_API_BASE_URL` | `dev`, `production` | Optional API base URL. Leave empty for preview-only frontend testing. |
| `VITE_PUBLIC_COLLECTION_MODE` | `dev`, `production` | `preview` never submits; `live` is reserved for approved v1-or-later collection. |
| `VITE_PUBLIC_TURNSTILE_SITE_KEY` | `dev`, `production` | Public widget key required for live collection. |

Store `AWS_ROLE_TO_ASSUME`, `TF_BACKEND_CONFIG_B64`, `TF_VAR_ACM_CERTIFICATE_ARN`, `SITE_BUCKET`, and `CLOUDFRONT_DISTRIBUTION_ID` as Environment secrets so public Actions logs mask account-specific infrastructure. Store `AWS_REGION` and all `VITE_PUBLIC_*` values as Environment variables. Do not commit either class of value to files.

## Dev Preview Isolation

Keep survey preview changes away from the live root domain until cutover:

- Use `dev` for manual branch deployments from survey work branches such as `survey/rebuild-flow`.
- Set `VITE_PUBLIC_SITE_URL` on the `dev` GitHub Environment to a non-production origin such as a dev CloudFront URL or a subdomain like `https://dev.optbot.study`.
- Do not point dev traffic at `https://optbot.study`; the static deploy workflow rejects that configuration for `dev`.
- Use separate dev and production S3 buckets and CloudFront distributions so uploads and invalidations cannot affect the live site.
- If the dev subdomain should be private, put access control at the edge or DNS/front-door layer. Reasonable options include Cloudflare Access, an IP allow list through AWS WAF, or a temporary CloudFront Function gate. Keep any credentials or allow lists outside this public repository.

## Terraform State

The repository includes `infra/aws/backend.tf`, but CI validation runs `terraform init -backend=false` so a fresh clone can validate without cloud credentials.

When you are ready for real plans, create an S3 backend and provide a private backend config. The example file is `infra/aws/backend.hcl.example`.

To store backend config in GitHub Actions:

```bash
base64 -w0 infra/aws/backend.hcl
```

Save the result as `TF_BACKEND_CONFIG_B64` on the protected GitHub Environment.

## IAM

Use GitHub OIDC. Do not create long-lived AWS access keys for Actions.

Example policies live under `infra/aws`:

- `github-oidc-trust-policy.example.json`
- `plan-policy.example.json`
- `deploy-static-policy.example.json`

The deploy policy is intentionally limited to static asset upload and CloudFront invalidation. Terraform apply needs broader permissions. The repository's production Turnstile apply workflow is manual, uses the protected `production` Environment, and rejects any plan beyond the expected in-place Lambda and IAM updates.

## Release Tags

Production deploys should use annotated tags like `v0.1.0`. This makes the deployed version easy to identify later and avoids deploying an unreviewed moving branch tip. Dev deploys may use branch names or other refs for review.

See `docs/git-strategy.md` for branch names, tag format, and hotfix rules.

## Cost Controls

No cost starts from normal CI. Costs begin when you create AWS resources, upload assets, store Terraform state, or invalidate CloudFront. Keep all AWS-write workflows manual until the study is ready to collect real responses.
