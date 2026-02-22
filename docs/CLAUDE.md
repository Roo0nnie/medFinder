

<!-- Source: .ruler/backend-rules.md -->

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
│   │   └── production.py        # Production overrides
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
- **Auth**: Use Django's `AUTH_USER_MODEL` and DRF authentication (e.g. `SessionAuthentication`). Set `permission_classes` and/or `get_permissions()` per view as needed (e.g. `AllowAny` for health, `IsAuthenticated` for create).

## Configuration

- **Environment**: Load env from backend root `.env` (e.g. in `config/settings/base.py` with `python-dotenv`). Use `os.environ.get()` for `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `DATABASE_URL` (or `PG*`), `CORS_ORIGINS`.
- **Settings**: Split by environment: `base.py` (shared), `development.py`, `production.py`. Set `DJANGO_SETTINGS_MODULE=config.settings.development` (or `.production`) when running or deploying.
- **DRF**: Configure in `base.py` (e.g. `REST_FRAMEWORK`): `DEFAULT_RENDERER_CLASSES`, `DEFAULT_AUTHENTICATION_CLASSES`, `EXCEPTION_HANDLER` (e.g. `core.exceptions.api_exception_handler`).
- **CORS**: Use `django-cors-headers`; add to `MIDDLEWARE` and set `CORS_ALLOWED_ORIGINS` from env.

## Testing

- Prefer tests next to the app: `api/v1/<app>/tests.py` or `api/v1/<app>/tests/` package.
- Use Django's `TestCase`/`TransactionTestCase` and DRF's `APIClient`/`APITestCase` for API tests.
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
7. Add tests in the app's `tests.py` or `tests/` package.

## Running and Deployment

- **Development**: From monorepo root `pnpm dev:backend`, or from `apps/backend` with venv: `python manage.py runserver 0.0.0.0:3000`.
- **Production**: Use Gunicorn, e.g. `gunicorn config.wsgi:application --bind 0.0.0.0:3000`, with `DJANGO_SETTINGS_MODULE=config.settings.production`.
- **Environment variables**: Document all required and optional vars in `.env.example` and keep it in sync with `config/settings/base.py`.



<!-- Source: .ruler/co-locate-types.md -->

---
description: Co-locate types with their usage instead of separate type-only files
globs: ["apps/**/*.ts", "apps/**/*.tsx"]
alwaysApply: true
---

# Co-locate Types Rule

## Rule: Avoid Separate Type-Only Files

**Guideline:** Do NOT create separate files that only contain type definitions. Instead, co-locate types with the code that uses them.

**Scope:** This rule applies to application code in `apps/`. Shared packages (`packages/`) have different requirements.

### What are Type-Only Files?

Type-only files are files that contain only TypeScript type definitions, interfaces, or enums without any runtime code:

```typescript
// ❌ BAD - Separate type-only file (types/user.types.ts)
export interface User {
	id: string
	name: string
	email: string
}

export type UserRole = "admin" | "user" | "guest"

export interface UserPreferences {
	theme: "light" | "dark"
	notifications: boolean
}
```

### Why Avoid Separate Type-Only Files?

1. **Context Loss**: Types are separated from the code that uses them
2. **Navigation Overhead**: Developers must jump between files to understand types
3. **Maintenance Burden**: Types and implementation can get out of sync
4. **Import Complexity**: Unnecessary import statements for simple types
5. **File Proliferation**: Creates many small files that could be consolidated

### Preferred Approach: Co-locate Types

**✅ GOOD - Types with their usage:**

```typescript
// components/user-profile.tsx
interface User {
	id: string
	name: string
	email: string
}

type UserRole = "admin" | "user" | "guest"

export function UserProfile({ user }: { user: User }) {
	// Component implementation using User type
}
```

**✅ GOOD - Types in the same feature directory:**

```typescript
// features/user-management/api/user.router.ts
interface CreateUserRequest {
	name: string
	email: string
	role: UserRole
}

