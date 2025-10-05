# Design Document

## Overview

Добавление функциональности отображения тредов (тем форума) для Telegram форумов. Система будет извлекать список тредов из базы данных, отображать их в виде горизонтального списка сверху дашборда и позволять фильтровать все данные по выбранному треду через параметр `thread_id` в URL.

## Architecture

### Data Flow

```
Database (messages table) 
  → fetchForumTopics() query
    → API Route (/api/topics)
      → ForumTopics Component (Client)
        → URL update with thread_id parameter
          → Dashboard re-render with filtered data
```

### Component Hierarchy

```
page.tsx (Server Component)
├── ForumTopics (Client Component) - новый
├── metrics-grid
│   └── MetricCard (x3)
├── content-grid
│   ├── TopUsers
│   └── AiInsights
└── MultiStyleSummaryGenerator
```

## Components and Interfaces

### 1. ForumTopics Component (Client Component)

**Location:** `components/forum-topics.tsx`

**Purpose:** Отображает список тредов форума с возможностью фильтрации

**Props:**
```typescript
type ForumTopicsProps = {
  chatId?: string;
  currentThreadId?: string;
  days?: 1 | 7;
};
```

**State:**
```typescript
const [topics, setTopics] = useState<ForumTopic[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

**Behavior:**
- Загружает список тредов через API при монтировании
- Отображает горизонтальный скроллируемый список тредов
- Выделяет активный тред
- При клике на тред обновляет URL с параметром `thread_id`
- Показывает кнопку "Все темы" для сброса фильтра

**UI Structure:**
```
┌─────────────────────────────────────────────────────┐
│ Темы форума:                                        │
│ [Все темы] [Тема 1 (42)] [Тема 2 (18)] [Тема 3...] │
└─────────────────────────────────────────────────────┘
```

### 2. API Route: /api/topics

**Location:** `app/api/topics/route.ts`

**Method:** GET

**Query Parameters:**
- `chat_id` (optional) - ID чата для фильтрации
- `days` (optional) - временное окно (1 или 7)

**Response Format:**
```typescript
{
  ok: boolean;
  data?: ForumTopic[];
  error?: string;
}
```

**Logic:**
1. Извлекает параметры из URL
2. Вызывает `fetchForumTopics()` из `lib/queries.ts`
3. Возвращает список тредов или ошибку

### 3. Database Query Function

**Location:** `lib/queries.ts`

**Function:** `fetchForumTopics()`

**Signature:**
```typescript
export async function fetchForumTopics({
  chatId,
  window = 1
}: {
  chatId?: string;
  window?: 1 | 7;
}): Promise<ForumTopic[]>
```

**SQL Logic:**
```sql
SELECT 
  message_thread_id,
  COUNT(*) as message_count,
  MAX(sent_at) as last_message_at,
  -- Извлекаем название темы из первого сообщения треда
  (SELECT text FROM messages m2 
   WHERE m2.message_thread_id = m.message_thread_id 
   AND m2.chat_id = m.chat_id
   ORDER BY sent_at ASC LIMIT 1) as topic_name
FROM messages m
WHERE sent_at >= NOW() - $1::interval
  AND message_thread_id IS NOT NULL
  [AND chat_id = $2]
