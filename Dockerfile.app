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

# Build-time DATABASE_URL
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

RUN npx prisma generate

RUN npm run build

# --------------------------------------------------
# Runtime
# --------------------------------------------------
FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apk add --no-cache docker-cli

COPY package*.json ./
COPY prisma.config.ts ./

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/generated ./src/generated

RUN npm ci --omit=dev

HEALTHCHECK \
  --interval=30s \
  --timeout=5s \
  --retries=3 \
CMD wget --spider -q http://localhost:3000/api/health || exit 1

EXPOSE 3000

CMD ["node","server.js"]