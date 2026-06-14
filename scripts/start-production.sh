#!/bin/sh
set -e

npx prisma db push --skip-generate

if [ -n "$BOOTSTRAP_ADMIN_EMAILS" ]; then
  node scripts/bootstrap-admins.js
fi

if [ "$APP_ROLE" = "worker" ]; then
  exec npm run worker
fi

if [ "$APP_ROLE" = "web" ]; then
  exec npm run start:web
fi

echo "Starting worker in background..."
npm run worker &
WORKER_PID=$!

cleanup() {
  kill -TERM "$WORKER_PID" 2>/dev/null || true
  wait "$WORKER_PID" 2>/dev/null || true
}

trap cleanup TERM INT

echo "Starting web server..."
exec npm run start:web
