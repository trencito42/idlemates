#!/bin/bash

# IdleMates Startup Script (Background Mode)
# This script starts both the Next.js server and the Steam worker in background

set -e

echo "🚀 Starting IdleMates in background mode..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Redis is running
echo -n "Checking Redis... "
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo -e "${YELLOW}Warning: Redis is not running. Worker may not function properly.${NC}"
    echo "Start Redis with: sudo systemctl start redis"
    echo ""
fi

# Check if MySQL is running
echo -n "Checking MySQL... "
if mysqladmin ping -h 127.0.0.1 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo -e "${RED}Error: MySQL is not running. Cannot start application.${NC}"
    echo "Start MySQL with: sudo systemctl start mysql"
    exit 1
fi

echo ""

# Start proxy servers unless disabled
if [ "${STEAM_DISABLE_PROXIES:-false}" = "true" ] || [ "${STEAM_USE_PROXIES:-true}" = "false" ]; then
    echo "Skipping 3proxy startup (proxies disabled)"
else
    echo "Starting SOCKS5 proxy servers..."
    bash scripts/start-proxies.sh
    sleep 1
fi

# Kill existing processes if any
echo "Cleaning up existing processes..."
pkill -f "next start" || true
pkill -f "tsx.*worker" || true
sleep 2

# Create logs directory
mkdir -p logs

# Check if source files have changed since last build
NEEDS_BUILD=false

if [ ! -d ".next" ] || [ ! -f ".next/BUILD_ID" ]; then
    echo -e "${YELLOW}No build found. Will build application...${NC}"
    NEEDS_BUILD=true
else
    # Check if any source files are newer than the build
    if [ -n "$(find app src components lib -type f -newer .next/BUILD_ID 2>/dev/null)" ]; then
        echo -e "${YELLOW}Source files changed. Will rebuild application...${NC}"
        NEEDS_BUILD=true
    fi
fi

# Resolve local binaries
NEXT_BIN="./node_modules/.bin/next"
TSX_BIN="./node_modules/.bin/tsx"

# Ensure Node.js is available (support nvm-based installs)
if ! command -v node >/dev/null 2>&1; then
    if [ -s "$HOME/.nvm/nvm.sh" ]; then
        # shellcheck source=/dev/null
        . "$HOME/.nvm/nvm.sh"
        nvm use --lts >/dev/null 2>&1 || true
    fi
fi

if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}Error: Node.js is not available in PATH.${NC}"
    echo "Tip: Install Node.js or ensure nvm is loaded for non-interactive shells."
    echo "Tried sourcing: $HOME/.nvm/nvm.sh"
    exit 1
fi

# Clear cache and rebuild if needed
if [ "$NEEDS_BUILD" = true ]; then
    echo "Clearing cache..."
    rm -rf .next
    rm -rf node_modules/.cache
    echo -e "${GREEN}✓${NC} Cache cleared"
    
    echo "Building application..."
    if [ -x "$NEXT_BIN" ]; then
        "$NEXT_BIN" build || {
            echo -e "${RED}Build failed! Check the error above.${NC}"
            exit 1
        }
    else
        echo -e "${RED}Error: Next.js binary not found at $NEXT_BIN${NC}"
        echo -e "${YELLOW}Tip: Install dependencies first (e.g., npm i or pnpm i).${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓${NC} Build complete"
    echo ""
fi

# Start Next.js in background with nohup
echo "Starting Next.js server on port 3699..."
if [ -x "$NEXT_BIN" ]; then
    nohup "$NEXT_BIN" start -p ${PORT:-3699} > logs/web.log 2>&1 &
else
    echo -e "${RED}Error: Next.js binary not found at $NEXT_BIN${NC}"
    exit 1
fi
WEB_PID=$!
disown $WEB_PID
echo -e "${GREEN}✓${NC} Next.js started (PID: $WEB_PID)"

# Wait a moment for server to initialize
sleep 3

# Start Worker in background with nohup
echo "Starting Steam Worker..."
if [ -x "$TSX_BIN" ]; then
    nohup "$TSX_BIN" src/worker/index.ts > logs/worker.log 2>&1 &
else
    echo -e "${RED}Error: tsx binary not found at $TSX_BIN${NC}"
    echo -e "${YELLOW}Tip: Install dev dependencies first (e.g., npm i).${NC}"
    exit 1
fi
WORKER_PID=$!
disown $WORKER_PID
echo -e "${GREEN}✓${NC} Worker started (PID: $WORKER_PID)"

# Save PIDs
echo $WEB_PID > logs/web.pid
echo $WORKER_PID > logs/worker.pid
echo $PROXY_PID > logs/proxy.pid

echo ""
echo -e "${GREEN}✅ IdleMates is running in background!${NC}"
echo ""
echo "📊 Services:"
echo "   • Web:    http://localhost:3699 (PID: $WEB_PID)"
echo "   • Worker: Running (PID: $WORKER_PID)"
echo ""
echo "📝 Logs:"
echo "   • Web:    tail -f logs/web.log"
echo "   • Worker: tail -f logs/worker.log"
echo ""
echo "🛑 To stop:"
echo "   • ./stop.sh"
echo "   • or manually: kill $WEB_PID $WORKER_PID"
echo ""
echo "✨ You can now close this terminal safely."
