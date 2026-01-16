# @repo/db

Framework-agnostic Drizzle ORM database package with schema definitions and database client. Optional NestJS integration available.

## Framework-Agnostic Usage (Any Framework)

This package works with any Node.js framework - NestJS is completely optional.

### Direct Client Usage

```typescript
import { createDrizzleClient } from "@repo/db/client"
import { todos } from "@repo/db/schema"

const db = createDrizzleClient()
const allTodos = await db.select().from(todos)
```

The `createDrizzleClient()` function creates a Drizzle client configured with your schema. It requires the `DATABASE_URL` environment variable.

### Schema Only

If you just need the schema definitions:

```typescript
// Use in your own Drizzle setup
import { drizzle } from "drizzle-orm/node-postgres"

import { schema, todos } from "@repo/db/schema"

const db = drizzle(pool, { schema })
```

## Optional NestJS Integration

If you're using NestJS and want dependency injection, import from the `/database` subpath:

```typescript
import { DatabaseModule } from "@repo/db/database"

@Module({
	imports: [DatabaseModule],
})
export class AppModule {}
```

Then inject in your services:

```typescript
import { Inject } from "@nestjs/common"

import { DRIZZLE_DB, type DrizzleDb } from "@repo/db/database"

@Injectable()
export class MyService {
	constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb | null) {}
}
```

**Note:** NestJS is an optional peer dependency. You only need `@nestjs/common` if you use the `/database` export.

## Scripts

- `pnpm push` - Push schema changes to database
- `pnpm studio` - Open Drizzle Studio
- `pnpm generate` - Generate migration files
- `pnpm migrate` - Run migrations
