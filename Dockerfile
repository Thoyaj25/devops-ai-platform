# ==================================================
# Dependencies
# ==================================================

FROM node:22-alpine AS deps

WORKDIR /app

RUN apk add --no-cache git

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npm ci


# ==================================================
# Builder
# ==================================================

FROM node:22-alpine AS builder

WORKDIR /app

ENV NODE_ENV=production

ENV DATABASE_URL="postgresql://marketsphere:marketsphere@postgres:5432/marketsphere"

COPY --from=deps /app/node_modules ./node_modules

COPY . .

RUN npx prisma generate

RUN npm run build


# ==================================================
# Runtime
# ==================================================

FROM node:22-alpine AS runtime

WORKDIR /app


ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0


# Runtime utilities
# docker-cli required by DockerDeploymentProvider
# wget required by HEALTHCHECK

RUN apk add --no-cache \
    docker-cli \
    wget \
    dumb-init


# ==================================================
# Next.js Standalone Runtime
# ==================================================

COPY --from=builder /app/.next/standalone ./

COPY --from=builder /app/.next/static ./.next/static

COPY --from=builder /app/public ./public


# ==================================================
# Prisma Runtime
# ==================================================

COPY --from=builder /app/prisma ./prisma

COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

COPY --from=builder /app/src/generated ./src/generated


# ==================================================
# Application Logs
# ==================================================

RUN mkdir -p /app/logs


# ==================================================
# Security
# ==================================================

# Docker socket access requires root.
# Restrict container permissions through compose.

USER root


# ==================================================
# Port
# ==================================================

EXPOSE 3000


# ==================================================
# Container Health
# ==================================================

HEALTHCHECK \
    --interval=10s \
    --timeout=5s \
    --start-period=30s \
    --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1


# ==================================================
# Startup
# ==================================================

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "server.js"]