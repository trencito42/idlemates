#!/bin/bash

echo "🔄 Restarting Web Frontend..."


# Kill only Next.js process
WEB_PID=$(cat logs/web.pid 2>/dev/null)
if [ ! -z "$WEB_PID" ]; then
  echo "Stopping Next.js (PID: $WEB_PID)..."
  kill $WEB_PID 2>/dev/null
  sleep 2
fi

# Kill any remaining Next.js processes
pkill -f "next.*start\|next.*dev" 2>/dev/null

# Ensure port 3699 is free (kill any process using it)
PORT_TO_KILL=${PORT:-3699}
PID_ON_PORT=$(lsof -ti tcp:$PORT_TO_KILL)
if [ ! -z "$PID_ON_PORT" ]; then
  echo "Killing process on port $PORT_TO_KILL (PID: $PID_ON_PORT)..."
  kill -9 $PID_ON_PORT 2>/dev/null
  sleep 2
fi

# Resolve local binaries
NEXT_BIN="./node_modules/.bin/next"

# Ensure Node.js is available (support nvm-based installs)
if ! command -v node >/dev/null 2>&1; then
  if [ -s "$HOME/.nvm/nvm.sh" ]; then
    # shellcheck source=/dev/null
    . "$HOME/.nvm/nvm.sh"
    nvm use --lts >/dev/null 2>&1 || true
  fi
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js is not available in PATH. Cannot restart."
  exit 1
fi

# Build if needed
if [ ! -d ".next" ]; then
  echo "No build found. Building application..."
  "$NEXT_BIN" build || {
    echo "Build failed."
    exit 1
  }
fi

# Check if build is outdated (optional - can be removed if too slow)
# Uncomment to force rebuild if source files are newer
# if [ -d ".next" ]; then
#   NEWEST_SRC=$(find app lib components -type f -name "*.ts" -o -name "*.tsx" 2>/dev/null | xargs stat -c %Y 2>/dev/null | sort -rn | head -1)
#   BUILD_TIME=$(stat -c %Y .next 2>/dev/null || echo 0)
#   if [ "$NEWEST_SRC" -gt "$BUILD_TIME" ]; then
#     echo "Source files changed. Rebuilding..."
#     npm run build
#   fi
# fi

echo "Starting Next.js on port ${PORT:-3699} with auto-restart..."
mkdir -p logs

if [ "$NODE_ENV" = "production" ]; then
  START_CMD=("$NEXT_BIN" start -p ${PORT:-3699})
else
  START_CMD=("$NEXT_BIN" dev -p ${PORT:-3699})
fi

(
  while true; do
    echo "[$(date '+%F %T')] Launching Next.js..." >> logs/web.log
    "${START_CMD[@]}" >> logs/web.log 2>&1
    EXIT_CODE=$?
    echo "[$(date '+%F %T')] Next.js exited with code ${EXIT_CODE}; restarting in 5s..." >> logs/web.log
    sleep 5
  done
) &

WEB_PID=$!
disown $WEB_PID 2>/dev/null || true
echo $WEB_PID > logs/web.pid
echo "✅ Next.js watchdog started (PID: $WEB_PID)"

echo ""
echo "📊 Status:"
echo "   • Web:    http://localhost:${PORT:-3699} (watchdog PID: $WEB_PID)"
echo "   • Worker: Still running (unchanged)"
echo ""
echo "📝 Logs: tail -f logs/web.log"
