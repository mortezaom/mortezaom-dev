# Multi-stage build for Next.js static export
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application for static export
RUN corepack enable pnpm && pnpm run build

# Production image - lightweight static file server
FROM node:20-alpine AS runner
WORKDIR /app

# Install serve package globally
RUN npm install -g serve

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy static files from Next.js build
COPY --from=builder --chown=nextjs:nodejs /app/out ./public

USER nextjs

EXPOSE 3000

# Serve static files
CMD ["serve", "-s", "public", "-l", "3000"]