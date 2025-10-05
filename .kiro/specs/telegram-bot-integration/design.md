# Design Document

## Overview

Интеграция Telegram Bot API для отправки AI-сгенерированных саммари в чаты. Функциональность будет добавлена в существующий компонент `SummaryGenerator` с новой кнопкой "Отправить в Telegram" и новым API endpoint для обработки отправки.

## Architecture

### High-Level Flow
1. Пользователь генерирует саммари через существующий интерфейс
2. После успешной генерации появляется кнопка "Отправить в Telegram"
3. При нажатии кнопки отправляется POST запрос на новый API endpoint
4. API endpoint форматирует саммари и отправляет через Telegram Bot API
5. Пользователь получает уведомление о результате отправки

### Integration Points
- **Frontend**: Модификация компонента `SummaryGenerator` (уже частично реализована)
- **Backend**: Новый API route `/api/send-to-telegram`
- **External**: Telegram Bot API для отправки сообщений
- **Configuration**: Новые переменные окружения для Telegram бота

## Components and Interfaces

### 1. Frontend Component Updates

**MultiStyleSummaryGenerator Component** (реализовано):
- Добавлена кнопка "📤 Отправить в Telegram" для каждого сгенерированного отчета
- Состояния: `isSending`, `sendSuccess`, `sendError` для каждой персоны
- Функция `sendToTelegram(persona, reportData)` для вызова API
- Поддержка всех 6 типов персон (curator, twitter, reddit, business, psychologist, creative)

**SummaryGenerator Component** (legacy, не используется на страницах):
- Простая версия с одной кнопкой генерации
- Также имеет кнопку "📤 Отправить в Telegram"

### 2. New API Endpoint

**Route**: `POST /api/send-to-telegram`

**Query Parameters**:
- `chat_id` (optional): ID чата для отправки
- `date` (optional): Дата для генерации саммари
- `days` (optional): Период (1 или 7 дней)

**Response Format**:
```typescript
{
  ok: boolean;
  message?: string;
  error?: string;
}
```

### 3. Telegram Service Module

**File**: `lib/telegram.ts`

**Functions**:
- `sendMessageToChat(chatId: string, message: string): Promise<boolean>`
- `formatSummaryForTelegram(report: ReportPayload): string`
- `validateTelegramConfig(): boolean`

**Types**:
```typescript
type TelegramMessage = {
  chat_id: string;
  text: string;
  parse_mode: 'Markdown' | 'HTML';
};

type TelegramResponse = {
  ok: boolean;
  result?: any;
  error_code?: number;
  description?: string;
};
```

### 4. Environment Configuration

**New Variables**:
- `TELEGRAM_BOT_TOKEN` (required): Токен бота от BotFather
- `TELEGRAM_CHAT_ID` (required): ID чата для отправки сообщений
- `TELEGRAM_THREAD_ID` (optional): ID треда форума для отправки в конкретную тему
- `TELEGRAM_API_URL` (optional): URL Telegram API (default: https://api.telegram.org)

## Data Models

### Message Formatting Structure

Саммари будет отформатировано в Telegram Markdown следующим образом:

```
🤖 *AI Дайджест за [дата]*

📊 *Сводка*
[summary text]

🎯 *Темы дня*
• [theme 1]
• [theme 2]
• [theme 3]

💡 *Инсайты*
• [insight 1]
• [insight 2]
• [insight 3]

---
_Сгенерировано AI-аналитиком_
```

### Message Length Handling

Telegram имеет лимит 4096 символов на сообщение. Стратегия обработки:

1. **Проверка длины**: Если сообщение < 4000 символов → отправить одним сообщением
2. **Разбивка**: Если больше → разбить на части:
   - Первое сообщение: заголовок + сводка
   - Второе сообщение: темы дня
   - Третье сообщение: инсайты
3. **Максимальная защита**: Обрезать каждую секцию до безопасного размера

## Error Handling

### Configuration Errors
- **Missing Credentials**: Если `TELEGRAM_BOT_TOKEN` или `TELEGRAM_CHAT_ID` не установлены → возврат 500 с сообщением о конфигурации
- **Invalid Token**: Если токен неверный → возврат с сообщением об ошибке авторизации
- **Invalid Thread ID**: Если `TELEGRAM_THREAD_ID` указан неверно → Telegram API вернет ошибку

### Runtime Errors
- **Network Issues**: Timeout или connection errors → возврат 503 с сообщением о временной недоступности
- **Bot Not in Chat**: Если бот не добавлен в чат → возврат 403 с инструкцией добавить бота
- **Invalid Chat ID**: Если chat_id неверный → возврат 400 с сообщением об ошибке

### User Experience
- **Loading State**: Кнопка показывает "📤 Отправляю..." и заблокирована
- **Success State**: Зеленое уведомление "✅ Саммари успешно отправлено в Telegram!"
- **Error State**: Красное уведомление с конкретным описанием ошибки

## Testing Strategy

### Unit Tests (Optional)
- `lib/telegram.ts` функции форматирования
- Валидация переменных окружения
- Обработка длинных сообщений

### Integration Tests (Optional)
- API endpoint `/api/send-to-telegram`
- Полный flow: генерация → отправка
- Error handling scenarios

### Manual Testing Scenarios
1. **Happy Path**: Генерация саммари → отправка в чат → проверка получения
2. **Configuration Issues**: Тест без токена, с неверным токеном
3. **Bot Permissions**: Тест с ботом не в чате, с ботом без прав на отправку
4. **Long Messages**: Тест с очень длинным саммари
5. **Network Issues**: Тест при недоступности Telegram API

## Security Considerations

### Token Management
- Токен бота хранится только в переменных окружения
- Никогда не логируется в консоль или ошибки
- Проверка токена при старте приложения (опционально)

### Input Validation
- Валидация `chat_id` (должен быть числом или строкой с префиксом)
- Санитизация текста саммари для Markdown
- Ограничение частоты запросов (rate limiting) - опционально

### Error Information
- Не раскрывать детали токена в ошибках
- Логировать ошибки на сервере, но возвращать общие сообщения клиенту

## Implementation Notes

### Telegram Bot API Integration
- Использовать официальный Telegram Bot API: `https://api.telegram.org/bot{token}/sendMessage`
- Метод: POST
- Content-Type: application/json
- Timeout: 10 секунд

### Message Formatting
- Использовать Markdown parse_mode для форматирования
- Экранировать специальные символы Markdown в тексте
- Добавить эмодзи для улучшения визуального восприятия

### Performance Considerations
- Кэширование последнего отправленного саммари (опционально)
- Асинхронная отправка без блокировки UI
- Retry logic для временных сбоев сети (опционально)

## Future Enhancements (Out of Scope)

- Поддержка отправки в несколько чатов одновременно
- Планировщик автоматической отправки саммари
- Кастомизация формата сообщений через UI
- Статистика отправленных сообщений
- Webhook для получения статуса доставки