export const userRouter = createTRPCRouter({
	create: publicProcedure
		.input(
			z.object({
				name: z.string(),
				email: z.string().email(),
				role: z.enum(["admin", "user", "guest"]),
			})
		)
		.mutation(async ({ input }) => {
			// Implementation using CreateUserRequest type
		}),
})
```

**✅ GOOD - Shared types in the same module:**

```typescript
// features/user-management/lib/user.utils.ts
export interface User {
	id: string
	name: string
	email: string
}

export type UserRole = "admin" | "user" | "guest"

export function formatUserName(user: User): string {
	return user.name
}
```

### Exceptions

Separate type files are acceptable in these cases:

#### Monorepo Package Exceptions

1. **`packages/contracts/`** - Designed specifically for shared API contracts, Zod schemas, and DTOs that are consumed by multiple apps
2. **`packages/db/src/schema/`** - Drizzle schema definitions that define database structure
3. **`packages/auth/src/types.ts`** - Auth-related type re-exports for external consumption

#### General Exceptions

4. **Shared across 3+ features** - Types used by many distinct features within an app
5. **Generated types** - Auto-generated from OpenAPI/Swagger, Drizzle, or external APIs
6. **Third-party integrations** - External service type definitions that don't belong to a single feature

### File Organization (within apps)

- Put types in the same file as the component/function that uses them
- For shared types within a feature, put them in the feature's `lib/` directory
- For truly shared types across features, put them in `core/lib/`
- Use descriptive filenames that indicate the primary purpose, not just "types"

### Enforcement (within apps)

- No `*.types.ts` files should exist in `apps/`
- No `types/` directories with only type definitions in `apps/`
- Types should be defined close to where they're first used
- Import shared types from `@repo/contracts` when needed across apps

---

**Remember:** Types are most valuable when they're close to the code that uses them, making the codebase more maintainable and easier to understand. For cross-app type sharing, use `@repo/contracts`.



<!-- Source: .ruler/mobile-rules.md -->

---
description: Flutter mobile app conventions for apps/mobile
globs: ["apps/mobile/**/*.dart"]
alwaysApply: false
---

# Flutter Mobile Rules (`apps/mobile/`)

## Directory Organization

```
apps/mobile/lib/
├── main.dart              # App entry point
├── app.dart               # MaterialApp/CupertinoApp configuration
├── core/                  # Shared utilities and base classes
│   ├── constants/         # App-wide constants
│   ├── extensions/        # Dart extension methods
│   ├── theme/             # Theme data and styling
│   └── utils/             # Utility functions
├── features/              # Feature-based organization
│   └── [feature]/
│       ├── data/          # Data layer (repositories, data sources)
│       │   ├── models/    # Data models, DTOs
│       │   └── repositories/
│       ├── domain/        # Business logic (optional clean architecture)
│       └── presentation/  # UI layer
│           ├── screens/   # Full-page widgets
│           ├── widgets/   # Feature-specific widgets
│           └── providers/ # State management (Riverpod/Provider)
├── services/              # External service integrations
│   ├── api/               # HTTP client, API service
│   ├── auth/              # Authentication service
│   └── storage/           # Local storage service
└── shared/                # Shared widgets and components
    ├── widgets/           # Reusable UI components
    └── dialogs/           # Common dialogs
```

## File Naming Conventions

Use **snake_case** for all file names (required by Dart linter):

| Type         | Pattern                               | Example                                     |
| ------------ | ------------------------------------- | ------------------------------------------- |
| Screens      | `[name]_screen.dart`                  | `home_screen.dart`, `login_screen.dart`     |
| Widgets      | `[name]_widget.dart` or `[name].dart` | `user_avatar.dart`, `todo_card.dart`        |
| Services     | `[name]_service.dart`                 | `auth_service.dart`, `api_service.dart`     |
| Models       | `[name]_model.dart` or `[name].dart`  | `user_model.dart`, `todo.dart`              |
| Providers    | `[name]_provider.dart`                | `auth_provider.dart`, `todos_provider.dart` |
| Repositories | `[name]_repository.dart`              | `user_repository.dart`                      |
| Extensions   | `[type]_extensions.dart`              | `string_extensions.dart`                    |

## Class Naming Conventions

Dart uses **PascalCase** for class names:

```dart
// Screens
class HomeScreen extends StatelessWidget {}
class LoginScreen extends StatefulWidget {}

