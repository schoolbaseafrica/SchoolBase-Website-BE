# SchoolBase Website API

NestJS API for the public SchoolBase website. It stores contact messages and
waitlist registrations and sends the related email notifications.

## Local development

Copy `.env.example` to `.env`, provide a PostgreSQL database and SMTP settings,
then run:

```bash
npm ci
npm run start:dev
```

The API is available at `http://localhost:3008/api/v1`, its health endpoint at
`/api/v1/health`, and Swagger at `/docs`.

## Container

The repository includes a production multi-stage `Dockerfile`. It exposes port
`3008`, runs as the unprivileged Node user, and automatically runs only the
website migrations under `src/database/migrations/website` in production.

```bash
docker build -t schoolbase-website-api .
docker run --env-file .env -p 3008:3008 schoolbase-website-api
```

See `schoolbase-deployment/docs/WEBSITE_COOLIFY.md` in the deployment repository
for the full Coolify setup.
