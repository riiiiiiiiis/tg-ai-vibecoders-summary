# Getting Started

<cite>
**Referenced Files in This Document**   
- [README.md](file://README.md)
- [package.json](file://package.json)
- [lib/db.ts](file://lib/db.ts)
- [lib/ai.ts](file://lib/ai.ts)
- [lib/telegram.ts](file://lib/telegram.ts)
</cite>

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation Process](#installation-process)
3. [Environment Configuration](#environment-configuration)
4. [Running the Development Server](#running-the-development-server)
5. [Package Scripts Overview](#package-scripts-overview)
6. [Common Setup Issues and Troubleshooting](#common-setup-issues-and-troubleshooting)

## Prerequisites

Before setting up the tg-ai-vibecoders-summary development environment, ensure the following prerequisites are met:

- **Node.js 18+**: The application requires Node.js version 18 or higher for proper execution. Verify your Node.js version using `node --version` in your terminal.
- **PostgreSQL Database**: A running PostgreSQL instance is required with existing `messages` and `users` tables that contain the Telegram chat data to be analyzed.
- **OpenRouter API Credentials**: Valid API credentials from OpenRouter are mandatory as the application relies on AI-powered insights generation through their service. The AI functionality is not optional and the application will not generate insights without proper API configuration.

**Section sources**
- [README.md](file://README.md#L2-L10)

## Installation Process

To set up the project locally, follow these steps:

1. Clone the repository from GitHub:
   ```bash
   git clone https://github.com/ris/tg-ai-vibecoders-summary.git
   cd tg-ai-vibecoders-summary
   ```

2. Install the required dependencies using npm:
   ```bash
   npm install
   ```

This will install all dependencies specified in the package.json file, including Next.js 15, PostgreSQL client, React 19, and other required libraries.

**Section sources**
- [README.md](file://README.md#L11-L15)
- [package.json](file://package.json#L1-L28)

## Environment Configuration

The application requires several environment variables to be configured. Create a `.env` file in the project root directory and populate it with the following required variables:

```env
DATABASE_URL=your_postgresql_connection_string
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=google/gemini-2.5-pro
```

### Required Environment Variables

| Variable | Description |
|--------|-------------|
| `DATABASE_URL` | PostgreSQL connection string pointing to the database with existing messages/users tables |
| `OPENROUTER_API_KEY` | API key for OpenRouter AI service (required for insights generation) |
| `OPENROUTER_MODEL` | Model identifier for OpenRouter (e.g., `google/gemini-2.5-pro`) |

### Optional Environment Variables

| Variable | Description | Default |
|--------|-------------|---------|
| `OPENROUTER_TIMEOUT_MS` | Request timeout override in milliseconds | 20000 |
| `TELEGRAM_BOT_TOKEN` | Token for Telegram bot integration | - |
| `TELEGRAM_CHAT_ID` | Target chat ID for sending reports | - |
| `LLM_DEBUG_VERBOSE` | Enable verbose logging for AI service (set to "1" to enable) | - |

The application validates the presence of critical environment variables during runtime. Missing `DATABASE_URL` will prevent database access, while missing OpenRouter credentials will prevent AI insights generation.

**Section sources**
- [README.md](file://README.md#L17-L28)
- [lib/db.ts](file://lib/db.ts#L7-L11)
- [lib/ai.ts](file://lib/ai.ts#L3-L4)
- [lib/ai.ts](file://lib/ai.ts#L171-L172)
- [lib/telegram.ts](file://lib/telegram.ts#L116-L124)

## Running the Development Server

After completing the installation and configuration steps, start the development server using the following command:

```bash
npm run dev
```

Once the server is running, access the application through your web browser:

- **24-hour dashboard**: Visit `http://localhost:3000`
- **7-day analytics**: Visit `http://localhost:3000/week`

The application uses Next.js App Router and will automatically reload when changes are made to the source files during development.

**Section sources**
- [README.md](file://README.md#L16)
- [package.json](file://package.json#L6)

## Package Scripts Overview

The following npm scripts are available in the project's package.json file:

| Script | Description |
|-------|-------------|
| `dev` | Starts the Next.js development server with hot reloading |
| `build` | Compiles the application for production deployment |
| `start` | Runs the production server (must run `build` first) |
| `lint` | Runs ESLint with Next.js configuration to check code quality |

These scripts provide the standard development workflow for a Next.js application, allowing for development, testing, building, and deployment.

**Section sources**
- [README.md](file://README.md#L31-L35)
- [package.json](file://package.json#L5-L9)

## Common Setup Issues and Troubleshooting

### Missing Environment Variables

If required environment variables are not set, the application will throw specific errors:

- **DATABASE_URL not set**: "DATABASE_URL env variable is required for database access."
- **OpenRouter credentials missing**: "AI service requires OPENROUTER_API_KEY and OPENROUTER_MODEL environment variables"

Ensure all required variables are properly configured in the `.env` file.

### Database Connection Failures

Verify that:
- The PostgreSQL server is running and accessible
- The connection string in `DATABASE_URL` is correct and includes proper credentials
- The database contains the required `messages` and `users` tables with appropriate data

### AI Service Unavailability

The application depends on OpenRouter for AI-powered insights. Issues may arise from:

- **Invalid API credentials**: Double-check the `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` values
- **Service outages**: Check OpenRouter service status
- **API quota limits**: Ensure you have sufficient API quota available
- **Network connectivity**: Verify internet connection is stable

### Telegram Integration Issues

When using Telegram bot integration, common issues include:

- **Missing bot token or chat ID**: Ensure both `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are set
- **Bot not added to chat**: The bot must be added to the target chat with appropriate permissions
- **Invalid chat ID**: Verify the chat ID is correct and the bot has permission to send messages

Enable `LLM_DEBUG_VERBOSE=1` in the environment to get detailed logging information for debugging AI-related issues.

**Section sources**
- [lib/db.ts](file://lib/db.ts#L11)
- [lib/ai.ts](file://lib/ai.ts#L172)
- [lib/telegram.ts](file://lib/telegram.ts#L116-L124)
- [lib/telegram.ts](file://lib/telegram.ts#L410-L442)