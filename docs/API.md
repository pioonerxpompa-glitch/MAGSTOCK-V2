# MAGSTOCK API

Auth: POST /auth/login, GET /me
Magazyny: GET /warehouses
Kategorie: GET/POST /categories, PUT/DELETE /categories/:id
Produkty: GET /products, GET /products/:id, GET /products/by-ean/:ean, POST/PUT/DELETE /products
Dane: GET /products/export.csv, POST /products/import-csv
Duplikaty: GET /products/duplicates, POST /products/merge
Magazyn: POST /inventory/transaction, POST /inventory/transfer, POST /inventory/stocktake, GET /inventory/history
Licencje: GET/POST /licenses, GET /users
Diagnostyka: GET /health, GET /health/deep
