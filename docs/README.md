# Find Optbot documentation

This index groups Optbot documentation by task. Use it to run the study locally, understand the system, or operate its AWS deployment.

## Start developing

These pages cover local setup and routine code changes:

- [Run Optbot locally](getting-started.md): install dependencies, start Vite, and preview a production build
- [Configure collection and deployment](configuration.md): set public build variables and switch between preview and live collection
- [Develop and verify changes](development.md): understand the source layout and run app, boundary, and infrastructure checks
- [Generate visual assets](visual-generation.md): reproduce project visuals without adding runtime dependencies

## Understand the system

These pages explain the application and repository boundaries:

- [Understand the system architecture](architecture.md): trace browser, static hosting, API, and response-storage traffic
- [Protect the public repository boundary](public-repo-boundary.md): keep responses, secrets, state, and private infrastructure outside Git
- [Understand cloud delivery](cloud-delivery.md): review the build, promotion, and deployment model
- [Document research sources](research-sources.md): track citations, adapted instruments, third-party licenses, and submission checks

## Release and operate Optbot

These pages cover protected delivery workflows:

- [Configure continuous integration and releases](ci-and-release.md): run pull request checks, create releases, and use protected workflows
- [Use the Git strategy](git-strategy.md): create branches, merge changes, and tag releases
- [Deploy Optbot on AWS](aws-deployment.md): provision infrastructure and attach `optbot.study`
- [Operate the AWS infrastructure](../infra/aws/README.md): configure Terraform resources and backend state