GROUP BY message_thread_id, chat_id
ORDER BY message_count DESC
```

**Error Handling:**
- Если колонка `message_thread_id` не существует → возвращает пустой массив
- Если нет тредов (обычная группа) → возвращает пустой массив
- Логирует ошибки в консоль

## Data Models

### ForumTopic Type

**Location:** `lib/types.ts`

```typescript
export type ForumTopic = {
  threadId: string;
  topicName: string;
  messageCount: number;
  lastMessageAt: string; // ISO timestamp
};
```

### Updated OverviewParams

Расширяем существующий тип в `lib/queries.ts`:

```typescript
type OverviewParams = {
  chatId?: string;
  threadId?: string; // новый параметр
  window?: 1 | 7;
  from?: Date;
  to?: Date;
};
```

### URL Parameters

Добавляем новый параметр к существующим:
- `chat_id` - ID чата (существующий)
- `thread_id` - ID треда форума (новый)
- `days` - временное окно (используется в /week)

## Integration with Existing Code

### 1. Модификация fetchOverview()

Добавляем поддержку фильтрации по `threadId`:

```typescript
export async function fetchOverview({ 
  chatId, 
  threadId, // новый параметр
  window = 1, 
  from, 
  to 
}: OverviewParams): Promise<OverviewResponse> {
  // ... existing code ...
  
  if (threadId) {
    conditions.push(`message_thread_id = $${params.length + 1}`);
    params.push(threadId);
  }
  
  // ... rest of the function
}
```

### 2. Модификация fetchMessagesText() и fetchMessagesWithAuthors()

Добавляем параметр `threadId` для фильтрации сообщений при генерации AI отчетов:

```typescript
export async function fetchMessagesText({
  chatId,
  threadId, // новый параметр
  from,
  to,
  limit = 5000
}: {
  chatId?: string;
  threadId?: string; // новый параметр
  from: Date;
  to: Date;
  limit?: number;
}): Promise<string[]> {
  // ... existing code ...
  
  if (threadId) {
    where.push(`m.message_thread_id = $${params.length + 1}`);
    params.push(threadId);
  }
  
  // ... rest of the function
}
```

### 3. Обновление page.tsx и week/page.tsx

Извлекаем `thread_id` из searchParams и передаем в компоненты:

```typescript
export default async function Dashboard24h({ searchParams }: PageProps) {
  const chatParam = searchParams?.["chat_id"];
  const chatId = Array.isArray(chatParam) ? chatParam[0] : chatParam;
  
  const threadParam = searchParams?.["thread_id"]; // новый
  const threadId = Array.isArray(threadParam) ? threadParam[0] : threadParam; // новый

  const metrics = await fetchOverview({ chatId, threadId, window: 1 }); // обновлено
  
  return (
    <div>
      <ForumTopics chatId={chatId} currentThreadId={threadId} days={1} /> {/* новый */}
      {/* ... existing components */}
    </div>
  );
}
```

### 4. Обновление API Routes

Модифицируем `/api/overview/route.ts` и `/api/report/[kind]/route.ts` для поддержки `thread_id`:

```typescript
// В /api/overview/route.ts
const chatId = searchParams.get("chat_id") ?? undefined;
const threadId = searchParams.get("thread_id") ?? undefined; // новый
const metrics = await fetchOverview({ chatId, threadId, window: days }); // обновлено

