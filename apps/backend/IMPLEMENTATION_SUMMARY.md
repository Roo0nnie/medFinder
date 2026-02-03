# Multi-Version API Implementation Summary

## Overview

The backend has been refactored to support multiple API versions simultaneously, each with their own:
- Endpoints (e.g., `/api/v1/examples/todos`, `/api/v2/examples/todos`)
- Swagger/Scalar documentation (e.g., `/api/v1/docs`, `/api/v2/docs`)
- Better Auth endpoints (e.g., `/api/v1/auth/*`, `/api/v2/auth/*`)
- Neutral modules (e.g., HealthModule appears across all versions)

## Key Changes

### 1. Unified Configuration File

**Created:** `apps/backend/src/config/versions.config.ts`

This is now the single source of truth for all version management AND versioning setup:
- `VERSION_MODULES` - Defines which API versions are available
- `NEUTRAL_MODULES` - Modules that appear across ALL versions
- `getVersionModules(version)` - Returns version module + neutral modules
- `discoverVersions()` - Returns list of available versions
- `setupVersioning(app)` - Configures URI-based versioning for the app

**Deleted:** `apps/backend/src/config/versioning.config.ts` (merged into `versions.config.ts`)

### 2. Dynamic Swagger Documentation

**Updated:** `apps/backend/src/config/swagger.config.ts`
- Now uses centralized `versions.config.ts`
- Each version gets its own OpenAPI document
- Automatically includes version module + all neutral modules
- Creates separate Swagger/Scalar docs at `/api/v1/docs`, `/api/v2/docs`, etc.

### 3. Multi-Version Better Auth

**Updated:** `apps/backend/src/config/better-auth.config.ts`
- Better Auth now mounted for EACH version
- `/api/v1/auth/*` - V1 auth endpoints
- `/api/v2/auth/*` - V2 auth endpoints
- Each version has its own auth instance (same config, different paths)

### 4. Removed API_VERSION Dependency

**Updated:** `apps/backend/src/config/bootstrap.ts`
- Removed `API_VERSION` logging (no longer single version)
- Updated import to use `@/config/versions.config`
- Updated documentation in `apps/backend/src/config/env.config.ts`

### 5. Added V2 Module Structure

**Created:** `apps/backend/src/modules/v2/`
- `v2.module.ts` - Main V2 module
- `examples/examples.module.ts` - Examples feature
- `examples/todos/todos.module.ts` - Todos feature
- `examples/todos/todos.controller.ts` - Controller with `version: "2"`
- `examples/todos/todos.service.ts` - V2 service (same logic as V1 for now)

## How to Use

### Accessing Different Versions

```bash
# V1 endpoints and docs
curl http://localhost:3000/api/v1/examples/todos
open http://localhost:3000/api/v1/docs

# V2 endpoints and docs
curl http://localhost:3000/api/v2/examples/todos
open http://localhost:3000/api/v2/docs

# V1 auth endpoints
curl http://localhost:3000/api/v1/auth/*

# V2 auth endpoints
curl http://localhost:3000/api/v2/auth/*

# Neutral modules (available in all versions)
curl http://localhost:3000/api/v1/health
curl http://localhost:3000/api/v2/health
```

### Adding a New Version (e.g., v3)

All version management happens in ONE file: `apps/backend/src/config/versions.config.ts`

1. Create the version module:
   ```typescript
   // apps/backend/src/modules/v3/v3.module.ts
   import { Module } from "@nestjs/common"
   import { ExamplesModule } from "./examples/examples.module"

   @Module({
     imports: [ExamplesModule],
   })
   export class V3Module {}
   ```

2. Import in `versions.config.ts`:
   ```typescript
   import { V3Module } from "@/modules/v3/v3.module"
   ```

3. Add to `VERSION_MODULES`:
   ```typescript
   export const VERSION_MODULES: Record<string, Type<any>> = {
     v1: V1Module,
     v2: V2Module,
     v3: V3Module, // New!
   }
   ```

4. Import in `app.module.ts`:
   ```typescript
   import { V3Module } from "@/modules/v3/v3.module"

   @Module({
     imports: [
       // ...other imports
       V3Module,
     ],
   })
   ```

5. Restart the app - done!

### Adding a Neutral Module

To add a module that appears across ALL versions:

1. Import in `versions.config.ts`:
   ```typescript
   import { SomeCommonModule } from "@/common/some-common/some-common.module"
   ```

2. Add to `NEUTRAL_MODULES`:
   ```typescript
   export const NEUTRAL_MODULES: Type<any>[] = [
     HealthModule,
     SomeCommonModule, // New!
   ]
   ```

3. Restart the app - module automatically appears in all version docs!

## Files Modified

1. **Created:** `apps/backend/src/config/versions.config.ts` - Unified version config and setup
2. **Deleted:** `apps/backend/src/config/versioning.config.ts` - Merged into versions.config
3. **Updated:** `apps/backend/src/config/swagger.config.ts` - Uses centralized config
4. **Updated:** `apps/backend/src/config/better-auth.config.ts` - Mounts for all versions
5. **Updated:** `apps/backend/src/config/bootstrap.ts` - Imports from versions.config
6. **Updated:** `apps/backend/src/config/env.config.ts` - Added documentation
7. **Created:** `apps/backend/src/modules/v2/` - Complete V2 module structure
8. **Updated:** `apps/backend/src/app.module.ts` - Imports V2Module

## Testing

Run tests to verify the implementation:

```bash
# Type checking
pnpm --filter backend typecheck

# Linting
pnpm --filter backend lint

# Start the app
pnpm --filter backend dev

# Test different versions
curl http://localhost:3000/api/v1/examples/todos
curl http://localhost:3000/api/v2/examples/todos

# Test docs
open http://localhost:3000/api/v1/docs
open http://localhost:3000/api/v2/docs

# Test auth endpoints
curl http://localhost:3000/api/v1/auth/*
curl http://localhost:3000/api/v2/auth/*

# Test neutral modules
curl http://localhost:3000/api/v1/health
curl http://localhost:3000/api/v2/health
```

## Benefits

1. **Single Source of Truth** - All version management in ONE file (`versions.config.ts`)
2. **Easy to Add Versions** - Just add module to config and import
3. **Neutral Module Support** - Modules automatically appear across all versions
4. **Independent Documentation** - Each version has its own Swagger/Scalar docs
5. **Independent Auth** - Each version has its own auth endpoints
6. **Backward Compatible** - Environment variable `API_VERSION` still exists (for now)
