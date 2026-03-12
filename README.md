# MedFinder

A TypeScript-first monorepo using **Turborepo** and **pnpm** for full-stack development: Next.js web app, Django REST API, and optional Flutter mobile client.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MONOREPO                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  apps/                                                                       │
│  ├── web (Next.js)     ──►  REST API  ──►  backend (Django)  ──►  PostgreSQL │
│  │   Port 8001              /api/v1/        Port 8000 (or .env PORT)          │
│  │   • Tailwind, shadcn/ui • TanStack Query • Django ORM + DRF               │
│  │   • @repo/auth (Better Auth)            • Gunicorn (prod)                 │
│  │   • @repo/contracts (Zod/DTOs)                                            │
│  │                                                                           │
│  └── mobile (Flutter)  ──►  same REST API (optional client)                  │
│                                                                              │
│  packages/ (shared by web, tooling)                                          │
│  ├── auth/     Better Auth config & instance                                 │
│  ├── contracts/  Zod schemas, DTOs, API contracts                            │
│  └── db/       Drizzle schema & client (tooling / type sync; backend uses     │
│                Django ORM for persistence)                                   │
│                                                                              │
│  tooling/  ESLint, Prettier, TypeScript base configs                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

- **Web** talks to **Backend** over HTTP at `NEXT_PUBLIC_API_BASE_URL` (e.g. `http://localhost:8000/api`). The API is versioned under `/api/v1/`.
- **Backend** is Django + Django REST Framework; it uses **PostgreSQL** via Django ORM. It runs as **Python only** at runtime (no Node); the monorepo starts it via a small Node script that invokes the backend’s virtualenv.
- **Shared packages** (`@repo/auth`, `@repo/contracts`, `@repo/db`) are used by the **web** app and tooling; the backend does not use them at runtime.

### How the backend works

- **Entrypoint**: From the repo, `pnpm dev` (or `pnpm dev:backend`) runs the backend’s `dev` script, which runs `node run-dev.mjs`. That script does **not** run Django in Node; it spawns **Python** and runs `manage.py runserver`.
- **Python environment**: The script prefers `apps/backend/.venv` (creation and `pip install -r requirements.txt` are one-time setup). If no venv exists, it falls back to system `python3` / `python` (Django must be installed there).
- **Port**: Backend port comes from `apps/backend/.env` (`PORT`, default `8000`). The web app’s `NEXT_PUBLIC_API_BASE_URL` must match (e.g. `http://localhost:8000/api`).
- **Django layout**:
  - **Project**: `config` (settings in `config/settings/base.py`, `development.py`, `production.py`).
  - **Root URL** `GET /` returns a short JSON description and points to `/api/v1/` and `/api/v1/health/`.
  - **API mount**: All versioned routes live under `/api/` → `api.urls` → `api/v1/` → `api.v1.urls` (health, users, staff).
- **API versioning**: Current version is **v1**. Routes are grouped under `/api/v1/` (e.g. `/api/v1/health/`, `/api/v1/users/`, `/api/v1/staff/`). Implementations live in `api/v1/<app>/` (views, serializers, urls, models).
- **Stack**: Django ORM + PostgreSQL, DRF (JSON renderer, session auth), `django-cors-headers`, `python-dotenv`. Production uses **Gunicorn** (see `start` script in `apps/backend/package.json`).

## Tech Stack

| Layer     | Technology                                                         |
| --------- | ------------------------------------------------------------------ |
| Frontend  | Next.js 16, Tailwind CSS, shadcn/ui                                |
| Backend   | Django 5 + DRF, REST API                                           |
| Mobile    | Flutter                                                            |
| Database  | PostgreSQL (Django ORM; Drizzle in packages/db for schema/tooling) |
| Auth      | Better Auth (web)                                                  |
| Contracts | Zod schemas + DTOs (packages)                                      |

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment files (copy from .env.example)
cp apps/backend/.env.example apps/backend/.env
cp apps/web/.env.example apps/web/.env
cp packages/db/.env.example packages/db/.env

# Backend: create virtualenv, install Python deps, run migrations
# Linux/macOS:
cd apps/backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt && .venv/bin/python manage.py migrate && cd ../..
# Windows (PowerShell):
# cd apps\backend; python -m venv .venv; .\.venv\Scripts\activate; pip install -r requirements.txt; python manage.py migrate; cd ..\..

# Build packages (required for first run)
pnpm build

