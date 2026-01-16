# Quanby Turbo Template

A TypeScript-first monorepo template using **Turborepo** and **pnpm** with a full-stack architecture spanning web, backend, and mobile platforms.

## Table of Contents

- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Packages](#packages)
- [Development Workflow](#development-workflow)
- [Documentation](#documentation)

## Technology Stack

| Layer           | Technology               | Location              |
| --------------- | ------------------------ | --------------------- |
| Frontend        | Next.js 16 (App Router)  | `apps/web/`           |
| Backend         | NestJS                   | `apps/backend/`       |
| Mobile          | Flutter                  | `apps/mobile/`        |
| Database        | Drizzle ORM + PostgreSQL | `packages/db/`        |
| Authentication  | Better Auth              | `packages/auth/`      |
| API Contracts   | Zod schemas + DTOs       | `packages/contracts/` |
| Styling         | Tailwind CSS + shadcn/ui | `apps/web/`           |
| Data Fetching   | TanStack Query           | `apps/web/`           |
| Package Manager | pnpm                     | —                     |
| Build System    | Turborepo                | —                     |

## Project Structure

```
turbo-template/
├── apps/
│   ├── web/                 # Next.js frontend
│   ├── backend/             # NestJS API server
│   └── mobile/              # Flutter mobile app
├── packages/
│   ├── auth/                # Shared Better Auth configuration
│   ├── contracts/           # Zod schemas, DTOs, API contracts
│   └── db/                  # Drizzle ORM schema and client
└── tooling/
    ├── eslint/              # Shared ESLint configurations
    ├── prettier/            # Shared Prettier configuration
    └── typescript/          # Shared TypeScript configs
```

## Getting Started

### Prerequisites

- **Node.js** ≥ 22.20.0
- **pnpm** ≥ 10.15.1
- **PostgreSQL** database
- **Flutter SDK** (for mobile development)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd turbo-template
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Create the following environment files:

   **`apps/backend/.env`**
   **`apps/web/.env`**

4. **Set up the database**

   ```bash
   # Push schema to database
   pnpm db:push

   # Or run migrations
   pnpm db:migrate
   ```

5. **Build all packages**

   ```bash
   pnpm build
   ```

6. **Start development**

   ```bash
   pnpm dev
   ```

## Environment Variables

### Backend (`apps/backend/.env`)

| Variable             | Description                  | Default                 |
| -------------------- | ---------------------------- | ----------------------- |
| `DATABASE_URL`       | PostgreSQL connection string | —                       |
| `PORT`               | Server port                  | `3000`                  |
| `BETTER_AUTH_SECRET` | Secret key for auth tokens   | —                       |
| `BETTER_AUTH_URL`    | Base URL for Better Auth     | `http://localhost:3000` |

### Web (`apps/web/.env.local`)

| Variable                      | Description                  | Default                 |
| ----------------------------- | ---------------------------- | ----------------------- |
| `DATABASE_URL`                | PostgreSQL connection string | —                       |
| `BETTER_AUTH_SECRET`          | Secret key for auth tokens   | —                       |
| `BETTER_AUTH_URL`             | Base URL for Better Auth     | `http://localhost:3000` |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | Public auth URL for client   | —                       |

## Scripts

All scripts are run from the repository root using `pnpm`.

### Development

| Command            | Description                        |
| ------------------ | ---------------------------------- |
| `pnpm dev`         | Start all apps in development mode |
| `pnpm dev:web`     | Start only the web app             |
| `pnpm dev:backend` | Start only the backend             |
| `pnpm dev:mobile`  | Start only the mobile app          |
| `pnpm start`       | Start all apps in production mode  |

### Build & Clean

| Command                 | Description                        |
| ----------------------- | ---------------------------------- |
| `pnpm build`            | Build all apps and packages        |
| `pnpm clean`            | Remove root `node_modules`         |
| `pnpm clean:workspaces` | Clean all workspace `node_modules` |

### Code Quality

| Command           | Description                           |
| ----------------- | ------------------------------------- |
| `pnpm lint`       | Run ESLint across all packages        |
| `pnpm lint:fix`   | Run ESLint with auto-fix              |
| `pnpm format`     | Check formatting with Prettier        |
| `pnpm format:fix` | Fix formatting with Prettier          |
| `pnpm typecheck`  | Run TypeScript type checking          |
| `pnpm lint:ws`    | Check workspace dependencies (sherif) |

### Database

| Command            | Description                     |
| ------------------ | ------------------------------- |
| `pnpm db:push`     | Push schema changes to database |
| `pnpm db:generate` | Generate Drizzle migrations     |
| `pnpm db:migrate`  | Run database migrations         |
| `pnpm db:studio`   | Open Drizzle Studio GUI         |

### Authentication

| Command              | Description                |
| -------------------- | -------------------------- |
| `pnpm auth:generate` | Generate Better Auth types |

### Testing

| Command                    | Description             |
| -------------------------- | ----------------------- |
| `pnpm -F backend test`     | Run backend tests       |
| `pnpm -F backend test:e2e` | Run backend E2E tests   |
| `pnpm -F backend test:cov` | Run tests with coverage |

## Packages

### `@repo/auth`

Shared Better Auth configuration used across all apps.

```typescript
import { auth } from "@repo/auth"
```

### `@repo/contracts`

Zod schemas and DTOs for type-safe API communication.

```typescript
import { CreateTodoDto, TodoSchema } from "@repo/contracts"
```

### `@repo/db`

Drizzle ORM schema definitions and database client.

```typescript
import { db } from "@repo/db"
import { todos, users } from "@repo/db/schema"
```

## Development Workflow

1. **Always use pnpm** — never use npm or yarn
2. **Run quality checks before committing:**
   ```bash
   pnpm lint && pnpm typecheck
   ```
3. **Format code before committing:**
   ```bash
   pnpm format:fix
   ```
4. **Update environment files** when adding new variables
5. **Keep features isolated** in their own folders

## Documentation

- [Turborepo](https://turbo.build/docs)
- [pnpm](https://pnpm.io/)
- [Next.js (App Router)](https://nextjs.org/docs/app)
- [NestJS](https://docs.nestjs.com/)
- [Flutter](https://docs.flutter.dev/)
- [Drizzle ORM](https://orm.drizzle.team/docs)
- [Better Auth](https://better-auth.com/docs)
- [Zod](https://zod.dev/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [TypeScript](https://www.typescriptlang.org/docs/)

---

For app-specific details, see the README inside each app folder.
