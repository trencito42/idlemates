#!/bin/bash
# Start 3proxy SOCKS5 server

cd "$(dirname "$0")/.."

# Ensure logs directory exists
mkdir -p logs

# Kill any existing 3proxy processes
pkill -f "./3proxy" || true
sleep 1

# Start 3proxy in background
nohup ./3proxy 3proxy.cfg > /dev/null 2>&1 &
PROXY_PID=$!

# Save PID
echo $PROXY_PID > logs/proxy.pid

echo "3proxy started on ports 9000-9009 (PID: $PROXY_PID)"
