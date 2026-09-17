#!/usr/bin/env sh
set -eu

echo "== MAGSTOCK UPDATE =="
echo "1/5 Backup"
./scripts/backup.sh

echo "2/5 Pull"
git fetch --all
git checkout main
git pull --ff-only origin main

echo "3/5 Build"
docker compose -f docker-compose.prod.yml build

echo "4/5 Database"
docker compose -f docker-compose.prod.yml run --rm api sh -c 'npx prisma migrate deploy'

echo "5/5 Restart + health"
docker compose -f docker-compose.prod.yml up -d
sleep 5
./scripts/healthcheck.sh

echo "UPDATE OK"
