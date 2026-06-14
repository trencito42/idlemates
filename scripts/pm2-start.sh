#!/usr/bin/env bash
set -euo pipefail
# PM2 wrapper to start Next.js with explicit PORT
cd "$(dirname "$0")/.."
PORT=${PORT:-3700}
export PORT
mkdir -p logs
exec ./node_modules/.bin/next start -p "$PORT" >> logs/pm2-out.log 2>> logs/pm2-err.log
