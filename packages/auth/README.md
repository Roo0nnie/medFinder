# @repo/auth

Framework-agnostic Better Auth package with shared configuration and instance. Provides authentication for backend (NestJS), web (Next.js), and mobile (Flutter) applications.

## Overview

This package provides a centralized Better Auth instance that can be used across multiple applications:

- **Backend (NestJS)**: Uses hybrid approach with `@thallesp/nestjs-better-auth` for NestJS-specific features
- **Web (Next.js)**: Direct usage with React hooks
- **Mobile (Flutter)**: Uses REST API calls to backend endpoints (no direct dependency)

## Framework-Agnostic Usage

The core auth instance can be imported and used in any Node.js application:

```typescript
import { auth } from "@repo/auth"

// Use the auth instance
const session = await auth.api.getSession({ headers })
```

## Backend Integration (NestJS)

### Setup

1. Install dependencies:

```bash
pnpm add @repo/auth @thallesp/nestjs-better-auth better-auth
```

2. Configure `main.ts` to disable body parser:

```typescript
import { NestFactory } from "@nestjs/core"

const app = await NestFactory.create(AppModule, {
	bodyParser: false, // Better Auth will handle this
})
```

3. Import `AuthModule` in your root module:

```typescript
import { Module } from "@nestjs/common"
import { AuthModule } from "@thallesp/nestjs-better-auth"

import { auth } from "@repo/auth"

@Module({
	imports: [
		AuthModule.forRoot({ auth }), // Pass shared instance
	],
})
export class AppModule {}
```

### Usage

Use decorators from `@thallesp/nestjs-better-auth`:

```typescript
import { Controller, Get } from "@nestjs/common"
import { AllowAnonymous, Roles, Session } from "@thallesp/nestjs-better-auth"

@Controller("users")
export class UserController {
	@Get("me")
	async getProfile(@Session() session: UserSession) {
		return session
	}

	@Get("public")
	@AllowAnonymous() // Allow anonymous access
	async publicRoute() {
		return { message: "This route is public" }
	}

	@Get("admin")
	@Roles(["admin"]) // Require admin role
	async adminRoute() {
		return "Only admins can see this"
	}
}
```

### Accessing Auth Service

You can also inject the `AuthService` to access Better Auth API methods:

```typescript
import { Controller, Get, Request } from "@nestjs/common"
import { AuthService } from "@thallesp/nestjs-better-auth"
import { fromNodeHeaders } from "better-auth/node"
import type { Request as ExpressRequest } from "express"

import { auth } from "@repo/auth"

@Controller("users")
export class UsersController {
	constructor(private authService: AuthService<typeof auth>) {}

	@Get("accounts")
	async getAccounts(@Request() req: ExpressRequest) {
		const accounts = await this.authService.api.listUserAccounts({
			headers: fromNodeHeaders(req.headers),
		})
		return { accounts }
	}
}
```

## Web Integration (Next.js)

### Setup

1. Install dependencies:

```bash
pnpm add @repo/auth better-auth better-auth/react
```

2. Create API route handler at `app/api/auth/[...all]/route.ts`:

```typescript
import { toNextJsHandler } from "better-auth/next-js"

import { auth } from "@repo/auth"

export const { GET, POST } = toNextJsHandler(auth)
```

3. Create auth client at `lib/auth-client.ts`:

```typescript
import { createAuthClient } from "better-auth/react"

export const { signIn, signUp, signOut, useSession } = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3000",
})
```

### Usage in React Components

```typescript
"use client"

import { useSession, signIn, signOut } from "@/lib/auth-client"

export function AuthButton() {
  const { data: session, isPending } = useSession()

  if (isPending) return <div>Loading...</div>

  if (session?.user) {
    return (
      <div>
        <p>Signed in as {session.user.email}</p>
        <button onClick={() => signOut()}>Sign out</button>
      </div>
    )
  }

  return (
    <button onClick={() => signIn.email({ email: "user@example.com", password: "password" })}>
      Sign in
    </button>
  )
}
```

### Server Components

```typescript
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: headers() })

  if (!session?.user) {
    return <div>Not authenticated</div>
  }

  return <div>Welcome, {session.user.email}!</div>
}
```

