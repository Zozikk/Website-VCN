# VCN IAM — system tożsamości (SSO)

Centralny serwer uwierzytelniania i panel administracyjny do zarządzania użytkownikami, aplikacjami OAuth i uprawnieniami. Integruje się z **VCN Website CMS** oraz innymi aplikacjami w ekosystemie VCN (VnetLPR, Vtools).

## Stack

| Warstwa | Technologia |
|---------|-------------|
| Auth API | Express + better-sqlite3 |
| Panel IAM | React + Vite |
| Demo client | Express + React (opcjonalny przykład integracji) |

## Porty (domyślne)

| Usługa | URL |
|--------|-----|
| Auth API | http://localhost:4000 |
| Panel IAM | http://localhost:5173 |
| VCN Website CMS | http://localhost:3000 |
| VCN Website API | http://localhost:5000 |

## Szybki start (example)

```bash
# 1. Instalacja
cd VCN_IAM
npm install

# 2. Konfiguracja (opcjonalna — działają domyślne wartości)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Uruchomienie auth server + panel IAM
npm run dev:auth
npm run dev:panel
```

W osobnym terminalu uruchom **VCN Website** (patrz `../VCN_Website/README.md`).

## Domyślne konto (seeder)

Po wyczyszczeniu bazy i restarcie serwera tworzone jest konto superadmina:

| Pole | Wartość |
|------|---------|
| E-mail | `kacper.witczak@vcn.pl` |
| Hasło | `Kacper123!` |
| Rola w CMS | `admin` (przez uprawnienie do aplikacji VCN CMS) |

## Integracja z VCN Website CMS

1. W IAM istnieje aplikacja **VCN CMS** z redirect URI: `http://localhost:3000/callback`
2. W `VCN_Website/frontend/.env`:
   ```
   NEXT_PUBLIC_SSO_PANEL_URL=http://localhost:5173
   NEXT_PUBLIC_IAM_APP_ID=1
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```
3. Użytkownik loguje się w CMS → przekierowanie do panelu IAM → powrót z kodem OAuth

Szczegóły flow: `AUTH_LOGIN_GUIDE.md`

## Panel IAM — moduły

- **Użytkownicy** — tworzenie, edycja (e-mail, hasło), usuwanie
- **Aplikacje** — rejestracja klientów OAuth (nazwa, redirect URI, secret key)
- **Uprawnienia** — przypisywanie ról (`viewer`, `editor`, `admin`) do aplikacji

## API admin (wymaga sesji admina)

| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/admin/users` | Lista użytkowników |
| POST | `/api/admin/users` | Utwórz użytkownika |
| PUT | `/api/admin/users/:id` | Edytuj e-mail / hasło |
| DELETE | `/api/admin/users/:id` | Usuń użytkownika |
| GET/POST/PUT/DELETE | `/api/admin/apps` | CRUD aplikacji |
| GET/POST/PUT/DELETE | `/api/admin/permissions` | CRUD uprawnień |

## Czyszczenie bazy danych

```bash
cd backend
npm run db:clean
npm run dev
```

Usuwa plik SQLite i przy następnym starcie tworzy świeżą bazę z seederem.

## Przydatne komendy

```bash
npm run dev              # auth + panel + demo client
npm run dev:auth         # tylko API
npm run dev:panel        # tylko panel IAM
npm run build            # build panelu
npm test                 # testy integracyjne API
```

## Design System

Oba panele (IAM i CMS) korzystają ze wspólnej palety VCN:

- Primary: `#CB1919`
- Tło: `#FFFFFF`
- Tekst: `#333333` / `#666666`
- Obramowania: `#E0E0E0`
- Layout: górny pasek nawigacji (bez sidebara)
