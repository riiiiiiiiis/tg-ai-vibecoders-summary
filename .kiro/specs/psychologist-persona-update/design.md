# Design Document

## Overview

Обновление AI-персоны "Психолог сообществ" для создания шуточного анализа участников чата в стиле "угадай LLM-модель". Вместо традиционного психологического профилирования, персона будет анализировать стиль письма участников и делать юмористические предположения о том, какая языковая модель (GPT-4, Claude, Gemini, DeepSeek и т.д.) могла бы генерировать такие сообщения.

Ключевая идея: создать развлекательный контент для сообщества, где каждый участник получает "диагноз" в виде AI-модели на основе своего стиля общения.

## Architecture

### Компоненты для изменения

1. **Prompt Configuration** (`lib/ai/prompts.ts`)
   - Обновление системного промпта для персоны `psychologist`
   - Изменение тона с серьезного психологического на шуточный
   - Добавление инструкций по лексическому анализу

2. **Schema Validation** (`lib/ai/schemas.ts`)
   - Обновление Zod-схемы для нового формата ответа
   - Добавление поля для списка моделей
   - Сохранение совместимости с существующим UI

3. **Type Definitions** (`lib/reportSchemas.ts`)
   - Обновление TypeScript типов для новой структуры данных
   - Добавление типов для "модельных предположений"

4. **UI Component** (`components/multi-style-summary-generator.tsx`)
   - Обновление рендеринга для отображения новой структуры
   - Визуальное выделение упоминаний участников
   - Отображение "модельных диагнозов"

### Неизменяемые компоненты

- API endpoints (`app/api/report/[kind]/route.ts`) — без изменений
- Database queries (`lib/queries.ts`) — без изменений
- Telegram integration (`lib/telegram.ts`) — без изменений
- Другие персоны (curator, business, creative и т.д.) — без изменений

## Components and Interfaces

### 1. Prompt Configuration

**Файл:** `lib/ai/prompts.ts`

**Текущая структура:**
```typescript
psychologist: {
  systemRole: "Ты — клинический психолог сообществ...",
  taskDescription: "Создать чисто психологический анализ...",
  outputFormat: `{"group_atmosphere": "...", "psychological_archetypes": [...], ...}`,
  constraints: [...]
}
```

**Новая структура:**
```typescript
psychologist: {
  systemRole: "Ты — шуточный AI-детектив, который анализирует стиль письма участников чата и угадывает, какая языковая модель могла бы так писать.",
  taskDescription: "Проанализировать стиль письма участников и создать шуточный отчёт в формате JSON",
  outputFormat: `{"intro": "...", "participants": [{"name": "...", "model": "...", "confidence": "...", "reasoning": "..."},...], "summary": "..."}`,
  constraints: [
    "Анализируй РЕАЛЬНЫЕ сообщения участников — лексику, структуру, длину, эмодзи",
    "Упоминай участников по никнейму (@username) или имени для уведомлений",
    "Используй названия реальных моделей: GPT-4, Claude 3.5 Sonnet, Gemini 2.0 Pro, DeepSeek V3, Llama 3.3, Qwen 2.5, Mistral Large, GLM-4",
    "Объясняй ПОЧЕМУ ты думаешь что это конкретная модель — приводи примеры из сообщений",
    "Пиши в шуточном, легком тоне — это игра, а не серьезный анализ",
    "Фокусируйся на топ-5 до топ-10 самых активных участниках периода"
  ]
}
```

### 2. Data Schema

**Файл:** `lib/reportSchemas.ts`

