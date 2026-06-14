#!/bin/bash
# bimi-check.sh
# Usage: ./bimi-check.sh yourdomain.com

DOMAIN=$1
if [ -z "$DOMAIN" ]; then
  echo "Usage: $0 domain.com"
  exit 1
fi

echo "🔍 Checking BIMI for: $DOMAIN"

RECORD=$(dig +short TXT default._bimi.$DOMAIN)
if [ -z "$RECORD" ]; then
  echo "❌ No BIMI record found at default._bimi.$DOMAIN"
  exit 1
fi

echo "✅ BIMI record found:"
echo "$RECORD"

LOGO_URL=$(echo "$RECORD" | grep -o 'https[^"]*svg')
VMC_URL=$(echo "$RECORD" | grep -o 'https[^"]*pem')

echo ""
echo "��️  Logo URL: $LOGO_URL"
if [ -z "$LOGO_URL" ]; then
  echo "❌ No logo URL found in BIMI record"
else
  curl -s -o /tmp/bimi.svg "$LOGO_URL"
  if file /tmp/bimi.svg | grep -qi 'SVG'; then
    echo "✅ SVG logo file is accessible and valid format"
  else
    echo "❌ SVG logo file is invalid or inaccessible"
  fi
fi

echo ""
if [ -n "$VMC_URL" ]; then
  echo "🔏 VMC Certificate found: $VMC_URL"
else
  echo "⚠️  No VMC Certificate in record — Gmail won’t display your logo without one."
fi
