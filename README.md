# Telegram Dashboard — Analytics & Insights

## Overview
Next.js 15 App Router application that connects to an existing PostgreSQL database to visualize Telegram chat activity and deliver **mandatory AI-powered** insights via Google Gemini 2.5 Pro.

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
**Required variables** (set in `.env`):
- `DATABASE_URL` — PostgreSQL connection string pointing to the existing messages/users tables.
- `OPENROUTER_API_KEY` — **Required** API key for OpenRouter AI service.
- `OPENROUTER_MODEL` — **Required** Model identifier, e.g., `google/gemini-2.5-pro`.
- `OPENROUTER_TIMEOUT_MS` — (optional) request timeout override in milliseconds (default: 20000).

⚠️ **Important**: AI features require valid OpenRouter credentials. The application will not generate insights without proper API configuration.

## Scripts
- `npm run dev` — start Next.js dev server.
- `npm run build` — build production bundle.
- `npm run start` — run production server.
- `npm run lint` — lint via ESLint/Next.

## AI Requirements
This application **requires** AI functionality for insights generation:
- All report generation depends on OpenRouter API
- No fallback content is provided when AI is unavailable
- Ensure stable internet connection and valid API quota
- Monitor OpenRouter service status for optimal experience

## Features
- **Real-time Analytics**: PostgreSQL-powered metrics and time-series data
- **AI-Powered Insights**: Mandatory Google Gemini 2.5 Pro analysis via OpenRouter
- **Interactive Generation**: On-demand summary creation with loading states
- **Multi-chat Support**: Filter analytics by specific Telegram chat_id
- **Responsive Design**: Optimized for desktop and mobile viewing

## Key Directories
- `app/` — App Router pages & API routes.
- `components/` — UI building blocks (cards, charts, AI insights).
- `lib/` — Database queries, AI integration, report builder, utilities.

## Development
```bash
npm run lint
```
Linting should pass without additional configuration.