**Новая Zod-схема:**
```typescript
export const psychologyReportSchema = z.object({
  intro: z.string().min(50).max(500),
  participants: z.array(z.object({
    name: z.string(),
    model: z.enum([
      // OpenAI
      'GPT-5 Pro', 'GPT-5-codex', 'o3', 'o3-mini', 'o4-mini', 'GPT-4o',
      // Anthropic
      'Claude Sonnet 4', 'Claude Sonnet 4.5', 'Claude Opus 4', 'Claude Haiku 4.5',
      // Google
      'Gemini 2.5 Pro', 'Gemini 2.5 Flash', 'Gemini 2.5 Flash-Lite',
      // Meta
      'Llama 4 Scout', 'Llama 4 Maverick', 'Llama 3.3 70B',
      // DeepSeek
      'DeepSeek V3', 'DeepSeek V3.2-Exp', 'DeepSeek R1',
      // Qwen
      'Qwen3', 'Qwen3 Max', 'Qwen3 235B-A22B',
      // Mistral
      'Mistral Large 2', 'Mistral Medium 3', 'Codestral 25',
      // Others
      'GLM-4.5', 'GLM-4.6', 'Grok 3', 'Kimi K2'
    ]),
    confidence: z.enum(['low', 'medium', 'high']),
    reasoning: z.string().min(50).max(800)
  })).min(5).max(10),
  summary: z.string().min(100).max(600).optional()
});

export type PsychologyReport = z.infer<typeof psychologyReportSchema>;
```

**Обновленные лимиты символов (v1.1):**
- `intro`: 50-500 символов (увеличено с 300 для более развернутого вступления)
- `reasoning`: 50-800 символов (увеличено с 500 для более детального анализа)
- `summary`: 100-600 символов (ОПЦИОНАЛЬНОЕ ПОЛЕ — может отсутствовать)

**Обоснование выбора моделей (обновлено для октября 2025):**
- GPT-5 Pro / GPT-5-codex / o3 / o3-mini / o4-mini / GPT-4o — новейшие модели OpenAI
- Claude Sonnet 4 / 4.5 / Opus 4 / Haiku 4.5 — топовые модели Anthropic четвертого поколения
- Gemini 2.5 Pro / Flash / Flash-Lite — модели Google нового поколения
- Llama 4 Scout / Maverick / Llama 3.3 70B — open-source модели Meta
- DeepSeek V3 / V3.2-Exp / R1 — китайские модели с уникальным стилем
- Qwen3 / Max / 235B-A22B — китайская модель Alibaba нового поколения
- Mistral Large 2 / Medium 3 / Codestral 25 — европейские модели
- GLM-4.5 / 4.6 — китайская модель Zhipu AI
- Grok 3 — модель xAI
- Kimi K2 — модель Moonshot

### 3. JSON Schema for AI

**Файл:** `lib/ai/schemas.ts`

**Обновление функции `getPersonaJsonSchema`:**
```typescript
case 'psychologist':
  return _objectField({
    intro: _stringField(50, 500),
    participants: _arrayField(
      _objectField({
        name: _stringField(),
        model: _enumField([
          'GPT-5 Pro', 'GPT-5-codex', 'o3', 'o3-mini', 'o4-mini', 'GPT-4o',
          'Claude Sonnet 4', 'Claude Sonnet 4.5', 'Claude Opus 4', 'Claude Haiku 4.5',
          'Gemini 2.5 Pro', 'Gemini 2.5 Flash', 'Gemini 2.5 Flash-Lite',
          'Llama 4 Scout', 'Llama 4 Maverick', 'Llama 3.3 70B',
          'DeepSeek V3', 'DeepSeek V3.2-Exp', 'DeepSeek R1',
          'Qwen3', 'Qwen3 Max', 'Qwen3 235B-A22B',
          'Mistral Large 2', 'Mistral Medium 3', 'Codestral 25',
          'GLM-4.5', 'GLM-4.6', 'Grok 3', 'Kimi K2'
        ]),
        confidence: _enumField(['low', 'medium', 'high']),
        reasoning: _stringField(50, 800)
      }, ["name", "model", "confidence", "reasoning"]),
      5, 10
    ),
    summary: _stringField(100, 600, false) // optional field
  }, ["intro", "participants"]); // summary not required
```

### 4. Telegram Formatting

**Файл:** `lib/telegram.ts`

**Обновление функции `formatPersonaReport` для обработки нового формата психолог-отчета:**