// Widgets
class UserAvatar extends StatelessWidget {}
class TodoCard extends StatelessWidget {}

// Services
class AuthService {}
class ApiService {}

// Models
class User {}
class Todo {}

// Providers (Riverpod)
final todosProvider = StateNotifierProvider<TodosNotifier, List<Todo>>((ref) {
  return TodosNotifier();
});
```

## State Management

Recommended: **Riverpod** for state management

```dart
// providers/todos_provider.dart
final todosProvider = FutureProvider<List<Todo>>((ref) async {
  final apiService = ref.watch(apiServiceProvider);
  return apiService.getTodos();
});

// screens/todos_screen.dart
class TodosScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final todosAsync = ref.watch(todosProvider);
    return todosAsync.when(
      data: (todos) => ListView.builder(...),
      loading: () => CircularProgressIndicator(),
      error: (err, stack) => Text('Error: $err'),
    );
  }
}
```

## Backend API Integration

### API Service Pattern

```dart
// services/api/api_service.dart
class ApiService {
  final Dio _dio;

  ApiService() : _dio = Dio(BaseOptions(
    baseUrl: Environment.apiBaseUrl,
  ));

  Future<List<Todo>> getTodos() async {
    final response = await _dio.get('/api/v1/examples/todos');
    return (response.data['data'] as List)
        .map((json) => Todo.fromJson(json))
        .toList();
  }
}
```

### Authentication

```dart
// services/auth/auth_service.dart
class AuthService {
  final FlutterSecureStorage _storage;

  Future<void> signIn(String email, String password) async {
    // Call backend auth endpoint
    final response = await _dio.post('/api/auth/sign-in', data: {
      'email': email,
      'password': password,
    });
    await _storage.write(key: 'token', value: response.data['token']);
  }
}
```

## Feature Module Pattern

Each feature should be self-contained:

```
features/todos/
├── data/
│   ├── models/
│   │   └── todo.dart
│   └── repositories/
│       └── todos_repository.dart
├── presentation/
│   ├── screens/
│   │   ├── todos_screen.dart
│   │   └── todo_detail_screen.dart
│   ├── widgets/
│   │   └── todo_card.dart
│   └── providers/
│       └── todos_provider.dart
```

## Best Practices

### Widget Composition

- Prefer composition over inheritance
- Extract widgets when they become complex (50+ lines)
- Use `const` constructors where possible

```dart
// Good: const constructor
class TodoCard extends StatelessWidget {
  const TodoCard({super.key, required this.todo});
  final Todo todo;
}
```

### Avoid Deep Nesting

```dart
// Bad: deeply nested
Scaffold(
  body: Container(
    child: Column(
      children: [
        Container(
          child: Row(
            children: [...]
          )
        )
      ]
    )
  )
)

