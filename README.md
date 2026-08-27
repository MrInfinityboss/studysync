# StudySync

StudySync is a responsive academic collaboration platform for discovering, hosting, and joining focused study sessions. It provides a calm, accessible workspace for students who want to coordinate sessions by subject, time, format, location, capacity, and learning goal.

## Features

- **Public landing experience** with product overview and sign-in entry points.
- **Google sign-in** using the OAuth 2.0 authorization-code flow with PKCE.
- **Session discovery** with search and filters for subject, date, format, location, and available seats.
- **Session hosting** with title, subject, description, schedule, physical location or online link, tags, and capacity.
- **Transactional enrollment** that prevents duplicate attendance and overbooking.
- **Ordered waitlists** that support cancellation and participant promotion when seats become available.
- **Personal dashboard** for upcoming sessions, hosted sessions, availability, and recent activity.
- **Profile management** for display name, bio, timezone, study interests, and avatar URL.
- **Host participant view** for confirmed participants and waitlist states.

## Technology stack

| Layer | Technology |
|---|---|
| Client | React 19, TypeScript, Vite, Wouter |
| UI | Tailwind CSS 4, Radix UI, Lucide icons, Framer Motion |
| Server | Node.js, Express, tRPC, Zod |
| Data | MySQL or TiDB, Drizzle ORM |
| Authentication | Google OAuth 2.0, signed HTTP-only cookies, JSON Web Tokens |
| Testing | Vitest |

## Prerequisites

Install the following before running the project locally:

- [Node.js](https://nodejs.org/) **22 or later**;
- [pnpm](https://pnpm.io/) 10 or later;
- a MySQL- or TiDB-compatible database;
- a Google Cloud project with a Web Application OAuth client, if you want Google sign-in.

## Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/YOUR-USERNAME/studysync.git
cd studysync
pnpm install
```

On Windows, if PowerShell blocks `npm.ps1`, either use `npm.cmd` and `pnpm.cmd`, or allow locally installed scripts for your current user:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

## Environment configuration

Create a `.env` file in the repository root. Do not commit this file.

```env
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=mysql://USERNAME:PASSWORD@HOST:3306/studysync

# Create a long, random secret in production.
JWT_SECRET=replace-with-a-long-random-secret

# Required by the signed StudySync session payload.
VITE_APP_ID=studysync-local

# Google OAuth 2.0 Web Application credentials
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Optional: required only when configuring the alternate sign-in provider.
OAUTH_SERVER_URL=
VITE_OAUTH_PORTAL_URL=
```

## Database setup

Apply the existing migrations after configuring `DATABASE_URL`:

```bash
pnpm drizzle-kit migrate
```

When the schema changes, generate and apply a new migration:

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

## Google authentication setup

In Google Cloud Console, create an OAuth client of type **Web application**. Add the following local authorized redirect URI:

```text
http://localhost:3000/api/auth/google/callback
```

For each hosted environment, also add its exact callback URL:

```text
https://YOUR-DOMAIN/api/auth/google/callback
```

The Google flow creates a short-lived signed state cookie, uses PKCE during authorization-code exchange, obtains the Google identity, links it to an existing account when appropriate, and then creates a signed StudySync session.

## Run locally

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The public welcome screen is available at [http://localhost:3000/welcome](http://localhost:3000/welcome).

## Available scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Start the Vite-powered development server. |
| `pnpm test` | Run the Vitest suite. |
| `pnpm check` | Run TypeScript type checking. |
| `pnpm build` | Create a production build. |
| `pnpm start` | Start the already-built production server. |
| `pnpm format` | Format project source files with Prettier. |
| `pnpm db:push` | Generate and apply Drizzle migrations. |

Run these checks before committing or deploying:

```bash
pnpm test
pnpm check
pnpm build
```

## Database model

The database is structured around user accounts, hosted study sessions, and participation lifecycle records.

| Table | Purpose |
|---|---|
| `users` | Core account, role, and sign-in data. |
| `profiles` | Display name, bio, timezone, interests, and avatar data. |
| `authIdentities` | External provider identities, including Google accounts. |
| `studySessions` | Session details, schedule, format, capacity, and lifecycle status. |
| `tags` / `sessionTags` | Reusable session categorisation. |
| `enrollments` | Confirmed and cancelled participation records. |
| `waitlistEntries` | Ordered waitlist and promotion states. |
| `notifications` | User-facing session updates. |
| `auditEvents` | Traceable events for session actions. |

## Project structure

```text
client/                 React interface, routes, components, and visual styles
server/                 Express server, tRPC procedures, authentication, and database helpers
drizzle/                Database schema and migrations
shared/                 Shared constants, validation, and types
docs/                   Integration and setup documentation
```

## Deployment notes

Set all environment variables in your hosting provider’s secret/configuration settings. Never commit `.env`, client secrets, database passwords, or production JWT secrets.

Before deployment, run `pnpm test`, `pnpm check`, and `pnpm build`. After deploying to a new domain, add the matching `/api/auth/google/callback` URL to the Google OAuth client’s authorized redirect URIs.

### Vercel deployment

The repository includes a Vercel serverless configuration: the React application builds to `dist/public`, while `api/[...path].ts` handles API and OAuth routes. See [`docs/vercel-deployment.md`](docs/vercel-deployment.md) before importing the repository into Vercel. Configure the required database, session, and Google OAuth secrets in Vercel before deployment, then add the production Vercel URL as an authorized Google callback URI.

## License

This project is provided under the MIT License. Add a `LICENSE` file if you intend to distribute or open-source it.
