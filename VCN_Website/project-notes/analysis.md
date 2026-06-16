# VCN Website - Project Analysis Notes

## 1) Repo structure
- backend/: Express + Sequelize + SQLite API (CMS backend)
- frontend/: Next.js App Router (public site + CMS admin)
- final-json/: JSON content export used by import scripts
- package-lock.json at repo root (subprojects have their own package.json)

## 2) Backend (backend/)
Runtime & stack:
- Node.js app (Express 5.x), Sequelize ORM, SQLite storage
- Auth: JWT + bcryptjs
- Validation: Zod
- Security headers: helmet, CORS configured

Entry + startup:
- src/server.js starts the app, authenticates DB, syncs models, ensures page columns, seeds default admin
- src/app.js wires middleware + routes and exposes /health, /health/ready

Config:
- src/config/env.js defines PORT, JWT secrets/TTL, preview token secrets, CORS origins,
  FRONTEND_BASE_URL, and revalidate secret
- src/config/database.js configures SQLite storage (default: ./database.sqlite)

Models:
- User (admin/editor, passwordHash)
- Page (CMS page with html/css/js + rendered variants + version + publish flag)
- PageVersion (snapshot history)
- RedirectRule (SEO redirects)
- Associations defined in src/models/index.js

Core routes:
- /api/auth: register, login
- /api/pages: CRUD, global layout (header/footer), page versions, publish version, preview tokens
- /api/redirects: list/create (admin), resolve public redirect

Content pipeline:
- src/utils/contentPipeline.js: sanitize HTML, scope CSS to page slug, validate JS (forbidden APIs),
  wrap JS in safe runtime, ensure CSS root ID

Middleware:
- authMiddleware (JWT)
- authorizeRoles
- validateRequest (Zod)
- errorMiddleware (JSON error response)
- requestMetricsMiddleware (logs request timing + request id)

Scripts (selected):
- importFromJson.js: imports pages from final-json/ (one folder per page with index.json)
- importWordpressSql.js: migrates WordPress SQL dump into pages + report
- importHomepageDump.js: parses a static HTML dump into home page
- cleanDatabase.js: deletes all DB rows
- additional scripts present: importKariera.js, importOldPages.js

## 3) Frontend (frontend/)
Runtime & stack:
- Next.js 16.x (App Router) + React 19.x + TypeScript
- Styling: Tailwind via @tailwindcss/postcss

Public site flow:
- / (home): uses slug "home" from backend, loads global header/footer
- /[...slug]: dynamic pages; fetches CMS page, uses ISR revalidate=60s,
  resolves backend redirects if page missing
- /preview/[token]: draft preview for CMS pages via backend preview token

Admin area:
- /login: CMS login, stores JWT in localStorage
- /dashboard: list pages, search/filter, delete
- /dashboard/new: create page
- /dashboard/edit/[id]: edit page + version history + publish snapshot + preview token
- /dashboard/redirects: manage SEO redirects
- (admin) layout: redirects to /login if no token

Components (selected):
- PageEditor: form for HTML/CSS/JS with live iframe preview
- CmsScriptRunner: executes backend-provided JS in the browser with (root, pageContext)
- PublicShell: adds Header/Footer for public routes only

Client API:
- src/lib/api.ts: typed client for backend endpoints
  - NEXT_PUBLIC_API_URL default http://localhost:5000
  - uses no-store by default unless revalidate is set (safe for admin/preview)
- src/lib/session.ts: JWT in localStorage with exp validation
- src/lib/types.ts: shared CMS types

Revalidation:
- /api/revalidate: expects NEXT_REVALIDATE_SECRET, calls revalidatePath()

## 4) Data / content
- final-json/ contains many page folders with index.json (some slugs include emojis)
- backend/database.sqlite exists in repo (local data)

## 5) Notes / risks
- Backend seeds a default admin user on startup (hardcoded credentials in code).
- Avoid leaking secrets from .env; adjust JWT/preview/revalidate secrets in env for production.
