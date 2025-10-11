# MVP Code Refactoring Design

## Overview

This document outlines a pragmatic refactoring strategy for the Telegram analytics dashboard MVP. The focus is on eliminating dead code, reducing duplication (DRY principles), and improving maintainability without over-engineering. Since this is an MVP with a single user, complex abstractions and premature optimizations are avoided.

**Refactoring Goals:**
- Remove deprecated and unused code
- Consolidate duplicated logic
- Simplify component structure
- Maintain existing functionality
- Keep the codebase simple and maintainable

## Project Context

**Type:** Full-Stack Next.js Application (MVP)
**Scale:** Single-user application
**Tech Stack:** Next.js 15, React 19 RC, PostgreSQL, OpenRouter AI API, Telegram Bot API

## Current Architecture Issues

### Dead Code Identified

| Location | Issue | Impact |
|----------|-------|--------|
| `lib/ai.ts` | Deprecated wrapper functions (`generateStructuredReport`, `generateReportFromText`, `generateReportWithPersona`, `generateStructuredReport_OLD`) | Code bloat, confusion |
| `lib/ai.ts` | Massive persona prompts duplicated in `getPersonaPrompt()` function | ~600 lines of prompt strings |
| `lib/queries.ts` | Unused `fetchMessagesText()` function | Dead code |
| `components/multi-style-summary-generator.tsx` | 1400+ lines with massive inline render functions | Complexity, poor readability |
| `lib/telegram.ts` | Highly repetitive formatting helpers | DRY violation |

### Code Duplication Issues

| Pattern | Locations | Solution |
|---------|-----------|----------|
| API parameter parsing | Multiple API routes | Centralized parser utility |
| Error response formatting | All API routes | Unified error handler |
| Report generation flow | `buildDailyReport()` has conditional complexity | Simplify conditional branches |
| Telegram formatting helpers | Multiple `_build*()` functions with similar patterns | Further consolidation possible |
| Persona rendering logic | Massive switch statements in React component | Extract to separate render modules |

## Refactoring Strategy

### Phase 1: Remove Dead Code

**Objective:** Eliminate unused and deprecated code to reduce maintenance burden.

#### Actions

| File | Action | Rationale |
|------|--------|-----------|
| `lib/ai.ts` | Delete deprecated wrapper functions: `generateStructuredReport()`, `generateReportFromText()`, `generateReportWithPersona()`, `generateStructuredReport_OLD()` | These are marked deprecated and have been replaced by unified `generateReport()` |
| `lib/queries.ts` | Delete `fetchMessagesText()` function | Not used anywhere in the codebase |
| `lib/ai.ts` | Remove `VERBOSE` logging flag and related conditional logs | Simplify to single logging approach |

**Expected Impact:**
- Reduce `lib/ai.ts` from ~1174 lines to ~950 lines
- Clearer API surface with single entry point
- Less confusion for future maintenance

### Phase 2: Extract Configuration Data

**Objective:** Separate large data structures (prompts, schemas) from logic.

#### Persona Prompts Extraction

**Current Issue:** `getPersonaPrompt()` contains ~600 lines of hardcoded prompt strings within the logic file.

**Solution:** Create separate configuration file for AI prompts.

**New Structure:**

```
lib/
  ai/
    prompts.ts          # Persona prompt configurations
    schemas.ts          # JSON schema builders (exists as reportSchemas.ts)
    generator.ts        # Core AI generation logic
    types.ts           # AI-specific types
```

**Prompt Configuration Approach:**

Each persona prompt is stored as a structured configuration object:

| Property | Type | Description |
|----------|------|-------------|
| `systemRole` | string | System role description |
| `taskDescription` | string | Task instructions |
| `outputFormat` | string | Expected output format |
| `constraints` | string[] | Critical constraints |

**Benefits:**
- Easier prompt editing without touching logic
- Better version control for prompt iterations
- Cleaner separation of concerns
- AI prompts can be updated independently

#### Schema Builders Consolidation

**Current Issue:** JSON schema builders (`_stringField()`, `_arrayField()`, `_objectField()`, `_enumField()`) are utility functions but mixed with main logic.

**Solution:** Group all schema-related utilities together, potentially merge with `reportSchemas.ts`.

### Phase 3: Simplify Report Generation Logic

**Objective:** Reduce conditional complexity in report building pipeline.

#### Current Flow Issues

The `generateReport()` function has complex branching logic:

```
if (persona === 'daily-summary' && links) → one path
else if (persona) → another path  
else if (text) → third path
else → fourth path (metrics-only)
```

**Simplified Approach:**

Create a report configuration resolver that determines parameters upfront:

| Input Combination | Report Type | Data Required | Max Tokens |
|-------------------|-------------|---------------|------------|
| persona=daily-summary + links | Daily Summary | messages + links | 3000 |
| persona=X + text | Persona Analysis | messages only | 3000 |
| persona=X (no text) | Persona Metrics | metrics only | 3000 |
| text only | Text Analysis | messages only | 1600 |
| metrics only | Metrics Report | metrics only | 1600 |

**Implementation Pattern:**

