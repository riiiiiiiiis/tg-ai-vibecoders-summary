# Database Design

<cite>
**Referenced Files in This Document**   
- [db.ts](file://lib/db.ts)
- [queries.ts](file://lib/queries.ts)
- [types.ts](file://lib/types.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Data Model](#data-model)
3. [Entity Relationship Diagram](#entity-relationship-diagram)
4. [Repository Pattern Implementation](#repository-pattern-implementation)
5. [Database Connection Management](#database-connection-management)
6. [Data Access Patterns](#data-access-patterns)
7. [Performance Considerations](#performance-considerations)
8. [External Schema Requirements](#external-schema-requirements)

## Introduction

This document provides comprehensive documentation for the database component of the tg-ai-vibecoders-summary application. The system relies on a PostgreSQL database with a predefined external schema that includes messages and users tables. The application implements a Repository Pattern through the queries.ts module to abstract database operations and provides connection pooling to manage database resources efficiently. This documentation details the data model, entity relationships, data access patterns, and performance considerations for the database layer.

## Data Model

The application interacts with two primary database tables: messages and users. These tables form the foundation for all data analysis and reporting features in the application.

### Messages Table

The messages table stores all message data from Telegram conversations. It serves as the primary source for analytics, reporting, and AI analysis.

**Field Definitions:**
- `id` (UUID): Unique identifier for each message
- `chat_id` (VARCHAR): Identifier for the Telegram chat
- `user_id` (VARCHAR): Identifier for the message author
- `text` (TEXT): Content of the message
- `sent_at` (TIMESTAMP): Timestamp when the message was sent
- `message_thread_id` (VARCHAR): Identifier for the message thread (used for forum topics)

### Users Table

The users table contains information about Telegram users who have sent messages in the tracked chats.

**Field Definitions:**
- `id` (VARCHAR): Unique identifier for the user
- `first_name` (VARCHAR): User's first name
- `last_name` (VARCHAR): User's last name
- `username` (VARCHAR): User's Telegram username

The data model supports the application's core functionality of analyzing communication patterns, generating reports, and providing insights about community engagement. The schema is designed to efficiently support time-series aggregation, user activity analysis, and content extraction for AI processing.

**Section sources**
- [types.ts](file://lib/types.ts#L1-L45)
- [queries.ts](file://lib/queries.ts#L1-L383)

## Entity Relationship Diagram

```mermaid
erDiagram
USERS {
varchar id PK
varchar first_name
varchar last_name
varchar username
}
MESSAGES {
uuid id PK
varchar chat_id FK
varchar user_id FK
text text
timestamp sent_at
varchar message_thread_id
}
USERS ||--o{ MESSAGES : "authors"
```

**Diagram sources**
- [db.ts](file://lib/db.ts#L1-L25)
- [queries.ts](file://lib/queries.ts#L1-L383)

## Repository Pattern Implementation

The application implements the Repository Pattern through the queries.ts module, which provides a clean abstraction layer between the business logic and database operations. This pattern encapsulates data access logic and provides type-safe methods for retrieving data.

### Repository Methods

The queries.ts module exports several key methods that implement the Repository Pattern:

#### fetchOverview
Retrieves comprehensive analytics overview data including message counts, unique users, link messages, top contributors, and time-series data. This method supports filtering by chat, thread, and time window.

#### fetchMessagesText
Retrieves raw message text content within a specified time range, with optional filtering by chat and thread. This method is optimized for AI processing and text analysis.

#### fetchMessagesWithAuthors
Retrieves message content along with author information, combining data from both messages and users tables. This method preserves the temporal order of messages and includes user display names.

#### fetchForumTopics
Retrieves information about active discussion threads (topics) within the chat, including message counts and topic names derived from the first message in each thread.

#### fetchMessagesWithLinks
Retrieves messages containing URLs along with extracted link information, enabling analysis of shared resources.

The Repository Pattern implementation ensures that database access logic is centralized, making the codebase more maintainable and testable. Each method handles parameter binding, query execution, and result transformation, returning type-safe JavaScript objects that can be consumed by higher-level application components.

**Section sources**
- [queries.ts](file://lib/queries.ts#L11-L383)
- [types.ts](file://lib/types.ts#L1-L45)

## Database Connection Management

The application implements a robust connection management strategy using PostgreSQL connection pooling to ensure efficient resource utilization and prevent connection leaks.

### Global Pool Instance

The database connection is managed through a global Pool instance that is created and reused across the application. This approach prevents the creation of multiple connection pools during hot-reload scenarios, which could lead to connection exhaustion.

```mermaid
classDiagram
class DatabaseConnection {
+getPool() Pool
+withConnection(handler) Promise~T~
}
class Pool {
-connectionString string
-max number
+query(sql, params) Promise~Result~
}
DatabaseConnection --> Pool : "creates and manages"
```

**Diagram sources**
- [db.ts](file://lib/db.ts#L1-L25)

### Connection Pool Configuration

The connection pool is configured with the following parameters:
- **Max Connections**: 5 connections maximum to prevent overwhelming the database server
- **Connection Reuse**: The global pool instance is reused across application restarts during development
- **Environment Variable**: Database URL is configured through the DATABASE_URL environment variable

The implementation uses a global variable (__pgPool) declared in the global scope to store the pool instance. This ensures that even during hot-reload in development, the same pool instance is reused rather than creating new connections. The getPool() function checks for the existence of the global pool and creates it only if it doesn't already exist.

The withConnection utility function provides a safe way to execute database operations, ensuring proper resource management and error handling. This function accepts a handler function that operates on the pool, abstracting away the connection management details from the calling code.

**Section sources**
- [db.ts](file://lib/db.ts#L1-L25)

## Data Access Patterns

The application employs several data access patterns optimized for its analytical workloads and reporting requirements.

### Time-Series Aggregation

The fetchOverview function implements time-series aggregation by grouping messages into temporal buckets (hourly or daily). The bucket size is dynamically determined based on the time window:
- For windows of 1 day or less: hourly buckets
- For windows greater than 2 days: daily buckets
- For custom date ranges: inferred based on the duration

This adaptive approach ensures appropriate granularity for visualization while maintaining query performance.

### Message Content Retrieval

Two specialized methods handle message content retrieval for different use cases:
- **fetchMessagesText**: Optimized for AI processing, returns only message text in chronological order
- **fetchMessagesWithAuthors**: Includes author context, combining user information from the users table

Both methods support pagination through the limit parameter (default: 5,000 messages) to prevent memory issues when processing large message sets.

### Filtering and Parameterization

All data access methods support flexible filtering through parameters:
- **Temporal filtering**: By date range or relative time window (1 or 7 days)
- **Chat filtering**: By specific chat ID
- **Thread filtering**: By message thread ID

Parameters are safely bound using PostgreSQL's parameterized query system to prevent SQL injection attacks. The query construction dynamically builds WHERE clauses based on the provided parameters, ensuring efficient index usage.

### Error Handling

The data access layer includes robust error handling, particularly in the fetchForumTopics method which gracefully handles cases where the message_thread_id column might be missing from the database schema. This defensive programming approach ensures the application remains functional even when database schema features are not fully available.

**Section sources**
- [queries.ts](file://lib/queries.ts#L11-L383)

## Performance Considerations

The database design and access patterns incorporate several performance optimizations to handle large datasets efficiently.

### Query Optimization

All queries are designed to leverage database indexes effectively:
- The messages table should have indexes on sent_at, chat_id, and user_id columns
- The fetchOverview query uses COUNT with FILTER for efficient conditional counting
- Time-based queries use range conditions on sent_at with proper indexing

The time-series aggregation query uses PostgreSQL's date_trunc function to group messages into temporal buckets, which is optimized for time-series analysis.

### Large Message Set Handling

The application implements several strategies for handling large sets of messages:
- **Result limiting**: All message retrieval methods include a limit parameter (default: 5,000) to prevent excessive memory usage
- **Streaming potential**: The use of simple SELECT queries allows for potential streaming of results in future optimizations
- **Text-only retrieval**: The fetchMessagesText method retrieves only the text column, minimizing data transfer

### Connection Pool Sizing

The connection pool is limited to 5 maximum connections, which represents a balance between:
- Allowing sufficient concurrency for multiple simultaneous requests
- Preventing database connection exhaustion
- Minimizing resource consumption on both client and server

This conservative pool size is appropriate for the application's analytical workload, which is typically not highly concurrent but may involve longer-running queries for data aggregation.

### Indexing Recommendations

For optimal performance, the following indexes are recommended:
- Composite index on messages(sent_at, chat_id) for time-based chat filtering
- Index on messages(user_id) for user activity analysis
- Index on messages(message_thread_id) for forum topic queries
- Index on users(id) as the primary key

**Section sources**
- [queries.ts](file://lib/queries.ts#L11-L383)
- [db.ts](file://lib/db.ts#L1-L25)

## External Schema Requirements

The application has specific requirements regarding the database schema that must be met for proper operation.

### Pre-existing Tables

The application assumes the existence of the following tables with the specified structure:

**messages table:**
- id (UUID, primary key)
- chat_id (VARCHAR)
- user_id (VARCHAR)
- text (TEXT)
- sent_at (TIMESTAMP)
- message_thread_id (VARCHAR, nullable)

**users table:**
- id (VARCHAR, primary key)
- first_name (VARCHAR, nullable)
- last_name (VARCHAR, nullable)
- username (VARCHAR, nullable)

The application does not manage schema migrations or table creation. These tables must be created and populated by external processes before the application can function correctly.

### Schema Dependency Philosophy

The application follows a dependency philosophy where it relies on an external system to manage the database schema and data ingestion. This separation of concerns allows:
- Independent scaling of data ingestion and analytics components
- Flexibility in data source integration
- Simplified application code that focuses on analysis rather than data management

The queries are written to be resilient to missing data or optional columns. For example, the fetchForumTopics method gracefully handles cases where the message_thread_id column might not exist, logging a warning but returning an empty array rather than failing.

### Environment Configuration

The database connection requires the following environment variable:
- **DATABASE_URL**: PostgreSQL connection string in the format postgres://user:password@host:port/database

This environment variable must be set for the application to establish a database connection. The application will throw an error during initialization if this variable is not present.

**Section sources**
- [db.ts](file://lib/db.ts#L1-L25)
- [queries.ts](file://lib/queries.ts#L1-L383)