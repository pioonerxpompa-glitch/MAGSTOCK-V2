# Architektura MAGSTOCK v2

Web -> API -> Prisma -> PostgreSQL

Sekrety w .env. Dane magazynowe w bazie. Produkcyjna aktualizacja: backup -> migracja -> test -> aktywacja -> rollback.
