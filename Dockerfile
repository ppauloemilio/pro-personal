# Stage 1: Install ALL dependencies (including build tools)
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set a dummy DATABASE_URL for build time (SQLite - static pages need it)
ENV DATABASE_URL="file:./dev.db"

RUN npx prisma generate
RUN npm run build

# Stage 3: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=80
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Copy Prisma schema for runtime
COPY --from=builder /app/prisma ./prisma

# Copy standalone server output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create persistent data directory
RUN mkdir -p /data && chown nextjs:nodejs /data

USER nextjs

EXPOSE 80

ENV DATABASE_URL="file:/data/prod.db"

# Initialize DB on first run, then start server
CMD ["sh", "-c", "npx prisma db push --skip-generate && node server.js"]
