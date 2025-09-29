# Project Structure & Organization

## Directory Layout

```
├── app/                    # Next.js 15 App Router
│   ├── api/               # API routes
│   │   ├── overview/      # Dashboard metrics endpoint (GET)
│   │   └── report/        # AI report generation endpoints
│   │       └── [kind]/    # Dynamic route for report types (generate, insights, preview)
│   ├── week/              # 7-day analytics page
│   ├── globals.css        # Global custom styles
│   ├── layout.tsx         # Root layout with Russian header/nav
│   └── page.tsx           # 24-hour dashboard (homepage)
├── components/            # Reusable UI components
│   ├── ai-insights.tsx    # AI report display component
│   ├── metric-card.tsx    # Statistics display cards
│   ├── summary-generator.tsx # Interactive AI report generation
│   └── top-users.tsx      # Top contributors list
├── lib/                   # Utilities and business logic
│   ├── ai.ts             # OpenRouter API integration
│   ├── db.ts             # PostgreSQL connection pooling
│   ├── queries.ts        # Database query functions
│   ├── report.ts         # Report generation orchestration
│   ├── reportSchemas.ts  # Zod schemas for AI responses
│   └── types.ts          # Shared TypeScript definitions
└── .kiro/                # Kiro AI assistant configuration
```

## Architecture Patterns

### App Router Structure
- **Server Components**: Default for data fetching (dashboard pages)
- **Client Components**: Interactive elements (`"use client"` for SummaryGenerator)
- **API Routes**: RESTful endpoints with dynamic routing `[kind]`
- **Dynamic Routes**: Chat filtering via `?chat_id=` query parameter
- **Layouts**: Shared Russian UI with navigation between 24h/7d views

### Component Organization
- **Functional Components**: All components use React function syntax
- **Props Typing**: Explicit TypeScript interfaces for all component props
- **Conditional Rendering**: Components handle loading/error/empty states
- **Co-location**: Related functionality grouped together

### Database Layer (`/lib`)
- `db.ts` - Connection pooling with global singleton pattern
- `queries.ts` - Parameterized SQL queries with type safety
- `types.ts` - Database result type definitions
- `ai.ts` - OpenRouter integration with structured JSON responses
- `report.ts` - Business logic orchestrating data + AI
- `reportSchemas.ts` - Zod validation for AI response structure

## API Design

### Endpoints
- `GET /api/overview` - Dashboard metrics with optional chat_id and days filters
- `GET /api/report/[kind]` - AI reports (generate, insights, preview)

### Query Parameters
- `chat_id` - Filter by specific Telegram chat
- `days` - Time window (1 or 7 days)
- `date` - Specific date for historical reports (YYYY-MM-DD)

### Response Format
```typescript
{ ok: boolean, data?: T, error?: string }
```

## Naming Conventions

### Files & Directories
- **kebab-case** for component files (`ai-insights.tsx`, `summary-generator.tsx`)
- **camelCase** for utility files (`reportSchemas.ts`)
- **lowercase** for API routes (`route.ts`)
- **[brackets]** for dynamic routes (`[kind]`)

### Components
- **PascalCase** for component names (`AiInsights`, `SummaryGenerator`)
- **Descriptive names** indicating purpose and data type

### Database & Types
- **PascalCase** for TypeScript types (`TopUser`, `OverviewResponse`)
- **camelCase** for object properties and function names
- **snake_case** for database column names (matching existing schema)

## Import Patterns
- `@/` path alias for all project root imports
- External libraries imported first
- Internal modules grouped by layer (components, lib, types)
- Explicit type imports with `type` keyword

## Styling Approach
- **Minimal CSS** - Basic browser defaults with minimal custom styling
- **Simple layouts** - Basic flexbox and grid for essential structure
- **Russian language** UI text and labels
- **Functional over aesthetic** - Focus on data display over visual design