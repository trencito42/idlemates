# Coolify Deployment

This project runs on Coolify as **one application service** plus two data services:

- `web`: Next.js frontend, API, and BullMQ / Steam worker (same container)
- `mysql`: MySQL 8
- `redis`: Redis 7

The Docker entrypoint starts the worker in the background and the web server in the foreground. You do not need a second Coolify application.

Optional split mode (only if you really want separate services):

- `APP_ROLE=web` — web only
- `APP_ROLE=worker` — worker only

## 1. Prepare the repository

Push the contents of this `project` folder to a Git repository.

Use this folder as the application root in Coolify.

## 2. Create the data services

Create these services first inside Coolify:

- MySQL 8
- Redis 7

Keep the generated hostnames, usernames, passwords, and database name.

## 3. Create the application

Create a new application from your Git repository with these settings:

- Build pack: `Dockerfile`
- Dockerfile path: `Dockerfile`
- Port: `3000`
- Start command: leave empty (Dockerfile `CMD` handles startup)

Environment variables:

```env
NODE_ENV=production
PORT=3000
SITE_URL=https://your-domain.example
NEXTAUTH_URL=https://your-domain.example
NEXTAUTH_SECRET=replace-with-a-long-random-secret
ENCRYPTION_MASTER_KEY=replace-with-a-stable-secret-key
DATABASE_URL=mysql://USER:PASSWORD@MYSQL_HOST:3306/idlemates
REDIS_URL=redis://default:PASSWORD@REDIS_HOST:6379/0
```

Optional billing variables if used:

```env
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=
PAYPAL_MODE=live
PAYPAL_PLAN_FREE=
PAYPAL_PLAN_BASIC=
PAYPAL_PLAN_PRO=
PAYPAL_PLAN_ULTRA=
```

Notes:

- The container runs `prisma db push` before starting web and worker.
- Attach your domain to this service.
- `REDIS_URL` is required for QR login, sessions, and rate limiting.

## 4. Import the database

If you want to restore the backup from `idlemates.sql`, import it into the Coolify MySQL service before switching traffic.

After import, ensure the application user in `DATABASE_URL` can read and write the schema.

## 5. First deployment order

Deploy in this order:

1. `mysql`
2. `redis`
3. `web`

## 6. Health checks

Recommended check:

- HTTP check on `/`

## 7. Common failures

### Build succeeds but app crashes on start

Usually one of these is wrong:

- `DATABASE_URL`
- `REDIS_URL`
- `NEXTAUTH_SECRET`
- `ENCRYPTION_MASTER_KEY`

### Web works but sessions or QR login do not start

Usually `REDIS_URL` is missing or wrong. The worker runs in the same container as the web app, so there is no separate worker service to manage.

### Login or callback URLs are broken

Set both:

- `SITE_URL`
- `NEXTAUTH_URL`

to the final HTTPS domain.
