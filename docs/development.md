# Develop and verify Optbot changes

This guide maps the repository and defines the checks required before review. Run the focused check for your change, then run the complete local gate.

## Find the relevant code

The repository separates the survey application, infrastructure, and operational documentation:

```text
src/                  React survey application and browser validation
public/               Static metadata, favicon, and social preview assets
infra/aws/            Terraform, Lambda, and analytics resources
docs/                 Architecture and operational guides
scripts/              Boundary checks and deployment helpers
.github/workflows/     Continuous integration and protected delivery
```

Start with these application files:

- `src/App.tsx`: survey state, navigation, submission, and completion
- `src/studyContent.ts`: consent copy, notices, questions, and study steps
- `src/surveyLogic.ts`: notice ordering, validation, and payload construction
- `src/schema.ts`: shared response schema
- `src/api.ts`: browser response client
- `src/styles.css`: visual tokens and component styles

## Run application checks

Run the same application gate used by continuous integration (CI):

```bash
npm run check
```

This command runs ESLint, TypeScript, Vitest, and the Vite production build.

Run the public-boundary check separately:

```bash
npm run check:public
```

The boundary check rejects files and patterns that could expose participant data, credentials, Terraform state, or private deployment details.

Audit production dependencies when they change:

```bash
npm run audit:deps
```

## Run infrastructure checks

Validate Terraform without connecting to remote state:

```bash
terraform -chdir=infra/aws fmt -check
terraform -chdir=infra/aws init -backend=false
terraform -chdir=infra/aws validate
```

Run the Python tests that cover Lambda, analytics transformation, and plan validation:

```bash
python -m unittest discover -s infra/aws/lambda -p 'test_*.py'
python -m unittest discover -s infra/aws/glue -p 'test_*.py'
python scripts/test_validate_analytics_plan.py
```

These checks don't create AWS resources. Use protected workflows for account-backed plans and applies.

## Prepare a pull request

Before requesting review:

1. Confirm the survey flow works in preview mode
2. Run `npm run check` and `npm run check:public`
3. Run infrastructure checks when the change touches `infra/aws/`
4. Keep generated output, responses, secrets, state, and local environment files out of Git
5. Describe the changed behavior and verification evidence in the pull request

Read [Use the Git strategy](git-strategy.md) for branch and release rules.