// Good: extract widgets
Scaffold(
  body: TodoList(),
)
```

## Testing

- Widget tests: `test/` directory
- Integration tests: `integration_test/` directory
- Use `flutter_test` package

```dart
// test/features/todos/presentation/widgets/todo_card_test.dart
testWidgets('TodoCard displays title', (tester) async {
  await tester.pumpWidget(MaterialApp(
    home: TodoCard(todo: Todo(title: 'Test')),
  ));
  expect(find.text('Test'), findsOneWidget);
});
```



<!-- Source: .ruler/no-barrel-files.md -->

---
description: Prohibition of barrel files (index.ts/js files that re-export)
globs: ["**/*.ts", "**/*.js", "**/*.tsx", "**/*.jsx"]
alwaysApply: true
---

# No Barrel Files Rule

## Rule: Prohibit Barrel Files in Applications

**Guideline:** Do NOT create barrel files (index.ts/js files that only re-export from other files) within application code.

**Scope:** This rule primarily applies to code in `apps/`. Package entrypoints are an allowed exception.

### What are Barrel Files?

Barrel files are `index.ts` or `index.js` files that only contain re-export statements like:

```typescript
// ❌ BAD - Barrel file in apps/
export { ComponentA } from "./component-a"
export { ComponentB } from "./component-b"
export { ComponentC } from "./component-c"
```

### Why Avoid Barrel Files?

1. **Bundle Size**: They can increase bundle size due to tree-shaking issues
2. **Performance**: Can cause unnecessary module loading
3. **Complexity**: Add an extra layer of indirection
4. **Debugging**: Make it harder to trace imports and dependencies
5. **Maintenance**: Require constant updates when adding/removing exports

### Acceptable Alternatives

**✅ GOOD - Direct imports:**

```typescript
import { ComponentA } from "./components/component-a"
import { ComponentB } from "./components/component-b"
import { ComponentC } from "./components/component-c"
```

**✅ GOOD - Named imports from specific files:**

```typescript
import { ComponentA, ComponentB } from "./components/shared-components"
```

### Exceptions

#### Allowed `index.ts` Files

**Framework-required entrypoints:**
- Next.js: `app/page.tsx`, `app/layout.tsx`, `app/api/*/route.ts`
- Django: `manage.py`, `config/wsgi.py` (backend is Python, not TypeScript)

**Package entrypoints (required for workspace imports):**
- `packages/*/src/index.ts` - Package public API exports
- `packages/db/src/schema/index.ts` - Schema re-exports for `@repo/db/schema`
- `packages/contracts/src/index.ts` - Contract re-exports for `@repo/contracts`

**Configuration files with logic:**
- Files that contain actual configuration logic, not just re-exports

### Why Packages are Different

Packages need `index.ts` entrypoints to:
1. Define a clear public API boundary
2. Enable workspace imports (`import { x } from "@repo/pkg"`)
3. Hide internal implementation details
4. Support TypeScript path mapping

```typescript
// ✅ GOOD - Package entrypoint (packages/contracts/src/index.ts)
export * from "./modules/v1/examples/todos.contract.js"
export * from "./common/common.contract.js"
export * from "./utils/dto-generator.js"
```

### Enforcement (within apps)

- No `index.ts` or `index.js` files in component directories
- No `index.ts` or `index.js` files in utility directories
- No `index.ts` or `index.js` files in feature directories
- Import directly from the specific files you need

### Enforcement (within packages)

- One `index.ts` at the package root (`packages/*/src/index.ts`) is required
- Sub-directory barrels allowed only for sub-path exports (e.g., `schema/index.ts` for `@repo/db/schema`)
- Keep internal modules unexported from the public API

---

**Remember:** Direct imports are clearer, more performant, and easier to maintain. Package entrypoints are the exception because they define API boundaries for workspace consumption.



<!-- Source: .ruler/packages-rules.md -->

---
description: Shared packages and tooling conventions
globs: ["packages/**/*.ts", "tooling/**/*.ts", "tooling/**/*.js", "tooling/**/*.mjs"]
alwaysApply: false
---

# Shared Packages & Tooling Rules

## Overview

The monorepo uses two directories for shared code:

- **`packages/`** - Shared business logic consumed by apps
- **`tooling/`** - Development tooling and configurations

## Packages (`packages/`)

### Current Packages

| Package | Import | Purpose |
|---------|--------|---------|
| `@repo/auth` | `import { auth } from "@repo/auth"` | Better Auth configuration |
| `@repo/db` | `import { db } from "@repo/db"` | Drizzle client and schema |
| `@repo/contracts` | `import { CreateTodoDto } from "@repo/contracts"` | API contracts, Zod schemas, DTOs |

### Package Structure

Each package follows this structure:

```
packages/[name]/
├── src/
│   ├── index.ts          # Package entrypoint (exports public API)
│   └── [modules]/        # Internal modules
├── package.json          # Package manifest
├── tsconfig.json         # TypeScript config (extends tooling/typescript/pkg.json)
└── turbo.json            # Turbo build config
```

### `@repo/auth` - Authentication

Shared Better Auth configuration used by the Next.js web app (backend is Django and may use its own auth):

```
packages/auth/src/
├── index.ts              # Exports auth instance and types
├── config.ts             # Better Auth configuration
└── types.ts              # Auth-related type exports (allowed exception)
```

