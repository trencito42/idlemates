#!/bin/bash
# Generate multiple proxy configs for different ports on one IP
IP="$(curl -s ifconfig.me)"
BASE_PORT=9000
COUNT=10

for ((i=0; i<$COUNT; i++)); do
  PORT=$((BASE_PORT + i))
  echo "socks5://$IP:$PORT"
done
