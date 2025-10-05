# Product Requirements Document (PRD)

## Telegram Analytics Dashboard

**Version:** 1.0  
**Last Updated:** January 2025  
**Status:** Active Development

---

## Executive Summary

Telegram Analytics Dashboard — это read-only веб-приложение для аналитики и AI-инсайтов Telegram-сообществ. Приложение подключается к существующей PostgreSQL базе данных с сообщениями и пользователями, предоставляя владельцам чатов визуализацию активности и AI-анализ динамики общения.

**Ключевой принцип:** Приложение работает в режиме read-only и не имеет прав на запись в базу данных. Все операции — это SELECT-запросы для аналитики.

---

## Problem Statement

### Проблема
Владельцы и администраторы Telegram-чатов не имеют удобного инструмента для:
- Анализа активности участников за разные периоды
- Понимания тем и динамики обсуждений
- Получения инсайтов о поведении сообщества
- Идей для контента и вовлечения участников

### Целевая аудитория
- Администраторы Telegram-чатов и каналов
- Модераторы сообществ
- Контент-менеджеры
- Аналитики социальных медиа

### Текущее решение
Telegram предоставляет базовую статистику в приложении, но она:
- Ограничена простыми метриками
- Не дает глубокого анализа контента
- Не предлагает AI-инсайты
- Не позволяет кастомизировать временные периоды

---

## Product Vision

Создать простой, быстрый и безопасный read-only дашборд, который превращает сырые данные Telegram-чатов в понятные метрики и AI-инсайты на русском языке, помогая администраторам лучше понимать свое сообщество.

---

## Goals & Success Metrics

### Business Goals
1. Предоставить владельцам чатов инструмент для понимания динамики сообщества
2. Помочь генерировать идеи для контента на основе AI-анализа
3. Обеспечить безопасный read-only доступ к аналитике

### Success Metrics
- Время загрузки дашборда < 2 секунд
- Успешная генерация AI-отчетов > 95% запросов
- Поддержка анализа чатов с 10,000+ сообщений
- Zero write operations в базу данных (безопасность)

### Non-Goals
- Модерация контента или управление чатом
- Отправка сообщений в Telegram
- Изменение данных в базе
- Реалтайм-уведомления
- Мобильное приложение (только веб)

---

## User Stories & Use Cases

### Primary Use Cases

#### UC1: Просмотр дневной активности
**Актор:** Администратор чата  
**Цель:** Увидеть активность за последние 24 часа  
**Сценарий:**
1. Пользователь открывает главную страницу `/`
2. Видит метрики: количество сообщений, уникальных участников, сообщений со ссылками
3. Видит топ-5 самых активных участников
4. Может отфильтровать по конкретному чату через `?chat_id=`

#### UC2: Анализ недельных трендов
**Актор:** Контент-менеджер  
**Цель:** Понять динамику за неделю  
**Сценарий:**
1. Пользователь переходит на `/week`
2. Видит агрегированные метрики за 7 дней
3. Сравнивает активность с дневной статистикой
4. Может фильтровать по чату

#### UC3: Генерация AI-инсайтов
**Актор:** Модератор  
**Цель:** Получить AI-анализ тем и предложения  
**Сценарий:**
1. Пользователь нажимает "Генерировать" в секции AI
2. Система анализирует сообщения через Google Gemini
3. Получает структурированный отчет: summary, themes, insights
4. Видит профили участников и идеи для контента
5. При ошибке видит понятное сообщение на русском

#### UC4: Фильтрация по чату
**Актор:** Администратор нескольких чатов  
**Цель:** Анализировать конкретный чат  
**Сценарий:**
1. Пользователь добавляет `?chat_id=123` к URL
2. Все метрики и AI-анализ фильтруются по этому чату
3. Может переключаться между чатами через URL

---

## Functional Requirements

### FR1: Analytics Dashboard
- **FR1.1** Отображение метрик за 24 часа на главной странице
- **FR1.2** Отображение метрик за 7 дней на `/week`
- **FR1.3** Фильтрация по `chat_id` через query параметр
- **FR1.4** Топ-5 участников по количеству сообщений
- **FR1.5** Подсчет сообщений со ссылками
- **FR1.6** Русскоязычный интерфейс

### FR2: AI Report Generation
- **FR2.1** Генерация отчетов по кнопке "Генерировать"
- **FR2.2** Структурированный JSON-ответ от AI (summary, themes, insights)
- **FR2.3** Два режима: с текстом сообщений и только метрики
- **FR2.4** Валидация ответа через Zod схемы
- **FR2.5** Отображение loading состояния
- **FR2.6** Обработка ошибок с понятными сообщениями

### FR3: Database Access
- **FR3.1** Read-only подключение к PostgreSQL
- **FR3.2** Connection pooling для эффективности
- **FR3.3** Только SELECT запросы
- **FR3.4** Параметризованные запросы для безопасности
- **FR3.5** Поддержка фильтрации по chat_id и временным периодам

### FR4: API Endpoints
- **FR4.1** `GET /api/overview` — метрики с фильтрами
- **FR4.2** `GET /api/report/[kind]` — AI-отчеты (generate, insights, preview)
- **FR4.3** Стандартный формат ответа: `{ ok, data?, error? }`
- **FR4.4** Query параметры: `chat_id`, `days`, `date`

---

## Non-Functional Requirements

### NFR1: Performance
- Загрузка дашборда < 2 секунд
- AI-генерация < 30 секунд
- Поддержка до 100,000 сообщений в анализе
- Connection pooling для оптимизации БД