Usage:
```typescript
import { auth, createAuth } from "@repo/auth"
import type { Session, User } from "@repo/auth"
```

### `@repo/db` - Database

Drizzle ORM schema and client:

```
packages/db/src/
├── index.ts              # Exports schema and client
├── client.ts             # Database client factory
└── schema/
    ├── index.ts          # Schema re-exports
    ├── auth.ts           # Auth-related tables
    └── todos.ts          # Feature schemas
```

Usage:
```typescript
import { db, createDBClient } from "@repo/db"
import { users, todos } from "@repo/db/schema"
```

### `@repo/contracts` - API Contracts

Shared Zod schemas and DTOs for type-safe API communication:

```
packages/contracts/src/
├── index.ts              # Public exports
├── common/               # Common schemas
│   ├── common.contract.ts
│   └── health.contract.ts
├── modules/
│   └── v1/               # Versioned contracts (mirrors backend modules)
│       └── [feature]/
│           └── [feature].contract.ts
└── utils/
    ├── dto-generator.ts  # DTO utilities
    └── types.ts          # Shared utility types
```

Contract file pattern (used by Next.js; Django backend keeps API shape aligned via DRF serializers):
```typescript
// [feature].contract.ts
import { z } from "zod"
import { createZodDto } from "nestjs-zod"

// Schemas
export const CreateTodoSchema = z.object({
  title: z.string().min(1).max(255),
  completed: z.boolean().optional(),
})

// Inferred types
export type CreateTodo = z.infer<typeof CreateTodoSchema>

// DTOs (for TypeScript consumers; Django uses DRF serializers)
export class CreateTodoDto extends createZodDto(CreateTodoSchema) {}
```

---

## Tooling (`tooling/`)

Development configurations shared across all apps.

### Structure

```
tooling/
├── eslint/               # ESLint configurations
│   ├── eslint.config.mjs # Base config
│   ├── next.mjs          # Next.js-specific rules
│   └── pkg.mjs           # Package-specific rules
├── prettier/             # Prettier configuration
│   └── index.js          # Shared Prettier config
└── typescript/           # TypeScript base configs
    ├── next.json         # Next.js apps
    ├── pkg.json          # Packages
    └── tool.json         # Tooling packages
```

### Using Tooling Configs

