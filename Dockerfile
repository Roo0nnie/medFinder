# Multi-stage build for the Turborepo monorepo (Next.js + shared packages).
# This is NOT the Django API image. To deploy the Python backend on Render, use:
#   Settings → Root Directory: apps/backend   → Dockerfile Path: ./Dockerfile
# or see apps/backend/.env.example (Render section).
#
# Stage 1: Builder - Build all packages and dependencies
FROM node:22-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@10.27.0

# Set working directory
WORKDIR /app

# Install only after workspace members exist on disk; otherwise pnpm cannot link
# workspace:* and `turbo run build` fails in tooling (e.g. TS6053 @repo/tsconfig not found).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps ./apps
COPY packages ./packages
COPY tooling ./tooling
RUN pnpm install --frozen-lockfile

# Remaining repo files (node_modules from host is dockerignored — does not clobber install)
COPY . .

RUN pnpm build

# Stage 2: Base runtime - Contains built artifacts
FROM node:22-alpine AS base

# Install pnpm for runtime
RUN npm install -g pnpm@10.27.0

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy built artifacts from builder (`pnpm start` = `turbo run start` needs turbo.json)
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder --chown=nodejs:nodejs /app/turbo.json ./turbo.json
COPY --from=builder --chown=nodejs:nodejs /app/packages ./packages
COPY --from=builder --chown=nodejs:nodejs /app/apps ./apps

# Switch to non-root user
USER nodejs

CMD ["pnpm", "start"]
