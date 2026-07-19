# -------------------------
# Dependencies
# -------------------------
FROM node:22-alpine AS deps

WORKDIR /app

# Install tools required during build
RUN apk add --no-cache git

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npm ci

# -------------------------
# Builder
# -------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Builder also needs git in case npm dependencies reference git repositories
RUN apk add --no-cache git

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

# -------------------------
# Runner
# -------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Worker requires these tools
RUN apk add --no-cache \
    git \
    docker-cli

# -------------------------
# Next.js standalone application
# -------------------------
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# -------------------------
# Worker runtime files
# -------------------------
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

EXPOSE 3000

# Default command (docker-compose overrides this for the worker)
CMD ["node", "server.js"]