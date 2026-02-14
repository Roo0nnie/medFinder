---
description: Django backend conventions for apps/backend
globs: ["apps/backend/**/*.py"]
alwaysApply: false
---

# Django Backend Rules (`apps/backend/`)

## Directory Organization

```
apps/backend/
├── config/                      # Django project config (not an app)
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py              # Shared settings (DB, INSTALLED_APPS, DRF, CORS)
│   │   ├── development.py       # Dev overrides (DEBUG, etc.)
│   │   └── production.py       # Production overrides
│   ├── urls.py                  # Root URLconf → include api.urls
│   ├── wsgi.py
│   └── asgi.py
├── api/                         # API namespace (not a Django app)
│   ├── urls.py                  # /api/ → v1/
│   └── v1/
│       ├── urls.py              # /api/v1/ → health/, example/, ...
│       ├── health/              # Health check app (GET /api/v1/health/)
│       │   ├── apps.py
│       │   ├── urls.py
│       │   └── views.py
│       └── examples/            # Example feature namespace
│           └── todos/           # Todo feature app
│               ├── apps.py
│               ├── models.py
│               ├── serializers.py
│               ├── services.py  # Business logic (queries, create/update/delete)
│               ├── views.py
│               ├── urls.py
│               └── migrations/
├── core/                        # Shared non-app code
│   └── exceptions.py            # DRF custom exception handler
├── manage.py
├── requirements.txt
└── .env.example
```

## Folder Purposes

| Folder     | Purpose                                      | Example Contents                          |
| ---------- | -------------------------------------------- | ----------------------------------------- |
| `config/`  | Django project settings, WSGI/ASGI, root URLs | base/dev/production settings, urls.py      |
| `api/`     | API routing namespace                        | urlconf only; no models or business logic |
| `api/v1/`  | Versioned API; each subfolder is an app or namespace | health app, examples.todos app      |
| `core/`    | Shared utilities and cross-cutting concerns  | Exception handler, future: mixins, utils  |

### Key Distinctions

- **`config/`** = Project configuration only. No business logic or feature code.
- **`api/`** = URL wiring only. No `models.py`, `views.py`, or app code here.
- **`api/v1/<app>/`** = Django apps (have `apps.py`) or nested namespaces (e.g. `examples/` containing `todos/`).
- **`core/`** = Reusable building blocks used by multiple apps (exception handler, future helpers).

## File Naming Conventions

- **Python**: snake_case for all files and modules (`user_profile.py`, `serializers.py`).
- **Django apps**: One package per feature under `api/v1/` (e.g. `api.v1.health`, `api.v1.examples.todos`).
- **Models**: `models.py` inside the app.
- **API layer**: `views.py`, `serializers.py`, `urls.py` inside the app.
- **Business logic**: `services.py` for functions that perform queries and mutations (no HTTP).
- **Tests**: `tests.py` or `tests/` package inside the app; or at project root `tests/` if preferred.

## Django Apps Under `api/v1/`

- Each feature that has routes or models is a Django app: add to `INSTALLED_APPS` in `config/settings/base.py` with the full dotted path (e.g. `"api.v1.health"`, `"api.v1.examples.todos"`).
- Register URLs in `api/v1/urls.py` with `path("prefix/", include("api.v1.<app>.urls"))`.
- App package must contain `apps.py` with an `AppConfig` (e.g. `name = "api.v1.examples.todos"`, `label = "api_v1_examples_todos"`).

## API Versioning

- All versioned routes live under `api/v1/`, `api/v2/`, etc.
- URL prefix: `/api/v1/`, `/api/v2/`.
- Add a new version by creating `api/v2/urls.py` and including it from `api/urls.py` with `path("v2/", include("api.v2.urls"))`.

## Feature Module Pattern (per app)

Each feature app under `api/v1/` should follow this pattern:

- **models.py** — Django models only. Use `db_table` if you need a specific table name. Prefer explicit `ordering` in Meta.
- **serializers.py** — DRF serializers: one (or more) for response shape (ModelSerializer or Serializer), and separate input serializers for create/update (validation only, no model). Use `SerializerMethodField` or `source=` to expose camelCase fields (e.g. `authorId`, `createdAt`) when the frontend contract expects camelCase.
- **services.py** — Pure business logic: functions that take plain arguments and perform ORM operations. Raise model `DoesNotExist` (or custom exceptions) so views can map to 404/400. No `request` or `Response` here.
- **views.py** — DRF APIView (or ViewSet). Handle HTTP, call serializers for validation and rendering, call `services.*` for persistence. Map exceptions to appropriate status codes (e.g. `Todo.DoesNotExist` → 404).
- **urls.py** — URL patterns for this app only; included by `api/v1/urls.py`.

## Shared Package and Frontend Alignment

