# ---------- Dependencies ----------
FROM node:22-alpine AS deps

WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Copy Prisma files before npm ci so postinstall (prisma generate) succeeds
COPY prisma ./prisma
COPY prisma.config.ts ./

# Install dependencies
RUN npm ci


# ---------- Builder ----------
FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build


# ---------- Runner ----------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup -S nextjs && \
    adduser -S nextjs -G nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]