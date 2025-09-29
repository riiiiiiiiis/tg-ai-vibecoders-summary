# Product Overview

## Telegram Dashboard — Analytics & Insights

A Next.js 15 application that provides real-time analytics and AI-powered insights for Telegram communities. The dashboard connects to an existing PostgreSQL database containing Telegram chat messages and user data, with mandatory AI analysis via Google Gemini 2.5 Pro.

## Key Features

### Analytics Dashboard
- **24-hour View** (`/`) - Real-time metrics for the last day
- **7-day View** (`/week`) - Weekly analytics summary
- **Multi-chat Support** - Filter all views by specific Telegram `chat_id` parameter
- **Core Metrics** - Total messages, unique users, messages with links
- **Top Contributors** - Simple list of most active users with display names
- **Basic Data Display** - Simple tables and lists for data presentation

### AI-Powered Insights
- **Structured Reports** - AI analysis with summary, themes, and actionable insights
- **Dual Generation Modes** - Text-based analysis (with message content) or metrics-only fallback
- **Interactive Generation** - On-demand report creation via "Генерировать" button
- **Russian Language Output** - AI generates friendly, conversational Russian content
- **User Profiling** - AI creates psychological profiles of chat participants
- **Content Suggestions** - Themes and engagement ideas based on chat dynamics

### Technical Implementation
- **Server-Side Rendering** - Dashboard pages pre-render with database queries
- **Client-Side Interactivity** - AI report generation with loading states and error handling
- **Dynamic API Routes** - `/api/overview` for metrics, `/api/report/[kind]` for AI analysis
- **Connection Pooling** - Efficient PostgreSQL connection management
- **Structured AI Responses** - JSON schema validation for consistent AI output format

## Critical Dependencies

### Required Services
- **PostgreSQL Database** - Existing schema with `messages` and `users` tables
- **OpenRouter API** - Valid API key and model configuration (Google Gemini 2.5 Pro)
- **Internet Connection** - Required for AI service calls (no offline mode)

### Database Schema Requirements
- `messages` table with columns: `id`, `user_id`, `chat_id`, `text`, `sent_at`
- `users` table with columns: `id`, `first_name`, `last_name`, `username`
- Proper indexing on `sent_at` and `chat_id` for performance

### Environment Configuration
- `DATABASE_URL` - PostgreSQL connection string
- `OPENROUTER_API_KEY` - API authentication token
- `OPENROUTER_MODEL` - Model identifier (e.g., `google/gemini-2.5-pro`)
- Optional: `OPENROUTER_TIMEOUT_MS`, `LLM_DEBUG_VERBOSE`, `LLM_TEXT_CHAR_BUDGET`

## User Interface Language

The application uses **Russian language** throughout:
- Navigation: "24 часа" / "7 дней"
- Metrics: "Сообщения", "Уникальные участники", "Сообщения со ссылками"
- AI sections: "AI дайджест", "Темы дня", "Инсайты"
- Interactive elements: "Генерировать", loading states in Russian
- Error messages and user feedback in Russian

## AI Behavior & Personality

The AI assistant is configured to act as a **friendly Telegram chat curator** with these characteristics:
- **Conversational tone** - Writes like a human friend, not corporate/official language
- **Community focus** - Helps chat owners understand member dynamics and engagement
- **Content suggestions** - Provides actionable ideas for posts, discussions, and mini-events
- **Psychological insights** - Creates participant profiles showing communication styles and roles
- **Russian cultural context** - Uses appropriate Russian expressions and communication patterns