1. Configuration resolver determines report parameters
2. Prompt builder constructs the prompt based on configuration
3. Schema selector picks appropriate validation schema
4. Single call to OpenRouter with resolved configuration

**Benefits:**
- Flattened conditional logic
- Easier to test each report type
- Clear configuration-driven approach
- Reduced cyclomatic complexity

### Phase 4: Simplify React Components

**Objective:** Break down massive component into manageable pieces.

#### Multi-Style Summary Generator Refactoring

**Current Issue:** 1409 lines in single file with inline render functions for each persona type.

**Solution Architecture:**

```
components/
  summary-generator/
    index.tsx                      # Main orchestrator (state, API calls)
    PersonaSelector.tsx            # Persona selection UI
    ReportDisplay.tsx              # Report display orchestrator
    renderers/
      DailySummaryRenderer.tsx     # Daily summary specific rendering
      BusinessRenderer.tsx         # Business persona rendering
      PsychologistRenderer.tsx     # Psychologist persona rendering
      AIPsychologistRenderer.tsx   # AI-Psychologist rendering
      CreativeRenderer.tsx         # Creative persona rendering
      DefaultRenderer.tsx          # Default/curator rendering
```

**Component Responsibility Matrix:**

| Component | Responsibility | State Management |
|-----------|----------------|------------------|
| `index.tsx` | API calls, global state, persona iteration | useState for loading/error states |
| `PersonaSelector` | Display persona options, selection UI | Stateless (receives props) |
| `ReportDisplay` | Route to appropriate renderer | Stateless (receives report data) |
| `*Renderer` | Render specific persona report structure | Stateless (pure presentation) |

**Shared Rendering Utilities:**

Create common rendering helpers to reduce duplication across renderers:

| Utility | Purpose |
|---------|---------|
| `Section` | Consistent section wrapper with title/emoji |
| `ListSection` | Bulleted or numbered list renderer |
| `KeyValuePair` | Labeled data display |
| `MetricCard` | Metric display with icon and label |
| `CollapsibleSection` | Expandable section for large data |

**Benefits:**
- Each file under 200 lines
- Easy to locate and modify specific persona rendering
- Reusable UI primitives reduce duplication
- Easier testing of individual renderers

### Phase 5: API Route Consolidation

**Objective:** Reduce duplication in API parameter parsing and error handling.

#### Shared API Utilities

Create centralized API utilities to eliminate repetitive code across routes.

**Utility Functions:**

| Function | Purpose | Return Type |
|----------|---------|-------------|
| `parseReportParams(searchParams)` | Extract and validate common report parameters (date, chatId, threadId, days, persona) | `ReportParams` object |
| `buildErrorResponse(error, context)` | Standardized error response formatting | `NextResponse` |
| `buildSuccessResponse(data)` | Standardized success response formatting | `NextResponse` |

**Parameter Parsing Logic:**

Consolidate the repeated pattern found in multiple API routes:

```
Current duplication in:
- /api/report/[kind]/route.ts
- /api/send-to-telegram/route.ts  
- /api/overview/route.ts
```

**Unified Parsing Pattern:**

| Parameter | Extraction Logic | Default Value | Validation |
|-----------|------------------|---------------|------------|
| `date` | `searchParams.get("date")` | undefined | Optional YYYY-MM-DD format |
| `chatId` | `searchParams.get("chat_id")` | undefined | Optional string |
| `threadId` | `searchParams.get("thread_id")` | undefined | Optional string |
| `days` | `Number(searchParams.get("days"))` | 1 | Must be 1 or 7 |
| `persona` | `searchParams.get("persona")` | undefined | Must be valid PersonaType |

**Error Response Standardization:**

All API routes should return consistent error format:

| Status Code | Condition | Response Format |
|-------------|-----------|-----------------|
| 400 | Invalid parameters | `{ ok: false, error: "message" }` |
| 404 | Resource not found | `{ ok: false, error: "message" }` |
| 500 | Server error | `{ ok: false, error: "message" }` |
| 503 | AI service unavailable | `{ ok: false, error: "message" }` |

### Phase 6: Database Query Optimization

**Objective:** Reduce redundant query logic and improve maintainability.

#### Query Builder Consolidation

**Current Issue:** Parameter building and WHERE clause construction duplicated across multiple query functions.

**Functions with Duplication:**
- `fetchOverview()`
- `fetchMessagesWithAuthors()`
- `fetchMessagesWithLinks()`
- `fetchForumTopics()`

**Shared Query Building Utilities:**

| Utility | Purpose | Signature |
|---------|---------|-----------|
| `buildTimeRangeConditions()` | Constructs time-based WHERE conditions | `(from?, to?, window?) => {conditions, params}` |
| `buildChatConditions()` | Constructs chat/thread WHERE conditions | `(chatId?, threadId?) => {conditions, params}` |
| `buildUserLabel()` | Constructs user display name (already exists) | `(firstName, lastName, username) => string` |

**Consolidation Pattern:**

Extract common SQL building logic used across all message queries:

```
Common pattern across queries:
1. Initialize conditions array and params array
2. Add time range conditions (from/to or window)
3. Add chatId condition (if provided)  
4. Add threadId condition (if provided)
5. Build WHERE clause by joining conditions
6. Execute query with params
```

