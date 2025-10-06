# Product Requirements Document (PRD)

## Telegram Analytics Dashboard

**Version:** 1.1  
**Last Updated:** January 2025  
**Status:** Production

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
- Двусторонняя коммуникация с Telegram (только отправка отчетов)
- Изменение данных в базе
- Реалтайм-уведомления
- Мобильное приложение (только веб)
- Аутентификация пользователей (внутренний инструмент)

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
5. Может отфильтровать по теме форума через `?thread_id=`

#### UC2: Анализ недельных трендов
**Актор:** Контент-менеджер  
**Цель:** Понять динамику за неделю  
**Сценарий:**
1. Пользователь переходит на `/week`
2. Видит агрегированные метрики за 7 дней
3. Сравнивает активность с дневной статистикой
4. Может фильтровать по чату и теме форума

#### UC3: Фильтрация по темам форума
**Актор:** Администратор форума  
**Цель:** Анализировать активность в конкретной теме  
**Сценарий:**
1. Пользователь видит список тем форума с количеством сообщений
2. Нажимает на тему для фильтрации
3. Все метрики обновляются для выбранной темы
4. Может вернуться к просмотру всех тем

#### UC4: Генерация AI-отчетов в разных стилях
**Актор:** Модератор  
**Цель:** Получить AI-анализ с разных перспектив  
**Сценарий:**
1. Пользователь видит 6 карточек с разными персонами AI-аналитиков
2. Может сгенерировать отчет для каждой персоны отдельно или все сразу
3. Получает структурированные отчеты:
   - Куратор-реалист: честный анализ с психо-профилями
   - Twitter-скептик: циничный взгляд со стороны
   - Reddit-модератор: анализ токсичности и групповой динамики
   - Бизнес-консультант: идеи монетизации и ROI
   - Психолог сообществ: психологические архетипы и эмоциональные паттерны
   - Креативный маркетолог: вирусные концепции и тренды
4. Может отправить любой отчет в Telegram одной кнопкой

#### UC5: Отправка отчетов в Telegram
**Актор:** Администратор чата  
**Цель:** Поделиться AI-анализом с участниками  
**Сценарий:**
1. Пользователь генерирует AI-отчет
2. Нажимает кнопку "Отправить в Telegram" под нужным отчетом
3. Отчет форматируется и отправляется в настроенный Telegram-чат
4. Получает подтверждение успешной отправки

#### UC6: Фильтрация по чату
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
- **FR1.4** Фильтрация по `thread_id` (темам форума) через query параметр
- **FR1.5** Топ-5 участников по количеству сообщений
- **FR1.6** Подсчет сообщений со ссылками
- **FR1.7** Русскоязычный интерфейс
- **FR1.8** Адаптивный layout для широких мониторов (2K, 4K)

### FR2: Forum Topics
- **FR2.1** Отображение списка тем форума с количеством сообщений
- **FR2.2** Кнопка "Все темы" для сброса фильтра
- **FR2.3** Интерактивная фильтрация по темам
- **FR2.4** Горизонтальный скролл для длинного списка тем
- **FR2.5** Визуальное выделение активной темы

### FR3: AI Report Generation (Multi-Persona)
- **FR3.1** 6 различных AI-персон для анализа:
  - Куратор-реалист: честный анализ с психо-профилями участников
  - Twitter-скептик: циничный взгляд с интернет-сленгом
  - Reddit-модератор: анализ токсичности и групповой динамики
  - Бизнес-консультант: идеи монетизации, стратегии дохода, ROI-инсайты
  - Психолог сообществ: психологические архетипы, эмоциональные паттерны
  - Креативный маркетолог: вирусные концепции, контент-форматы, тренды
- **FR3.2** Генерация отчетов индивидуально или всех сразу
- **FR3.3** Структурированный JSON-ответ с валидацией через Zod
- **FR3.4** Два режима: с текстом сообщений и только метрики
- **FR3.5** Отображение loading состояния для каждой персоны
- **FR3.6** Обработка ошибок с понятными сообщениями на русском
- **FR3.7** Цветовая кодировка персон для визуального различия

### FR4: Telegram Integration
- **FR4.1** Отправка AI-отчетов в Telegram-чат
- **FR4.2** Форматирование отчетов для Telegram (Markdown)
- **FR4.3** Поддержка отправки в конкретный thread (forum topics)
- **FR4.4** Кнопка отправки под каждым сгенерированным отчетом
- **FR4.5** Визуальная обратная связь (loading, success, error)
- **FR4.6** Автоматическое скрытие success-сообщения через 5 секунд

### FR5: Database Access
- **FR5.1** Read-only подключение к PostgreSQL
- **FR5.2** Connection pooling для эффективности
- **FR5.3** Только SELECT запросы
- **FR5.4** Параметризованные запросы для безопасности
- **FR5.5** Поддержка фильтрации по chat_id, thread_id и временным периодам

### FR6: API Endpoints
- **FR6.1** `GET /api/overview` — метрики с фильтрами (chat_id, thread_id, days)
- **FR6.2** `GET /api/topics` — список тем форума с количеством сообщений
- **FR6.3** `GET /api/report/generate` — генерация AI-отчетов с поддержкой persona
- **FR6.4** `POST /api/send-to-telegram` — отправка отчетов в Telegram
- **FR6.5** Стандартный формат ответа: `{ ok, data?, error? }`
- **FR6.6** Query параметры: `chat_id`, `thread_id`, `days`, `date`, `persona`

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

