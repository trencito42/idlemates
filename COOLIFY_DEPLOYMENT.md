# Coolify Deployment

This project runs on Coolify as two application services plus two data services:

- `web`: Next.js frontend and API
- `worker`: BullMQ / Steam worker
- `mysql`: MySQL 8
- `redis`: Redis 7

## 1. Prepare the repository

Push the contents of this `project` folder to a Git repository.

Use this folder as the application root in Coolify.

## 2. Create the data services

Create these services first inside Coolify:

- MySQL 8
- Redis 7

Keep the generated hostnames, usernames, passwords, and database name.

## 3. Create the `web` application

Create a new application from your Git repository with these settings:

- Build pack: `Dockerfile`
- Dockerfile path: `Dockerfile`
- Port: `3000`

Environment variables for `web`:

```env
NODE_ENV=production
PORT=3000
SITE_URL=https://your-domain.example
NEXTAUTH_URL=https://your-domain.example
NEXTAUTH_SECRET=replace-with-a-long-random-secret
ENCRYPTION_MASTER_KEY=replace-with-a-stable-secret-key
DATABASE_URL=mysql://USER:PASSWORD@MYSQL_HOST:3306/idlemates
REDIS_URL=redis://REDIS_HOST:6379
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

- The container runs `prisma migrate deploy` before starting the web app.
- Attach your domain to this `web` service, not to the worker.

## 4. Create the `worker` application

Create a second application from the same repository.

Use the same settings as `web`, with one change:

- Start command: `npm run worker`

Environment variables for `worker`:

```env
NODE_ENV=production
DATABASE_URL=mysql://USER:PASSWORD@MYSQL_HOST:3306/idlemates
REDIS_URL=redis://REDIS_HOST:6379
ENCRYPTION_MASTER_KEY=replace-with-the-same-key-used-by-web
SITE_URL=https://your-domain.example
NEXTAUTH_URL=https://your-domain.example
NEXTAUTH_SECRET=replace-with-the-same-secret-used-by-web
```

If the worker uses billing, mail, or Steam-related env vars in your setup, add the same values here too.

The worker does not need a public domain.

## 5. Import the database

If you want to restore the backup from `idlemates.sql`, import it into the Coolify MySQL service before switching traffic.

After import, ensure the application user in `DATABASE_URL` can read and write the schema.

## 6. First deployment order

Deploy in this order:

1. `mysql`
2. `redis`
3. `web`
4. `worker`

## 7. Health checks

Recommended checks:

- `web`: HTTP check on `/`
- `worker`: process-only is enough; no public health endpoint exists yet

## 8. Common failures

### Build succeeds but app crashes on start

Usually one of these is wrong:

- `DATABASE_URL`
- `REDIS_URL`
- `NEXTAUTH_SECRET`
- `ENCRYPTION_MASTER_KEY`

### Web works but sessions do not start

Usually the `worker` service is missing, stopped, or not connected to the same Redis and MySQL instances.

### Login or callback URLs are broken

Set both:

- `SITE_URL`
- `NEXTAUTH_URL`

to the final HTTPS domain.
