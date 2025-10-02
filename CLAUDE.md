# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js 15 (App Router) dashboard that analyzes Telegram chat activity using PostgreSQL and generates AI-powered insights via OpenRouter (Google Gemini 2.5 Pro). Uses Server Components for data fetching and Client Components for interactive features.

## Commands

- `npm run dev` — Start development server (http://localhost:3000)
- `npm run build` — Build production bundle
- `npm run start` — Run production server
- `npm run lint` — Run ESLint

## Environment Configuration

**Required** environment variables in `.env`:
- `DATABASE_URL` — PostgreSQL connection string (expects existing `messages` and `users` tables)
- `OPENROUTER_API_KEY` — OpenRouter API key (required for all AI features)
- `OPENROUTER_MODEL` — Model identifier (e.g., `google/gemini-2.5-pro`)

**Optional** variables:
- `OPENROUTER_TIMEOUT_MS` — Request timeout override (default: 20000ms)
- `LLM_TEXT_CHAR_BUDGET` — Max characters for message text (default: 80000)
- `LLM_DEBUG_VERBOSE` — Set to "1" for verbose OpenRouter logging

**Telegram Bot Integration** (optional):
- `TELEGRAM_BOT_TOKEN` — Telegram bot token (get from @BotFather)
- `TELEGRAM_CHAT_ID` — Target chat ID where summaries will be sent (find using @userinfobot)

AI functionality is **mandatory**—the application will not generate insights without valid OpenRouter credentials.

## Architecture

### Database Layer (`lib/db.ts`, `lib/queries.ts`)

- **Connection pooling**: Global PostgreSQL pool (`getPool()`) with max 5 connections to avoid leaks during hot-reload
- **Expected schema**: Requires `messages` table (columns: `id`, `chat_id`, `user_id`, `text`, `sent_at`) and `users` table (columns: `id`, `first_name`, `last_name`, `username`)
- **Core queries**:
  - `fetchOverview()` — Metrics, top users, time-series (supports time windows: 1 day or 7 days)
  - `fetchMessagesText()` — Raw message text for AI processing
  - `fetchMessagesWithAuthors()` — Messages with author metadata (first_name, last_name, username)

### AI Layer (`lib/ai.ts`, `lib/report.ts`)

- **OpenRouter integration**: Uses `google/gemini-2.5-pro` via OpenRouter API with JSON schema validation
- **Report generation strategy**:
  1. **Text-based mode** (preferred): Fetches up to 5000 messages with authors, truncates to `LLM_TEXT_CHAR_BUDGET`, sends to AI for deep analysis including psychological profiles
  2. **Metrics-only fallback**: Uses aggregated metrics when text payload is empty
- **Schema validation**: Uses Zod (`lib/reportSchemas.ts`) to parse and validate AI responses (fields: `summary`, `themes[]`, `insights[]`)
- **Prompts**: System prompt expects friendly Russian-language curator persona, generates psychological profiles of chat participants

### API Routes

- **`GET /api/overview`** (`app/api/overview/route.ts`): Fetches metrics for 1 or 7 days. Query params: `chat_id` (optional), `days` (1 or 7, default 1)
- **`GET /api/report/[kind]`** (`app/api/report/[kind]/route.ts`): Generates AI reports. Valid `kind` values: `generate`, `insights`, `preview`. Query params: `date` (YYYY-MM-DD), `chat_id`, `days` (1 or 7). Returns 503 if AI unavailable.
- **`POST /api/send-to-telegram`** (`app/api/send-to-telegram/route.ts`): Generates report and sends it to configured Telegram chat. Query params: `date` (YYYY-MM-DD), `chat_id`, `days` (1 or 7). Requires `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` env variables. Automatically splits messages exceeding Telegram's 4096 character limit.

### Pages & Components

- **`app/page.tsx`** — 24-hour dashboard (Server Component)
- **`app/week/page.tsx`** — 7-day dashboard (Server Component)
- **`components/summary-generator.tsx`** — Client Component for on-demand AI report generation with Telegram integration (loading states, error handling, send-to-Telegram button)
- **`components/ai-insights.tsx`** — Displays AI-generated insights
- **`components/metric-card.tsx`**, **`components/top-users.tsx`** — Static metric displays

### TypeScript Configuration

- **Module resolution**: Uses `bundler` with `@/*` path alias pointing to root
- **Strict mode**: Enabled
- **Target**: ES2022
- No JavaScript files allowed (`allowJs: false`)

## Development Workflow

1. Ensure PostgreSQL database is running and `DATABASE_URL` is set with correct schema
2. Verify OpenRouter API credentials are configured
3. Run `npm run dev` to start development server
4. Access http://localhost:3000 for 24-hour view, http://localhost:3000/week for 7-day view
5. Use `?chat_id=<id>` query parameter to filter by specific Telegram chat

## Important Notes

- **AI reports require valid OpenRouter configuration**—no fallback content exists
- **Database schema is external**—this app expects pre-existing `messages` and `users` tables
- **Next.js 15 canary**: Uses React 19 RC and App Router
- **Server-side rendering**: Metrics are fetched server-side; AI generation happens on-demand via API
- **Russian language**: All UI text and AI prompts are in Russian
- **Chat filtering**: All queries support optional `chat_id` parameter for multi-chat deployments
- **Telegram Bot Setup** (optional feature):
  1. Create bot via @BotFather, get token
  2. Add bot to target chat, ensure it can send messages
  3. Get chat ID using @userinfobot (for groups: negative number)
  4. Add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` to `.env`
  5. Use "📤 Отправить в Telegram" button in UI to send summaries
- не запускай локальный сервер