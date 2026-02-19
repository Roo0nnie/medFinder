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

## Prerequisites

- **Python 3** (3.10+ recommended). Install from [python.org](https://www.python.org/downloads/) or `winget install Python.Python.3.12`.
- **Windows**: If you see `No runtimes are installed` when running `pnpm dev:backend`, register Python with the launcher:
  ```powershell
  py install default
  ```
- **PostgreSQL** for the database (see `DATABASE_URL` in Environment Variables).

## Development

```bash
# From monorepo root
pnpm dev:backend

# Or from apps/backend (with venv activated)
python manage.py runserver 0.0.0.0:3000
```

Runs on [http://localhost:8000](http://localhost:8000) by default. The port is read from `PORT` in `.env`.

**Port in use or "permission to access that port"**: Set `PORT=8000` in `apps/backend/.env`, then set `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api` in `apps/web/.env` so the frontend talks to the API on the new port.

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

| Variable        | Required | Description                                             |
| --------------- | -------- | ------------------------------------------------------- |
| `DATABASE_URL`  | Yes      | PostgreSQL connection string                            |
| `SECRET_KEY`    | Yes      | Django secret (change in production)                    |
| `DEBUG`         | No       | true/false (default: true)                              |
| `ALLOWED_HOSTS` | No       | Comma-separated (required in prod)                      |
| `CORS_ORIGINS`  | Yes      | Comma-separated CORS origins                            |
| `PORT`          | No       | Port for runserver (default: 3000). Used by dev script. |

See `.env.example` for reference.

## API Endpoints

- **Health**: `GET /api/v1/health/` — Returns server status and database connectivity
- **Todos**: `GET/POST /api/v1/example/todos/` — List and create
- **Todo detail**: `GET/PUT/DELETE /api/v1/example/todos/<id>/` — Get, update, delete

Create todo requires authentication (Django session or custom auth). List/Get/Update/Delete are currently allowed for all; tighten permissions as needed.

## Auth & permissions (NestJS → Django)

This backend uses **Django REST Framework** for auth and permissions. There is no NestJS or Reflector in this repo.

| NestJS                                                       | Django / DRF equivalent                                                                                                                                           |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Guards** (e.g. `JwtAuthGuard`, `RolesGuard`)               | **`permission_classes`** on the view: `[IsAuthenticated]`, `[IsOwner]`, custom permission classes                                                                 |
| **Reflector + decorators** (`@Public()`, `@Roles('admin')`)  | **Permission classes** that implement `has_permission(request, view)` (and optionally `has_object_permission`)                                                    |
| **`reflector.getAllAndOverride('roles', [handler, class])`** | Implement a **DRF `BasePermission`** and attach it to the view; no metadata/reflector — the view class declares `permission_classes = [IsAuthenticated, IsOwner]` |
| **Route protection**                                         | Same: set `permission_classes` on the view (or use `get_permissions()` for method-specific rules)                                                                 |

### Do not copy from NestJS

- **No Reflector or decorator-based metadata** — use DRF permission classes and `permission_classes` / `get_permissions()`.
- **No global guards** — use DRF `DEFAULT_PERMISSION_CLASSES` in settings and override per view.
- **No `getAllAndOverride`** — that API does not exist in Django; the error `Cannot read properties of undefined (reading 'getAllAndOverride')` means some **other process** (e.g. an old NestJS app) is still serving the request. Ensure only Django is bound to the API port (e.g. 3000).

### Example: role-based access

- **`api/v1/users/permissions.py`** defines `IsAdmin`, `IsOwner`, `IsSelfOrAdmin`, etc.
- **Views** use them: `permission_classes = [IsAuthenticated, IsOwner]` for create/update/delete.
- **Method-specific:** override `get_permissions()` (e.g. in `StaffDetailView`: require `IsOwner` only for PUT/DELETE).

### Root URL and errors

- **GET /** is handled by Django (`config/views.root_view`) and returns `{ "message": "MedFinder API", "api": "/api/v1/", ... }`. If you see a different response (e.g. a NestJS-style error), another server is bound to that port.
- **API errors** use a consistent `{ "error": { "code", "message" }, "meta": { "traceId", "timestamp" } }` shape (see `core/exceptions.api_exception_handler`).

## Scripts

| Command      | Description            |
| ------------ | ---------------------- |
| `pnpm dev`   | Run development server |
| `pnpm start` | Run with Gunicorn      |
| `pnpm build` | No-op (for Turbo)      |
