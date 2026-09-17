# MAGSTOCK v2 — wdrozenie

## Produkcja
1. Ustaw: POSTGRES_PASSWORD, JWT_SECRET, ADMIN_PIN, WEB_ORIGIN.
2. Uruchom: docker compose -f docker-compose.prod.yml up -d --build
3. Wykonaj migracje Prisma.
4. Wykonaj backup.
5. Sprawdz health: ./scripts/healthcheck.sh

## Backup
./scripts/backup.sh

## Restore
./scripts/restore.sh backups/nazwa.sql

## Aktualizacja
backup -> migracja -> build -> healthcheck -> aktywacja -> rollback przy bledzie
