#!/bin/bash
cd "$(dirname "$0")"
echo "Starting IdleMates Worker..."
npx tsx src/worker/index.ts
