# AWS Deployment

## 1. Plan Infra

```bash
cd infra/aws
terraform init
terraform fmt -check
terraform validate
terraform plan -out optbot.tfplan
terraform show -no-color optbot.tfplan
```

Review the saved plan before creating resources. When the reviewed plan is acceptable, apply that exact plan:

```bash
terraform apply optbot.tfplan
```

Copy the `responses_api_endpoint`, `site_bucket_name`, and `cloudfront_distribution_id` outputs.

## 2. Configure Frontend

Create `.env.local` from `.env.example`:

```bash
VITE_PUBLIC_SITE_URL=https://optbot.study
VITE_PUBLIC_API_BASE_URL=<responses_api_endpoint>
VITE_PUBLIC_COLLECTION_MODE=preview
VITE_PUBLIC_SURVEY_ID=optbot-study-v1
VITE_PUBLIC_TURNSTILE_SITE_KEY=<public-site-key-for-live-collection>
```

## 3. Deploy Static Assets

```bash
npm install
npm run build
AWS_REGION=us-west-2 SITE_BUCKET=<site_bucket_name> CLOUDFRONT_DISTRIBUTION_ID=<cloudfront_distribution_id> ./scripts/deploy-static.sh
```

## 4. Attach `optbot.study`

1. Request an ACM certificate for `optbot.study` in `us-east-1`.
2. Add the DNS validation records in Cloudflare.
3. Wait for the certificate to be issued.
4. Set `acm_certificate_arn` in a private `.tfvars` file.
5. Re-run `terraform plan`, review the saved plan, then apply the reviewed plan.
6. Create the Cloudflare CNAME or proxied record for `optbot.study` pointing to the CloudFront domain output.

## 5. Enable Turnstile Before Real Collection

Create the secret outside Terraform so the secret value does not enter Terraform state:

```bash
aws ssm put-parameter \
  --name /optbot/turnstile/secret \
  --type SecureString \
  --value '<secret-value>'
```

Then set:

```hcl
require_turnstile               = true
turnstile_secret_parameter_name = "/optbot/turnstile/secret"
```

Run the protected Terraform plan with remote state and Turnstile enabled. Review its sanitized resource actions, then run `.github/workflows/terraform-apply-turnstile.yml` through the required reviewer on the GitHub `production` Environment. The apply workflow rejects changes beyond the expected in-place Lambda and IAM policy updates and verifies enforcement afterward.
