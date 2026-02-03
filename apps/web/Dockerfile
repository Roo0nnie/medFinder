# ========================================
# Base Stage
# ========================================
FROM node:22-alpine AS base
RUN apk update
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@10.27.0
WORKDIR /app

# ========================================
# Prepare Stage - Prune workspace
# ========================================
FROM base AS prepare
RUN npm install -g turbo
COPY . .
# Generate pruned workspace with pruned lockfile for target workspace
RUN turbo prune @repo/web --docker

# ========================================
# Builder Stage
# ========================================
FROM base AS builder
# First install the dependencies (as they change less often)
COPY --from=prepare /app/out/json/ .
COPY --from=prepare /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile
# Build the project
COPY --from=prepare /app/out/full/ .
RUN pnpm --filter @repo/web build

# ========================================
# Runner Stage - Minimal production image
# ========================================
FROM base AS runner
# Don't run production as root for security reasons
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/app/building-your-application/deploying#minimal-usage
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

EXPOSE 3001
CMD node apps/web/server.js
