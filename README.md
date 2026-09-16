# MAGSTOCK v2

Nowa wersja systemu magazynowego MAGSTOCK.

## Stack
- Web: React + TypeScript + Vite
- API: Node.js + Fastify + TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Auth: JWT + hash PIN
- Barcode: EAN-13 / kamera przeglądarki
- Docker Compose
- GitHub Actions

## Moduly
- logowanie PIN
- role Admin / Pracownik
- licencje pracownikow
- produkty
- EAN-13, Eurocash index, AEN
- kategorie / podgrupy
- MAGAZYN ALKOHOLE
- MAGAZYN NAPOJE
- przyjecia, rozchody, przesuniecia
- stany minimalne
- historia operacji
- CSV import/export
- przygotowanie pod OCR faktur, AI i aktualizacje

## Uruchomienie

1. Skopiuj `.env.example` jako `.env`.
2. Uruchom baze:
   `docker compose up -d db`
3. API:
   `cd apps/api`
   `npm install`
   `npx prisma migrate dev --name init`
   `npm run seed`
   `npm run dev`
4. Web:
   `cd apps/web`
   `npm install`
   `npm run dev`

Domyslny PIN administratora jest pobierany z `ADMIN_PIN` w `.env`.
Przed wdrozeniem produkcyjnym koniecznie zmien PIN i JWT secret.

## Zasada aktualizacji
Kod aplikacji jest rozdzielony od danych i konfiguracji. Aktualizacje maja byc wykonywane przez kontrolowany proces: backup -> migracja -> test -> aktywacja -> rollback przy bledzie.