```typescript
function formatPersonaReport(report: { date: string; persona?: string; data: any }): string {
  const { date, persona, data } = report;
  const lines: string[] = [
    ..._buildHeader('AI Дайджест', date, `Эксперт: ${getPersonaEmoji(persona)}`)
  ];

  // ... existing personas ...

  if (persona === 'psychologist') {
    // NEW FORMAT: Шуточный AI-детектив
    lines.push(..._buildTextSection('🤖', 'Введение', data.intro));
    
    // Participants with model detection
    if (data.participants?.length > 0) {
      lines.push('🎭 <b>Модельные диагнозы</b>');
      lines.push('');
      
      data.participants.forEach((participant: any, idx: number) => {
        const confidenceEmoji = participant.confidence === 'high' ? '🎯' :
                               participant.confidence === 'medium' ? '🤔' : '❓';
        
        // Format name with mention if starts with @
        const nameFormatted = participant.name.startsWith('@')
          ? `<a href="tg://user?id=${participant.name.substring(1)}">${escapeHTML(participant.name)}</a>`
          : `<b>${escapeHTML(participant.name)}</b>`;
        
        lines.push(`${idx + 1}️⃣ ${nameFormatted}`);
        lines.push(`   <code>${escapeHTML(participant.model)}</code> ${confidenceEmoji}`);
        lines.push(`   <i>${escapeHTML(participant.reasoning)}</i>`);
        lines.push('');
      });
      
      lines.push(..._buildDivider());
    }
    
    if (data.summary) {
      lines.push(..._buildTextSection('📊', 'Общий вывод', data.summary));
    }
  }

  // ... rest of personas ...

  lines.push(..._buildFooter());
  return lines.join('\n');
}
```

**Поддерживаемые HTML-теги в Telegram:**
- `<b>text</b>` — жирный текст (заголовки, имена)
- `<i>text</i>` — курсив (reasoning, даты)
- `<code>text</code>` — моноширинный шрифт (названия моделей)
- `<a href="tg://user?id=username">text</a>` — упоминания пользователей

**Упоминания пользователей:**
- Если имя начинается с `@`, создаем ссылку: `<a href="tg://user?id=username">@username</a>`
- Telegram автоматически создаст уведомление для упомянутого пользователя
- Если имя без `@`, используем просто `<b>Имя</b>` без уведомления

**Важно:** Функция `escapeHTML()` уже существует в `lib/telegram.ts` и обрабатывает специальные символы (`&`, `<`, `>`).

### 5. UI Rendering

**Файл:** `components/multi-style-summary-generator.tsx`

**Обновление функции `renderReportContent` для `psychologist`:**

```typescript
if (persona === 'psychologist') {
  return (
    <>
      {data.intro && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ 
            margin: '0 0 0.75rem 0', 
            color: color,
            fontSize: '1rem',
            fontWeight: '600'
          }}>
            🤖 Введение
          </h4>
          <p style={{ 
            lineHeight: '1.6', 
            margin: 0,
            color: '#374151',
            fontStyle: 'italic'
          }}>
            {data.intro}
          </p>
        </div>
      )}
      
      {data.participants && data.participants.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ 
            margin: '0 0 0.75rem 0', 
            color: color,
            fontSize: '1rem',
            fontWeight: '600'
          }}>
            🎭 Модельные диагнозы
          </h4>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {data.participants.map((participant: {
              name: string, 
              model: string, 
              confidence: string, 
              reasoning: string
            }, index: number) => (
              <div key={`participant-${index}`} style={{ 
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                borderLeft: `4px solid ${color}`
              }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong style={{ color: color, fontSize: '1rem' }}>
                    {participant.name}
                  </strong>
                  <span style={{ 
                    marginLeft: '0.75rem',
                    padding: '0.25rem 0.6rem',
                    backgroundColor: getModelColor(participant.model),
                    color: 'white',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: '600'
                  }}>
                    {participant.model}
                  </span>
                  <span style={{ 
                    marginLeft: '0.5rem',
                    padding: '0.2rem 0.5rem',
                    backgroundColor: participant.confidence === 'high' ? '#10b981' :
                                    participant.confidence === 'medium' ? '#f59e0b' : '#ef4444',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}>
                    {participant.confidence === 'high' ? '🎯 высокая' : 
                     participant.confidence === 'medium' ? '🤔 средняя' : '❓ низкая'}
                  </span>
                </div>
                <div style={{ 
                  fontSize: '0.9rem', 
                  color: '#374151', 
                  lineHeight: '1.5' 
                }}>
                  {participant.reasoning}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {data.summary && (
        <div>
          <h4 style={{ 
            margin: '0 0 0.75rem 0', 
            color: color,
            fontSize: '1rem',
            fontWeight: '600'
          }}>
            📊 Общий вывод
          </h4>
          <p style={{ 
            lineHeight: '1.6', 
            margin: 0,
            color: '#374151'
          }}>
            {data.summary}
          </p>
        </div>
      )}
    </>
  );
}
```

