#!/bin/bash

# IdleMates Stop Script

echo "Stopping IdleMates services..."

# Kill 3proxy processes
pkill -f "./3proxy" && echo "✓ Killed 3proxy server"

# Kill proxy server if running
if [ -f logs/proxy.pid ]; then
    PROXY_PID=$(cat logs/proxy.pid)
    if [ -n "$PROXY_PID" ] && kill -0 $PROXY_PID 2>/dev/null; then
        kill -TERM $PROXY_PID 2>/dev/null
        sleep 1
        kill -9 $PROXY_PID 2>/dev/null && echo "✓ Killed proxy server (PID: $PROXY_PID)"
    fi
    rm logs/proxy.pid
fi

# Kill by PID files if they exist
if [ -f logs/web.pid ]; then
    WEB_PID=$(cat logs/web.pid)
    if [ -n "$WEB_PID" ] && kill -0 $WEB_PID 2>/dev/null; then
    pkill -TERM -P $WEB_PID 2>/dev/null
    kill -TERM $WEB_PID 2>/dev/null
    sleep 1
    pkill -9 -P $WEB_PID 2>/dev/null
    kill -9 $WEB_PID 2>/dev/null && echo "✓ Fully killed web server tree (PID: $WEB_PID)"
    fi
    rm logs/web.pid
fi

if [ -f logs/worker.pid ]; then
    WORKER_PID=$(cat logs/worker.pid)
    if [ -n "$WORKER_PID" ] && kill -0 $WORKER_PID 2>/dev/null; then
    pkill -TERM -P $WORKER_PID 2>/dev/null
    kill -TERM $WORKER_PID 2>/dev/null
    sleep 1
    pkill -9 -P $WORKER_PID 2>/dev/null
    kill -9 $WORKER_PID 2>/dev/null && echo "✓ Fully killed worker tree (PID: $WORKER_PID)"
    fi
    rm logs/worker.pid
fi

# Fallback: kill by process name
pkill -f "next start" && echo "✓ Killed any remaining Next.js processes"
pkill -f "tsx.*worker" && echo "✓ Killed any remaining worker processes"
# Ensure no stray Next.js processes remain
pkill -9 -f "next-server"
pkill -9 -f "node.*3699"
echo "✅ All services stopped"
