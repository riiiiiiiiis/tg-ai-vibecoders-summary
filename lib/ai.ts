import { reportSchema, type ParsedReport } from "./reportSchemas";
import type { OverviewResponse } from "./types";

const VERBOSE = process.env.LLM_DEBUG_VERBOSE === "1";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

type ChatMessage = {
  role: "system" | "user";
  content: string;
};

type ReportArgs = {
  date: string;
  chatId?: string;
  metrics: OverviewResponse;
};

export async function generateStructuredReport({ date, chatId, metrics }: ReportArgs): Promise<ParsedReport | null> {
  if (!process.env.OPENROUTER_API_KEY || !process.env.OPENROUTER_MODEL) {
    throw new Error("AI service requires OPENROUTER_API_KEY and OPENROUTER_MODEL environment variables");
  }

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `Ты — аналитик-куратор Telegram-чата, который помогает владельцу понимать динамику сообщества и находить точки роста.

**Твой стиль:**
- Пиши по-русски, живым языком, как опытный друг-советчик
- Избегай канцеляризмов ("в рамках", "осуществлять", "мероприятие")
- Делай конкретные выводы, а не пересказывай цифры

**Твоя задача:**
Проанализировать метрики активности и создать практичный отчёт в формате JSON с тремя полями:

1. **summary** (строка, 600-900 символов):
   - Начни с 2-3 предложений о ключевой динамике (рост/спад, кто тянет чат, что выделяется)
   - Затем раздел "Психо-профили участников:" со списком 5-7 самых показательных авторов в формате:
     "• Имя: роль в чате (примеры: лидер мнений / генератор контента / тихий наблюдатель / провокатор дискуссий / связующее звено), краткая характеристика поведения"
   - Выбирай для профилей топ-активистов + тех, кто показывает интересные паттерны (резкие всплески, стабильность, контраст с другими)

2. **themes** (массив из 3-5 строк):
   - Каждая тема = конкретная идея поста/обсуждения/активности
   - Формат: "Название темы: что именно сделать и почему это зайдёт участникам"
   - Основывай на поведении топ-участников: если кто-то активен в определённое время → предложи формат под это время
   - Избегай общих фраз типа "обсудить интересы" — будь специфичен

3. **insights** (массив из 3-5 строк):
   - Каждый инсайт = одна конкретная рекомендация с обоснованием
   - Формат: "Что сделать: почему это сработает на основе данных"
   - Фокусируйся на форматах (опросы, челленджи, регулярные рубрики), времени постинга, вовлечении молчунов

**Критически важно:**
- Не дублируй цифры из метрик — интерпретируй их
- Возвращай ТОЛЬКО валидный JSON без markdown-блоков, без дополнительного текста
- Укладывайся в структуру: {"summary": "...", "themes": ["...", ...], "insights": ["...", ...]}`
    },
    {
      role: "user",
      content: buildPrompt({ date, chatId, metrics })
    }
  ];

  console.log("[OpenRouter] mode", "metrics-only");
  console.log("[OpenRouter] metrics", {
    total: metrics.totalMessages,
    unique: metrics.uniqueUsers,
    links: metrics.linkMessages
  });
  if (VERBOSE) console.log("[OpenRouter] messages", messages);
  else console.log(
    "[OpenRouter] message lengths",
    messages.map((m) => ({ role: m.role, len: m.content.length }))
  );

  try {
    const response = await callOpenRouter(messages, {
      responseFormat: {
        type: "json_schema",
        json_schema: {
          name: "telegram_report",
          schema: {
            type: "object",
            properties: {
              summary: { type: "string" },
              themes: { type: "array", items: { type: "string" }, maxItems: 8 },
              insights: { type: "array", items: { type: "string" }, maxItems: 8 }
            },
            required: ["summary", "themes", "insights"],
            additionalProperties: false
          }
        }
      },
      temperature: 0.6,
      maxOutputTokens: 1600
    });

    if (!response) return null;

    let json: unknown;
    try {
      json = JSON.parse(response);
    } catch (parseError) {
      console.error("Failed to parse JSON from OpenRouter", parseError);
      return null;
    }

    const parsed = reportSchema.safeParse(json);
    if (!parsed.success) {
      console.error("Failed to parse OpenRouter response", parsed.error);
      return null;
    }
    return parsed.data;
  } catch (error) {
    console.error("OpenRouter report generation failed", error);
    return null;
  }
}

