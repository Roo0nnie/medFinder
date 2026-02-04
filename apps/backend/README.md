# @repo/backend

NestJS API server with Better Auth, Drizzle ORM, and Zod validation.

## Tech Stack

- **Framework**: NestJS
- **Database**: Drizzle ORM + PostgreSQL
- **Auth**: Better Auth
- **Validation**: Zod + nestjs-zod
- **API Docs**: Swagger (auto-generated from Zod schemas)

## Structure

```
apps/backend/src/
├── common/              # Reusable NestJS modules
│   ├── database/        # Database module, providers
│   ├── filters/         # Global exception filters
│   └── health/          # Health check endpoints
├── config/              # App configuration
│   └── env.config.ts    # Environment validation
├── modules/             # Feature modules by API version
│   └── v1/
│       ├── app.module.ts
│       └── [feature]/
│           ├── [feature].module.ts
│           ├── [feature].controller.ts
│           ├── [feature].service.ts
│           └── [feature].controller.spec.ts
├── shared/              # Shared non-module code
│   ├── decorators/      # Custom decorators
│   ├── guards/          # Auth guards
│   ├── interceptors/    # Logging, transform interceptors
│   └── pipes/           # Validation pipes
├── utils/               # Pure utility functions
├── main.module.ts       # Root module
└── main.ts              # Bootstrap entry point
```

## Development

```bash
# From monorepo root
pnpm dev:backend

# Or directly
pnpm --filter @repo/backend dev
```

Runs on [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable                      | Required | Description                     |
| ----------------------------- | -------- | ------------------------------- |
| `DATABASE_URL`                | ✅       | PostgreSQL connection string    |
| `BETTER_AUTH_SECRET`          | ✅       | Auth secret key                 |
| `BETTER_AUTH_TRUSTED_ORIGINS` | ✅       | Comma-separated trusted origins |
| `CORS_ORIGINS`                | ✅       | Comma-separated CORS origins    |
| `PORT`                        | ❌       | Server port (default: 3000)     |
| `GOOGLE_CLIENT_ID`            | ❌       | Google OAuth client ID          |
| `GOOGLE_CLIENT_SECRET`        | ❌       | Google OAuth client secret      |

See `.env.example` for reference.

## API Endpoints

- **Health**: `GET /health` — Returns server status and database connectivity
- **Swagger**: `GET /api/docs` — Interactive API documentation

## Scripts

| Command         | Description             |
| --------------- | ----------------------- |
| `pnpm dev`      | Start in watch mode     |
| `pnpm build`    | Build for production    |
| `pnpm start`    | Start production build  |
| `pnpm test`     | Run unit tests          |
| `pnpm test:e2e` | Run E2E tests           |
| `pnpm test:cov` | Run tests with coverage |

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