# Generate AI agent rules (optional)
pnpm dlx @intellectronica/ruler apply

# Start development (web on 8001, backend on port from apps/backend/.env, default 8000)
pnpm dev
```

## Project Structure

```
├── apps/
│   ├── web/           # Next.js frontend (port 8001)
│   ├── backend/       # Django API (port from .env PORT, default 8000)
│   │   ├── config/    # Django project (settings, root urls, wsgi)
│   │   ├── api/       # Versioned API: api/urls → api/v1/ (health, users, staff)
│   │   ├── manage.py
│   │   ├── run-dev.mjs   # Node script that starts Django via .venv Python
│   │   └── requirements.txt
│   └── mobile/        # Flutter app
├── packages/
│   ├── auth/          # Shared Better Auth config
│   ├── contracts/     # API contracts & DTOs (Zod)
│   └── db/            # Drizzle schema & client (shared types / tooling)
└── tooling/           # Shared configs (ESLint, Prettier, TypeScript)
```

## Environment Variables

### Backend (`apps/backend/.env`)

| Variable        | Required | Description                                             |
| --------------- | -------- | ------------------------------------------------------- |
| `DATABASE_URL`  | Yes      | PostgreSQL connection string                            |
| `SECRET_KEY`    | Yes      | Django secret (change in production)                    |
| `PORT`          | No       | Server port (default 8000); set if you use another port |
| `DEBUG`         | No       | Set to false in production                              |
| `ALLOWED_HOSTS` | No       | Comma-separated hosts (production)                      |
| `CORS_ORIGINS`  | Yes      | Comma-separated CORS origins (e.g. web app URL)         |

### Web (`apps/web/.env`)

| Variable                   | Required | Description           |
| -------------------------- | -------- | --------------------- |
| `NEXT_PUBLIC_APP_URL`      | Yes      | Web app URL           |
| `NEXT_PUBLIC_API_BASE_URL` | Yes      | Backend API base URL  |
| `NEXT_PUBLIC_API_VERSION`  | No       | API version (e.g. v1) |

### Database (`packages/db/.env`)

| Variable       | Required | Description                  |
| -------------- | -------- | ---------------------------- |
| `DATABASE_URL` | Yes      | PostgreSQL connection string |

## Scripts

| Command            | Description                |
| ------------------ | -------------------------- |
| `pnpm dev`         | Start all apps in dev mode |
| `pnpm dev:web`     | Start only web app         |
| `pnpm dev:backend` | Start only backend         |
| `pnpm dev:mobile`  | Start only mobile app      |
| `pnpm build`       | Build all apps             |
| `pnpm lint`        | Run ESLint                 |
| `pnpm typecheck`   | Run TypeScript checks      |
| `pnpm format:fix`  | Format code with Prettier  |
| `pnpm db:push`     | Push Drizzle schema        |
| `pnpm db:studio`   | Open Drizzle Studio        |

## Shared Packages

Used by the **web** app (and tooling). Backend is Django and does not use these at runtime.

```typescript
// Auth configuration (web)
import { auth } from "@repo/auth"
// API contracts & DTOs
import { CreateTodoDto, TodoSchema } from "@repo/contracts"
// Database client & schema (Drizzle; optional for web/tooling)
import { db } from "@repo/db"
import { todos, users } from "@repo/db/schema"
```

## Deployment

This template includes Docker and AWS ECS configurations:

- **Docker**: `docker-compose.yml` for local containerized development
- **CI/CD**: GitHub Actions workflows for staging and production
- **AWS**: ECS task definitions in `aws/ecs/`

See `aws/setup-guide.md` for deployment instructions.

## Links

- [Turborepo](https://turbo.build/docs) · [Next.js](https://nextjs.org/docs) · [Django](https://docs.djangoproject.com/) · [Drizzle](https://orm.drizzle.team/) · [Better Auth](https://better-auth.com/docs)

1. Create and activate a virtualenv (recommended)
   From apps/backend:

cd ~/software/medFinder/apps/backend
python3 -m venv .venv
source .venv/bin/activate

2. Install backend dependencies
   Still in apps/backend with the venv active:
   pip install --upgrade pippip install -r requirements.txt

pip install --upgrade pip
pip install -r requirements.txt

3. Run migrations

python manage.py migrate

From now on, whenever you work on the Django backend, first run:
cd ~/software/medFinder/apps/backendsource .venv/bin/activate
so python / python3 sees the installed Django.