**Вспомогательная функция для цветов моделей:**
```typescript
function getModelColor(model: string): string {
  const colorMap: Record<string, string> = {
    // OpenAI - зелёные оттенки
    'GPT-5 Pro': '#10b981',
    'GPT-5-codex': '#059669',
    'o3': '#047857',
    'o3-mini': '#065f46',
    'o4-mini': '#064e3b',
    'GPT-4o': '#10b981',
    // Anthropic - оранжевые оттенки
    'Claude Sonnet 4': '#f59e0b',
    'Claude Sonnet 4.5': '#d97706',
    'Claude Opus 4': '#b45309',
    'Claude Haiku 4.5': '#92400e',
    // Google - синие оттенки
    'Gemini 2.5 Pro': '#3b82f6',
    'Gemini 2.5 Flash': '#2563eb',
    'Gemini 2.5 Flash-Lite': '#1d4ed8',
    // Meta - фиолетовые оттенки
    'Llama 4 Scout': '#8b5cf6',
    'Llama 4 Maverick': '#7c3aed',
    'Llama 3.3 70B': '#6d28d9',
    // DeepSeek - индиго оттенки
    'DeepSeek V3': '#6366f1',
    'DeepSeek V3.2-Exp': '#4f46e5',
    'DeepSeek R1': '#4338ca',
    // Qwen - голубые оттенки
    'Qwen3': '#06b6d4',
    'Qwen3 Max': '#0891b2',
    'Qwen3 235B-A22B': '#0e7490',
    // Mistral - лаймовые оттенки
    'Mistral Large 2': '#84cc16',
    'Mistral Medium 3': '#65a30d',
    'Codestral 25': '#4d7c0f',
    // Others
    'GLM-4.5': '#ef4444',
    'GLM-4.6': '#dc2626',
    'Grok 3': '#f97316',
    'Kimi K2': '#14b8a6'
  };
  return colorMap[model] || '#64748b';
}
```

## Data Models

### Input Data

Персона получает те же данные, что и сейчас:
- `metrics` — статистика чата (количество сообщений, участников)
- `text` — текст последних сообщений с авторами
- `date` — дата анализа
- `chatId` / `threadId` — фильтры

### Output Data Structure

```typescript
{
  intro: string;              // Вступление (50-500 символов) - plain text
  participants: Array<{
    name: string;             // Имя/никнейм участника (@username или "Иван")
    model: string;            // Название модели из enum
    confidence: string;       // 'low' | 'medium' | 'high'
    reasoning: string;        // Объяснение (50-800 символов) - plain text
  }>;                         // 5-10 участников
  summary?: string;           // Общий вывод (100-600 символов) - plain text - ОПЦИОНАЛЬНОЕ
}
```

**Важно:** AI возвращает plain text, а форматирование в HTML для Telegram происходит на стороне сервера при отправке.

### Example Output (JSON from AI)

```json
{
  "intro": "Ребят, я проанализировал ваши сообщения и у меня есть теория — вы все боты! 🤖 Вот мои предположения о том, какие модели за вами скрываются:",
  "participants": [
    {
      "name": "@ivan_petrov",
      "model": "Claude Sonnet 4.5",
      "confidence": "high",
      "reasoning": "Длинные, структурированные сообщения с четкой логикой. Любит списки и подробные объяснения. Вежливый тон и академический стиль — классический Claude."
    },
    {
      "name": "Мария",
      "model": "GPT-5 Pro",
      "confidence": "medium",
      "reasoning": "Короткие, емкие ответы с эмодзи 😊. Быстро переключается между темами. Иногда слишком оптимистична — похоже на GPT в режиме 'helpful assistant'."
    },
    {
      "name": "@tech_guru",
      "model": "DeepSeek V3",
      "confidence": "high",
      "reasoning": "Технические термины, код-сниппеты, математические формулы. Прямолинейный стиль без лишних слов. Явно китайская модель с фокусом на точность."
    }
  ]
}
```

