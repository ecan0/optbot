# Cloud Delivery Pattern

OptBot uses a cloud-first delivery model, but CI must not create infrastructure by accident.

## Promotion Model

1. Pull requests run static checks only.
2. `main` produces a short-lived build artifact, still with no AWS writes.
3. SemVer tags create GitHub Release artifacts.
4. Terraform plan is manual and uses GitHub OIDC instead of static AWS keys.
5. Terraform apply stays local or behind a separate protected approval path.
6. Static site deployment is manual, tag-based, and protected by a GitHub Environment.

## GitHub Environments

Create these environments before enabling cloud workflows:

| Environment | Purpose | Required reviewers |
| --- | --- | --- |
| `dev` | Optional cloud plan testing. | Optional. |
| `production` | Production plan and static deploy. | Yes. |

Environment variables:

| Variable | Environment | Purpose |
| --- | --- | --- |
| `AWS_ROLE_TO_ASSUME` | `dev`, `production` | IAM role ARN for GitHub OIDC. |
| `AWS_REGION` | `dev`, `production` | Usually `us-east-1`. |
| `TF_BACKEND_CONFIG_B64` | `production` | Base64-encoded Terraform backend config. |
| `SITE_BUCKET` | `production` | S3 bucket that receives built assets. |
| `CLOUDFRONT_DISTRIBUTION_ID` | `production` | CloudFront distribution invalidated after upload. |

Use environment variables, not committed files, for account-specific values.

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

The deploy policy is intentionally limited to static asset upload and CloudFront invalidation. Terraform apply usually needs broader permissions and should stay behind a separate approval process.

## Release Tags

Production deploys should use annotated tags like `v0.1.0`. This makes the deployed version easy to identify later and avoids deploying an unreviewed moving branch tip.

See `docs/git-strategy.md` for branch names, tag format, and hotfix rules.

## Cost Controls

No cost starts from normal CI. Costs begin when you create AWS resources, upload assets, store Terraform state, or invalidate CloudFront. Keep all AWS-write workflows manual until the study is ready to collect real responses.
