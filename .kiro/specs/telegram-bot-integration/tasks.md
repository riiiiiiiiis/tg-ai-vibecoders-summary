# Implementation Plan

- [x] 1. Create Telegram service module
  - Create `lib/telegram.ts` with core Telegram Bot API integration functions
  - Implement `sendMessageToChat()` function for sending messages via Telegram API
  - Implement `formatSummaryForTelegram()` function to convert report payload to Telegram Markdown format
  - Implement `validateTelegramConfig()` function to check environment variables
  - Add proper TypeScript types for Telegram API requests and responses
  - _Requirements: 2.1, 2.2, 2.3, 5.1, 5.2, 5.3_

- [x] 2. Implement message formatting logic
  - Create function to format report sections (summary, themes, insights) with Telegram Markdown
  - Add emoji icons for visual enhancement (🤖, 📊, 🎯, 💡)
  - Implement message length validation (4096 character limit)
  - Implement message splitting logic for long content (split into multiple messages if needed)
  - Add Markdown special character escaping to prevent formatting errors
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 3. Create API endpoint for Telegram sending
  - Create `/api/send-to-telegram/route.ts` with POST handler
  - Extract query parameters (chat_id, date, days) from request
  - Validate Telegram configuration before processing
  - Generate or retrieve report data using existing report generation logic
  - Format report using Telegram service functions
  - Send formatted message to Telegram via Bot API
  - Return standardized response format `{ ok, message?, error? }`
  - _Requirements: 1.1, 2.1, 2.3, 2.4, 4.1, 4.2_

- [x] 4. Add error handling to API endpoint
  - Handle missing or invalid Telegram credentials (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID)
  - Handle network errors and timeouts when calling Telegram API
  - Handle bot permission errors (bot not in chat, insufficient permissions)
  - Handle invalid chat_id or thread_id errors
  - Return user-friendly error messages in Russian
  - _Requirements: 1.3, 2.2, 3.4, 4.3_

- [x] 5. Update SummaryGenerator component UI
  - Add "📤 Отправить в Telegram" button next to generate button
  - Implement button disabled state when no summary is generated
  - Add `isSending` state for loading indication
  - Add `sendSuccess` and `sendError` states for user feedback
  - Implement `sendToTelegram()` function to call API endpoint
  - Show loading state "📤 Отправляю..." while sending
  - Display success notification "✅ Саммари успешно отправлено в Telegram!"
  - Display error notification with error details
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 3.3, 3.4_

- [x] 6. Update environment configuration
  - Add TELEGRAM_BOT_TOKEN to .env.example with documentation
  - Add TELEGRAM_CHAT_ID to .env.example with documentation
  - Add TELEGRAM_THREAD_ID (optional) to .env.example with documentation
  - Update tech.md steering file with new environment variables
  - _Requirements: 2.1, 2.2, 2.4_

- [x] 7. Manual testing and validation
  - Test successful message sending to Telegram chat
  - Test with missing TELEGRAM_BOT_TOKEN (should show config error)
  - Test with invalid bot token (should show auth error)
  - Test with bot not added to chat (should show permission error)
  - Test with long summary content (should split into multiple messages)
  - Test with forum thread_id parameter (should send to specific thread)
  - Verify Markdown formatting renders correctly in Telegram
  - _Requirements: 1.1, 1.2, 1.3, 2.2, 4.3, 5.1, 5.4_