### NFR6: Responsive Design
- Адаптивный layout для 5 уровней разрешений:
  - Mobile (<768px): 1 колонка
  - Tablet (768-1279px): 2-3 колонки, max-width 1200px
  - Desktop (1280-1919px): 3 колонки, max-width 1400px
  - Wide Desktop (1920-2559px): 4-5 колонок, max-width 85%
  - Ultra Wide (≥2560px): 5-6 колонок, max-width 80%
- Эффективное использование пространства на широких мониторах (70-85% ширины на 4K)
- CSS Grid с auto-fit для автоматической адаптации колонок

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
  thread_id BIGINT,  -- Forum topic ID (nullable)
  text TEXT,
  sent_at TIMESTAMP
)

users (
  id BIGINT PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  username TEXT
)

forum_topics (
  thread_id BIGINT PRIMARY KEY,
  chat_id BIGINT,
  topic_name TEXT
)
```

### API Design
```
GET /api/overview?chat_id={id}&thread_id={id}&days={1|7}
Response: { ok: true, data: { totalMessages, uniqueUsers, linkMessages, topUsers, series } }

GET /api/topics?chat_id={id}&days={1|7}
Response: { ok: true, data: [{ threadId, topicName, messageCount }] }

GET /api/report/generate?chat_id={id}&thread_id={id}&days={1|7}&date={YYYY-MM-DD}&persona={curator|business|psychologist|creative|twitter|reddit}
Response: { ok: true, data: { summary, themes, insights } | { monetization_ideas, revenue_strategies, roi_insights } | ... }

POST /api/send-to-telegram?chat_id={id}&thread_id={id}&days={1|7}&date={YYYY-MM-DD}&persona={type}
Body: { summary, themes, insights, ... }
Response: { ok: true, message: "Саммари успешно отправлено в Telegram" }
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
- **ForumTopics** — Интерактивный список тем форума с фильтрацией
- **AiInsights** — Отображение AI-отчета (legacy, не используется)
- **MultiStyleSummaryGenerator** — Генератор отчетов с 6 персонами:
  - Карточки для каждой персоны с цветовой кодировкой
  - Индивидуальная генерация или массовая генерация всех
  - Кнопка отправки в Telegram под каждым отчетом
  - Loading/success/error состояния для каждой карточки

### Layout & Styling
- Адаптивный CSS Grid layout для широких мониторов
- 5 уровней breakpoints (mobile → 4K)
- Минимальный custom CSS без фреймворков
- Цветовая кодировка персон AI-аналитиков

### Language
- Весь UI на русском языке
- AI генерирует ответы на русском
- Разные тоны в зависимости от персоны:
  - Куратор: дружелюбный, разговорный
  - Twitter: циничный, саркастичный
  - Reddit: аналитичный, модераторский
  - Бизнес: профессиональный, цифровой
  - Психолог: эмпатичный, научный
  - Креативный: энергичный, трендовый

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

# Optional - AI Configuration
OPENROUTER_TIMEOUT_MS=20000
LLM_DEBUG_VERBOSE=1
LLM_TEXT_CHAR_BUDGET=80000

# Optional - Telegram Integration
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_CHAT_ID=-1001234567890
TELEGRAM_THREAD_ID=12345  # For forum topics
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

## Implemented Features (v1.1)

✅ **Core Analytics**
- Дневная и недельная аналитика
- Фильтрация по чатам и темам форума
- Топ-участники с процентами активности
- Адаптивный layout для широких мониторов

✅ **AI Analysis**
- 6 различных AI-персон для анализа
- Массовая генерация всех отчетов
- Структурированные отчеты с валидацией

✅ **Telegram Integration**
- Отправка AI-отчетов в Telegram
- Поддержка forum topics
- Форматирование для Telegram Markdown

## Future Enhancements (Out of Scope for v1.1)

- 📊 Графики и визуализации трендов
- 📅 Выбор произвольных дат для анализа (сейчас только текущая дата)
- 🔔 Экспорт отчетов в PDF/CSV
- 🌐 Поддержка других языков (английский)
- 👥 Multi-user access с аутентификацией
- 📈 Сравнение периодов (week-over-week)
- 🎯 Настраиваемые метрики и KPI
- 🤖 Автоматическая отправка отчетов по расписанию
- 📱 Мобильное приложение или PWA

---

## Glossary

- **Read-only** — Режим работы приложения, при котором выполняются только SELECT запросы к БД
- **AI Persona** — Специализированный AI-аналитик с уникальным стилем и фокусом анализа
- **Forum Topics** — Темы в Telegram-форумах (супергруппах с включенными topics)
- **Thread ID** — Идентификатор темы форума для фильтрации сообщений
- **OpenRouter** — API-сервис для доступа к различным LLM моделям
- **Connection Pooling** — Переиспользование подключений к БД для производительности
- **SSR** — Server-Side Rendering, рендеринг страниц на сервере
- **Zod** — TypeScript-first библиотека для валидации схем данных
- **Responsive Breakpoints** — Точки переключения layout в зависимости от ширины экрана
- **CSS Grid** — CSS технология для создания двумерных адаптивных сеток

---

## Changelog

### v1.1 (January 2025)
- ✅ Добавлена поддержка forum topics с фильтрацией
- ✅ Реализовано 6 AI-персон для разностороннего анализа
- ✅ Добавлена интеграция с Telegram для отправки отчетов
- ✅ Реализован адаптивный layout для широких мониторов (2K, 4K)
- ✅ Добавлена массовая генерация всех отчетов одной кнопкой

### v1.0 (January 2025)
- ✅ Базовая аналитика (24 часа / 7 дней)
- ✅ Фильтрация по chat_id
- ✅ AI-генерация отчетов (куратор-персона)
- ✅ Топ-участники и базовые метрики

---

**Document Status:** ✅ Production Ready
