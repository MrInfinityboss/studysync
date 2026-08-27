# Deploy StudySync on Vercel

## Before the first deployment

The repository contains `vercel.json` and `api/[...path].ts`, which place the StudySync Express routes—including tRPC and Google OAuth—inside a Vercel Node.js function. The React application is built as static content in `dist/public`.

## Vercel import settings

When importing the GitHub repository, leave the framework as **Other**. Vercel reads `vercel.json`, so it will use the correct installation command, build command, output directory, SPA rewrite, and API function settings automatically.

## Environment variables

Add the following values under **Project Settings → Environment Variables**. Apply each to **Production**, **Preview**, and **Development** as needed.

| Name | Required | Purpose |
|---|---:|---|
| `DATABASE_URL` | Yes | MySQL or TiDB connection string available to Vercel. |
| `JWT_SECRET` | Yes | Long random secret used to sign and verify user session cookies. |
| `VITE_APP_ID` | Yes | Stable StudySync application identifier, for example `studysync-vercel`. |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth Web Application client ID. |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth Web Application client secret. |
| `OAUTH_SERVER_URL` | Only for alternate sign-in | Base URL for the optional alternate OAuth provider. |
| `VITE_OAUTH_PORTAL_URL` | Only for alternate sign-in | Browser sign-in URL for the optional alternate OAuth provider. |

Do not add quotes around values. Do not commit secrets into `.env`, `vercel.json`, or GitHub.

## Google OAuth callback URLs

After Vercel assigns a deployment URL, open the Google Cloud OAuth client and add:

```text
https://YOUR-VERCEL-DOMAIN/api/auth/google/callback
```

For reliable Google sign-in, add the final production domain, not only a temporary preview URL. If you use preview deployments for Google OAuth tests, add each preview callback URL separately or use a stable custom preview domain.

## Database migration

Vercel deploys application code; it does not automatically migrate a database. From a machine with the same `DATABASE_URL`, run:

```bash
pnpm drizzle-kit migrate
```

## Verification checklist

1. Open the Vercel deployment URL and visit `/welcome`.
2. Verify `/api/trpc/auth.me` responds rather than returning a 404.
3. Choose **Continue with Google** and confirm the callback reaches `/dashboard?auth=google-success`.
4. Create and search for a study session to verify database connectivity.

## Deployment limits

The application is compatible with request-driven serverless execution. Do not add persistent workers, in-memory queues, long-lived WebSocket state, or scheduled reminder loops to this Vercel deployment without a separate durable service.
