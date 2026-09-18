#!/usr/bin/env bash
set -Eeuo pipefail
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

git pull
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy
docker compose -f docker-compose.prod.yml run --rm api npm run seed
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps
echo "MAGSTOCK update completed."
