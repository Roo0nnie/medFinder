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
