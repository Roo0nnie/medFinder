# Turbo Template

Simple TypeScript-first monorepo using Turborepo and pnpm.

## Setup

1. Clone the repository
2. Copy env examples to real files:
    - `apps/backend/.env.example` → `apps/backend/.env`
    - `apps/web/.env.local.example` → `apps/web/.env.local`
3. Install dependencies: `pnpm install`
4. Build all: `pnpm build`
5. Push database migrations: `pnpm -F db db:push`
6. Start dev: `pnpm dev` (or run per app)

## Workspace

- `apps/backend` – NestJS API server
- `apps/web` – Next.js (App Router)
- `apps/mobile` – Flutter client
- `packages/auth` – Shared auth utilities
- `packages/contracts` – Zod contracts and DTOs
- `packages/db` – Drizzle schemas and client

For app-specific details and env vars, see the README inside each folder.

## Commands

Run these from the repo root:

- Type check all: `pnpm typecheck`
- Lint all: `pnpm lint`
- Fix lint issues: `pnpm lint:fix`
- Format code: `pnpm format`
- Fix formatting: `pnpm format:fix`
- Test backend: `pnpm -F backend test`
- E2E tests (backend): `pnpm -F backend test:e2e`

## Docs

- Turborepo: https://turbo.build/docs
- pnpm: https://pnpm.io/
- NestJS: https://docs.nestjs.com/
- Next.js (App Router): https://nextjs.org/docs/app
- Flutter: https://docs.flutter.dev/
- Drizzle ORM: https://orm.drizzle.team/docs
- Zod: https://zod.dev/
- TypeScript: https://www.typescriptlang.org/docs/
- ESLint: https://eslint.org/docs/latest/use/getting-started
- Prettier: https://prettier.io/docs/en/

