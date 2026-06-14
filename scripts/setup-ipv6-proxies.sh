#!/bin/bash

# Setup IPv6 addresses for proxy rotation
# This creates 50 unique IPv6 addresses from your /64 subnet

INTERFACE="eth0"
IPV6_PREFIX="2a00:ccc1:101:20"
START_INDEX=100
COUNT=50

echo "Setting up $COUNT IPv6 addresses on $INTERFACE..."

for i in $(seq 0 $((COUNT-1))); do
    IP_INDEX=$((START_INDEX + i))
    IPV6_ADDR="${IPV6_PREFIX}::${IP_INDEX}"
    
    # Add IPv6 address to interface
    ip -6 addr add ${IPV6_ADDR}/64 dev ${INTERFACE} 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "✓ Added ${IPV6_ADDR}"
    fi
done

echo "✓ IPv6 addresses configured"
echo "Total addresses: $(ip -6 addr show ${INTERFACE} | grep '2a00:ccc1:101:20' | wc -l)"
