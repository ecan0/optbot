# Run Optbot locally

This guide starts the survey in preview mode. Preview mode exercises the complete browser flow without sending a response.

## Prerequisites for local development

Install these tools before you start:

- Node.js 22
- npm
- Git

You don't need AWS credentials to develop or test the frontend.

## Install and start the app

Clone the repository, install locked dependencies, and create a local environment file:

```bash
npm install
cp .env.example .env.local
npm run dev
```

Vite prints the local address after startup. Open that address and complete the survey flow.

The default `.env.example` sets `VITE_PUBLIC_COLLECTION_MODE=preview`. The completion screen downloads a local response preview instead of contacting the response API.

## Build and preview production output

Build the application before reviewing production behavior:

```bash
npm run build
npm run preview
```

Vite writes the production bundle to `dist/` and serves it from a local preview server.

## Choose the next task

Use these guides after local setup:

- [Configure collection and deployment](configuration.md) to understand public environment variables
- [Develop and verify changes](development.md) to run the repository checks
- [Understand the system architecture](architecture.md) to trace production traffic
