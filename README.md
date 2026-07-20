# OptBot

OptBot is a study website for collecting short guided survey responses at `optbot.study`.

The app presents participants with a focused multi-step flow, validates response shape in the browser, and can submit completed responses to a small serverless API. The current survey content is intentionally easy to replace as the study design develops.

## App

- React, Vite, and TypeScript
- Guided survey flow in `src/App.tsx`
- Study questions in `src/studyContent.ts`
- Shared response schema in `src/schema.ts`
- Preview mode when no API endpoint is configured

## Run Locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

By default, local runs do not send responses anywhere. Set `VITE_PUBLIC_API_BASE_URL` in `.env.local` to test against a deployed API.

## Build

```bash
npm run build
```

The production build is written to `dist/`.

## Configuration

| Variable | Purpose |
| --- | --- |
| `VITE_PUBLIC_SITE_URL` | Public site URL, normally `https://optbot.study`. |
| `VITE_PUBLIC_API_BASE_URL` | API base URL for response submission. Required for live collection; never contacted in preview mode. |
| `VITE_PUBLIC_COLLECTION_MODE` | Explicit response gate: `preview` never sends responses; `live` requires an API endpoint and Turnstile site key. Defaults to `preview`. |
| `VITE_PUBLIC_SURVEY_ID` | Stable identifier for the current survey version. |
| `VITE_PUBLIC_TURNSTILE_SITE_KEY` | Public Turnstile site key. Required only for live collection. |

Only `VITE_` variables are exposed to the browser. Do not put secrets in frontend environment files.

## Checks

Run the same app checks used by CI:

```bash
npm run check
npm run audit:deps
npm run check:public
terraform -chdir=infra/aws fmt -check
terraform -chdir=infra/aws init -backend=false
terraform -chdir=infra/aws validate
```

CI also includes a manual Terraform plan workflow and a production-only Turnstile apply workflow protected by the `production` Environment. See [docs/ci-and-release.md](docs/ci-and-release.md).

## Cloud Delivery

CI is structured for a cloud project without deploying by default:

- Pull requests run app, dependency, public-boundary, and Terraform validation checks.
- Successful builds upload a short-lived `dist/` artifact.
- Deployable versions are annotated SemVer tags such as `v0.1.0`.
- Terraform plans are manual and use GitHub OIDC.
- Static site deployment is manual, tag-based, and should be protected by a GitHub Environment.

See [docs/git-strategy.md](docs/git-strategy.md), [docs/cloud-delivery.md](docs/cloud-delivery.md), and [docs/ci-and-release.md](docs/ci-and-release.md).

## Deploy

Static assets can be hosted from any SPA-capable static origin. This repo includes an AWS deployment path in `infra/aws` for:

- S3 and CloudFront for the site
- API Gateway and Lambda for `POST /v1/responses`
- DynamoDB with TTL for response storage
- Turnstile enforcement with the private secret stored in SSM Parameter Store

See [docs/aws-deployment.md](docs/aws-deployment.md) for the full deployment flow.

After infrastructure exists, deploy the latest build with:

```bash
npm run build
AWS_REGION=us-west-2 SITE_BUCKET=<bucket-name> CLOUDFRONT_DISTRIBUTION_ID=<distribution-id> ./scripts/deploy-static.sh
```

## Project Layout

```text
src/                  Survey app source
infra/aws/            Optional AWS deployment code
docs/                 Architecture, deployment, and repo-boundary notes
scripts/              Deployment helpers
```

## Data Boundary

Do not commit participant responses, Terraform state, real credentials, private infrastructure details, or local environment files. Keep public study content and deployable app code here; keep operational secrets outside the repository.

See [docs/public-repo-boundary.md](docs/public-repo-boundary.md) before publishing or adding deployment-specific configuration.
