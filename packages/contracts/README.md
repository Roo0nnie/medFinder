# @repo/contracts

Contract-based API schemas and DTOs using Zod for type-safe validation and OpenAPI documentation generation.

## Overview

This package provides a centralized location for API contracts using Zod schemas. These schemas serve as the single source of truth for:

- **Type Safety**: TypeScript types are automatically inferred from Zod schemas
- **Validation**: Runtime validation for API requests and responses
- **Documentation**: Auto-generated OpenAPI/Swagger documentation via `nestjs-zod`

## Architecture

```
packages/contracts/
├── src/
│   ├── v1/
│   │   ├── examples/
│   │   │   └── todos/
│   │   │       ├── todo.schema.ts
│   │   │       └── todo.dto.ts
│   │   └── auth/
│   │       ├── auth.schema.ts
│   │       └── auth.dto.ts
│   └── index.ts
```

## Usage

### In Backend (NestJS)

1. Import DTOs from the contracts package:

```typescript
import { CreateTodoDto, UpdateTodoDto } from "@repo/contracts"

@Controller("todos")
export class TodosController {
  @Post()
  async create(@Body() payload: CreateTodoDto) {
    // payload is validated and typed
  }
}
```

2. The DTOs are automatically validated using `ZodValidationPipe` configured globally in `main.ts`

3. OpenAPI documentation is automatically generated from the Zod schemas

### Defining New Contracts

1. Create a Zod schema in the appropriate module directory (e.g., `src/v1/examples/todos/todo.schema.ts`):

```typescript
import { z } from "zod"

export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
  age: z.number().int().positive().optional(),
})

export type CreateUser = z.infer<typeof CreateUserSchema>
```

2. Create a DTO in the same directory (e.g., `src/v1/examples/todos/todo.dto.ts`):

```typescript
import { createZodDto } from "nestjs-zod"
import { CreateUserSchema } from "./user.schema"

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
```

3. Export from `src/index.ts`:

```typescript
export * from "./v1/examples/users/user.schema"
export * from "./v1/examples/users/user.dto"
```

## Benefits

- **Single Source of Truth**: Zod schemas define both validation and TypeScript types
- **Auto-Generated Documentation**: OpenAPI docs generated from Zod schemas via `nestjs-zod`
- **Type Safety**: End-to-end type safety from contract to implementation
- **Shared Contracts**: Contracts can be used across backend, frontend, and mobile apps
- **Better Developer Experience**: Changes to schemas automatically update types and docs
- **Organized by Module**: Contracts are organized by API version and module for better maintainability

## Scripts

- `pnpm build` - Build the package
- `pnpm dev` - Watch mode for development
- `pnpm typecheck` - Type check without building
