# AWS Infrastructure

This stack builds the public OptBot footprint without EC2:

- Private S3 bucket for built SPA assets.
- CloudFront distribution with Origin Access Control.
- API Gateway HTTP API at `POST /v1/responses`.
- Python Lambda submit handler.
- DynamoDB response table with TTL.
- Optional SSM Parameter Store lookup for Turnstile verification.

Terraform state, real tfvars, and AWS credentials must stay outside git.

## Plan And Review

```bash
terraform init
terraform plan -out optbot.tfplan
terraform show -no-color optbot.tfplan
```

Review the saved plan before creating resources. When the reviewed plan is acceptable, apply that exact plan with `terraform apply optbot.tfplan`.

Use the `cloudfront_domain_name` output for a first smoke test. Add the custom domain only after an ACM certificate in `us-east-1` has been issued and validated.
