#!/usr/bin/env sh
set -eu
test -n "${POSTGRES_PASSWORD:-}" || { echo "Brak POSTGRES_PASSWORD"; exit 1; }
test -n "${JWT_SECRET:-}" || { echo "Brak JWT_SECRET"; exit 1; }
test -n "${ADMIN_PIN:-}" || { echo "Brak ADMIN_PIN"; exit 1; }
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
sleep 5
docker compose -f docker-compose.prod.yml run --rm api sh -c 'npx prisma migrate deploy'
./scripts/healthcheck.sh
