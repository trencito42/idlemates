#!/bin/bash

# Generate 3proxy configuration with IPv6 binding
# Creates 50 proxy instances, each bound to a unique IPv6 address

OUTPUT_FILE="3proxy-ipv6.cfg"
IPV6_PREFIX="2a00:ccc1:101:20"
START_PORT=9000
START_IP_INDEX=100
COUNT=50

cat > ${OUTPUT_FILE} << 'EOF'
# 3proxy configuration with IPv6 rotation
# Each proxy instance binds to a unique IPv6 address

# Logging
log /home/idlemat/htdocs/idlemat.es/logs/3proxy.log D
logformat "- +_L%t.%. %N.%p %E %U %C:%c %R:%r %O %I %h %T"

# Authentication
auth none

# Allow from localhost
allow *

# Timeouts
timeouts 30 60 300 30

# Max connections per proxy
maxconn 100

EOF

echo "Generating proxy configurations..."

for i in $(seq 0 $((COUNT-1))); do
    PORT=$((START_PORT + i))
    IP_INDEX=$((START_IP_INDEX + i))
    IPV6_ADDR="${IPV6_PREFIX}::${IP_INDEX}"
    
    cat >> ${OUTPUT_FILE} << EOF
# Proxy $((i+1)) - Port ${PORT} using IPv6 ${IPV6_ADDR}
internal 0.0.0.0
external ${IPV6_ADDR}
socks -p${PORT}

EOF
done

echo "✓ Generated ${OUTPUT_FILE} with ${COUNT} IPv6 proxy instances"
echo "Proxies on ports ${START_PORT}-$((START_PORT + COUNT - 1))"
