# Aktualizacje MAGSTOCK v2

Aktualizacja nie nadpisuje danych magazynowych.

Kolejnosc:
1. backup
2. pobranie nowego kodu
3. build obrazu
4. migracja bazy
5. restart
6. healthcheck
7. pozostawienie poprzedniego backupu do rollbacku

Nigdy nie commituj pliku .env ani rzeczywistych sekretow do repozytorium.