**Примечание:** Поле `summary` теперь опциональное и может отсутствовать в ответе AI.

### Example Telegram Message (HTML)

```html
🤖 <b>AI Дайджест</b>
📅 <i>17 октября 2025 г.</i>
🔮 <b>Эксперт: 🧠 Психолог сообществ</b>

━━━━━━━━━━━━━━━━━━━━━

🤖 <b>Введение</b>

Ребят, я проанализировал ваши сообщения и у меня есть теория — вы все боты! 🤖 Вот мои предположения о том, какие модели за вами скрываются:

• • • • • • • • • • • • • • • •

🎭 <b>Модельные диагнозы</b>

1️⃣ <a href="tg://user?id=ivan_petrov">@ivan_petrov</a>
   <code>Claude 3.5 Sonnet</code> 🎯
   <i>Длинные, структурированные сообщения с четкой логикой. Любит списки и подробные объяснения. Вежливый тон и академический стиль — классический Claude.</i>

2️⃣ <b>Мария</b>
   <code>GPT-4 Turbo</code> 🤔
   <i>Короткие, емкие ответы с эмодзи 😊. Быстро переключается между темами. Иногда слишком оптимистична — похоже на GPT-4 в режиме 'helpful assistant'.</i>

3️⃣ <a href="tg://user?id=tech_guru">@tech_guru</a>
   <code>DeepSeek V3</code> 🎯
   <i>Технические термины, код-сниппеты, математические формулы. Прямолинейный стиль без лишних слов. Явно китайская модель с фокусом на точность.</i>

• • • • • • • • • • • • • • • •

📊 <b>Общий вывод</b>

В чате доминируют Claude и GPT-4 — классическое сочетание вежливости и оптимизма. DeepSeek добавляет технической глубины. Отличная команда для продуктивных дискуссий! 🚀

• • • • • • • • • • • • • • • •

━━━━━━━━━━━━━━━━━━━━━
🔮 <i>Создано AI-аналитиком</i>
⚡️ <i>15:30</i>
```

## Error Handling

### Validation Errors

1. **Неправильный формат ответа от AI**
   - Zod-схема отклонит невалидный JSON
   - Пользователь увидит: "❌ Не удалось сгенерировать отчет"
   - Логирование ошибки в консоль для debugging

2. **Недостаточно данных для анализа**
   - Если участников < 5, AI должен работать с доступными
   - Минимум 5 участников в схеме, но можно меньше если данных мало

3. **AI вернул неизвестную модель**
   - Enum в схеме отклонит неизвестные значения
   - AI должен выбирать только из предложенного списка

### User Experience

1. **Loading State**
   - Показывается во время генерации: "🤖 Генерирую отчет..."
   - Стандартный UI компонента

2. **Success State**
   - Отображение карточек участников с моделями
   - Цветовая кодировка для визуального различия

3. **Error State**
   - Красная рамка с сообщением об ошибке
   - Кнопка повторной генерации доступна

## Testing Strategy

### Unit Tests (Optional)

Тесты не являются обязательными для этого изменения, но могут быть полезны:

1. **Schema Validation**
   - Проверка что валидный JSON проходит Zod-схему
   - Проверка что невалидный JSON отклоняется

2. **UI Rendering**
   - Snapshot тесты для нового формата
   - Проверка что все поля отображаются корректно

### Manual Testing

**Обязательные проверки:**

1. **Генерация отчета**
   - Нажать кнопку генерации для персоны "Психолог"
   - Проверить что отчет генерируется без ошибок
   - Проверить что все участники отображаются

2. **Формат данных**
   - Проверить что имена участников упоминаются
   - Проверить что модели из списка
   - Проверить что reasoning содержит примеры из сообщений

3. **UI отображение**
   - Проверить цветовую кодировку моделей
   - Проверить badges для confidence
   - Проверить читаемость текста