- **Contracts**: The monorepo has `@repo/contracts` (Zod schemas, DTOs) for the Next.js app. The Django backend does not import TypeScript packages. Keep API request/response shape aligned with those contracts (e.g. same field names; use camelCase in DRF serializers if the frontend expects camelCase).
- **Database**: This backend uses the **Django ORM** and PostgreSQL. Define models in the backend app; do not use `@repo/db` (Drizzle) from the backend. Run migrations with `python manage.py migrate`.
- **Auth**: Use Django’s `AUTH_USER_MODEL` and DRF authentication (e.g. `SessionAuthentication`). Set `permission_classes` and/or `get_permissions()` per view as needed (e.g. `AllowAny` for health, `IsAuthenticated` for create).

## Configuration

- **Environment**: Load env from backend root `.env` (e.g. in `config/settings/base.py` with `python-dotenv`). Use `os.environ.get()` for `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `DATABASE_URL` (or `PG*`), `CORS_ORIGINS`.
- **Settings**: Split by environment: `base.py` (shared), `development.py`, `production.py`. Set `DJANGO_SETTINGS_MODULE=config.settings.development` (or `.production`) when running or deploying.
- **DRF**: Configure in `base.py` (e.g. `REST_FRAMEWORK`): `DEFAULT_RENDERER_CLASSES`, `DEFAULT_AUTHENTICATION_CLASSES`, `EXCEPTION_HANDLER` (e.g. `core.exceptions.api_exception_handler`).
- **CORS**: Use `django-cors-headers`; add to `MIDDLEWARE` and set `CORS_ALLOWED_ORIGINS` from env.

## Testing

- Prefer tests next to the app: `api/v1/<app>/tests.py` or `api/v1/<app>/tests/` package.
- Use Django’s `TestCase`/`TransactionTestCase` and DRF’s `APIClient`/`APITestCase` for API tests.
- Cover at least: list/create/detail/update/delete and permission behavior where relevant.

## Common Patterns

### View: validate input, call service, return response

```python
# views.py
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Todo
from . import services
from .serializers import TodoListSerializer, TodoCreateInputSerializer

class TodoListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request):
        todos = services.get_all_todos()
        serializer = TodoListSerializer(todos, many=True)
        return Response(serializer.data)

    def post(self, request):
        in_serializer = TodoCreateInputSerializer(data=request.data)
        in_serializer.is_valid(raise_exception=True)
        data = in_serializer.validated_data
        todo = services.create_todo(
            title=data["title"],
            completed=data.get("completed", False),
            author_id=request.user.pk,
        )
        out_serializer = TodoListSerializer(todo)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)
```

### Service: pure functions, no request/response

```python
# services.py
from .models import Todo

def get_all_todos():
    return Todo.objects.all().order_by("-completed", "-updated_at")

def get_todo_by_id(pk):
    return Todo.objects.get(pk=pk)  # raises Todo.DoesNotExist

def create_todo(*, title, completed=False, author_id):
    return Todo.objects.create(
        title=title,
        completed=completed,
        author_id=author_id,
    )
```

### Serializers: output (camelCase if needed) and input validation

```python
# serializers.py
from rest_framework import serializers
from .models import Todo

class TodoListSerializer(serializers.ModelSerializer):
    authorId = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = Todo
        fields = ["id", "title", "completed", "authorId", "createdAt", "updatedAt"]

    def get_authorId(self, obj):
        return str(obj.author_id)

class TodoCreateInputSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255, min_length=1)
    completed = serializers.BooleanField(default=False, required=False)
```

### Handling 404 in detail views

```python
try:
    todo = services.get_todo_by_id(pk)
except Todo.DoesNotExist:
    return Response(
        {"detail": "Todo with ID {pk} not found"},
        status=status.HTTP_404_NOT_FOUND,
    )
```

## Adding a New Feature (AI Guidance)

1. **New app under `api/v1/`**: Create package `api/v1/<feature>/` (or under an existing namespace like `api/v1/examples/<feature>/`).
2. Add `apps.py` with `AppConfig` and register in `config/settings/base.py` `INSTALLED_APPS`.
3. Add `models.py` if the feature has persistence; run `python manage.py makemigrations` and `migrate`.
4. Add `serializers.py` (output + input serializers), `services.py` (business logic), `views.py` (DRF views), `urls.py` (URL patterns).
5. In `api/v1/urls.py`, add `path("<prefix>/", include("api.v1.<app>.urls"))`.
6. Keep URL and response shape aligned with `@repo/contracts` and frontend expectations (camelCase if used there).
7. Add tests in the app’s `tests.py` or `tests/` package.

## Running and Deployment

- **Development**: From monorepo root `pnpm dev:backend`, or from `apps/backend` with venv: `python manage.py runserver 0.0.0.0:3000`.
- **Production**: Use Gunicorn, e.g. `gunicorn config.wsgi:application --bind 0.0.0.0:3000`, with `DJANGO_SETTINGS_MODULE=config.settings.production`.
- **Environment variables**: Document all required and optional vars in `.env.example` and keep it in sync with `config/settings/base.py`.