export async function generateReportFromText({
  date,
  chatId,
  metrics,
  text
}: {
  date: string;
  chatId?: string;
  metrics: OverviewResponse;
  text: string;
}): Promise<ParsedReport | null> {
  if (!process.env.OPENROUTER_API_KEY || !process.env.OPENROUTER_MODEL) {
    throw new Error("AI service requires OPENROUTER_API_KEY and OPENROUTER_MODEL environment variables");
  }

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `Ты — аналитик-куратор Telegram-чата с доступом к реальным сообщениям. Твоя суперсила — видеть паттерны в том, ЧТО и КАК пишут участники.

**Твой стиль:**
- Пиши по-русски, живым языком, как опытный друг-советчик
- Избегай канцеляризмов ("в рамках", "осуществлять", "мероприятие")
- Подмечай детали: тон, темы, эмоции, повторяющиеся фразы

**Твоя задача:**
Проанализировать содержание сообщений и создать практичный отчёт в формате JSON с тремя полями:

1. **summary** (строка, 600-900 символов):
   - Начни с 2-3 предложений о настроении чата и ключевых темах, которые всплывали
   - Затем раздел "Психо-профили участников:" со списком 6-8 самых ярких авторов в формате:
     "• Имя: роль + тон (примеры: мотиватор с юмором / критик-скептик / генератор мемов / философ-размышлятель / решала проблем), что характерно для его сообщений"
   - Используй реальные сообщения для выводов: упоминай паттерны (частые вопросы, шутки, советы, споры)
   - Выбирай для профилей не только самых активных, но и тех, кто задаёт тон или создаёт уникальный контент

2. **themes** (массив из 4-6 строк):
   - Каждая тема = конкретная идея контента, основанная на реальных интересах из переписки
   - Формат: "Название темы: что именно предложить участникам и на какой запрос/тренд в чате это отвечает"
   - Цепляйся за упоминаемые слова, вопросы, споры — предлагай развить это в формат
   - Избегай общих фраз — если видишь тему, называй её прямо

3. **insights** (массив из 4-6 строк):
   - Каждый инсайт = рекомендация, основанная на поведенческих паттернах в сообщениях
   - Формат: "Что сделать: почему это сработает (ссылайся на тон/темы/роли участников)"
   - Предлагай форматы под конкретных людей: "Если X часто задаёт вопросы → запусти рубрику Q&A"
   - Подмечай пробелы: какие темы участники начинают, но не доводят до конца

**Критически важно:**
- Используй преимущество доступа к текстам — делай выводы на основе содержания, а не только цифр
- Не пересказывай сообщения — анализируй паттерны
- Возвращай ТОЛЬКО валидный JSON без markdown-блоков, без дополнительного текста
- Укладывайся в структуру: {"summary": "...", "themes": ["...", ...], "insights": ["...", ...]}`
    },
    {
      role: "user",
      content: [
        `Дата: ${date}`,
        `Чат: ${chatId ?? "(не указан)"}`,
        `Всего сообщений: ${metrics.totalMessages}; Уникальные: ${metrics.uniqueUsers}; Со ссылками: ${metrics.linkMessages}`,
        "Ниже сообщения за последние сутки (усечённо). Формат: [HH:MM] Автор: Текст",
        text
      ].join("\n")
    }
  ];

  console.log("[OpenRouter] mode", "text-based");
  console.log("[OpenRouter] metrics", {
    total: metrics.totalMessages,
    unique: metrics.uniqueUsers,
    links: metrics.linkMessages
  });
  if (VERBOSE) console.log("[OpenRouter] messages", messages);
  else console.log(
    "[OpenRouter] message lengths",
    messages.map((m) => ({ role: m.role, len: m.content.length }))
  );

  try {
    const raw = await callOpenRouter(messages, {
      responseFormat: {
        type: "json_schema",
        json_schema: {
          name: "telegram_report",
          schema: {
            type: "object",
            properties: {
              summary: { type: "string" },
              themes: { type: "array", items: { type: "string" }, maxItems: 8 },
              insights: { type: "array", items: { type: "string" }, maxItems: 8 }
            },
            required: ["summary", "themes", "insights"],
            additionalProperties: false
          }
        }
      },
      temperature: 0.6,
      maxOutputTokens: 1600
    });
    if (!raw) return null;
    const json = JSON.parse(raw);
    const parsed = reportSchema.safeParse(json);
    if (!parsed.success) {
      console.error("Failed to parse OpenRouter text-based response", parsed.error);
      return null;
    }
    return parsed.data;
  } catch (error) {
    console.error("OpenRouter report-from-text generation failed", error);
    return null;
  }
}

