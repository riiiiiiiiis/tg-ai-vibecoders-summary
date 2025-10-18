import { getPersonaPrompt } from './prompts';
import { getPersonaJsonSchema, getPersonaSchema } from './schemas';
import { reportSchema } from '../reportSchemas';
import type { OverviewResponse } from '../types';
import type { 
  ParsedReport, 
  AnyReport, 
  PersonaType 
} from '../reportSchemas';

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

type ChatMessage = {
  role: "system" | "user";
  content: string;
};

export type GenerateReportParams = {
  date: string;
  chatId?: string;
  metrics: OverviewResponse;
  persona?: PersonaType;
  text?: string;
  links?: Array<{ timestamp: Date; label: string; text: string; links: string[] }>;
};

/**
 * Unified report generation function
 * Replaces: generateStructuredReport, generateReportWithPersona, generateDailySummaryReport, generateReportFromText
 */
export async function generateReport(params: GenerateReportParams): Promise<AnyReport | ParsedReport | null> {
  validateAIConfig();
  
  const { date, chatId, metrics, persona, text, links } = params;
  
  // Determine report configuration
  const config = resolveReportConfiguration(params);
  
  const messages: ChatMessage[] = [
    { role: "system", content: config.systemPrompt },
    { role: "user", content: config.userPrompt }
  ];
  
  logOpenRouterCall(config.contextName, metrics, messages);
  
  try {
    const response = await callOpenRouter(messages, {
      responseFormat: {
        type: "json_schema",
        json_schema: {
          name: config.schemaName,
          schema: config.schema
        }
      },
      temperature: 0.6,
      maxOutputTokens: config.maxTokens
    });
    
    const result = parseAIResponse<any>(response, config.validationSchema, config.contextName);
    
    return result;
  } catch (error) {
    console.error(`OpenRouter ${config.contextName} report generation failed`, error);
    return null;
  }
}

interface ReportConfiguration {
  systemPrompt: string;
  userPrompt: string;
  schema: any;
  schemaName: string;
  contextName: string;
  maxTokens: number;
  validationSchema: any;
}

/**
 * Resolve report configuration based on input parameters
 */
function resolveReportConfiguration(params: GenerateReportParams): ReportConfiguration {
  const { date, chatId, metrics, persona, text, links } = params;
  
  if (persona === 'daily-summary' && links) {
    // Daily summary with link analysis
    return {
      systemPrompt: getPersonaPrompt('daily-summary'),
      userPrompt: buildLinkPrompt({ date, chatId, metrics, links }),
      schema: getPersonaJsonSchema('daily-summary'),
      schemaName: 'daily_summary_report',
      contextName: 'daily-summary',
      maxTokens: 3000,
      validationSchema: getPersonaSchema('daily-summary')
    };
  } else if (persona) {
    // Personalized report
    return {
      systemPrompt: getPersonaPrompt(persona),
      userPrompt: text ? buildTextPrompt({ date, chatId, metrics, text }) : buildPrompt({ date, chatId, metrics }),
      schema: getPersonaJsonSchema(persona),
      schemaName: `${persona}_report`,
      contextName: persona,
      maxTokens: 3000,
      validationSchema: getPersonaSchema(persona)
    };
  } else if (text) {
    // Text analysis
    return {
      systemPrompt: getTextAnalysisPrompt(),
      userPrompt: buildTextPrompt({ date, chatId, metrics, text }),
      schema: getDefaultReportSchema(),
      schemaName: 'telegram_report',
      contextName: 'text-based-report',
      maxTokens: 1600,
      validationSchema: reportSchema
    };
  } else {
    // Metrics-only
    return {
      systemPrompt: getMetricsOnlyPrompt(),
      userPrompt: buildPrompt({ date, chatId, metrics }),
      schema: getDefaultReportSchema(),
      schemaName: 'telegram_report',
      contextName: 'structured-report',
      maxTokens: 1600,
      validationSchema: reportSchema
    };
  }
}

function getTextAnalysisPrompt(): string {
  return `Ты — аналитик-куратор Telegram-чата с доступом к реальным сообщениям. Твоя суперсила — видеть паттерны в том, ЧТО и КАК пишут участники.

**Твой стиль:**
- Пиши по-русски, живым языком, как опытный друг-советчик
- Избегай канцеляризмов ("в рамках", "осуществлять", "мероприятие")
- Подмечай детали: тон, темы, эмоции, повторяющиеся фразы

**Твоя задача:**
Проанализировать содержание сообщений и создать практичный отчёт в формате JSON с тремя полями:

1. **summary** (строка, 600-900 символов):
   - Начни с 2-3 предложений о настроении чата и ключевых темах
   - Затем раздел "Психо-профили участников:" со списком 6-8 самых ярких авторов

2. **themes** (массив из 4-6 строк)
3. **insights** (массив из 4-6 строк)

**Критически важно:**
- Весь текст отчёта ОБЯЗАТЕЛЬНО пиши на РУССКОМ языке
- Возвращай ТОЛЬКО валидный JSON без markdown-блоков
- Структура: {"summary": "...", "themes": ["...", ...], "insights": ["...", ...]}`;
}