**ESLint** (in app's `eslint.config.mjs`):
```javascript
import nextConfig from "@repo/eslint-config/next.mjs"
export default [...nextConfig]
```

**TypeScript** (in app's `tsconfig.json`):
```json
{
  "extends": "@repo/typescript-config/next.json"
}
```

**Prettier** (in app's `package.json` or `.prettierrc`):
```json
{
  "prettier": "@repo/prettier-config"
}
```

---

## Creating a New Package

1. Create the package directory:
   ```
   packages/[name]/
   ├── src/
   │   └── index.ts
   ├── package.json
   └── tsconfig.json
   ```

2. Set up `package.json`:
   ```json
   {
     "name": "@repo/[name]",
     "version": "0.0.0",
     "private": true,
     "exports": {
       ".": "./src/index.ts"
     },
     "scripts": {
       "build": "tsc",
       "dev": "tsc --watch"
     }
   }
   ```

3. Extend TypeScript config:
   ```json
   {
     "extends": "@repo/typescript-config/pkg.json",
     "include": ["src"],
     "exclude": ["node_modules"]
   }
   ```

4. Add to consuming app's dependencies:
   ```json
   {
     "dependencies": {
       "@repo/[name]": "workspace:*"
     }
   }
   ```

---

## Rules

### Package Exports

- **Packages MUST have an `index.ts`** - This is an allowed exception to the no-barrel rule
- Export only the public API from `index.ts`
- Keep internal modules private (not exported from index)

### Type Definitions

- **`packages/contracts/`** is allowed to have type-focused files (exception to co-locate rule)
- **`packages/db/src/schema/`** contains Drizzle schema definitions (allowed exception)
- Other packages should co-locate types with implementation

### Dependencies

- Packages should minimize external dependencies
- Prefer peer dependencies for framework-specific packages
- Use `workspace:*` for internal package dependencies



<!-- Source: .ruler/project-rules.md -->

---
description: General monorepo rules and conventions
globs: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx", "**/*.dart"]
alwaysApply: true
---

# MedFinder MedFinder - AI Agent Rules

## Project Overview

This is a **Turborepo monorepo** template with three applications and shared packages. The architecture separates concerns across apps while sharing code through workspace packages.

## Technology Stack

| Layer           | Technology                               | Location              |
| --------------- | ---------------------------------------- | --------------------- |
| Frontend        | Next.js 16 (App Router)                  | `apps/web/`           |
| Backend         | Django                                   | `apps/backend/`       |
| Mobile          | Flutter                                  | `apps/mobile/`        |
| Database        | Drizzle ORM + PostgreSQL                 | `packages/db/`        |
| Auth            | Better Auth                              | `packages/auth/`      |
| Contracts       | Zod schemas + DTOs                       | `packages/contracts/` |
| Styling         | Tailwind CSS + Shadcn UI                 | `apps/web/`           |
| Data Fetching   | TanStack Query                           | `apps/web/`           |
| Package Manager | pnpm (always use `pnpm`, never npm/yarn) |                       |

## Monorepo Structure

```
turbo-template/
├── apps/
│   ├── web/              # Next.js frontend
│   ├── backend/          # Django API server
│   └── mobile/           # Flutter mobile app
├── packages/
│   ├── auth/             # Shared auth configuration
│   ├── db/               # Drizzle schema and client
│   └── contracts/        # API contracts, Zod schemas, DTOs
└── tooling/
    ├── eslint/           # ESLint configurations
    ├── prettier/         # Prettier configuration
    └── typescript/       # TSConfig base files
```

## Cross-App Package Usage

Import shared packages using the `@repo/*` workspace alias:

```typescript
import { auth } from "@repo/auth"
import { CreateTodoDto, TodoSchema } from "@repo/contracts"
import { db } from "@repo/db"
import { todos } from "@repo/db/schema"
```

---

## Development Workflow

1. Use `pnpm` for all package management
2. Run `pnpm lint && pnpm typecheck` before committing
3. Run `pnpm format:fix` to fix formatting issues
4. Update `.env.example` and `env.ts` when adding environment variables
5. Keep features isolated in their own folders

## Common Scripts

### Development

```bash
pnpm dev              # Start all apps in development (watch mode)
pnpm dev:web          # Start only web app
pnpm dev:backend      # Start only backend app
pnpm dev:mobile       # Start only mobile app
pnpm start            # Start all apps in production mode
```

### Build & Clean

```bash
pnpm build            # Build all apps for production
pnpm clean            # Remove root node_modules
pnpm clean:workspaces # Clean all workspace node_modules
```

### Code Quality

```bash
pnpm lint             # Run ESLint across all packages
pnpm lint:fix         # Run ESLint and auto-fix issues
pnpm format           # Check formatting with Prettier
pnpm format:fix       # Fix formatting with Prettier
pnpm typecheck        # Run TypeScript type checking
pnpm lint:ws          # Check workspace dependencies (sherif)
```

### Database

```bash
pnpm db:push          # Push schema changes to database
pnpm db:generate      # Generate Drizzle types/migrations
pnpm db:migrate       # Run database migrations
pnpm db:studio        # Open Drizzle Studio GUI
```

### Auth

```bash
pnpm auth:generate    # Generate Better Auth types
```

## TypeScript Standards

- Use TypeScript everywhere - no `.js` files allowed (except config files)
- Define proper types for all data structures
- Prefer inferring types from schemas (`z.infer<typeof Schema>`)
- Co-locate types with their usage (see co-locate-types rule)

## File Naming Conventions

| Context    | Convention | Examples                                 |
| ---------- | ---------- | ---------------------------------------- |
| TypeScript | kebab-case | `user-profile.tsx`, `auth-utils.ts`      |
| Flutter    | snake_case | `user_profile.dart`, `auth_service.dart` |
| Folders    | kebab-case | `user-management/`, `document-signing/`  |
| Components | kebab-case | `todo-card.tsx`, `user-avatar.tsx`       |
| Hooks      | kebab-case | `use-auth.ts`, `use-todos-query.ts`      |

---

## App-Specific Rules

See the following files for app-specific conventions:

- **`web-rules.md`** - Next.js frontend (`apps/web/`)
- **`backend-rules.md`** - Django API server (`apps/backend/`)
- **`mobile-rules.md`** - Flutter mobile app (`apps/mobile/`)
- **`packages-rules.md`** - Shared packages and tooling



<!-- Source: .ruler/tailwind.md -->

---
description: Tailwind CSS size utility preference (web frontend only)
globs: ["apps/web/**/*.tsx", "apps/web/**/*.jsx"]
alwaysApply: false
---

# Tailwind CSS Size Utility Guidelines

**Scope:** This rule applies only to `apps/web/` (Next.js frontend). Backend and mobile apps do not use Tailwind CSS.

## Rule: Use `size-*` for Square Dimensions

**Guideline 1:** Use Tailwind's `size-*` utility classes instead of separate `w-*` and `h-*` when width and height are the same.

**Examples:**

```tsx
// ✅ GOOD - Using size-* for equal dimensions
<div className="size-4" />
<div className="size-6" />
<div className="size-8" />
<div className="size-12" />

// ❌ BAD - Redundant w-* and h-* when equal
<div className="w-4 h-4" />
<div className="w-6 h-6" />
```

**Guideline 2:** Only use separate `w-*` and `h-*` classes when the width and height values are different.

```tsx
// ✅ GOOD - Different dimensions require separate utilities
<div className="w-full h-screen" />
<div className="w-64 h-48" />
```

**Guideline 3:** This applies to all size values including responsive variants.

```tsx
// ✅ GOOD - Responsive size utilities
<div className="size-4 md:size-6 lg:size-8" />

// ❌ BAD - Redundant responsive utilities
<div className="w-4 h-4 md:w-6 md:h-6 lg:w-8 lg:h-8" />
```

## Common Use Cases

| Element          | Preferred                      | Avoid                  |
| ---------------- | ------------------------------ | ---------------------- |
| Icons            | `size-4`, `size-5`, `size-6`   | `w-4 h-4`, `w-5 h-5`   |
| Avatars          | `size-8`, `size-10`, `size-12` | `w-8 h-8`, `w-10 h-10` |
| Buttons (square) | `size-9`, `size-10`            | `w-9 h-9`, `w-10 h-10` |
| Loaders          | `size-4`, `size-6`             | `w-4 h-4`, `w-6 h-6`   |



<!-- Source: .ruler/web-rules.md -->

---
description: Next.js frontend conventions for apps/web
globs: ["apps/web/**/*.ts", "apps/web/**/*.tsx"]
alwaysApply: false
---

# Next.js Frontend Rules (`apps/web/`)

## Directory Organization

```
apps/web/
├── app/                  # ONLY Next.js reserved files (pages, layouts, routes)
│   ├── (site)/           # Route groups and page.tsx files only
│   ├── api/              # API routes only
│   └── layout.tsx        # Root layout
├── features/             # ALL business logic goes here
│   └── [feature-name]/
│       ├── api/          # TanStack Query hooks, fetch functions
│       ├── components/   # Feature-specific UI components
│       ├── lib/          # Feature-specific utilities
│       ├── server/       # Server actions, server-side logic
│       └── utils/        # Feature utilities
├── core/                 # Shared/reusable code
│   ├── components/       # Shared UI components
│   ├── context/          # React contexts
│   ├── hooks/            # Shared React hooks
│   ├── lib/              # Shared utilities
│   ├── styles/           # Global styles
│   └── middleware/       # Shared middleware
├── services/             # External service integrations
│   ├── better-auth/      # Auth client setup
│   ├── query/            # TanStack Query setup
│   └── [service]/        # Other external services
└── env.ts                # Environment validation
```

## Folder Purposes

| Folder       | Purpose                                          | Example Contents                         |
| ------------ | ------------------------------------------------ | ---------------------------------------- |
| `app/`       | Next.js routing only (pages, layouts, routes)    | `page.tsx`, `layout.tsx`, `route.ts`     |
| `features/`  | Business logic organized by feature              | `todos/`, `auth/`, `dashboard/`          |
| `core/`      | Shared code used across multiple features        | Components, hooks, utilities             |
| `services/`  | External service integrations and configurations | Auth, API clients, third-party services  |

### Key Distinction

- **`app/`** = Next.js routing only (no business logic)
- **`features/`** = All business logic and feature-specific code
- **`core/`** = Shared utilities and components
- **`services/`** = External integrations

## Business Logic Placement

- **ALL business logic** must go in `features/[feature-name]/` folders
- Keep features isolated and self-contained
- Never put business logic in the `app/` directory
- The `app/` directory should only contain Next.js routing files

## File Naming Conventions

- **Components**: kebab-case (`user-profile.tsx`, `document-signer.tsx`)
- **Files**: kebab-case (`user-profile.utils.ts`, `auth-validation.schema.ts`)
- **Folders**: kebab-case (`user-management/`, `document-signing/`)
- **Hooks**: `use-[name].ts` (`use-auth.ts`, `use-todos.ts`)
- **Query hooks**: `use-[resource]-query.ts`, `use-[resource]-mutation.ts`

## Data Fetching with TanStack Query

### Query Setup

```typescript
// services/query/query-client.ts
import { QueryClient } from "@tanstack/react-query"

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 60 * 1000,
			refetchOnWindowFocus: false,
		},
	},
})
```

### Feature Query Hooks

```typescript
// features/todos/api/use-todos-query.ts
import { useQuery } from "@tanstack/react-query"

async function fetchTodos() {
	const res = await fetch("/api/v1/examples/todos")
	if (!res.ok) throw new Error("Failed to fetch todos")
	return res.json()
}

export function useTodosQuery() {
	return useQuery({
		queryKey: ["todos"],
		queryFn: fetchTodos,
	})
}
```

### Mutations

```typescript
// features/todos/api/use-create-todo-mutation.ts
import { useMutation, useQueryClient } from "@tanstack/react-query"

async function createTodo(data: CreateTodo) {
	const res = await fetch("/api/v1/examples/todos", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	})
	if (!res.ok) throw new Error("Failed to create todo")
	return res.json()
}

export function useCreateTodoMutation() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: createTodo,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["todos"] })
		},
	})
}
```

## Component Structure

- Use Shadcn UI components as the base component library
- Feature-specific components go in `features/[feature-name]/components/`
- Shared components go in `core/components/`
- Follow React best practices with hooks and functional components

### Component Pattern

```tsx
// features/todos/components/todo-card.tsx
interface TodoCardProps {
	todo: Todo
	onComplete: (id: number) => void
}

export function TodoCard({ todo, onComplete }: TodoCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>{todo.title}</CardTitle>
			</CardHeader>
			<CardContent>
				<Button onClick={() => onComplete(todo.id)}>Complete</Button>
			</CardContent>
		</Card>
	)
}
```

## Server Actions

For mutations that need server-side logic:

```typescript
// features/todos/server/actions.ts
"use server"

import { db } from "@repo/db"
import { todos } from "@repo/db/schema"

export async function createTodoAction(data: CreateTodo) {
	const [todo] = await db.insert(todos).values(data).returning()
	return todo
}
```

## Authentication

Using Better Auth client:

```typescript
// services/better-auth/auth-client.ts
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
})

export const { signIn, signUp, signOut, useSession } = authClient
```

## Feature Module Pattern

Each feature should be self-contained:

```
features/todos/
├── api/
│   ├── use-todos-query.ts
│   └── use-create-todo-mutation.ts
├── components/
│   ├── todo-card.tsx
│   ├── todo-list.tsx
│   └── create-todo-form.tsx
├── lib/
│   └── todo-utils.ts
└── server/
    └── actions.ts
```

## Environment Variables

- Define in `env.ts` using a validation library (e.g., `@t3-oss/env-nextjs`)
- Always prefix client-side variables with `NEXT_PUBLIC_`
- Update `.env.example` when adding new variables
