# Multi-stage build for Next.js web application
FROM node:22-alpine AS base

# Install pnpm
RUN npm install -g pnpm@10.27.0

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Create minimal .gitignore for linting (not in .dockerignore)
RUN touch .gitignore

# Copy workspace dependencies
COPY packages ./packages
COPY tooling ./tooling
COPY apps ./apps

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build all packages using turbo
RUN pnpm build

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

# Copy all necessary files from base stage (node_modules, packages, apps)
COPY --from=base --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=base --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=base --chown=nodejs:nodejs /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=base --chown=nodejs:nodejs /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=base --chown=nodejs:nodejs /app/turbo.json ./turbo.json
COPY --from=base --chown=nodejs:nodejs /app/packages ./packages
COPY --from=base --chown=nodejs:nodejs /app/apps/web ./apps/web

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/ || exit 1

# Start Next.js
CMD ["pnpm", "start", "--filter", "@repo/web", "--", "-p", "3001"]
