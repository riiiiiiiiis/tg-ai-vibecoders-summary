# Technology Stack

## Core Framework
- **Next.js 15.0.0-canary.58** (App Router) with React 19 RC
- **TypeScript 5.5.3** with strict mode enabled
- **Custom CSS** for minimal styling

## Database & APIs
- **PostgreSQL** via `pg` driver (v8.12.0) with connection pooling
- **OpenRouter API** for AI integration (Google Gemini 2.5 Pro)
- **Zod 3.23.8** for schema validation and type safety

## Development Tools
- **ESLint 8.57.0** with Next.js configuration

## Key Libraries
- **React 19.0.0-rc.0** with concurrent features

## Build & Development Commands

### Development
```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Build production bundle
npm run start        # Run production server
```

### Quality Assurance
```bash
npm run lint         # ESLint validation
```

## Environment Configuration

### Required Variables
- `DATABASE_URL` - PostgreSQL connection string
- `OPENROUTER_API_KEY` - OpenRouter API key (mandatory)
- `OPENROUTER_MODEL` - Model identifier (e.g., google/gemini-2.5-pro)

### Optional Variables
- `OPENROUTER_TIMEOUT_MS` - Request timeout override (default: 20000ms)
- `LLM_DEBUG_VERBOSE` - Set to "1" for verbose AI logging
- `LLM_TEXT_CHAR_BUDGET` - Character limit for AI text analysis (default: 80000)

## Next.js Configuration
- Experimental typed routes enabled
- Server external packages: `pg` for PostgreSQL driver
- Path aliases: `@/*` maps to project root