## Mobile Integration (Flutter)

The mobile app uses REST API calls to the backend Better Auth endpoints. No direct Better Auth dependency is needed.

### Setup

1. Add dependencies to `pubspec.yaml`:

```yaml
dependencies:
  http: ^1.2.2
  flutter_secure_storage: ^9.2.2
```

2. Use the `AuthService` from `lib/services/auth_service.dart`:

```dart
import 'package:mobile/services/auth_service.dart';

final authService = AuthService(
  baseUrl: 'http://localhost:3000', // Your backend URL
);

// Sign in
final session = await authService.signIn(
  email: 'user@example.com',
  password: 'password',
);

// Get current session
final currentSession = await authService.getSession();

// Check if authenticated
final isAuth = await authService.isAuthenticated();

// Sign out
await authService.signOut();
```

### Example Usage

```dart
import 'package:flutter/material.dart';
import 'package:mobile/services/auth_service.dart';

class LoginPage extends StatefulWidget {
  @override
  _LoginPageState createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _authService = AuthService(baseUrl: 'http://localhost:3000');
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  Future<void> _signIn() async {
    final session = await _authService.signIn(
      email: _emailController.text,
      password: _passwordController.text,
    );

    if (session != null) {
      // Navigate to home page
      Navigator.pushReplacementNamed(context, '/home');
    } else {
      // Show error
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Sign in failed')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          TextField(controller: _emailController, decoration: InputDecoration(labelText: 'Email')),
          TextField(controller: _passwordController, decoration: InputDecoration(labelText: 'Password'), obscureText: true),
          ElevatedButton(onPressed: _signIn, child: Text('Sign In')),
        ],
      ),
    );
  }
}
```

## Environment Variables

The auth package requires the following environment variables:

- `BETTER_AUTH_SECRET` or `AUTH_SECRET` - Secret key for signing tokens (required)
- `BETTER_AUTH_URL` or `NEXT_PUBLIC_BETTER_AUTH_URL` - Base URL of your application (default: `http://localhost:3000`)
- `BETTER_AUTH_TRUSTED_ORIGINS` - Comma-separated list of trusted origins for CORS (optional)
- `POSTGRES_URL` - Database connection string (from `@repo/db`)

## Database Schema

The Better Auth database tables are defined in `@repo/db/src/schema/auth.ts`:

- `users` - User accounts
- `sessions` - Active sessions
- `accounts` - OAuth accounts and credentials
- `verifications` - Email verification and password reset tokens

Make sure to run database migrations after adding the auth schema:

```bash
pnpm db:generate
pnpm db:migrate
```

## Scripts

- `pnpm build` - Build the package
- `pnpm dev` - Watch mode for development
- `pnpm generate` - Generate Better Auth types and helpers (uses Better Auth CLI)

## Architecture

```
┌─────────────────────────────────────────┐
│      @repo/auth (Core Package)          │
│  - Better Auth instance & config        │
│  - Drizzle adapter (uses @repo/db)      │
│  - Shared across backend & web          │
└─────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
┌─────────────┐ ┌──────────┐ ┌──────────────┐
│  Backend    │ │   Web    │ │   Mobile    │
│  (NestJS)   │ │ (Next.js)│ │  (Flutter)  │
├─────────────┤ ├──────────┤ ├──────────────┤
│ Hybrid:     │ │ Direct:  │ │ REST API:   │
│ @repo/auth  │ │ @repo/   │ │ HTTP calls  │
│ +           │ │ auth     │ │ to backend  │
│ @thallesp/  │ │ +        │ │ /api/auth/* │
│ nestjs-     │ │ better-  │ │             │
│ better-auth │ │ auth/    │ │ No Better   │
│             │ │ react    │ │ Auth dep    │
└─────────────┘ └──────────┘ └──────────────┘
```

## Notes

- The auth instance is created once and shared across all apps
- Backend uses `@thallesp/nestjs-better-auth` for NestJS-specific features (decorators, guards, DI)
- Web uses Better Auth React hooks for client-side authentication
- Mobile uses REST API calls - no Better Auth dependency needed
- All apps share the same database schema and configuration