4. **Telegram интеграция (КРИТИЧНО)**
   - Проверить предпросмотр сообщения в HTML-формате
   - Проверить что HTML-теги корректно отображаются
   - Проверить отправку в Telegram
   - **Проверить что упоминания (@username) создают уведомления**
   - Проверить что `<code>` теги отображают модели моноширинным шрифтом
   - Проверить что `<b>` и `<i>` теги работают корректно
   - Проверить что эмодзи отображаются в Telegram

### Test Scenarios

**Сценарий 1: Стандартный чат с 10+ участниками**
- Ожидание: 5-10 участников в отчете
- Ожидание: Разнообразие моделей
- Ожидание: Конкретные примеры из сообщений

**Сценарий 2: Малоактивный чат с 3-5 участниками**
- Ожидание: Все доступные участники в отчете
- Ожидание: Корректная работа с минимальными данными

**Сценарий 3: Чат с forum topics**
- Ожидание: Фильтрация по thread_id работает
- Ожидание: Анализ только участников темы

## Implementation Notes

### Prompt Engineering Tips

1. **Упоминания участников**
   - Инструкция: "Используй формат @username для участников с никнеймами, или просто имя"
   - Пример в промпте: "@ivan_petrov (если есть username) или Иван Петров (если только имя)"
   - **ВАЖНО:** AI должен использовать `@username` из данных, если он доступен

2. **Лексический анализ**
   - Инструкция: "Анализируй РЕАЛЬНЫЕ сообщения: длину, структуру, лексику, эмодзи, пунктуацию"
   - Пример: "Короткие сообщения с эмодзи = GPT-4, длинные структурированные = Claude, технические с формулами = DeepSeek"
   - Инструкция: "Приводи КОНКРЕТНЫЕ примеры из сообщений участника"

3. **Шуточный тон**
   - Инструкция: "Пиши легко и с юмором, это игра, а не серьезный анализ"
   - Пример: "Ребят, вы все боты! 🤖 Вот мои предположения..."
   - Инструкция: "Используй эмодзи для эмоциональности"

4. **HTML-безопасность**
   - AI возвращает plain text, HTML-форматирование делается на сервере
   - Не нужно экранировать символы в JSON-ответе
   - Функция `escapeHTML()` обработает специальные символы автоматически

### Backward Compatibility

- Старая персона `psychologist` полностью заменяется
- Нет миграции данных (отчеты генерируются on-demand)
- UI компонент обрабатывает только новый формат
- Другие персоны не затронуты

### Performance Considerations

- Размер ответа: ~2-5 KB (меньше чем у ai-psychologist)
- Время генерации: ~10-20 секунд (стандартно для AI)
- Нет дополнительных запросов к БД

## Design Decisions

### Почему именно эти модели?

Выбраны популярные и узнаваемые модели с разными "характерами":
- **GPT-4** — оптимистичный, helpful
- **Claude** — вежливый, структурированный
- **Gemini** — сбалансированный, Google-стиль
- **DeepSeek** — технический, математический
- **Llama** — open-source, прямолинейный
- **Qwen** — китайский стиль
- **Mistral** — европейский подход

### Почему 5-10 участников?

- Меньше 5 — слишком мало для интересного анализа
- Больше 10 — слишком длинный отчет, теряется фокус
- Топ-10 активных участников — самые заметные в чате

### Почему три уровня confidence?

- **Высокая** — явные признаки модели (длина, структура, лексика)
- **Средняя** — некоторые признаки, но не все
- **Низкая** — сложно определить, нужно больше данных

### Почему intro + participants + summary?

- **Intro** — задает шуточный тон, объясняет концепцию
- **Participants** — основной контент, персонализированный
- **Summary** — общий вывод, связывает все вместе

## Migration Path

Нет необходимости в миграции:
1. Отчеты генерируются on-demand
2. Нет сохраненных данных в БД
3. Изменения только в коде

## Future Enhancements

Возможные улучшения в будущем (out of scope):

1. **Больше моделей**
   - Добавить новые модели по мере появления
   - Grok, Command R+, и другие

2. **Визуализация**
   - График распределения моделей в чате
   - Диаграмма "модельной совместимости"

3. **Исторический анализ**
   - Отслеживание изменения "модели" участника со временем
   - "Эволюция стиля письма"

4. **Интерактивность**
   - Кнопка "Угадай мою модель" для самопроверки
   - Голосование участников за правильность диагноза
