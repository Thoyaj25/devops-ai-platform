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

RUN apk add --no-cache git

ENV NODE_ENV=production

# Prisma / Next build requires DATABASE_URL
ENV DATABASE_URL="postgresql://marketsphere:marketsphere@postgres:5432/marketsphere"


COPY --from=deps /app/node_modules ./node_modules

COPY . .


# Generate Prisma client

RUN npx prisma generate


# Build Next.js standalone

RUN npm run build



# ==================================================
# Runtime
# ==================================================

FROM node:22-alpine AS runtime


WORKDIR /app


ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0



# Runtime dependencies

RUN apk add --no-cache \
    git \
    docker-cli



# ==================================================
# Next.js Standalone
# ==================================================

COPY --from=builder \
    /app/.next/standalone \
    ./


COPY --from=builder \
    /app/.next/static \
    ./.next/static


COPY --from=builder \
    /app/public \
    ./public



# ==================================================
# Prisma Runtime
# ==================================================

COPY --from=builder \
    /app/prisma \
    ./prisma


COPY --from=builder \
    /app/prisma.config.ts \
    ./prisma.config.ts


COPY --from=builder \
    /app/src/generated \
    ./src/generated



# ==================================================
# Docker Runtime Access
# ==================================================

# Required for DockerDeploymentProvider
# Container receives docker.sock from compose


RUN mkdir -p /app/logs



# ==================================================
# Security
# ==================================================

# Keep root because Docker socket access requires it.
# Restrict deployment container through compose instead.

USER root



EXPOSE 3000



# ==================================================
# Health Check
# ==================================================

HEALTHCHECK \
    --interval=30s \
    --timeout=5s \
    --start-period=40s \
    --retries=5 \
    CMD node -e "\
    fetch('http://127.0.0.1:3000/api/health')\
    .then(res => {\
        if (!res.ok) process.exit(1);\
    })\
    .catch(() => process.exit(1));"



# ==================================================
# Startup
# ==================================================

CMD ["node", "server.js"]