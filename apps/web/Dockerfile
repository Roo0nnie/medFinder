FROM node:22-alpine AS base

# Install pnpm
RUN npm install -g pnpm@10.27.0

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy workspace dependencies
COPY packages ./packages
COPY tooling ./tooling
COPY apps ./apps

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build web application
RUN pnpm build --filter=@repo/web

# Production stage
FROM node:22-alpine AS production

# Install pnpm
RUN npm install -g pnpm@10.27.0

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy workspace packages (only necessary ones)
COPY packages/auth ./packages/auth
COPY packages/contracts ./packages/contracts
COPY packages/db ./packages/db

# Copy web app
COPY apps/web/package.json ./apps/web/
COPY apps/web/next.config.ts ./apps/web/next.config.ts
COPY apps/web/postcss.config.mjs ./apps/web/postcss.config.mjs
COPY apps/web/components.json ./apps/web/components.json

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built web app from base stage
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