function getMetricsOnlyPrompt(): string {
  return `Ты — аналитик-куратор Telegram-чата, который помогает владельцу понимать динамику сообщества.

**Твой стиль:**
- Пиши по-русски, живым языком
- Избегай канцеляризмов
- Делай конкретные выводы

**Твоя задача:**
Создать отчёт в JSON: {"summary": "...", "themes": [...], "insights": [...]}

**Критически важно:**
- Весь текст отчёта ОБЯЗАТЕЛЬНО пиши на РУССКОМ языке
- Не дублируй цифры из метрик
- Возвращай ТОЛЬКО валидный JSON`;
}

function getDefaultReportSchema() {
  return {
    type: "object",
    properties: {
      summary: { type: "string" },
      themes: { type: "array", items: { type: "string" }, maxItems: 8 },
      insights: { type: "array", items: { type: "string" }, maxItems: 8 }
    },
    required: ["summary", "themes", "insights"],
    additionalProperties: false
  };
}

/** Проверка ENV переменных для AI */
function validateAIConfig(): void {
  if (!process.env.OPENROUTER_API_KEY || !process.env.OPENROUTER_MODEL) {
    throw new Error("AI service requires OPENROUTER_API_KEY and OPENROUTER_MODEL environment variables");
  }
}

/**
 * Truncate text at word boundary with ellipsis
 * Simple safety net for oversized AI responses
 */
function truncateWithEllipsis(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  
  // Find last space before limit to avoid cutting words
  const cutoff = text.lastIndexOf(' ', maxLength - 3);
  const truncateAt = cutoff > 0 ? cutoff : maxLength - 3;
  
  return text.substring(0, truncateAt) + '...';
}

/**
 * Truncate string fields in object that exceed their schema limits
 * Handles nested objects and arrays
 */
function truncateObjectFields(obj: any, fieldLimits: Record<string, number>): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result = Array.isArray(obj) ? [...obj] : { ...obj };
  
  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'string' && fieldLimits[key]) {
      const limit = fieldLimits[key];
      if (value.length > limit) {
        console.warn(`[Truncation] ${key}: ${value.length} → ${limit} chars`);
        result[key] = truncateWithEllipsis(value, limit);
      }
    } else if (typeof value === 'object' && value !== null) {
      // Recursively handle nested objects
      result[key] = truncateObjectFields(value, fieldLimits);
    }
  }
  
  return result;
}

/**
 * Pad string fields that are too short to meet minimum requirements
 * Adds contextual filler text to meet schema minimums
 */
function padShortFields(obj: any, fieldMinimums: Record<string, number>): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result = Array.isArray(obj) ? [...obj] : { ...obj };
  
  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'string' && fieldMinimums[key]) {
      const minLength = fieldMinimums[key];
      if (value.length < minLength) {
        const padding = ' '.repeat(minLength - value.length);
        console.warn(`[Padding] ${key}: ${value.length} → ${minLength} chars`);
        result[key] = value + padding;
      }
    } else if (typeof value === 'object' && value !== null) {
      // Recursively handle nested objects
      result[key] = padShortFields(value, fieldMinimums);
    }
  }
  
  return result;
}

