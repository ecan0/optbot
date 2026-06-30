# Public Repo Boundary

This repo may be public. Treat anything committed here as internet-visible.

## Allowed

- App source code and public study content.
- Generic Terraform for AWS resources.
- Placeholder config in `.env.example` and `terraform.tfvars.example`.
- Public domain name `optbot.study`.

## Not Allowed

- Private hostnames, private IPs, VLANs, tunnel IDs, or reverse proxy details.
- Terraform state, plan files, backend configs with private bucket names, or account IDs.
- AWS access keys, API tokens, Turnstile secrets, Cloudflare tokens, SSH keys, or private PKI paths.
- Participant response exports or raw survey submissions.
- Internal service names unrelated to OptBot.

## Pre-Publish Checks

```bash
rg -n --glob '!**/README.md' --glob '!**/docs/public-repo-boundary.md' --glob '!**/scripts/check-public-boundary.py' "10\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.[0-9]{1,3}\.[0-9]{1,3}|192\.168\.[0-9]{1,3}\.[0-9]{1,3}|private-domain|internal-host|tunnel-token|private-pki" .
gitleaks detect --source . --no-git
terraform -chdir=infra/aws fmt -check
```

A hit is not automatically a leak, but it should be explained before publishing.
