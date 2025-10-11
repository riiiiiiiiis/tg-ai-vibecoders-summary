# AI Integration

<cite>
**Referenced Files in This Document**   
- [ai.ts](file://lib/ai.ts)
- [report.ts](file://lib/report.ts)
- [reportSchemas.ts](file://lib/reportSchemas.ts)
- [types.ts](file://lib/types.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Core Components](#core-components)
4. [Detailed Component Analysis](#detailed-component-analysis)
5. [System Boundaries and API Integration](#system-boundaries-and-api-integration)
6. [Cross-Cutting Concerns](#cross-cutting-concerns)
7. [Infrastructure and Error Handling](#infrastructure-and-error-handling)
8. [Conclusion](#conclusion)

## Introduction
The AI integration component of the tg-ai-vibecoders-summary application provides intelligent insights generation for Telegram chat analytics using the OpenRouter API with Google Gemini 2.5 Pro. This system transforms raw chat metrics and message content into structured, actionable reports through advanced natural language processing. The architecture centers around a unified reporting system that supports multiple analytical personas while maintaining robust validation, error handling, and fallback mechanisms.

## Architecture Overview
The AI integration follows a layered architectural pattern with clear separation of concerns between data retrieval, AI processing, and response validation. The system orchestrates the flow from raw chat data to structured JSON reports through a well-defined pipeline.

```mermaid
graph TD
A[Client Request] --> B[buildDailyReport]
B --> C{Has Persona?}
C --> |Yes| D[Fetch Messages & Links]
C --> |No| E[Fetch Messages Only]
D --> F[generateReport]
E --> F
F --> G[OpenRouter API]
G --> H[Google Gemini 2.5 Pro]
H --> I[JSON Response]
I --> J[Schema Validation]
J --> K[Structured Report]
K --> L[Client Response]
style A fill:#f9f,stroke:#333
style L fill:#f9f,stroke:#333
```

**Diagram sources**
- [report.ts](file://lib/report.ts#L13-L103)
- [ai.ts](file://lib/ai.ts#L33-L165)

## Core Components
The AI system comprises three core components that work in concert to generate insights: the unified report generator, JSON schema validators, and the report orchestrator. These components enable flexible report generation while ensuring data integrity and system reliability.

**Section sources**
- [ai.ts](file://lib/ai.ts#L33-L165)
- [report.ts](file://lib/report.ts#L13-L103)
- [reportSchemas.ts](file://lib/reportSchemas.ts#L3-L7)

## Detailed Component Analysis

### Unified Report Generation System
The `generateReport` function serves as the central AI processing engine, replacing multiple specialized functions through a unified interface. This refactoring eliminated 676 lines of redundant code while enhancing maintainability and extensibility.

```mermaid
classDiagram
class GenerateReportParams {
+date : string
+chatId? : string
+metrics : OverviewResponse
+persona? : PersonaType
+text? : string
+links? : LinkData[]
}
class AnyReport {
+summary : string
+themes : string[]
+insights : string[]
}
class BusinessReport {
+monetization_ideas : string[]
+revenue_strategies : string[]
+roi_insights : string[]
}
class PsychologyReport {
+group_atmosphere : string
+psychological_archetypes : Archetype[]
+emotional_patterns : string[]
+group_dynamics : string[]
}
class CreativeReport {
+creative_temperature : string
+viral_concepts : string[]
+content_formats : string[]
+trend_opportunities : string[]
}
class AiPsychologistReport {
+group_atmosphere : string
+psychological_archetypes : Archetype[]
+ai_model_personalities : AiModelPersonality[]
+emotional_patterns : string[]
+group_dynamics : string[]
+ai_model_distribution : AiModelDistribution
}
class DailySummaryReport {
+day_overview : string
+key_events : KeyEvent[]
+participant_highlights : ParticipantHighlight[]
+shared_links : SharedLink[]
+link_summary : LinkSummary
+discussion_topics : string[]
+daily_metrics : DailyMetrics
+next_day_forecast : string[]
}
GenerateReportParams --> AnyReport : "generates"
GenerateReportParams --> BusinessReport : "generates"
GenerateReportParams --> PsychologyReport : "generates"
GenerateReportParams --> CreativeReport : "generates"
GenerateReportParams --> AiPsychologistReport : "generates"
GenerateReportParams --> DailySummaryReport : "generates"
```

**Diagram sources**
- [ai.ts](file://lib/ai.ts#L33-L165)
- [reportSchemas.ts](file://lib/reportSchemas.ts#L3-L111)

#### Two-Mode Report Generation Strategy
The system implements a sophisticated two-mode generation strategy that adapts to available data and user requirements. When message text is available, it enables deep content analysis; otherwise, it falls back to metrics-only interpretation.

```mermaid
flowchart TD
Start([Report Request]) --> HasText{Text Available?}
HasText --> |Yes| TextMode["Text-Based Analysis Mode"]
HasText --> |No| MetricsMode["Metrics-Only Fallback Mode"]
TextMode --> BuildTextPrompt["buildTextPrompt()"]
TextMode --> SetMaxTokens["maxTokens = 3000"]
TextMode --> UseTextSchema["Use Text Analysis Schema"]
MetricsMode --> BuildPrompt["buildPrompt()"]
MetricsMode --> SetMaxTokens["maxTokens = 1600"]
MetricsMode --> UseMetricsSchema["Use Metrics Schema"]
TextMode --> Generate["Call OpenRouter API"]
MetricsMode --> Generate
Generate --> Parse["Parse AI Response"]
Parse --> Validate["Validate Against Schema"]
Validate --> Success{Valid?}
Success --> |Yes| Return["Return Structured Report"]
Success --> |No| Error["Return null"]
style TextMode fill:#e6f3ff,stroke:#333
style MetricsMode fill:#ffe6e6,stroke:#333
style Return fill:#e6ffe6,stroke:#333
style Error fill:#ffe6e6,stroke:#333
```

**Diagram sources**
- [ai.ts](file://lib/ai.ts#L33-L165)
- [ai.ts](file://lib/ai.ts#L942-L940)

### JSON Schema Validation with Zod
The system employs Zod for robust JSON schema validation, ensuring AI responses conform to expected structures before being processed by the application. This prevents malformed data from propagating through the system.

```mermaid
classDiagram
class reportSchema {
+summary : string
+themes : string[]
+insights : string[]
}
class businessReportSchema {
+monetization_ideas : string[]
+revenue_strategies : string[]
+roi_insights : string[]
}
class psychologyReportSchema {
+group_atmosphere : string
+psychological_archetypes : object[]
+emotional_patterns : string[]
+group_dynamics : string[]
}
class creativeReportSchema {
+creative_temperature : string
+viral_concepts : string[]
+content_formats : string[]
+trend_opportunities : string[]
}
class aiPsychologistReportSchema {
+group_atmosphere : string
+psychological_archetypes : object[]
+ai_model_personalities : object[]
+emotional_patterns : string[]
+group_dynamics : string[]
+ai_model_distribution : object
}
class dailySummaryReportSchema {
+day_overview : string
+key_events : object[]
+participant_highlights : object[]
+shared_links : object[]
+link_summary : object
+discussion_topics : string[]
+daily_metrics : object
+next_day_forecast : string[]
}
class _objectField {
+properties : any
+required : string[]
}
class _arrayField {
+itemType : any
+minItems : number
+maxItems : number
}
class _stringField {
+minLength : number
+maxLength : number
}
_objectField <|-- reportSchema
_objectField <|-- businessReportSchema
_arrayField <|-- _objectField
_stringField <|-- _objectField
_objectField <|-- psychologyReportSchema
_objectField <|-- creativeReportSchema
_objectField <|-- aiPsychologistReportSchema
_objectField <|-- dailySummaryReportSchema
```

**Diagram sources**
- [reportSchemas.ts](file://lib/reportSchemas.ts#L3-L111)
- [ai.ts](file://lib/ai.ts#L410-L586)

### Component Relationships and Data Flow
The integration between ai.ts, report.ts, and reportSchemas.ts forms a cohesive system where each component has a distinct responsibility in the report generation pipeline.

```mermaid
sequenceDiagram
participant Client as "API Route"
participant Report as "report.ts"
participant AI as "ai.ts"
participant Schemas as "reportSchemas.ts"
participant OpenRouter as "OpenRouter API"
Client->>Report : buildDailyReport(request)
Report->>Report : fetchOverview()
Report->>Report : fetchMessagesWithAuthors()
alt Has Persona
Report->>Report : fetchMessagesWithLinks()
Report->>AI : generateReport(params, text, links)
else No Persona
Report->>AI : generateReport(params, text)
end
AI->>AI : validateAIConfig()
AI->>AI : Determine persona and build prompt
AI->>Schemas : getPersonaJsonSchema(persona)
AI->>Schemas : getPersonaPrompt(persona)
AI->>OpenRouter : callOpenRouter(messages, schema)
OpenRouter-->>AI : JSON response
AI->>Schemas : Validate with Zod schema
AI-->>Report : Parsed report object
Report-->>Client : Formatted report payload
```

**Diagram sources**
- [report.ts](file://lib/report.ts#L13-L103)
- [ai.ts](file://lib/ai.ts#L33-L165)
- [reportSchemas.ts](file://lib/reportSchemas.ts#L3-L111)

## System Boundaries and API Integration
The application interacts with the OpenRouter API through a well-defined boundary that handles request formatting, response parsing, and error management. This boundary ensures reliable communication with the external AI service.

```mermaid
flowchart LR
A[Application] --> B[Request Formatting]
B --> C[OpenRouter API]
C --> D[Google Gemini 2.5 Pro]
D --> E[Response Parsing]
E --> F[Schema Validation]
F --> G[Application]
subgraph "Request Formatting"
B1[Build System Prompt]
B2[Build User Prompt]
B3[Apply JSON Schema]
B4[Set Temperature: 0.6]
B5[Set Max Tokens]
end
subgraph "Response Processing"
E1[Parse JSON]
E2[Validate Structure]
E3[Sanitize Content]
E4[Handle Errors]
end
A --> B1
B1 --> B2
B2 --> B3
B3 --> B4
B4 --> B5
B5 --> C
C --> E1
E1 --> E2
E2 --> E3
E3 --> E4
E4 --> G
```

**Diagram sources**
- [ai.ts](file://lib/ai.ts#L1019-L1092)
- [ai.ts](file://lib/ai.ts#L33-L165)

## Cross-Cutting Concerns

### Prompt Engineering and Russian-Language Curator Persona
The system implements sophisticated prompt engineering with a specialized Russian-language curator persona that provides culturally relevant insights while maintaining professional analytical standards.

```mermaid
classDiagram
class PersonaType {
+curator
+business
+psychologist
+ai-psychologist
+creative
+twitter
+reddit
+daily-summary
}
class CuratorPersona {
+Style : "Direct, no sugarcoating"
+Focus : "Real dynamics, problems"
+Language : "Russian"
+Roles : "Leader, Content Generator, Toxic Dominant, Attention-Seeker"
+Themes : "Uncomfortable topics"
+Insights : "Honest recommendations"
}
class BusinessPersona {
+Focus : "Monetization ideas"
+Revenue strategies
+ROI insights
+Currency : "Rubles/Dollars"
}
class PsychologyPersona {
+Psychological archetypes
+Emotional patterns
+Group dynamics
+Professional terminology
}
class AiPsychologistPersona {
+AI model personalities
+Confidence levels
+Behavioral evidence
+Traditional archetype cross-reference
}
PersonaType --> CuratorPersona
PersonaType --> BusinessPersona
PersonaType --> PsychologyPersona
PersonaType --> AiPsychologistPersona
```

**Diagram sources**
- [ai.ts](file://lib/ai.ts#L588-L940)
- [ai.ts](file://lib/ai.ts#L410-L586)

### Response Validation and Fallback Strategies
The system implements comprehensive validation and fallback mechanisms to ensure reliability even when AI responses are problematic or unavailable.

```mermaid
flowchart TD
A[AI Response] --> B{Response Exists?}
B --> |No| C[Return null]
B --> |Yes| D[Parse JSON]
D --> E{Parse Success?}
E --> |No| F[Log Parse Error]
F --> C
E --> |Yes| G[Validate Schema]
G --> H{Valid?}
H --> |No| I[Log Validation Error]
I --> C
H --> |Yes| J[Sanitize Content]
J --> K[Return Data]
style C fill:#ffe6e6,stroke:#333
style K fill:#e6ffe6,stroke:#333
```

**Diagram sources**
- [ai.ts](file://lib/ai.ts#L177-L196)
- [ai.ts](file://lib/ai.ts#L150-L158)

## Infrastructure and Error Handling
The system includes robust infrastructure for handling AI requests with proper timeout management, error logging, and graceful degradation when issues occur.

```mermaid
sequenceDiagram
participant App as "Application"
participant API as "OpenRouter API"
participant Timeout as "Timeout Handler"
App->>App : Set timeout (20s default)
App->>API : POST /chat/completions
API-->>App : Processing...
alt Success
API-->>App : 200 OK + JSON
App->>App : Parse and validate
App-->>App : Return report
else Timeout
Timeout-->>App : Abort request
App->>App : Log timeout error
App-->>App : Return null
else API Error
API-->>App : Error status
App->>App : Log API error
App-->>App : Return null
end
```

**Diagram sources**
- [ai.ts](file://lib/ai.ts#L1019-L1092)
- [ai.ts](file://lib/ai.ts#L170-L174)

## Conclusion
The AI integration component of the tg-ai-vibecoders-summary application demonstrates a sophisticated architecture for generating intelligent insights from Telegram chat data. By implementing a unified `generateReport` function, the system achieves code efficiency while supporting multiple analytical personas. The integration of Zod for JSON schema validation ensures data integrity, while comprehensive error handling and fallback strategies maintain system reliability. The two-mode generation strategy (text-based with message authors and metrics-only fallback) provides flexibility in report generation based on available data. The system's boundary with the OpenRouter API is well-defined, with proper request formatting, response parsing, and timeout management. This architecture successfully balances advanced AI capabilities with robust engineering practices, delivering valuable insights to users while maintaining system stability and performance.