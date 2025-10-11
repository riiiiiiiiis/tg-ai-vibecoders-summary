# Configuration Guide

<cite>
**Referenced Files in This Document**   
- [lib/db.ts](file://lib/db.ts)
- [lib/ai.ts](file://lib/ai.ts)
- [lib/report.ts](file://lib/report.ts)
- [lib/telegram.ts](file://lib/telegram.ts)
- [app/api/send-to-telegram/route.ts](file://app/api/send-to-telegram/route.ts)
- [README.md](file://README.md)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Environment Variables Overview](#environment-variables-overview)
3. [Required Configuration](#required-configuration)
4. [Optional Configuration](#optional-configuration)
5. [Creating the .env File](#creating-the-env-file)
6. [Practical Configuration Examples](#practical-configuration-examples)
7. [Configuration Impact on Application Behavior](#configuration-impact-on-application-behavior)
8. [Common Configuration Issues](#common-configuration-issues)
9. [Troubleshooting Configuration Errors](#troubleshooting-configuration-errors)

## Introduction
This guide provides comprehensive instructions for configuring the tg-ai-vibecoders-summary application. The application relies on environment variables to connect to external services including PostgreSQL for data storage, OpenRouter for AI processing, and Telegram for message delivery. Proper configuration is essential for the application to function correctly, as AI-powered insights are mandatory rather than optional features. This document details all configuration options, their purposes, acceptable values, and practical implementation examples.

## Environment Variables Overview
The tg-ai-vibecoders-summary application uses environment variables to configure its connection to external services and control its behavior. These variables are categorized into required and optional settings. Required variables must be set for the application to start and function properly, while optional variables allow for customization of behavior and enhanced functionality. All configuration is managed through a .env file in the project root directory.

**Section sources**
- [README.md](file://README.md#L25-L40)

## Required Configuration
The following environment variables are required for the application to function:

### DATABASE_URL
This variable contains the PostgreSQL connection string for accessing the application's database. The connection string must follow the standard PostgreSQL format: `postgresql://username:password@hostname:port/database_name`. For example: `postgresql://user:pass@localhost:5432/telegram_analytics`. The database must contain the required tables for messages and users as specified in the application's data model. Without this variable, the application cannot access chat data for analysis.

**Section sources**
- [lib/db.ts](file://lib/db.ts#L7)
- [README.md](file://README.md#L27)

### OPENROUTER_API_KEY
This variable contains the API key for authenticating with the OpenRouter service, which provides access to AI models for generating insights. The key must be a valid string provided by OpenRouter after account creation. This authentication credential is mandatory as all report generation depends on the OpenRouter API. Without a valid key, the application cannot generate AI-powered insights and will fail to produce summaries.

**Section sources**
- [lib/ai.ts](file://lib/ai.ts#L171)
- [README.md](file://README.md#L28)

### OPENROUTER_MODEL
This variable specifies the AI model identifier to be used for generating reports through OpenRouter. Valid values are model identifiers available on the OpenRouter platform, such as `google/gemini-2.5-pro`, `anthropic/claude-3-haiku`, or `openai/gpt-4-turbo`. The model choice directly impacts the quality, style, and capabilities of the generated insights. This variable is required because the application needs to know which AI model to invoke for report generation.

**Section sources**
- [lib/ai.ts](file://lib/ai.ts#L921)
- [README.md](file://README.md#L29)

## Optional Configuration
The following environment variables are optional and provide additional control over the application's behavior:

### OPENROUTER_TIMEOUT_MS
This variable sets the timeout duration in milliseconds for requests to the OpenRouter API. The default value is 20,000 milliseconds (20 seconds). Acceptable values are positive integers representing milliseconds. Increasing this value may improve reliability when generating complex reports, while decreasing it can make the application more responsive but potentially more prone to timeouts during periods of high AI service load.

**Section sources**
- [lib/ai.ts](file://lib/ai.ts#L918)
- [README.md](file://README.md#L30)

### LLM_TEXT_CHAR_BUDGET
This variable controls the maximum number of characters from chat messages that will be sent to the AI model for analysis. The default value is 80,000 characters. This budget affects the depth of AI analysis, as a higher character count allows the AI to consider more message content when generating insights. Values should be positive integers, with higher values providing more context but potentially increasing API costs and processing time.

**Section sources**
- [lib/report.ts](file://lib/report.ts#L22)

### LLM_DEBUG_VERBOSE
This variable enables verbose logging for AI-related operations when set to "1". When enabled, the application will log detailed information about AI requests and responses, which can be helpful for debugging configuration issues or understanding the AI processing flow. Any value other than "1" disables verbose logging. This is a boolean flag that helps developers troubleshoot AI integration problems.

**Section sources**
- [lib/ai.ts](file://lib/ai.ts#L3)

### TELEGRAM_BOT_TOKEN
This variable contains the authentication token for the Telegram bot used to send summary reports. The token is obtained from the BotFather on Telegram and follows the format `123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ`. When configured, the application can automatically send generated summaries to specified Telegram chats. Without this variable, the send-to-telegram functionality will be disabled.

**Section sources**
- [lib/telegram.ts](file://lib/telegram.ts#L116)
- [app/api/send-to-telegram/route.ts](file://app/api/send-to-telegram/route.ts#L32)

### TELEGRAM_CHAT_ID
This variable specifies the Telegram chat ID where summary reports should be sent. The ID is a numeric string that uniquely identifies a Telegram group, channel, or private chat. When used in conjunction with TELEGRAM_BOT_TOKEN, it enables automated delivery of AI-generated summaries. Multiple chat IDs can be configured for different deployment scenarios, allowing the same application instance to serve multiple Telegram communities.

**Section sources**
- [lib/telegram.ts](file://lib/telegram.ts#L117)
- [app/api/send-to-telegram/route.ts](file://app/api/send-to-telegram/route.ts#L32)

## Creating the .env File
To create the configuration file for the tg-ai-vibecoders-summary application, follow these steps:

1. In the root directory of the project, create a new file named `.env`.
2. Add the required environment variables with their values:
   ```
   DATABASE_URL=postgresql://username:password@hostname:port/database_name
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   OPENROUTER_MODEL=google/gemini-2.5-pro
   ```
3. Optionally, add any of the optional variables with appropriate values:
   ```
   OPENROUTER_TIMEOUT_MS=20000
   LLM_TEXT_CHAR_BUDGET=80000
   LLM_DEBUG_VERBOSE=0
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   TELEGRAM_CHAT_ID=your_telegram_chat_id
   ```
4. Save the file and ensure it is not committed to version control by verifying it is listed in `.gitignore`.
5. Restart the application to load the new configuration.

The application will automatically read these variables at startup and use them to configure its services.

**Section sources**
- [README.md](file://README.md#L25-L40)

## Practical Configuration Examples
The following examples demonstrate complete configuration setups for different deployment scenarios:

### Development Environment
For local development with a local PostgreSQL database and debugging enabled:
```
DATABASE_URL=postgresql://devuser:devpass@localhost:5432/telegram_dev
OPENROUTER_API_KEY=sk-or-v1-abcdefghijklmnopqrstuvwxyz1234567890
OPENROUTER_MODEL=google/gemini-2.5-pro
OPENROUTER_TIMEOUT_MS=30000
LLM_TEXT_CHAR_BUDGET=50000
LLM_DEBUG_VERBOSE=1
```

### Production Environment
For production deployment with optimized settings:
```
DATABASE_URL=postgresql://produser:strongpassword@db-server:5432/telegram_prod
OPENROUTER_API_KEY=sk-or-v1-zyxwvutsrqponmlkjihgfedcba0987654321
OPENROUTER_MODEL=anthropic/claude-3-haiku
OPENROUTER_TIMEOUT_MS=20000
LLM_TEXT_CHAR_BUDGET=80000
LLM_DEBUG_VERBOSE=0
TELEGRAM_BOT_TOKEN=987654321:ZYXWVUTSRQPONMLKJIHGFEDCBA
TELEGRAM_CHAT_ID=123456789
```

### Multi-Chat Environment
For serving multiple Telegram communities with different configuration profiles:
```
DATABASE_URL=postgresql://multiuser:password@cluster:5432/telegram_multi
OPENROUTER_API_KEY=sk-or-v1-1234567890abcdefghijklmnopqrstuvwxyz
OPENROUTER_MODEL=openai/gpt-4-turbo
LLM_TEXT_CHAR_BUDGET=100000
TELEGRAM_BOT_TOKEN=111222333:AAA111BBB222CCC333DDD444EEE555
# Use query parameters to specify different chat IDs at runtime
```

**Section sources**
- [README.md](file://README.md#L25-L40)

## Configuration Impact on Application Behavior
Configuration options significantly affect the application's behavior and performance:

- **Timeout Settings**: The OPENROUTER_TIMEOUT_MS value directly impacts report generation reliability. Too short a timeout may cause failures when processing complex reports, while too long a timeout can make the application appear unresponsive. The default 20-second timeout balances reliability and user experience.

- **Character Budget**: The LLM_TEXT_CHAR_BUDGET determines the depth of AI analysis. A higher budget allows the AI to consider more message content, potentially producing more nuanced insights, but increases API costs and processing time. A lower budget may result in superficial analysis that misses important context.

- **Model Selection**: The OPENROUTER_MODEL choice affects the style, depth, and quality of generated insights. More advanced models like GPT-4 or Claude 3 can produce more sophisticated analysis but at higher cost, while lighter models provide faster, more economical processing with potentially less depth.

- **Debug Mode**: Enabling LLM_DEBUG_VERBOSE provides detailed logging that can help identify configuration issues but increases log volume and may expose sensitive information in production environments.

**Section sources**
- [lib/ai.ts](file://lib/ai.ts#L918)
- [lib/report.ts](file://lib/report.ts#L22)

## Common Configuration Issues
The following are common configuration problems and their solutions:

- **Invalid Connection Strings**: Incorrect DATABASE_URL format is a frequent issue. Ensure the connection string follows the format `postgresql://user:pass@host:port/dbname` and that all components are correct. Special characters in passwords must be URL-encoded.

- **Expired API Keys**: OpenRouter API keys may expire or be revoked. If report generation suddenly fails, verify that the OPENROUTER_API_KEY is still valid in your OpenRouter account dashboard and update it if necessary.

- **Incorrect Chat IDs**: Using an invalid TELEGRAM_CHAT_ID prevents message delivery. Verify the chat ID by sending a message to the bot and using the getUpdates API to see the correct chat ID in the response.

- **Insufficient Permissions**: The Telegram bot must have permission to send messages in the specified chat. Add the bot to the group or channel and grant it the necessary permissions through Telegram's interface.

- **Model Availability**: The specified OPENROUTER_MODEL might not be available or accessible with your account tier. Check OpenRouter's model directory to confirm the model exists and your account has access to it.

**Section sources**
- [lib/db.ts](file://lib/db.ts#L7)
- [lib/ai.ts](file://lib/ai.ts#L171)
- [lib/telegram.ts](file://lib/telegram.ts#L116)

## Troubleshooting Configuration Errors
When encountering configuration-related errors, follow these steps:

1. **Check Required Variables**: Verify that DATABASE_URL, OPENROUTER_API_KEY, and OPENROUTER_MODEL are all set in the .env file. The application will fail to start without these.

2. **Validate Connection Strings**: Test the DATABASE_URL connection using a PostgreSQL client to ensure it can reach the database server and authenticate successfully.

3. **Test API Keys**: Use curl or a similar tool to make a test request to the OpenRouter API with your API key to confirm it is valid and has sufficient quota.

4. **Review Error Logs**: Examine application logs for specific error messages related to configuration. The logs will indicate which service failed to initialize and why.

5. **Verify Telegram Credentials**: Use the Telegram Bot API's getMe method to verify the bot token is valid, and getChat to verify the chat ID is correct and the bot has access.

6. **Check Environment Loading**: Ensure the .env file is being loaded by adding temporary logging to confirm environment variables are being read correctly.

7. **Validate File Location**: Confirm the .env file is in the project root directory and is named exactly `.env` with the dot prefix.

**Section sources**
- [lib/db.ts](file://lib/db.ts#L7)
- [lib/ai.ts](file://lib/ai.ts#L171)
- [lib/telegram.ts](file://lib/telegram.ts#L116)