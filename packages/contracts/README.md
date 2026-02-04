# @repo/contracts

Shared API contracts using Zod schemas and DTOs for type-safe validation.

## Structure

```
packages/contracts/
├── src/
│   ├── index.ts          # Public exports
│   ├── common/           # Shared schemas (pagination, errors)
│   │   └── common.contract.ts
│   ├── modules/v1/       # Versioned API contracts
│   │   └── [feature]/
│   │       └── [feature].contract.ts
│   └── utils/            # DTO generator utilities
│       └── dto-generator.ts
└── package.json
```

## Usage

```typescript
import { CreateTodoDto, CreateTodoSchema, type CreateTodo } from "@repo/contracts"

// Use schema for validation
const result = CreateTodoSchema.safeParse(data)

// Use type for TypeScript
const todo: CreateTodo = { title: "My Todo" }

// Use DTO in NestJS controllers
@Post()
async create(@Body() payload: CreateTodoDto) {
  // payload is validated by Zod
}
```

## Structure

```
src/
├── common/           # Shared schemas (pagination, errors)
├── modules/v1/       # Versioned API contracts
│   └── [feature]/
│       └── [feature].contract.ts
├── utils/            # DTO generator utilities
└── index.ts          # Public exports
```

## Adding Contracts

1. Create contract file:

```typescript
// src/modules/v1/users/users.contract.ts
import { createZodDto } from "nestjs-zod"
import { z } from "zod"

// Schema
export const CreateUserSchema = z.object({
	email: z.string().email(),
	name: z.string().min(1).max(255),
})

// Type (inferred from schema)
export type CreateUser = z.infer<typeof CreateUserSchema>

// DTO (for NestJS validation)
export class CreateUserDto extends createZodDto(CreateUserSchema) {}
```

2. Export from `src/index.ts`

## Benefits

- **Single source of truth** — Schema defines validation + TypeScript types
- **Auto-generated docs** — OpenAPI/Swagger from Zod schemas
- **Shared across apps** — Same contracts for backend, web, mobile
