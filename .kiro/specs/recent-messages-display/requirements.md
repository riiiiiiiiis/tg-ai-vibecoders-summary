# Requirements Document

## Introduction

This feature adds a visual display of recent messages from Telegram chats to the analytics dashboard. The primary goal is to provide administrators with a quick way to verify that the dashboard is showing current, up-to-date data by displaying the actual latest messages alongside the analytics metrics. This creates transparency and builds trust in the accuracy of the dashboard's data.

## Requirements

### Requirement 1: Display Recent Messages List

**User Story:** As a chat administrator, I want to see the latest messages from my chat on the dashboard, so that I can verify the data is current and understand the recent conversation context.

#### Acceptance Criteria

1. WHEN the dashboard page loads THEN the system SHALL display a list of the most recent messages from the selected time period
2. WHEN displaying messages THEN the system SHALL show at least the following information for each message: sender name, message text, and timestamp
3. WHEN a message has no text content THEN the system SHALL display a placeholder indicator (e.g., "[медиа]", "[стикер]")
4. WHEN the message list is displayed THEN the system SHALL order messages from newest to oldest
5. IF a chat_id filter is applied THEN the system SHALL only show messages from that specific chat

### Requirement 2: Message Display Formatting

**User Story:** As a chat administrator, I want messages to be displayed in a readable format with proper Russian timestamps, so that I can quickly scan and understand the recent activity.

#### Acceptance Criteria

1. WHEN displaying a timestamp THEN the system SHALL format it in Russian locale with date and time (e.g., "5 янв. 2025, 14:30")
2. WHEN displaying sender names THEN the system SHALL show the full name (first_name + last_name) or username if name is unavailable
3. WHEN a message text is very long THEN the system SHALL truncate it with an ellipsis after a reasonable character limit
4. WHEN displaying the message list THEN the system SHALL use clear visual separation between individual messages
5. WHEN no messages are available THEN the system SHALL display a message "Нет сообщений за выбранный период"

### Requirement 3: Integration with Existing Dashboard

**User Story:** As a chat administrator, I want the recent messages to appear on both the 24-hour and 7-day dashboard views, so that I can verify data freshness regardless of which time period I'm viewing.

#### Acceptance Criteria

1. WHEN viewing the 24-hour dashboard (/) THEN the system SHALL display recent messages from the last 24 hours
2. WHEN viewing the 7-day dashboard (/week) THEN the system SHALL display recent messages from the last 7 days
3. WHEN the chat_id query parameter is present THEN the system SHALL filter messages to only that chat
4. WHEN the recent messages component is displayed THEN the system SHALL position it in a logical location on the page (e.g., below metrics or in a sidebar)
5. IF the database query fails THEN the system SHALL display an error message in Russian without breaking the rest of the dashboard

### Requirement 4: Performance and Data Limits

**User Story:** As a system administrator, I want the recent messages feature to load quickly and not impact dashboard performance, so that the user experience remains smooth even with large chat histories.

#### Acceptance Criteria

1. WHEN fetching recent messages THEN the system SHALL limit the query to a maximum of 20 messages
2. WHEN the database query executes THEN the system SHALL use indexed columns (sent_at, chat_id) for optimal performance
3. WHEN the component renders THEN the system SHALL use server-side rendering to avoid client-side loading delays
4. IF the query takes longer than expected THEN the system SHALL still render the rest of the dashboard without blocking
5. WHEN displaying messages THEN the system SHALL use read-only SELECT queries consistent with the application's security model
