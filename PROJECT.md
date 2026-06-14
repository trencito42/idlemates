# PROJECT.md

## Project overview
- **Description**: IdleMates is a premium web service for Steam hour boosting and card farming. It allows users to "idle" Steam games in the cloud 24/7, accumulating playtime and farming trading cards without keeping their own hardware powered on.
- **Tech stack**: 
  - **Framework**: Next.js 14.2.11 (App Router)
  - **Language**: TypeScript 5.6, Node.js 20+
  - **Frontend**: React 18, Tailwind CSS 3.4, Framer Motion, SweetAlert2
  - **Database/ORM**: Prisma 5.19 (MySQL)
  - **AI Integration**: Xoda AI Chat Widget (Ollama + Mistral 7B), streaming responses, multilingual support (EN/RO/ES)
  - **Background Tasks**: BullMQ 5.21, Redis 7+ (ioredis)
  - **Auth**: NextAuth.js 4.24 with Prisma Adapter, AES-256-GCM envelope encryption for credentials
  - **Infrastructure**: 3proxy (IPv6 SOCKS rotation), PM2 (Process Management)
  - **External Services**: Steam API, Stripe (Payments), Nodemailer (Emails), Discord (Support)

## Project structure
- `app/`: Next.js App Router root.
  - `admin/`: Internal administration panel for user and session management.
  - `api/`: Backend API route handlers (Steam integration, Billing, Chat/Xoda).
  - `app/`: Main dashboard area (`/app/dashboard`, `/app/billing`, `/app/security`).
  - `auth/`: Identity management (Login, Register, Password Reset).
  - `steam-*/`: Landing pages for vertical services (hour boosting, card farming, level up).
- `components/`: Modular UI system.
  - `ui/`: Design system primitives (Button, Dropdown, Modal, Logo).
  - `ChatWidget.tsx`: Xoda AI interface with real-time streaming.
- `lib/`: Core backend logic and shared utilities.
  - `db.ts`: Prisma client singleton with custom error mapping and retries.
  - `crypto.ts`: AES-256-GCM envelope encryption with 32-byte master key rotation.
  - `proxy-manager.ts`: Manages a pool of IPv6 proxies with health monitoring and rotation.
  - `plans.ts`: Business logic for plan limits (Free, Basic, Pro, Ultra).
- `src/worker/`: State-heavy background worker using BullMQ to maintain persistent Steam client connections via `steam-user`.
- `prisma/`: Database schema (`schema.prisma`) and migration history.
- `scripts/`: Operational scripts (e.g., `update-pricing-cache.ts` for AI context).
- `proxies/`: Proxy lists and 3proxy configuration files.

## Development workflow
- **Build**: `npm run build` - Compiles the Next.js application and worker.
- **Run/Dev**: 
  - `npm run dev`: Starts the web server (port 3699).
  - `npm run worker`: Starts the BullMQ worker for Steam idling.
  - `ollama serve`: Required for Xoda AI Chat functionality.
- **Test**: 
  - `npm test`: Unit/Integration tests with Vitest.
  - `npm run e2e`: End-to-end browser tests with Playwright.
- **Infrastructure Management**:
  - `./start.sh` / `./stop.sh`: Main service lifecycle scripts.
  - `./status.sh`: Health monitoring of web, worker, redis, and mysql.
  - `npx tsx scripts/update-pricing-cache.ts`: Syncs DB plans to Redis for AI context.

## Conventions
- **Naming**:
  - **React Components**: `PascalCase` (e.g., `Header.tsx`).
  - **Logic/Hooks**: `camelCase` (e.g., `useLazyLoad.ts`).
- **Import Style**: Absolute imports via `@/*` path alias.
- **Design System**: Strictly follows `DESIGN_SYSTEM_ARCHITECTURE.md` (Accent purple `#8A5CFF`, dark-first).
- **Patterns**:
  - **Security**: "Zero human access" policy; credentials decrypted only in worker memory.
  - **Smart Pause**: Automatic detection and pausing of sessions when the user is active on Steam locally.
  - **Multi-tenant Proxies**: Accounts are bound to unique IPv6 addresses from a 3proxy pool.

## Key constraints
- **Credential Safety**: NEVER log or store unencrypted credentials. Master key rotation happens monthly.
- **Steam Throttling**: The worker implements a 30-minute cooldown on `RateLimitExceeded` errors.
- **DB Migrations**: All schema changes must be applied via `prisma migrate dev`.
- **AI Context**: Xoda must only discuss IdleMates-related topics; unrelated queries are politely redirected.
- **Language Support**: Xoda must match the user's language (EN/RO/ES) while maintaining professional grammar.
- **Plan Limits**:
  - **Free**: 1 game, 100h/month.
  - **Basic**: 6 games, 500h/month (€4.99).
  - **Pro**: 12 games, 1000h/month (€9.99).
  - **Ultra**: 24 games, 2000h/month (€14.99).
