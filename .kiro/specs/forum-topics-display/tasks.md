# Implementation Plan

- [x] 1. Add ForumTopic type definition
  - Create `ForumTopic` type in `lib/types.ts` with fields: threadId, topicName, messageCount, lastMessageAt
  - _Requirements: 4.2_

- [x] 2. Implement database query for forum topics
  - [x] 2.1 Create `fetchForumTopics()` function in `lib/queries.ts`
    - Write SQL query to group messages by message_thread_id
    - Extract topic name from first message in thread
    - Apply chatId and window filters
    - Sort by message count descending
    - Handle missing message_thread_id column gracefully (return empty array)
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 2.2 Write unit tests for fetchForumTopics()
    - Test correct grouping by message_thread_id
    - Test filtering by chatId and window
    - Test handling of missing column
    - Test empty results for non-forum chats
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 3. Create API endpoint for forum topics
  - [x] 3.1 Implement `/api/topics/route.ts`
    - Extract chat_id and days query parameters
    - Call fetchForumTopics() with parameters
    - Return JSON response with ok/data/error structure
    - Handle errors and return appropriate error messages in Russian
    - _Requirements: 1.3, 1.4_

  - [ ]* 3.2 Write integration tests for /api/topics endpoint
    - Test successful response with valid parameters
    - Test error handling for database failures
    - Test response format matches expected structure
    - _Requirements: 1.3, 1.4_

- [x] 4. Update existing queries to support thread filtering
  - [x] 4.1 Extend OverviewParams type with threadId field
    - Add optional threadId parameter to OverviewParams type in `lib/queries.ts`
    - _Requirements: 3.1, 3.2_

  - [x] 4.2 Modify fetchOverview() to filter by threadId
    - Add threadId condition to WHERE clause when provided
    - Ensure proper parameter indexing in SQL query
    - _Requirements: 3.1, 3.2_

  - [x] 4.3 Modify fetchMessagesText() to filter by threadId
    - Add optional threadId parameter to function signature
    - Add threadId condition to WHERE clause when provided
    - _Requirements: 3.3_

  - [x] 4.4 Modify fetchMessagesWithAuthors() to filter by threadId
    - Add optional threadId parameter to function signature
    - Add threadId condition to WHERE clause when provided
    - _Requirements: 3.3_

- [x] 5. Create ForumTopics client component
  - [x] 5.1 Implement ForumTopics component in `components/forum-topics.tsx`
    - Create client component with "use client" directive
    - Define ForumTopicsProps interface (chatId, currentThreadId, days)
    - Implement state management for topics, loading, and error
    - Fetch topics from /api/topics on component mount
    - Render horizontal scrollable list of topic buttons
    - Highlight active thread based on currentThreadId prop
    - Include "Все темы" button to clear filter
    - Handle click events to update URL with thread_id parameter using useRouter
    - Display loading state with Russian text "Загрузка тем..."
    - Display error state with Russian error message
    - Hide component when topics array is empty
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.4, 5.1, 5.2, 5.3_

  - [ ]* 5.2 Write unit tests for ForumTopics component
    - Test rendering of topics list
    - Test active thread highlighting
    - Test URL update on click
    - Test loading and error states
    - Test hiding when no topics
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.1, 5.2, 5.3_

- [x] 6. Integrate ForumTopics into dashboard pages
  - [x] 6.1 Update `app/page.tsx` to include ForumTopics
    - Extract thread_id from searchParams
    - Pass threadId to fetchOverview()
    - Add ForumTopics component at top of page
    - Pass chatId, currentThreadId, and days props
    - _Requirements: 1.1, 3.1, 3.5_

  - [x] 6.2 Update `app/week/page.tsx` to include ForumTopics
    - Extract thread_id from searchParams
    - Pass threadId to fetchOverview()
    - Add ForumTopics component at top of page
    - Pass chatId, currentThreadId, and days=7 prop
    - _Requirements: 1.1, 3.1, 3.5_

- [x] 7. Update API routes to support thread filtering
  - [x] 7.1 Modify `/api/overview/route.ts`
    - Extract thread_id query parameter
    - Pass threadId to fetchOverview() call
    - _Requirements: 3.2_

  - [x] 7.2 Modify `/api/report/[kind]/route.ts`
    - Extract thread_id query parameter
    - Pass threadId to fetchMessagesText() and fetchMessagesWithAuthors() calls
    - Ensure AI reports are generated only for selected thread
    - _Requirements: 3.3_

- [x] 8. Update MultiStyleSummaryGenerator to pass threadId
  - [x] 8.1 Modify `components/multi-style-summary-generator.tsx`
    - Add threadId prop to component interface
    - Include thread_id in API request URLs for report generation
    - _Requirements: 3.3_

  - [x] 8.2 Update page.tsx and week/page.tsx to pass threadId to MultiStyleSummaryGenerator
    - Pass threadId prop extracted from searchParams
    - _Requirements: 3.3_

- [x] 9. Add basic styling for ForumTopics component
  - Add CSS styles for horizontal scrollable container
  - Style topic buttons with hover effects
  - Style active thread with distinct background color
  - Ensure responsive design for mobile devices
  - _Requirements: 5.1, 5.2, 5.3, 5.4_
