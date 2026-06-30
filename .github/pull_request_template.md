## Summary

## Checks

- [ ] `npm run check`
- [ ] `npm run audit:deps`
- [ ] `npm run check:public`
- [ ] `terraform -chdir=infra/aws fmt -check`
- [ ] `terraform -chdir=infra/aws init -backend=false`
- [ ] `terraform -chdir=infra/aws validate`

## Cloud Impact

- [ ] No AWS resources are created or changed by this PR.
- [ ] IAM, state, and deployment notes are updated if cloud behavior changed.
- [ ] Any future deployment requires a manual workflow or local Terraform apply.
