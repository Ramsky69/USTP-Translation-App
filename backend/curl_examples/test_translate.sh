#!/usr/bin/env bash
# POSIX test script for the /api/translate endpoint

set -euo pipefail
body='{"text":"Hello world","target":"es"}'
echo "Sending request to http://localhost:3000/api/translate"
curl -s -X POST http://localhost:3000/api/translate -H "Content-Type: application/json" -d "$body" | jq || true
