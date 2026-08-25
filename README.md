# Crawler API

NestJS API for the Crawler job-matching and CV-tailoring application.

## Architecture

- PostgreSQL + Prisma for users, profiles, jobs, CVs, applications, and subscriptions.
- Redis for feed caching, tailoring sessions, BullMQ, and middleware rate limits.
- BullMQ + Nest Schedule for hourly source crawling.
- Cloudflare R2-compatible storage for uploaded and generated documents.
- Gemini for CV and cover-letter generation/refinement.
- Password JWT/refresh-token auth plus verified Clerk sessions.

All successful responses use `{ status, message, data }`. Unexpected errors are
written to the CLI and `logs/error.log`; HTTP requests are logged to the CLI.

## Local setup

```bash
cp .env.example .env
docker compose up -d
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

The API listens on port `8080` by default. Configure comma-separated
`ADMIN_EMAILS` for job-source administration and manual crawler triggers.

## Commands

```bash
npm run build
npm run lint
npm test
npm run test:e2e
```

## Main endpoints

- `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`
- `GET/PATCH /profiles/me`
- `GET /feed`, `GET /feed/:id`, `GET /search`
- `GET/POST/PATCH/DELETE /applications`
- `GET/POST/PATCH/DELETE /base-cvs`
- `POST /tailoring/generate`, `GET /tailoring/:sessionId`
- `POST /tailoring/:sessionId/refine`, `POST /tailoring/:sessionId/accept`
- `GET/POST/PATCH/DELETE /admin/job-sources` (admin)
- `POST /crawler/trigger/:sourceId`, `POST /crawler/trigger-all` (admin)

## Deferred v2 work

- Stripe billing and paid-plan lifecycle.
- Additional Nigerian job-source adapters.
