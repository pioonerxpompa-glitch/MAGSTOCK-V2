#!/usr/bin/env bash
set -Eeuo pipefail
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

command -v docker >/dev/null 2>&1 || { echo "ERROR: Docker is required."; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "ERROR: Docker Compose v2 is required."; exit 1; }

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env. Fill in PostgreSQL credentials and secrets, then run this script again."
  exit 2
fi

set -a
source .env
set +a

if [[ "$DATABASE_URL" == *"DB_USER"* || "$DATABASE_URL" == *"DB_PASSWORD"* || "$DATABASE_URL" == *"DB_HOST"* || "$ADMIN_PIN" == "CHANGE_ME" || "$JWT_SECRET" == *"CHANGE_ME"* ]]; then
  echo "ERROR: .env is not configured."
  exit 2
fi

docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy
docker compose -f docker-compose.prod.yml run --rm api npm run seed
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps
echo "MAGSTOCK installation completed."
