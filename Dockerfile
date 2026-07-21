# --------------------------------------------------
# Dependencies
# --------------------------------------------------
FROM node:22-alpine AS deps

WORKDIR /app

RUN apk add --no-cache git

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npm ci

# --------------------------------------------------
# Builder
# --------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build && exit 1

# --------------------------------------------------
# Runtime
# --------------------------------------------------
FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN apk add --no-cache \
    git \
    docker-cli

# Standalone Next.js application
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Worker runtime files
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json

EXPOSE 3000

CMD ["node", "server.js"]