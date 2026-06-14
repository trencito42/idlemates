#!/bin/bash
# IdleMates System Status Checker

echo "🔍 IdleMates System Status"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Web Server
if pgrep -f "next start" > /dev/null; then
    echo -e "${GREEN}✓${NC} Web Server: Running (Port 3699)"
else
    echo -e "${RED}✗${NC} Web Server: Not running"
fi

# Check Worker
if pgrep -f "tsx.*worker" > /dev/null; then
    echo -e "${GREEN}✓${NC} Worker: Running"
else
    echo -e "${RED}✗${NC} Worker: Not running"
fi

# Check Proxies
PROXY_COUNT=$(netstat -tulnp 2>/dev/null | grep -c ":900[0-9].*3proxy")
if [ "$PROXY_COUNT" -eq 10 ]; then
    echo -e "${GREEN}✓${NC} Proxies: All 10 running (Ports 9000-9009)"
elif [ "$PROXY_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠${NC} Proxies: Only $PROXY_COUNT/10 running"
else
    echo -e "${RED}✗${NC} Proxies: Not running"
fi

# Check Redis
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Redis: Running"
else
    echo -e "${RED}✗${NC} Redis: Not running"
fi

# Check MySQL
if mysqladmin ping -h 127.0.0.1 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} MySQL: Running"
else
    echo -e "${RED}✗${NC} MySQL: Not running"
fi

echo ""
echo "📊 Recent Errors:"
echo "================================"

# Check for recent errors in worker log
WORKER_ERRORS=$(tail -100 logs/worker.log 2>/dev/null | grep -c "error\|Error\|ECONNREFUSED")
if [ "$WORKER_ERRORS" -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Worker: No recent errors"
else
    echo -e "${YELLOW}⚠${NC} Worker: $WORKER_ERRORS errors in last 100 lines"
    echo "   Run: tail -50 logs/worker.log | grep -i error"
fi

# Check for recent errors in web log
WEB_ERRORS=$(tail -100 logs/web.log 2>/dev/null | grep -c "error\|Error")
if [ "$WEB_ERRORS" -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Web: No recent errors"
else
    echo -e "${YELLOW}⚠${NC} Web: $WEB_ERRORS errors in last 100 lines"
    echo "   Run: tail -50 logs/web.log | grep -i error"
fi

echo ""
echo "🌐 Proxy Test:"
echo "================================"

# Test first proxy
if timeout 3 curl -x socks5://193.33.167.216:9000 https://api.steampowered.com -I > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Proxy connection test: PASSED"
else
    echo -e "${RED}✗${NC} Proxy connection test: FAILED"
fi

echo ""
echo "📝 Quick Commands:"
echo "================================"
echo "  View worker log:  tail -f logs/worker.log"
echo "  View web log:     tail -f logs/web.log"
echo "  Restart services: ./stop.sh && ./start.sh"
echo "  Stop services:    ./stop.sh"
echo ""
