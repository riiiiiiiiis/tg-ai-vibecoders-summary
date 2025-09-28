# Telegram Dashboard — Analytics & Insights

## Overview
Next.js 15 App Router MVP that connects to an existing PostgreSQL database to visualize Telegram chat activity and surface AI-powered daily insights.

## Getting Started
1. Ensure Node.js 18+ is installed.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env` (see **Configuration**).
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Visit `http://localhost:3000` for the 24-hour dashboard, `http://localhost:3000/week` for 7-day analytics.

## Configuration
Required variables (set in `.env`):
- `DATABASE_URL` — PostgreSQL connection string pointing to the existing messages/users tables.
- `OPENROUTER_API_KEY` — API key for OpenRouter (optional; AI blocks gracefully degrade when absent).
- `OPENROUTER_MODEL` — Model identifier for OpenRouter requests, e.g., `openrouter/anthropic/claude-3-sonnet`.
- `OPENROUTER_TIMEOUT_MS` — (optional) request timeout override in milliseconds.

## Scripts
- `npm run dev` — start Next.js dev server.
- `npm run build` — build production bundle.
- `npm run start` — run production server.
- `npm run lint` — lint via ESLint/Next.
- `npm run test` — execute Vitest suite.

## Key Directories
- `app/` — App Router pages & API routes.
- `components/` — UI building blocks (cards, charts, AI insights).
- `lib/` — Database queries, AI integration, report builder, utilities.

## Testing
```bash
npm run lint
npm run test
```
Both commands should pass without additional configuration.
