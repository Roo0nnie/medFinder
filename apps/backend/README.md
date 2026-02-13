# @repo/backend

Django API server with versioned REST API (Option A structure).

## Tech Stack

- **Framework**: Django 5 + Django REST Framework
- **Database**: PostgreSQL (Django ORM)
- **CORS**: django-cors-headers
- **Production server**: Gunicorn

## Structure (Option A)

```
apps/backend/
├── config/                 # Django project config
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py             # Root → api/
│   ├── wsgi.py
│   └── asgi.py
├── api/
│   ├── urls.py             # /api/ → v1/
│   └── v1/
│       ├── urls.py         # /api/v1/ → health, example/
│       ├── health/         # GET /api/v1/health/
│       └── examples/
│           └── todos/      # CRUD /api/v1/example/todos/
├── core/                   # Shared (exceptions, etc.)
├── manage.py
├── requirements.txt
└── .env.example
```

## Development

```bash
# From monorepo root
pnpm dev:backend

# Or from apps/backend (with venv activated)
python manage.py runserver 0.0.0.0:3000
```

Runs on [http://localhost:3000](http://localhost:3000)

## First-time setup

```bash
cd apps/backend
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your DATABASE_URL and CORS_ORIGINS
python manage.py migrate
python manage.py runserver 0.0.0.0:3000
```

## Environment Variables

| Variable        | Required | Description                          |
| --------------- | -------- | ------------------------------------ |
| `DATABASE_URL`  | Yes      | PostgreSQL connection string         |
| `SECRET_KEY`    | Yes      | Django secret (change in production) |
| `DEBUG`         | No       | true/false (default: true)           |
| `ALLOWED_HOSTS` | No       | Comma-separated (required in prod)   |
| `CORS_ORIGINS`  | Yes      | Comma-separated CORS origins         |

See `.env.example` for reference.

## API Endpoints

- **Health**: `GET /api/v1/health/` — Returns server status and database connectivity
- **Todos**: `GET/POST /api/v1/example/todos/` — List and create
- **Todo detail**: `GET/PUT/DELETE /api/v1/example/todos/<id>/` — Get, update, delete

Create todo requires authentication (Django session or custom auth). List/Get/Update/Delete are currently allowed for all; tighten permissions as needed.

## Scripts

| Command      | Description            |
| ------------ | ---------------------- |
| `pnpm dev`   | Run development server |
| `pnpm start` | Run with Gunicorn      |
| `pnpm build` | No-op (for Turbo)      |
