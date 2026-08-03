# ── Build stage ──────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# ── Production stage ─────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Non-root user for security
RUN addgroup -S finsight && adduser -S finsight -G finsight

COPY --from=build /app/node_modules ./node_modules
COPY . .

USER finsight

ENV NODE_ENV=production

EXPOSE ${PORT:-3000}

CMD ["node", "server.js"]
