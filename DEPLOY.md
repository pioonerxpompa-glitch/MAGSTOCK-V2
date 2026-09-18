# MAGSTOCK — instalacja

Wymagania: Linux, Docker Engine, Docker Compose v2 i istniejący PostgreSQL.

1. git clone https://github.com/pioonerxpompa-glitch/MAGSTOCK-V2.git
2. cd MAGSTOCK-V2
3. cp .env.example .env
4. nano .env
5. chmod +x scripts/install.sh scripts/update.sh
6. ./scripts/install.sh

Ustaw w .env:
DATABASE_URL — adres istniejącej bazy PostgreSQL
JWT_SECRET — długi losowy sekret
ADMIN_PIN — początkowy PIN administratora
WEB_ORIGIN — publiczny adres aplikacji
VITE_API_URL — adres API dostępny z przeglądarki

Instalator buduje kontenery, wykonuje migracje Prisma, tworzy MAGAZYN ALKOHOLE i MAGAZYN NAPOJE oraz administratora.

Aktualizacja:
git pull
./scripts/update.sh

Diagnostyka:
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f web

WAŻNE: przed migracją istniejącej bazy wykonaj backup. Jeśli baza zawiera dane starego MAGSTOCK, najpierw trzeba zweryfikować jej schemat.
