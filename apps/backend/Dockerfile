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

# Build backend application
RUN pnpm build --filter=@repo/backend

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

# Copy only necessary workspace packages (not all packages)
COPY packages/auth ./packages/auth
COPY packages/contracts ./packages/contracts
COPY packages/db ./packages/db

# Copy backend app
COPY apps/backend/package.json ./apps/backend/
COPY apps/backend/tsconfig.json ./apps/backend/
COPY apps/backend/tsconfig.build.json ./apps/backend/
COPY apps/backend/nest-cli.json ./apps/backend/
COPY apps/backend/.swcrc ./apps/backend/
COPY apps/backend/src ./apps/backend/src

# Install production dependencies
RUN cd apps/backend && pnpm install --frozen-lockfile --prod

# Copy built backend from base stage
COPY --from=base --chown=nodejs:nodejs /app/apps/backend/dist ./apps/backend/dist
COPY --from=base --chown=nodejs:nodejs /app/node_modules ./node_modules

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start NestJS
CMD ["node", "apps/backend/dist/main.js"]
