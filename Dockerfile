ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-bookworm-slim AS deps
WORKDIR /idlemates
ENV NEXT_TELEMETRY_DISABLED=1
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm ci --include=dev --no-audit --no-fund || (find /root/.npm/_logs -maxdepth 1 -type f -print -exec cat {} \; && exit 1)

FROM node:${NODE_VERSION}-bookworm-slim AS builder
WORKDIR /idlemates
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=mysql://placeholder:placeholder@127.0.0.1:3306/idlemates
ENV SHADOW_DATABASE_URL=mysql://placeholder:placeholder@127.0.0.1:3306/idlemates_shadow
COPY --from=deps /idlemates/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

FROM node:${NODE_VERSION}-bookworm-slim AS runner
WORKDIR /idlemates
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /idlemates/node_modules ./node_modules
COPY --from=builder /idlemates/.next ./.next
COPY --from=builder /idlemates/package.json ./package.json
COPY --from=builder /idlemates/next.config.js ./next.config.js
COPY --from=builder /idlemates/public ./public
COPY --from=builder /idlemates/prisma ./prisma
COPY --from=builder /idlemates/src ./src
COPY --from=builder /idlemates/lib ./lib
COPY --from=builder /idlemates/types ./types
COPY --from=builder /idlemates/tsconfig.json ./tsconfig.json
COPY scripts/start-production.sh ./scripts/start-production.sh
COPY scripts/bootstrap-admins.js ./scripts/bootstrap-admins.js
RUN chmod +x ./scripts/start-production.sh
EXPOSE 3000
CMD ["./scripts/start-production.sh"]