// В /api/report/[kind]/route.ts
const threadId = searchParams.get("thread_id") ?? undefined; // новый
// Передаем threadId в функции генерации отчетов
```

## Error Handling

### Database Level

1. **Колонка не существует:**
   - Перехватываем PostgreSQL ошибку "column does not exist"
   - Возвращаем пустой массив тредов
   - Логируем предупреждение: "Forum topics not available (message_thread_id column missing)"

2. **Нет данных:**
   - Возвращаем пустой массив
   - Компонент не отображается

### API Level

```typescript
try {
  const topics = await fetchForumTopics({ chatId, window: days });
  return Response.json({ ok: true, data: topics });
} catch (error) {
  console.error("[API] /api/topics error:", error);
  return Response.json(
    { ok: false, error: "Не удалось загрузить темы форума" },
    { status: 500 }
  );
}
```

### Component Level

```typescript
useEffect(() => {
  async function loadTopics() {
    try {
      setLoading(true);
      const response = await fetch(url);
      const result = await response.json();
      
      if (!result.ok) {
        setError(result.error || "Ошибка загрузки");
        return;
      }
      
      setTopics(result.data || []);
    } catch (err) {
      setError("Не удалось загрузить темы");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }
  
  loadTopics();
}, [chatId, days]);
```

**Display Logic:**
- Если `loading` → показываем "Загрузка тем..."
- Если `error` → показываем сообщение об ошибке (не блокируем остальной UI)
- Если `topics.length === 0` → не отображаем компонент вообще
- Если `topics.length > 0` → отображаем список

## Testing Strategy

### Unit Tests (Optional)

1. **fetchForumTopics() function:**
   - Корректно группирует по message_thread_id
   - Правильно применяет фильтры chatId и window
   - Возвращает пустой массив при отсутствии колонки
   - Сортирует по количеству сообщений

2. **ForumTopics component:**
   - Корректно отображает список тредов
   - Выделяет активный тред
   - Обновляет URL при клике
   - Показывает состояния loading/error

### Integration Tests (Optional)

1. **API endpoint /api/topics:**
   - Возвращает корректный формат данных
   - Обрабатывает параметры chat_id и days
   - Возвращает ошибку при проблемах с БД

2. **End-to-end flow:**
   - Клик на тред обновляет URL
   - Метрики пересчитываются с фильтром
   - AI отчеты генерируются только для выбранного треда
   - Кнопка "Все темы" сбрасывает фильтр

### Manual Testing Scenarios

1. **Форум с тредами:**
   - Открыть дашборд с chat_id форума
   - Проверить отображение списка тредов
   - Кликнуть на тред, проверить фильтрацию
   - Сгенерировать AI отчет, проверить что анализируется только выбранный тред

2. **Обычная группа:**
   - Открыть дашборд с chat_id обычной группы
   - Проверить что список тредов не отображается
   - Проверить что все остальные функции работают

3. **База без message_thread_id:**
   - Проверить что приложение не падает
   - Проверить что список тредов не отображается
   - Проверить логи на наличие предупреждения

## UI/UX Considerations

### Visual Design

- **Расположение:** Сразу под навигацией, перед метриками
- **Стиль:** Горизонтальный скроллируемый список кнопок
- **Активный тред:** Другой цвет фона (например, светло-синий)
- **Hover эффект:** Легкое изменение цвета при наведении
- **Адаптивность:** На мобильных устройствах скроллится горизонтально

### Interaction Patterns

1. **Клик на тред:**
   - Обновляет URL с `?thread_id=XXX`
   - Страница перезагружается с новыми данными
   - Тред остается выделенным

2. **Клик на "Все темы":**
   - Удаляет параметр `thread_id` из URL
   - Страница перезагружается с полными данными

3. **Прямая ссылка:**
   - URL с `?chat_id=XXX&thread_id=YYY` сразу показывает отфильтрованные данные
   - Можно шарить ссылки на конкретные треды

### Accessibility

- Кнопки имеют понятные aria-labels
- Активный тред имеет aria-current="true"
- Клавиатурная навигация работает (Tab, Enter)
- Достаточный контраст цветов

## Performance Considerations

1. **Database Query Optimization:**
   - Индекс на `(message_thread_id, sent_at)` для быстрой группировки
   - LIMIT на количество возвращаемых тредов (например, топ 50)

2. **Client-Side:**
   - Список тредов кешируется в состоянии компонента
   - Не перезагружается при каждом ре-рендере
   - Используем `useEffect` с правильными зависимостями

3. **API Response:**
   - Минимальный размер данных (только необходимые поля)
   - Быстрый ответ благодаря индексам БД

## Migration Path

### Phase 1: Database Check
- Проверить наличие колонки `message_thread_id` в таблице `messages`
- Если отсутствует, добавить: `ALTER TABLE messages ADD COLUMN message_thread_id TEXT;`
- Создать индекс: `CREATE INDEX idx_messages_thread_id ON messages(message_thread_id, sent_at);`

### Phase 2: Backend Implementation
- Добавить `ForumTopic` тип в `lib/types.ts`
- Реализовать `fetchForumTopics()` в `lib/queries.ts`
- Обновить `fetchOverview()` для поддержки `threadId`
- Создать API route `/api/topics/route.ts`

### Phase 3: Frontend Implementation
- Создать компонент `ForumTopics`
- Интегрировать в `page.tsx` и `week/page.tsx`
- Обновить `MultiStyleSummaryGenerator` для передачи `threadId`

### Phase 4: Testing & Refinement
- Тестирование на реальных данных форума
- Проверка обратной совместимости с обычными группами
- Оптимизация производительности при необходимости
