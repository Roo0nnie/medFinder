# Multi-stage build for Next.js web application
FROM node:22-alpine AS base

# Install pnpm
RUN npm install -g pnpm@10.27.0

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy workspace dependencies
COPY packages ./packages

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy web app source
COPY apps/web/package.json ./apps/web/
COPY apps/web/tsconfig.json ./apps/web/
COPY apps/web/next.config.ts ./apps/web/
COPY apps/web/postcss.config.mjs ./apps/web/
COPY apps/web/components.json ./apps/web/
COPY apps/web/app ./apps/web/app
COPY apps/web/core ./apps/web/core
COPY apps/web/features ./apps/web/features
COPY apps/web/services ./apps/web/services
COPY apps/web/env.ts ./apps/web/
COPY apps/web/public ./apps/web/public

# Build Next.js application
RUN cd apps/web && pnpm build

# Production stage
FROM node:22-alpine AS production

# Install pnpm
RUN npm install -g pnpm@10.27.0

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy workspace dependencies
COPY packages ./packages

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built Next.js app
COPY --from=base --chown=nodejs:nodejs /app/apps/web/.next ./apps/web/.next
COPY --from=base --chown=nodejs:nodejs /app/apps/web/public ./apps/web/public
COPY --from=base --chown=nodejs:nodejs /app/apps/web/package.json ./apps/web/package.json
COPY --from=base --chown=nodejs:nodejs /app/apps/web/next.config.ts ./apps/web/next.config.ts

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/ || exit 1

# Start Next.js
CMD ["pnpm", "start", "--filter", "@repo/web", "--", "-p", "3001"]