async function callOpenRouter(
  messages: ChatMessage[],
  options?: {
    temperature?: number;
    responseFormat?: Record<string, unknown>;
    maxOutputTokens?: number;
  }
): Promise<string | null> {
  const controller = new AbortController();
  const timeoutMs = Number(process.env.OPENROUTER_TIMEOUT_MS ?? 20000);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const requestPayload = {
    model: process.env.OPENROUTER_MODEL,
    temperature: options?.temperature ?? 0.3,
    response_format: options?.responseFormat,
    messages,
    max_tokens: options?.maxOutputTokens
  };
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "HTTP-Referer": "https://telegram-dashboard.local",
    "X-Title": "Telegram Dashboard"
  } as const;
  const bodyStr = JSON.stringify(requestPayload);
  console.log("[OpenRouter] Request", {
    endpoint: OPENROUTER_ENDPOINT,
    model: requestPayload.model,
    temperature: requestPayload.temperature,
    messageRoles: messages.map((message) => message.role),
    timeoutMs,
    bodySizeBytes: bodyStr.length
  });
  if (VERBOSE)
    console.log("[OpenRouter] Request headers", {
      ...headers,
      Authorization: "Bearer ***"
    });
  if (VERBOSE) console.log("[OpenRouter] Request body", requestPayload);
  const start = Date.now();

  try {
    const res = await fetch(OPENROUTER_ENDPOINT, {
      method: "POST",
      headers,
      body: bodyStr,
      signal: controller.signal
    });
    const durationMs = Date.now() - start;
    console.log("[OpenRouter] Response", {
      status: res.status,
      ok: res.ok,
      durationMs
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("OpenRouter error", errorText);
      return null;
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (VERBOSE) console.log("[OpenRouter] Raw content", content ?? null);
    return content ?? null;
  } finally {
    if (controller.signal.aborted) {
      console.warn("[OpenRouter] Request aborted after", Date.now() - start, "ms");
    }
    clearTimeout(timeout);
  }
}

function buildPrompt({ date, chatId, metrics }: ReportArgs): string {
  // Calculate percentages and additional context
  const totalUserMessages = metrics.topUsers.reduce((sum, u) => sum + u.messageCount, 0);
  const top3Share = metrics.topUsers.slice(0, 3).reduce((sum, u) => sum + u.messageCount, 0);
  const concentrationNote = top3Share / metrics.totalMessages > 0.5
    ? '\n⚠️ Замечание: более 50% сообщений от топ-3 участников — высокая концентрация активности'
    : '';

  // Format user list with percentages
  const userList = metrics.topUsers
    .map((user, idx) => {
      const percentage = ((user.messageCount / metrics.totalMessages) * 100).toFixed(1);
      return `${idx + 1}. ${user.displayName} — ${user.messageCount} сообщений (${percentage}% от общего объёма)`;
    })
    .join('\n');

  // Timeline summary (show peaks)
  const timelineSummary = metrics.series.length > 5
    ? `\nДинамика по времени (показаны ключевые точки):\n${
        [...metrics.series]
          .sort((a, b) => b.messageCount - a.messageCount)
          .slice(0, 5)
          .map(t => `  ${t.timestamp}: ${t.messageCount} сообщений`)
          .join('\n')
      }\n(Всего замеров: ${metrics.series.length})`
    : `\nДинамика по времени:\n${metrics.series.map(t => `  ${t.timestamp}: ${t.messageCount}`).join('\n')}`;

  return `**Данные для анализа:**

Дата анализа: ${date}
Чат ID: ${chatId ?? '(не указан)'}

Общая статистика:
• Всего сообщений: ${metrics.totalMessages}
• Уникальных участников: ${metrics.uniqueUsers}
• Средняя активность на участника: ${(metrics.totalMessages / metrics.uniqueUsers).toFixed(1)} сообщений
• Сообщений со ссылками: ${metrics.linkMessages} (${((metrics.linkMessages / metrics.totalMessages) * 100).toFixed(1)}%)

Топ-10 участников по активности:
${userList}${concentrationNote}
${timelineSummary}

---

**Задание:**

**У тебя есть метрики активности** — интерпретируй паттерны:
- Кто стабильно активен, кто даёт всплески, кто молчит
- Есть ли корреляция между временем и активностью
- Какие участники могут быть лидерами мнений по объёму вклада
- Для психо-профилей используй поведенческие паттерны (частота, время, соотношение с другими)

Создай отчёт для владельца чата по структуре:

**summary** (600-900 символов):
1. Открывающий абзац (2-3 предложения): ключевая динамика чата — что происходило, какое настроение, кто задавал тон
2. Раздел "Психо-профили участников:" — выбери 5-7 самых показательных авторов из топ-10:
   - Обязательно включи топ-3 по активности
   - Из оставшихся выбери тех, кто показывает интересные паттерны или контрастирует с лидерами
   - Формат каждого профиля: "• Имя: роль/тон, краткая характеристика"
   - Роли могут быть: лидер мнений, генератор контента, связующее звено, тихий наблюдатель, провокатор дискуссий, мотиватор, критик, решала проблем и т.п.

**themes** (3-5 элементов массива):
- Каждая строка = конкретная тема для поста/обсуждения/активности
- НЕ пиши общие фразы ("обсудить хобби") — будь специфичен ("Челлендж 'Книга недели': каждый участник делится одной книгой и почему она зашла")
- Объясняй, почему эта тема зайдёт ЭТИМ участникам на основе данных

**insights** (3-5 элементов массива):
- Каждая строка = одна конкретная рекомендация действия
- Формат: "Что сделать: почему это сработает"
- Фокус на форматах (опросы, регулярные рубрики, игры), времени, балансе активности

**Критически важно:**
- Возвращай ТОЛЬКО валидный JSON: {"summary": "...", "themes": [...], "insights": [...]}
- Не добавляй markdown-блоки (\`\`\`json), не пиши текст до или после JSON
- НЕ пересказывай метрики ("всего было X сообщений") — делай выводы на их основе
- Психо-профили должны быть сжатыми (1 строка на человека), но содержательными
- Темы и инсайты должны быть практичными и сразу применимыми`;
}
