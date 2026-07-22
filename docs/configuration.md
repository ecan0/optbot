# Configure collection and deployment

This reference defines the public build variables used by Optbot. Keep frontend variables public and store operational secrets outside Vite environment files.

## Frontend environment variables

Copy `.env.example` to `.env.local` for local development. Vite exposes every `VITE_` variable to the browser.

| Variable | Required value |
| --- | --- |
| `VITE_PUBLIC_SITE_URL` | Public site URL. Production uses `https://optbot.study`. |
| `VITE_PUBLIC_API_BASE_URL` | Base URL for the response API. Live collection requires this value. |
| `VITE_PUBLIC_COLLECTION_MODE` | `preview` blocks submission. `live` requires the API URL and Turnstile site key. |
| `VITE_PUBLIC_SURVEY_ID` | Stable identifier for the survey version. The default is `optbot-study-v1`. |
| `VITE_PUBLIC_TURNSTILE_SITE_KEY` | Public Cloudflare Turnstile site key. Live collection requires this value. |

Never add credentials, Turnstile secrets, participant data, or private infrastructure identifiers to these variables.

## Preview mode behavior

Set collection mode to `preview` during local development and non-collecting reviews:

```dotenv
VITE_PUBLIC_COLLECTION_MODE=preview
VITE_PUBLIC_API_BASE_URL=
VITE_PUBLIC_TURNSTILE_SITE_KEY=
```

Preview mode validates the full survey flow. It downloads the normalized response payload instead of sending it to the API.

## Live collection behavior

Live collection requires three public values:

```dotenv
VITE_PUBLIC_COLLECTION_MODE=live
VITE_PUBLIC_API_BASE_URL=https://api.example.test
VITE_PUBLIC_TURNSTILE_SITE_KEY=your_public_site_key_here
```

The application refuses an invalid live configuration. The deployment workflow also rejects production releases without live collection after `v1.0.0`.

Store the private Turnstile secret in AWS Systems Manager Parameter Store. Follow [Deploy Optbot on AWS](aws-deployment.md) to configure server-side verification.

## GitHub Environment values

Protected workflows read deployment values from the selected GitHub Environment. [Configure continuous integration and releases](ci-and-release.md) lists each Environment variable and secret.
