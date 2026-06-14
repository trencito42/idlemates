#!/bin/bash

# IdleMates Development Startup Script
# This script starts both the Next.js dev server and the Steam worker

set -e

echo "🚀 Starting IdleMates (Development Mode)..."
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

# Start proxy servers
echo "Starting SOCKS5 proxy servers..."
bash scripts/start-proxies.sh
sleep 1

# Kill existing processes if any
echo "Cleaning up existing processes..."
pkill -f "next dev" || true
pkill -f "tsx.*worker" || true
sleep 2

# Create logs directory
mkdir -p logs

# Start Next.js DEV in background
echo "Starting Next.js dev server on port 3699..."
npm run dev > logs/web.log 2>&1 &
WEB_PID=$!
echo -e "${GREEN}✓${NC} Next.js dev started (PID: $WEB_PID)"

# Wait a moment for server to initialize
sleep 3

# Start Worker in background
echo "Starting Steam Worker..."
npx tsx src/worker/index.ts > logs/worker.log 2>&1 &
WORKER_PID=$!
echo -e "${GREEN}✓${NC} Worker started (PID: $WORKER_PID)"

echo ""
echo -e "${GREEN}✅ IdleMates is running in DEV mode!${NC}"
echo ""
echo "📊 Services:"
echo "   • Web:    http://localhost:3699 (PID: $WEB_PID) [DEV MODE - Hot Reload]"
echo "   • Worker: Running (PID: $WORKER_PID)"
echo ""
echo "📝 Logs:"
echo "   • Web:    tail -f logs/web.log"
echo "   • Worker: tail -f logs/worker.log"
echo ""
echo "🛑 To stop:"
echo "   • kill $WEB_PID $WORKER_PID"
echo "   • or run: ./stop.sh"
echo ""

# Save PIDs
echo $WEB_PID > logs/web.pid
echo $WORKER_PID > logs/worker.pid
echo $PROXY_PID > logs/proxy.pid

# Keep script running and monitor processes
echo "Press Ctrl+C to stop all services"
echo ""

trap "echo ''; echo 'Stopping services...'; kill $WEB_PID $WORKER_PID 2>/dev/null; echo 'Stopped.'; exit" INT TERM

# Monitor processes
while true; do
    if ! kill -0 $WEB_PID 2>/dev/null; then
        echo -e "${RED}✗ Web server died! Check logs/web.log${NC}"
        kill $WORKER_PID 2>/dev/null
        exit 1
    fi
    if ! kill -0 $WORKER_PID 2>/dev/null; then
        echo -e "${RED}✗ Worker died! Check logs/worker.log${NC}"
        kill $WEB_PID 2>/dev/null
        exit 1
    fi
    sleep 5
done
