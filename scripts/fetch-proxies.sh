#!/usr/bin/env bash
# Fetch free HTTP proxies from proxifly and store to proxies/http.txt
# Usage: ./scripts/fetch-proxies.sh [output-file]
set -euo pipefail

URL="https://cdn.jsdelivr.net/gh/proxifly/free-proxy-list@main/proxies/protocols/http/data.txt"
OUT_DIR="proxies"
OUT_FILE="${1:-$OUT_DIR/http.txt}"

mkdir -p "$OUT_DIR"

echo "Fetching HTTP proxies from proxifly..."
curl -sL "$URL" -o "$OUT_FILE.raw"

# Normalize: trim, remove comments/empties, ensure host:port format, dedupe
awk 'NF && $0 !~ /^#/ {print $0}' "$OUT_FILE.raw" | sed 's/^\s*//;s/\s*$//' | sort -u > "$OUT_FILE"
rm -f "$OUT_FILE.raw"

COUNT=$(wc -l < "$OUT_FILE" | sed 's/ //g')

echo "Saved $COUNT proxies to $OUT_FILE"
echo "Tip: set STEAM_PROXIES_FILE=$OUT_FILE or place file at $OUT_FILE so ProxyManager picks it up."