### NFR2: Security
- **Read-only доступ к БД** (критично!)
- Параметризованные SQL-запросы (защита от SQL injection)
- Валидация всех входных параметров
- Безопасное хранение API ключей в environment variables
- No user authentication (предполагается внутреннее использование)

### NFR3: Reliability
- Graceful degradation при недоступности AI
- Retry логика для AI запросов
- Понятные error messages на русском
- Логирование ошибок для debugging

### NFR4: Maintainability
- TypeScript strict mode
- Zod схемы для валидации
- Модульная архитектура (components, lib, api)
- Документированный код
- ESLint для code quality

### NFR5: Scalability
- Server-side rendering для быстрой загрузки
- Connection pooling для БД
- Оптимизированные SQL запросы с индексами
- Ограничение размера текста для AI (80,000 символов)

---

## Technical Architecture

### Technology Stack
- **Frontend:** Next.js 15 (App Router), React 19 RC, TypeScript 5.5
- **Backend:** Next.js API Routes, Node.js
- **Database:** PostgreSQL (read-only via `pg` driver)
- **AI:** OpenRouter API (Google Gemini 2.5 Pro)
- **Validation:** Zod 3.23.8
- **Styling:** Custom CSS (minimal)

### Database Schema
```sql
-- Read-only access to these tables
messages (
  id BIGINT PRIMARY KEY,
  user_id BIGINT,
  chat_id BIGINT,
  text TEXT,
  sent_at TIMESTAMP
)

users (
  id BIGINT PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  username TEXT
)
```

### API Design
```
GET /api/overview?chat_id={id}&days={1|7}
Response: { ok: true, data: { totalMessages, uniqueUsers, messagesWithLinks, topUsers } }

GET /api/report/generate?chat_id={id}&days={1|7}
Response: { ok: true, data: { summary, themes, insights, participants } }
```

### Data Flow
1. User requests page → Next.js SSR
2. Server queries PostgreSQL (SELECT only)
3. Data rendered in React components
4. User clicks "Генерировать" → Client-side fetch
5. API route queries DB + calls OpenRouter
6. AI response validated via Zod
7. Structured data returned to client

---

## User Interface

### Pages
1. **`/` (24 часа)** — Главная страница с дневной аналитикой
2. **`/week` (7 дней)** — Недельная аналитика

### Components
- **MetricCard** — Карточка с числовой метрикой
- **TopUsers** — Список топ-участников
- **AiInsights** — Отображение AI-отчета
- **SummaryGenerator** — Кнопка генерации с loading состоянием

### Language
- Весь UI на русском языке
- AI генерирует ответы на русском
- Дружелюбный, разговорный тон (не корпоративный)

---

## Dependencies & Integrations

### Required Services
1. **PostgreSQL Database**
   - Existing schema with messages and users
   - Read-only credentials
   - Network access from application

2. **OpenRouter API**
   - Valid API key
   - Model: `google/gemini-2.5-pro`
   - Internet connectivity

### Environment Variables
```bash
# Required
DATABASE_URL=postgresql://user:pass@host:5432/db
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=google/gemini-2.5-pro

# Optional
OPENROUTER_TIMEOUT_MS=20000
LLM_DEBUG_VERBOSE=1
LLM_TEXT_CHAR_BUDGET=80000
```

---

## Security Considerations

### Database Security
- ✅ Read-only database user with SELECT-only permissions
- ✅ Parameterized queries (no string concatenation)
- ✅ Input validation on all query parameters
- ✅ Connection pooling with limits
- ❌ No INSERT, UPDATE, DELETE, DROP operations
- ❌ No dynamic SQL generation

### API Security
- API keys stored in environment variables (not in code)
- No user authentication (internal tool assumption)
- Rate limiting considerations for AI API
- Error messages don't expose sensitive data

### Data Privacy
- No data modification or deletion
- No data export features (view-only)
- AI analysis uses aggregated/anonymized data where possible

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| AI API unavailable | High | Medium | Graceful degradation, show metrics only |
| Database connection issues | High | Low | Connection pooling, retry logic |
| Slow queries on large datasets | Medium | Medium | Indexed queries, query optimization |
| Accidental write operations | Critical | Low | Read-only DB user, code review |
| AI response format changes | Medium | Low | Zod validation, error handling |

---

## Future Enhancements (Out of Scope for v1)

- 📊 Графики и визуализации трендов
- 📅 Выбор произвольных дат для анализа
- 🔔 Экспорт отчетов в PDF/CSV
- 🤖 Интеграция с Telegram Bot для отправки отчетов
- 🌐 Поддержка других языков (английский)
- 👥 Multi-user access с аутентификацией
- 📈 Сравнение периодов (week-over-week)
- 🎯 Настраиваемые метрики и KPI

---

## Glossary

- **Read-only** — Режим работы приложения, при котором выполняются только SELECT запросы к БД
- **AI Insights** — Структурированный анализ чата через LLM (summary, themes, insights)
- **OpenRouter** — API-сервис для доступа к различным LLM моделям
- **Connection Pooling** — Переиспользование подключений к БД для производительности
- **SSR** — Server-Side Rendering, рендеринг страниц на сервере
- **Zod** — TypeScript-first библиотека для валидации схем данных

---

## Approval & Sign-off

**Product Owner:** _[Pending]_  
**Tech Lead:** _[Pending]_  
**Date:** _[Pending]_

---

**Document Status:** ✅ Ready for Review