**Benefits:**
- DRY compliance
- Consistent parameter handling
- Easier to add new query filters
- Reduced chance of SQL injection

## Testing Strategy

### Test Coverage Priorities

Since this is an MVP, focus testing on:

| Component | Test Type | Priority | Rationale |
|-----------|-----------|----------|-----------|
| `lib/ai/generator.ts` | Unit tests | HIGH | Core business logic, expensive API calls |
| API routes | Integration tests | MEDIUM | User-facing endpoints |
| React components | Manual testing | LOW | UI is straightforward, visual inspection sufficient |
| Database queries | Integration tests | MEDIUM | Data integrity critical |

### Refactoring Validation

After each refactoring phase, validate:

| Validation | Method |
|------------|--------|
| No functionality broken | Manual testing of all report generation flows |
| AI reports still generate correctly | Test each persona type |
| Telegram sending still works | End-to-end test |
| Database queries return same results | Compare query outputs before/after |

## File Structure After Refactoring

```
lib/
  ai/
    generator.ts        # Core generateReport() function
    prompts.ts          # Persona prompt configurations  
    schemas.ts          # JSON schema definitions
    types.ts            # AI-related types
  db/
    connection.ts       # Database pool management (from db.ts)
    queries.ts          # Query functions (from queries.ts)
    builders.ts         # Shared query building utilities
  telegram/
    client.ts           # Telegram API client
    formatter.ts        # Message formatting (from telegram.ts)
  api/
    utils.ts            # Shared API utilities (params, errors)
  
components/
  summary-generator/
    index.tsx
    PersonaSelector.tsx
    ReportDisplay.tsx
    renderers/
      DailySummaryRenderer.tsx
      BusinessRenderer.tsx
      PsychologistRenderer.tsx
      AIPsychologistRenderer.tsx
      CreativeRenderer.tsx
      DefaultRenderer.tsx
    shared/
      Section.tsx
      ListSection.tsx
      MetricCard.tsx
      
app/
  api/
    overview/route.ts
    report/[kind]/route.ts
    send-to-telegram/route.ts
    topics/route.ts
```

## Implementation Priority

| Phase | Estimated Complexity | Risk Level | Order |
|-------|---------------------|------------|-------|
| Phase 1: Remove Dead Code | Low | Low | 1st - Quick wins |
| Phase 2: Extract Prompts | Low | Low | 2nd - No logic changes |
| Phase 5: API Utilities | Medium | Low | 3rd - Clear boundaries |
| Phase 6: Query Consolidation | Medium | Medium | 4th - DB changes need testing |
| Phase 3: Report Logic | Medium | Medium | 5th - Core logic refactor |
| Phase 4: Component Split | High | Low | 6th - UI changes, easy to test visually |

## Migration Approach

**Incremental Refactoring Strategy:**

1. **Keep old code initially** - Comment as deprecated, don't delete immediately
2. **Create new implementations alongside old** - Parallel implementation
3. **Test new implementations thoroughly** - Validation before switchover  
4. **Switch imports to new implementations** - Update import statements
5. **Monitor in production** - Ensure no regressions
6. **Remove old code** - Final cleanup after validation period

**Backward Compatibility:**

During refactoring, maintain existing API contracts:
- API route signatures remain unchanged
- Component props interfaces stay stable  
- Database query return types preserved
- Report payload structures consistent

## Non-Goals (Avoiding Over-Engineering)

This refactoring explicitly **does NOT include**:

❌ Adding new features
❌ Implementing complex design patterns (Repository, Factory, Strategy, etc.)
❌ Adding dependency injection frameworks  
❌ Creating elaborate abstraction layers
❌ Migrating to different libraries
❌ Performance optimizations without proven bottlenecks
❌ Comprehensive test coverage (only critical paths)
❌ TypeScript strict mode enforcement
❌ Code generation or metaprogramming
❌ Microservices architecture
❌ Caching layers

**Rationale:** This is a single-user MVP. Simplicity and maintainability are more valuable than theoretical scalability.

## Success Criteria

The refactoring is successful when:

✅ All deprecated functions removed
✅ No duplicate code patterns remain
✅ Each file is under 400 lines (except large configuration data)
✅ All existing functionality works identically
✅ Code is easier to navigate and understand
✅ Future changes require modifying fewer files
✅ New developers can understand the codebase in under 2 hours

## Rollback Plan

If issues arise during refactoring:

1. **Git branching strategy** - Each phase on separate branch
2. **Tag stable points** - Tag working states before major changes
3. **Keep backup exports** - Export critical data before DB changes
4. **Incremental deployment** - Deploy phases separately, not all at once
5. **Monitoring** - Watch error logs for 48 hours after each deployment

## Maintenance Post-Refactoring

After refactoring completion:

| Activity | Frequency | Responsibility |
|----------|-----------|----------------|
| Code review of new changes | Per commit | Developer |
| Dependency updates | Monthly | Developer |
| AI prompt tuning | As needed | Developer |
| Performance monitoring | Weekly | Automated |
| Backup verification | Weekly | Automated |

