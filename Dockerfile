ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-bookworm-slim AS deps
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm ci --include=dev --no-audit --no-fund || (find /root/.npm/_logs -maxdepth 1 -type f -print -exec cat {} \; && exit 1)

FROM node:${NODE_VERSION}-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=mysql://placeholder:placeholder@127.0.0.1:3306/idlemates
ENV SHADOW_DATABASE_URL=mysql://placeholder:placeholder@127.0.0.1:3306/idlemates_shadow
ENV REDIS_URL=redis://127.0.0.1:6379
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

FROM node:${NODE_VERSION}-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/types ./types
COPY --from=builder /app/tsconfig.json ./tsconfig.json
EXPOSE 3000
CMD ["sh","-c","npx prisma migrate deploy && npm run start:web"]
