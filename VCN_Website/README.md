# VCN Website — CMS i strona publiczna

System zarządzania treścią (CMS) oraz publiczna witryna VCN. Logowanie do panelu odbywa się przez **VCN IAM** (SSO).

## Stack

| Warstwa | Technologia |
|---------|-------------|
| Backend API | Express + Sequelize + SQLite |
| Frontend | Next.js 16 + React 19 + Tailwind v4 |
| Auth | VCN IAM (OAuth code flow) |

## Porty (domyślne)

| Usługa | URL |
|--------|-----|
| Frontend (Next.js) | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| VCN IAM Panel | http://localhost:5173 |
| VCN IAM API | http://localhost:4000 |

## Szybki start (example)

### Wymagania wstępne

Uruchom **VCN IAM** przed CMS (patrz `../VCN_IAM/README.md`).

### 1. Backend

```bash
cd VCN_Website/backend
npm install
cp .env.example .env   # jeśli istnieje
npm run dev
```

Backend nasłuchuje na porcie **5000** i automatycznie:
- tworzy schemat bazy SQLite
- seeduje admina: `kacper.witczak@vcn.pl` / `Kacper123!`
- seeduje tagi: `vnetlpr`, `vtools`, `vcn-website`

### 2. Frontend

```bash
cd VCN_Website/frontend
npm install
```

Utwórz `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SSO_PANEL_URL=http://localhost:5173
NEXT_PUBLIC_IAM_APP_ID=1
```

```bash
npm run dev
```

### 3. Logowanie

1. Otwórz http://localhost:3000/login
2. Kliknij **Zaloguj przez VCN**
3. Zaloguj się w panelu IAM: `kacper.witczak@vcn.pl` / `Kacper123!`
4. Zostaniesz przekierowany do panelu CMS: http://localhost:3000/dashboard

## Panel CMS — moduły

| Ścieżka | Opis |
|---------|------|
| `/dashboard` | Lista stron, filtry (status, typ, **tag**), tabela |
| `/dashboard/new` | Tworzenie strony |
| `/dashboard/edit/[id]` | Edycja z podglądem i historią wersji |
| `/dashboard/redirects` | Redirecty SEO |
| `/dashboard/tags` | Zarządzanie tagami produktowymi |

## Tagi produktowe

Tagi służą do kategoryzacji stron według produktów ekosystemu VCN:

- Domyślne: `vnetlpr`, `vtools`, `vcn-website`
- Nowe tagi dodajesz w **Panel → Tagi**
- Przypisujesz je przy edycji strony
- Filtrujesz listę stron po tagu na dashboardzie

## API (wybrane endpointy)

| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/pages?tag=vnetlpr` | Lista stron z filtrem tagu |
| GET/POST | `/api/tags` | Lista / tworzenie tagów |
| GET/POST/PUT/DELETE | `/api/pages` | CRUD stron |
| GET/POST | `/api/redirects` | Redirecty SEO |

## Czyszczenie bazy danych

```bash
cd backend
npm run db:clean
npm run dev
```

Usuwa wszystkie strony, tagi, redirecty i użytkowników. Po restarcie serwera seeder odtwarza konto admina i domyślne tagi.

## Połączenie z VCN IAM — checklist

- [ ] IAM auth server działa na `:4000`
- [ ] IAM panel działa na `:5173`
- [ ] W IAM istnieje aplikacja **VCN CMS** z redirect `http://localhost:3000/callback`
- [ ] Użytkownik ma uprawnienie `admin` do aplikacji CMS w IAM
- [ ] `NEXT_PUBLIC_IAM_APP_ID` w frontendzie = ID aplikacji CMS z IAM
- [ ] CORS w backendzie CMS zezwala na `http://localhost:3000`

## Design System

Wspólny z panelem IAM:

- Primary: `#CB1919`
- Tło: `#FFFFFF`
- Layout: górny pasek nawigacji
- Komponenty: `page-section`, `ds-input`, `ds-table`, `Button`

## Struktura projektu

```
VCN_Website/
├── backend/          # Express API, Sequelize, SQLite
│   └── src/
│       ├── models/   # Page, Tag, User, RedirectRule...
│       ├── scripts/  # db:clean, importy
│       └── utils/    # seedDefaultAdmin, seedDefaultTags
└── frontend/         # Next.js App Router
    └── src/
        ├── app/(admin)/dashboard/   # Panel CMS
        └── components/admin/        # TopBar, PageEditor...
```

Więcej szczegółów architektury: `project-notes/analysis.md`
