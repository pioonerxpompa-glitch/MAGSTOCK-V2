#!/usr/bin/env sh
set -eu
if [ "$#" -ne 1 ]; then
  echo "Uzycie: ./scripts/restore.sh backups/magstock.sql"
  exit 1
fi
FILE="$1"
test -f "$FILE"
docker compose -f docker-compose.prod.yml exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < "$FILE"
echo "Restore zakonczony: $FILE"