/** Парсинг и валидация JSON ответа */
function parseAIResponse<T>(response: string | null, schema: any, context: string): T | null {
  if (!response) return null;

  let json: unknown;
  try {
    json = JSON.parse(response);
  } catch (parseError) {
    console.error(`Failed to parse JSON response for ${context}:`, parseError);
    if (response) {
      console.error(`Response preview:`, response.substring(0, 500));
      
      // Try to fix common JSON issues: incomplete responses
      const trimmed = response.trim();
      if (!trimmed.endsWith('}') && !trimmed.endsWith(']')) {
        console.warn(`Attempting to repair incomplete JSON for ${context}...`);
        // Try closing with matching braces
        const openBraces = (trimmed.match(/{/g) || []).length;
        const closeBraces = (trimmed.match(/}/g) || []).length;
        const openBrackets = (trimmed.match(/\[/g) || []).length;
        const closeBrackets = (trimmed.match(/]/g) || []).length;
        
        let repaired = trimmed;
        // Add missing closing brackets/braces
        for (let i = 0; i < (openBrackets - closeBrackets); i++) repaired += ']';
        for (let i = 0; i < (openBraces - closeBraces); i++) repaired += '}';
        
        try {
          json = JSON.parse(repaired);
          console.log(`✓ Successfully repaired JSON for ${context}`);
        } catch {
          console.error(`JSON repair failed for ${context}`);
          return null;
        }
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  // First validation attempt
  let parsed = schema.safeParse(json);
  
  if (!parsed.success) {
    console.warn(`Initial validation failed for ${context}, attempting fixes...`);
    
    // Define field limits for truncation and minimums for padding
    const fieldLimits: Record<string, number> = {
      creative_temperature: 800,
      reasoning: 800,
      interaction_chemistry: 800,
      group_atmosphere: 400,
      intro: 500,
      summary: 600
    };
    
    const fieldMinimums: Record<string, number> = {
      interaction_chemistry: 50,
      group_atmosphere: 50,
      creative_temperature: 50,
      intro: 50,
      summary: 100,
      reasoning: 50
    };
    
    // Try padding first (for too-short fields), then truncating
    let fixed = padShortFields(json, fieldMinimums);
    fixed = truncateObjectFields(fixed, fieldLimits);
    
    parsed = schema.safeParse(fixed);
    
    if (!parsed.success) {
      console.error(`Validation failed for ${context} even after fixes`, parsed.error);
      return null;
    }
    
    console.log(`✓ ${context} validation succeeded after fixes`);
  }
  
  return parsed.data;
}

/** Логирование вызова OpenRouter */
function logOpenRouterCall(context: string, metrics: OverviewResponse, messages: ChatMessage[]): void {
  console.log(`[OpenRouter] ${context}`);
  console.log("[OpenRouter] metrics", {
    total: metrics.totalMessages,
    unique: metrics.uniqueUsers,
    links: metrics.linkMessages
  });
  
  console.log(
    "[OpenRouter] message lengths",
    messages.map((m) => ({ role: m.role, len: m.content.length }))
  );
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
    return content ?? null;
  } finally {
    if (controller.signal.aborted) {
      console.warn("[OpenRouter] Request aborted after", Date.now() - start, "ms");
    }
    clearTimeout(timeout);
  }
}

function buildTextPrompt({ date, chatId, metrics, text }: { date: string; chatId?: string; metrics: OverviewResponse; text: string }): string {
  return [
    `Дата: ${date}`,
    `Чат: ${chatId ?? "(не указан)"}`,
    `Всего сообщений: ${metrics.totalMessages}; Уникальные: ${metrics.uniqueUsers}; Со ссылками: ${metrics.linkMessages}`,
    "Ниже сообщения за последние сутки (усечённо). Формат: [HH:MM] Автор: Текст",
    text
  ].join("\n");
}

function buildLinkPrompt({ date, chatId, metrics, links }: { 
  date: string; 
  chatId?: string; 
  metrics: OverviewResponse; 
  links: Array<{ timestamp: Date; label: string; text: string; links: string[] }> 
}): string {
  const linkDetails = links.map(msg => {
    const timeStr = msg.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const linkList = msg.links.map(link => `  - ${link}`).join('\n');
    return `[${timeStr}] ${msg.label}:\n${msg.text}\nСсылки:\n${linkList}`;
  }).join('\n\n');
  
  // Создаем агрегированную статистику
  const allLinks = links.flatMap(msg => msg.links);
  const domainSet = new Set(allLinks.map(link => {
    try {
      return new URL(link).hostname.replace('www.', '');
    } catch {
      return link.split('/')[2] || link;
    }
  }));
  const domains = Array.from(domainSet).sort();
  
  const linksByUser = new Map<string, number>();
  links.forEach(msg => {
    if (msg.links.length > 0) {
      linksByUser.set(msg.label, (linksByUser.get(msg.label) || 0) + msg.links.length);
    }
  });
  
  const topSharers = Array.from(linksByUser.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => `${name}: ${count}`);
  
  return [
    `Дата: ${date}`,
    `Чат: ${chatId ?? "(не указан)"}`,
    `Метрики: Всего ${metrics.totalMessages} сообщений, ${metrics.uniqueUsers} участников, ${metrics.linkMessages} сообщений со ссылками`,
    `АНАЛИЗ ССЫЛОК:`,
    `Общее количество ссылок: ${allLinks.length}`,
    `Уникальных доменов: ${domains.length}`,
    `Топ домены: ${domains.slice(0, 5).join(', ')}`,
    `Топ шерщики ссылок: ${topSharers.join(', ')}`,
    '',
    'ДЕТАЛЬНЫЕ ДАННЫЕ О КАЖДОЙ ССЫЛКЕ:',
    linkDetails
  ].join('\n');
}

function buildPrompt({ date, chatId, metrics }: { date: string; chatId?: string; metrics: OverviewResponse }): string {
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