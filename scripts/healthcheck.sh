#!/usr/bin/env sh
set -eu
URL="${MAGSTOCK_HEALTH_URL:-http://localhost:4000/health}"
curl --fail --silent --show-error "$URL"
echo
