import { reportSchema, businessReportSchema, psychologyReportSchema, creativeReportSchema, dailySummaryReportSchema, aiPsychologistReportSchema, type ParsedReport, type BusinessReport, type PsychologyReport, type CreativeReport, type DailySummaryReport, type AiPsychologistReport, type AnyReport } from "./reportSchemas";
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

// ============== UNIFIED REPORT GENERATION ==============

type GenerateReportParams = {
  date: string;
  chatId?: string;
  metrics: OverviewResponse;
  persona?: PersonaType;
  text?: string;
  links?: Array<{ timestamp: Date; label: string; text: string; links: string[] }>;
};

/**
 * Универсальная функция генерации отчётов
 * Заменяет: generateStructuredReport, generateReportWithPersona, generateDailySummaryReport, generateReportFromText
 */
export async function generateReport(params: GenerateReportParams): Promise<AnyReport | ParsedReport | null> {
  validateAIConfig();
  
  const { date, chatId, metrics, persona, text, links } = params;
  
  // Определяем тип отчёта и строим prompt
  let systemPrompt: string;
  let userPrompt: string;
  let schema: any;
  let schemaName: string;
  let contextName: string;
  let maxTokens = 1600;
  
  if (persona === 'daily-summary' && links) {
    // Daily summary с анализом ссылок
    systemPrompt = getPersonaPrompt('daily-summary');
    userPrompt = buildLinkPrompt({ date, chatId, metrics, links });
    schema = getPersonaJsonSchema('daily-summary');
    schemaName = 'daily_summary_report';
    contextName = 'daily-summary';
    maxTokens = 3000;
    console.log(`[OpenRouter] daily-summary with links, mode: link-based, linksWithData: ${links.length}`);
  } else if (persona) {
    // Персонализированный отчёт
    systemPrompt = getPersonaPrompt(persona);
    userPrompt = text ? buildTextPrompt({ date, chatId, metrics, text }) : buildPrompt({ date, chatId, metrics });
    schema = getPersonaJsonSchema(persona);
    schemaName = `${persona}_report`;
    contextName = persona;
    maxTokens = 3000;
  } else if (text) {
    // Текстовый анализ
    systemPrompt = `Ты — аналитик-куратор Telegram-чата с доступом к реальным сообщениям. Твоя суперсила — видеть паттерны в том, ЧТО и КАК пишут участники.

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
- Возвращай ТОЛЬКО валидный JSON без markdown-блоков
- Структура: {"summary": "...", "themes": ["...", ...], "insights": ["...", ...]}`;
    userPrompt = buildTextPrompt({ date, chatId, metrics, text });
    schema = {
      type: "object",
      properties: {
        summary: { type: "string" },
        themes: { type: "array", items: { type: "string" }, maxItems: 8 },
        insights: { type: "array", items: { type: "string" }, maxItems: 8 }
      },
      required: ["summary", "themes", "insights"],
      additionalProperties: false
    };
    schemaName = 'telegram_report';
    contextName = 'text-based-report';
  } else {
    // Метрики-only
    systemPrompt = `Ты — аналитик-куратор Telegram-чата, который помогает владельцу понимать динамику сообщества.

**Твой стиль:**
- Пиши по-русски, живым языком
- Избегай канцеляризмов
- Делай конкретные выводы

**Твоя задача:**
Создать отчёт в JSON: {"summary": "...", "themes": [...], "insights": [...]}

**Критически важно:**
- Не дублируй цифры из метрик
- Возвращай ТОЛЬКО валидный JSON`;
    userPrompt = buildPrompt({ date, chatId, metrics });
    schema = {
      type: "object",
      properties: {
        summary: { type: "string" },
        themes: { type: "array", items: { type: "string" }, maxItems: 8 },
        insights: { type: "array", items: { type: "string" }, maxItems: 8 }
      },
      required: ["summary", "themes", "insights"],
      additionalProperties: false
    };
    schemaName = 'telegram_report';
    contextName = 'structured-report';
  }
  
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ];
  
  _logOpenRouterCall(contextName, metrics, messages);
  
  try {
    const response = await callOpenRouter(messages, {
      responseFormat: {
        type: "json_schema",
        json_schema: {
          name: schemaName,
          schema: schema
        }
      },
      temperature: 0.6,
      maxOutputTokens: maxTokens
    });
    
    const validationSchema = persona ? getPersonaSchema(persona) : reportSchema;
    const result = _parseAIResponse<any>(response, validationSchema, contextName);
    
    // Sanitize creative persona if needed
    if (persona === 'creative' && result && typeof result === 'object') {
      const creativeResult = result as any;
      if (creativeResult.creative_temperature && typeof creativeResult.creative_temperature === 'string' && creativeResult.creative_temperature.length > 300) {
        console.warn(`[${persona}] Truncating creative_temperature from ${creativeResult.creative_temperature.length} to 300 characters`);
        creativeResult.creative_temperature = creativeResult.creative_temperature.substring(0, 297) + '...';
      }
    }
    
    return result;
  } catch (error) {
    console.error(`OpenRouter ${contextName} report generation failed`, error);
    return null;
  }
}

// ============== HELPER FUNCTIONS ==============

/** Проверка ENV переменных для AI */
function validateAIConfig(): void {
  if (!process.env.OPENROUTER_API_KEY || !process.env.OPENROUTER_MODEL) {
    throw new Error("AI service requires OPENROUTER_API_KEY and OPENROUTER_MODEL environment variables");
  }
}

/** Парсинг и валидация JSON ответа */
function _parseAIResponse<T>(response: string | null, schema: any, context: string): T | null {
  if (!response) return null;

  let json: unknown;
  try {
    json = JSON.parse(response);
  } catch (parseError) {
    console.error(`Failed to parse JSON response for ${context}:`, parseError);
    if (response) console.error(`Response preview:`, response.substring(0, 500));
    return null;
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    console.error(`Failed to validate ${context} response`, parsed.error);
    return null;
  }
  
  return parsed.data;
}

/** Логирование вызова OpenRouter */
function _logOpenRouterCall(context: string, metrics: OverviewResponse, messages: ChatMessage[]): void {
  console.log(`[OpenRouter] ${context}`);
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
}

// ============== DEPRECATED WRAPPERS (для обратной совместимости) ==============

/**
 * @deprecated Используйте generateReport() вместо этой функции
 */
export async function generateStructuredReport({ date, chatId, metrics }: ReportArgs): Promise<ParsedReport | null> {
  return generateReport({ date, chatId, metrics }) as Promise<ParsedReport | null>;
}

/**
 * @deprecated Используйте generateReport() вместо этой функции
 */
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
  return generateReport({ date, chatId, metrics, text }) as Promise<ParsedReport | null>;
}

/**
 * @deprecated - LEGACY FUNCTION - DO NOT USE
 * Используйте generateReport() вместо этой функции
 * Оставлена только для обратной совместимости - будет удалена
 */
export async function generateStructuredReport_OLD({ date, chatId, metrics }: ReportArgs): Promise<ParsedReport | null> {
  validateAIConfig();

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

  _logOpenRouterCall("mode: metrics-only", metrics, messages);

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

    return _parseAIResponse<ParsedReport>(response, reportSchema, "structured-report");
  } catch (error) {
    console.error("OpenRouter report generation failed", error);
    return null;
  }
}

export type PersonaType = 'curator' | 'business' | 'psychologist' | 'ai-psychologist' | 'creative' | 'twitter' | 'reddit' | 'daily-summary';

/**
 * @deprecated Используйте generateReport() вместо этой функции
 */
export async function generateReportWithPersona({
  date,
  chatId,
  metrics,
  text,
  persona = 'curator'
}: {
  date: string;
  chatId?: string;
  metrics: OverviewResponse;
  text?: string;
  persona?: PersonaType;
}): Promise<AnyReport | null> {
  return generateReport({ date, chatId, metrics, text, persona });
}

function getPersonaSchema(persona: PersonaType) {
  switch (persona) {
    case 'business':
      return businessReportSchema;
    case 'psychologist':
      return psychologyReportSchema;
    case 'ai-psychologist':
      return aiPsychologistReportSchema;
    case 'creative':
      return creativeReportSchema;
    case 'daily-summary':
      return dailySummaryReportSchema;
    case 'curator':
    case 'twitter':
    case 'reddit':
    default:
      return reportSchema;
  }
}

// ========================================
// JSON SCHEMA HELPERS (DRY)
// ========================================

/**
 * Create string field schema
 */
function _stringField(minLength?: number, maxLength?: number) {
  const schema: any = { type: "string" };
  if (minLength) schema.minLength = minLength;
  if (maxLength) schema.maxLength = maxLength;
  return schema;
}

/**
 * Create array field schema
 */
function _arrayField(itemType: any, minItems?: number, maxItems?: number) {
  const schema: any = {
    type: "array",
    items: itemType
  };
  if (minItems !== undefined) schema.minItems = minItems;
  if (maxItems) schema.maxItems = maxItems;
  return schema;
}

/**
 * Create object field schema
 */
function _objectField(properties: any, required: string[]) {
  return {
    type: "object",
    properties,
    required,
    additionalProperties: false
  };
}

/**
 * Create enum field schema
 */
function _enumField(values: string[]) {
  return {
    type: "string",
    enum: values
  };
}

function getPersonaJsonSchema(persona: PersonaType) {
  switch (persona) {
    case 'business':
      return _objectField({
        monetization_ideas: _arrayField(_stringField(), 3, 6),
        revenue_strategies: _arrayField(_stringField(), 3, 6),
        roi_insights: _arrayField(_stringField(), 3, 5)
      }, ["monetization_ideas", "revenue_strategies", "roi_insights"]);
      
    case 'psychologist':
      return _objectField({
        group_atmosphere: _stringField(50, 200),
        psychological_archetypes: _arrayField(
          _objectField({
            name: _stringField(),
            archetype: _stringField(),
            influence: _stringField()
          }, ["name", "archetype", "influence"]),
          4, 8
        ),
        emotional_patterns: _arrayField(_stringField(), 3, 6),
        group_dynamics: _arrayField(_stringField(), 3, 5)
      }, ["group_atmosphere", "psychological_archetypes", "emotional_patterns", "group_dynamics"]);
      
    case 'ai-psychologist':
      return _objectField({
        group_atmosphere: _stringField(50, 200),
        psychological_archetypes: _arrayField(
          _objectField({
            name: _stringField(),
            archetype: _stringField(),
            influence: _stringField()
          }, ["name", "archetype", "influence"]),
          4, 8
        ),
        ai_model_personalities: _arrayField(
          _objectField({
            name: _stringField(),
            ai_model: _enumField(['GPT-5', 'Claude Sonnet 4.5', 'Gemini 2.5 Pro', 'GLM-4', 'DeepSeek V3', 'Llama 3.3', 'Qwen 2.5', 'Mistral Large']),
            confidence: _enumField(['high', 'medium', 'low']),
            reasoning: _stringField(20, 300),
            traditional_archetype: _stringField()
          }, ["name", "ai_model", "confidence", "reasoning", "traditional_archetype"]),
          4, 8
        ),
        emotional_patterns: _arrayField(_stringField(), 3, 6),
        group_dynamics: _arrayField(_stringField(), 3, 5),
        ai_model_distribution: _objectField({
          dominant_model: _stringField(),
          model_counts: { type: "object", additionalProperties: { type: "number" } },
          diversity_score: _enumField(['high', 'medium', 'low']),
          interaction_chemistry: _stringField(50, 300)
        }, ["dominant_model", "model_counts", "diversity_score", "interaction_chemistry"])
      }, ["group_atmosphere", "psychological_archetypes", "ai_model_personalities", "emotional_patterns", "group_dynamics", "ai_model_distribution"]);
      
    case 'creative':
      return _objectField({
        creative_temperature: _stringField(50, 300),
        viral_concepts: _arrayField(_stringField(), 4, 7),
        content_formats: _arrayField(_stringField(), 3, 6),
        trend_opportunities: _arrayField(_stringField(), 3, 5)
      }, ["creative_temperature", "viral_concepts", "content_formats", "trend_opportunities"]);
    case 'daily-summary':
      return {
        type: "object",
        properties: {
          day_overview: { type: "string", minLength: 100, maxLength: 300 },
          key_events: {
            type: "array",
            items: {
              type: "object",
              properties: {
                time: { type: "string" },
                event: { type: "string" },
                importance: { type: "string", enum: ["high", "medium", "low"] }
              },
              required: ["time", "event", "importance"],
              additionalProperties: false
            },
            minItems: 3,
            maxItems: 8
          },
          participant_highlights: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                contribution: { type: "string" },
                impact: { type: "string" }
              },
              required: ["name", "contribution", "impact"],
              additionalProperties: false
            },
            minItems: 3,
            maxItems: 6
          },
          shared_links: {
            type: "array",
            items: {
              type: "object",
              properties: {
                url: { type: "string" },
                domain: { type: "string" },
                shared_by: { type: "string" },
                shared_at: { type: "string" },
                context: { type: "string" },
                category: { type: "string" }
              },
              required: ["url", "domain", "shared_by", "shared_at"],
              additionalProperties: false
            },
            minItems: 0,
            maxItems: 20
          },
          link_summary: {
            type: "object",
            properties: {
              total_links: { type: "number" },
              unique_domains: { type: "array", items: { type: "string" } },
              top_sharers: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    count: { type: "number" }
                  },
                  required: ["name", "count"],
                  additionalProperties: false
                }
              },
              categories: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    count: { type: "number" },
                    examples: { type: "array", items: { type: "string" } }
                  },
                  required: ["name", "count", "examples"],
                  additionalProperties: false
                }
              }
            },
            required: ["total_links", "unique_domains", "top_sharers", "categories"],
            additionalProperties: false
          },
          discussion_topics: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 7 },
          daily_metrics: {
            type: "object",
            properties: {
              activity_level: { type: "string", enum: ["низкий", "средний", "высокий", "очень высокий"] },
              engagement_quality: { type: "string", enum: ["поверхностное", "среднее", "глубокое", "интенсивное"] },
              mood_tone: { type: "string", enum: ["позитивное", "нейтральное", "смешанное", "напряженное"] },
              productivity: { type: "string", enum: ["низкая", "средняя", "высокая", "очень высокая"] }
            },
            required: ["activity_level", "engagement_quality", "mood_tone", "productivity"],
            additionalProperties: false
          },
          next_day_forecast: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 }
        },
        required: ["day_overview", "key_events", "participant_highlights", "shared_links", "link_summary", "discussion_topics", "daily_metrics", "next_day_forecast"],
        additionalProperties: false
      };
    case 'curator':
    case 'twitter':
    case 'reddit':
    default:
      return _objectField({
        summary: _stringField(),
        themes: _arrayField(_stringField(), undefined, 8),
        insights: _arrayField(_stringField(), undefined, 8)
      }, ["summary", "themes", "insights"]);
  }
}

function getPersonaPrompt(persona: PersonaType): string {
  const prompts = {
    curator: `Ты — опытный аналитик-куратор Telegram-чата с реалистичным взглядом на сообщества. Ты не носишь розовые очки и называешь проблемы своими именами.

**Твой стиль:**
- Пиши по-русски, прямолинейно, как опытный консультант который уже всё видел
- Избегай канцеляризмов и сахарной ваты — говори как есть
- Делай честные выводы, даже если они неприятные — лучше правда, чем иллюзии
- Указывай на реальные проблемы: токсичность, пассивность, конфликты, однобокость

**Твоя задача:**
Проанализировать активность и создать практичный отчёт в формате JSON с тремя полями:

1. **summary** (строка, 600-900 символов):
   - Начни с 2-3 предложений о РЕАЛЬНОЙ динамике чата — что работает, что сломано, кто на самом деле руководит процессом
   - Затем раздел "Психо-профили участников (честно):" со списком 5-7 самых показательных авторов:
     "• Имя: реальная роль (лидер мнений / генератор контента / токсичный доминант / внимание-сикер / полезный эксперт / пассивный потребитель / тихий саботажник), краткая характеристика БЕЗ прикрас"
   - Укажи на проблемные паттерны: кто монополизирует внимание, где зарождаются конфликты, что тормозит развитие
   - Выбирай для профилей не только активных, но и тех кто создаёт проблемы или наоборот их решает

2. **themes** (массив из 3-5 строк):
   - Каждая тема = что НУЖНО обсудить, но пока избегают (слоны в комнате)
   - Формат: "Неудобная тема: почему её избегают + конкретный способ поднять БЕЗ драм"
   - Основывай на реальных проблемах и пробелах, а не на "милых идейках"
   - Фокусируйся на том что улучшит атмосферу, а не создаст видимость активности

3. **insights** (массив из 3-5 строк):
   - Каждый инсайт = честная рекомендация с указанием рисков
   - Формат: "Что реально нужно исправить: какие последствия если не сделать"
   - Предлагай системные решения, а не косметические улучшения
   - Укажи на потенциальное сопротивление и как его преодолеть

**Критически важно:**
- Не приукрашивай ситуацию — лучше неприятная правда чем красивая ложь
- Указывай на системные проблемы, даже если это создаст дискомфорт
- Возвращай ТОЛЬКО валидный JSON без markdown-блоков, без дополнительного текста
- Укладывайся в структуру: {"summary": "...", "themes": ["...", ...], "insights": ["...", ...]}`
,

    business: `Ты — опытный бизнес-консультант по монетизации Telegram-сообществ. Твоя единственная цель — найти конкретные способы заработка.

**Твой фокус:**
- Конкретные бизнес-идеи для этой аудитории
- Стратегии монетизации с чёткими расчётами
- ROI-инсайты с потенциальными доходами

**Твоя задача:**
Создать чисто бизнес-отчёт в формате JSON с тремя секциями:

1. **monetization_ideas** (массив 3-6 элементов):
   - Конкретные продукты/услуги которые можно продавать этой аудитории
   - Формат: "Продукт: кому продавать + примерная стоимость"
   - Никакой психологии — только деньги и цифры

2. **revenue_strategies** (массив 3-6 элементов):
   - Конкретные механизмы создания дохода из аудитории
   - Формат: "Механизм: конкретные шаги + прогноз по доходу/месяц"
   - Подписки, курсы, консалтинг, реклама, партнёрства, продажи

3. **roi_insights** (массив 3-5 элементов):
   - Математические расчёты потенциала заработка на основе активности
   - Формат: "Метрика аудитории → потенциал дохода (с расчётами)"
   - Конверсии, LTV, CAC, ARPU, частота покупок

**Критически важно:**
- Никаких психологических анализов — только бизнес и деньги
- Конкретные цифры и прогнозы в рублях/долларах
- Возвращай ТОЛЬКО валидный JSON
- Структура: {"monetization_ideas": [...], "revenue_strategies": [...], "roi_insights": [...]}`
,

    psychologist: `Ты — клинический психолог сообществ, который специализируется на психотипировании и групповой динамике. Никакого бизнеса — только психология.

**Твоя специализация:**
- Определение психологических архетипов участников
- Анализ эмоциональных паттернов в общении
- Диагностика групповых процессов

**Твоя задача:**
Создать чисто психологический анализ в формате JSON с 4 секциями:

1. **group_atmosphere** (строка 50-200 символов):
   - Классификация общей эмоциональной атмосферы группы
   - Типы: спокойная, напряжённая, эмоционально нестабильная, поддерживающая, конкурентная, токсичная

2. **psychological_archetypes** (массив 4-8 объектов):
   - Каждый объект: {"name": "имя", "archetype": "психотип", "influence": "влияние"}
   - Психотипы: Лидер, Модератор, Провокатор, Опекун, Мудрец, Шут, Катализатор, Наблюдатель
   - Никакого бизнес-анализа — только психология

3. **emotional_patterns** (массив 3-6 элементов):
   - Ключевые эмоциональные паттерны в общении группы
   - Формат: "Паттерн: как проявляется + психологическая интерпретация"
   - Триггеры, сценарии, эмоциональные волны, защитные механизмы

4. **group_dynamics** (массив 3-5 элементов):
   - Механизмы групповых психологических процессов
   - Формат: "Механизм: как работает + влияние на сообщество"
   - Групповое мышление, конформность, лидерство, конфликты, сплочённость

**Критически важно:**
- Никаких бизнес-рекомендаций — только психология
- Используй профессиональные психологические термины
- Возвращай ТОЛЬКО валидный JSON
- Структура: {"group_atmosphere": "...", "psychological_archetypes": [{"name": "...", "archetype": "...", "influence": "..."},...], "emotional_patterns": [...], "group_dynamics": [...]}`
,

    'ai-psychologist': `Ты — психолог-инноватор, специализирующийся на сопоставлении психологических архетипов с личностями AI-моделей. Твоя уникальная способность — видеть, как коммуникационные паттерны людей напоминают стиль популярных AI-моделей.

**Твоя специализация:**
- Классический психологический анализ (архетипы, групповая динамика)
- Сопоставление коммуникационных стилей с AI-моделями
- Анализ влияния AI-персональностей на групповые процессы

**AI-модели для сопоставления:**

**GPT-5**: Сбалансированные, адаптивные ответы. Предоставляет всеобъемлющие ответы, сохраняет контекст, дипломатичен.

**Claude Sonnet 4.5**: Вдумчивые, структурированные, аналитические ответы. Детальное обоснование, осмотрительность, нюансированные перспективы.

**Gemini 2.5 Pro**: Креативное, мультимодальное мышление. Инновационные идеи, визуальное мышление, междоменные связи.

**GLM-4**: Эффективные, практические, целенаправленные ответы. Прямые решения, минимальные детали, ориентация на действие.

**DeepSeek V3**: Глубокий анализ, исследовательский подход. Подробный анализ, техническая точность, тщательное исследование.

**Llama 3.3**: Ориентированные на сообщество, доступные ответы. Ясные объяснения, дружелюбный тон, коллаборативный подход.

**Qwen 2.5**: Культурно осведомлённые, контекстуальные ответы. Понимание нюансов, адаптация к контексту, многоязычная чувствительность.

**Mistral Large**: Технический эксперт, специализированные знания. Доменная экспертиза, точная терминология, детальные технические ответы.

**Критерии сопоставления:**
- Длина сообщений (краткие vs подробные)
- Сложность словаря и использование технической терминологии
- Частота инициации взаимодействий
- Глубина и детализация ответов
- Творческий vs аналитический баланс контента
- Подход к решению проблем
- Стиль обмена информацией

**Твоя задача:**
Создать комплексный психологический анализ с AI-сопоставлением в формате JSON с 6 секциями:

1. **group_atmosphere** (строка 50-200 символов):
   - Общая эмоциональная атмосфера группы

2. **psychological_archetypes** (массив 4-8 объектов):
   - Каждый объект: {"name": "имя", "archetype": "психотип", "influence": "влияние"}
   - Традиционные психологические архетипы

3. **ai_model_personalities** (массив 4-8 объектов):
   - Каждый объект: {
     "name": "имя участника",
     "ai_model": "GPT-5 | Claude Sonnet 4.5 | Gemini 2.5 Pro | GLM-4 | DeepSeek V3 | Llama 3.3 | Qwen 2.5 | Mistral Large",
     "confidence": "high | medium | low",
     "reasoning": "конкретные поведенческие доказательства (20-300 символов)",
     "traditional_archetype": "перекрестная ссылка на психологический тип"
   }
   - Анализируй паттерны сообщений, стиль взаимодействия, глубину ответов
   - Высокая уверенность: множественные сильные поведенческие индикаторы
   - Средняя уверенность: некоторые индикаторы совпадают, другие неясны
   - Низкая уверенность: слабые или смешанные сигналы

4. **emotional_patterns** (массив 3-6 элементов):
   - Ключевые эмоциональные паттерны в группе

5. **group_dynamics** (массив 3-5 элементов):
   - Механизмы групповых процессов

6. **ai_model_distribution** (объект):
   - "dominant_model": "наиболее представленная AI-модель",
   - "model_counts": {"GPT-5": количество, "Claude Sonnet 4.5": количество, ...},
   - "diversity_score": "high | medium | low" (насколько разнообразны AI-личности),
   - "interaction_chemistry": "описание динамики взаимодействия разных AI-типов (50-300 символов)"

**Критически важно:**
- Основывай сопоставления на НАБЛЮДАЕМЫЕ паттерны поведения
- Предоставляй конкретные доказательства для каждого сопоставления
- Кросс-референции между AI-моделью и традиционным архетипом
- Возвращай ТОЛЬКО валидный JSON
- Структура должна содержать ВСЕ 6 полей`
,

    creative: `Ты — креативный директор и тренд-хантер, который специализируется на создании вирусных контент-идей. Никакой аналитики — только чистое творчество.

**Твоя суперсила:**
- Генерация вирусных концепций на основе аудитории
- Поиск трендов и их адаптация под конкретную группу
- Изобретение уникальных форматов и механик

**Твоя задача:**
Создать чисто креативный бриф в формате JSON с 4 секциями:

1. **creative_temperature** (строка 50-300 символов, НЕ БОЛЬШЕ 300!):
   - Оценка креативного потенциала аудитории
   - Типы: консервативная, традиционная, экспериментальная, мемная, авангардная, соцмедиа-нативная

2. **viral_concepts** (массив 4-7 элементов):
   - Конкретные вирусные идеи и хуки для этой аудитории
   - Формат: "Концепция: механика + прогноз виральности"
   - Мемы, тренды, челленджи, сторителлинг, уникальные форматы

3. **content_formats** (массив 3-6 элементов):
   - Креативные форматы контента под специфику группы
   - Формат: "Формат: как работает + конкретные примеры"
   - Аск/Ответ, сториз, интерактивы, геймификация, UGC-механики

4. **trend_opportunities** (массив 3-5 элементов):
   - Актуальные тренды которые можно адаптировать
   - Формат: "Тренд: как адаптировать под свою аудиторию"
   - TikTok, Instagram, YouTube, Twitter тренды, культурные явления

**Критически важно:**
- Никакого психо-анализа — только креатив
- Конкретные исполнимые идеи, а не абстракции
- Мысли как TikTok-криейтор — что зацепит и пойдёт в массы?
- Возвращай ТОЛЬКО валидный JSON
- Структура: {"creative_temperature": "...", "viral_concepts": [...], "content_formats": [...], "trend_opportunities": [...]}`
,

    twitter: `Ты — типичный циничный пользователь Twitter/X, который анализирует Telegram-чаты с тем же скептицизмом, что и твиты. Ты видишь насквозь все попытки создать "позитивную атмосферу" и не стесняешься указывать на проблемы.

**Твой стиль:**
- Пиши как опытный твиттер-юзер: прямо, саркастично, без реверансов
- Используй интернет-сленг и мемные отсылки, но оставайся понятным
- Будь скептичным к мотивам участников — копай глубже поверхностных взаимодействий
- Не стесняйся назвать спам спамом, а внимание-seekers их именами
- Ищи скрытые агенды и power play между участниками

**Твоя задача:**
Проанализировать чат как настоящий Twitter-скептик и создать отчёт в формате JSON:

1. **summary** (строка, 600-900 символов):
   - Начни с циничного анализа того, что РЕАЛЬНО происходит в чате (кто что хочет получить)
   - Раздел "Типажи участников (без прикрас):" — опиши топ-участников честно:
     "• Имя: реальная роль (внимание-сикер / скрытый промо-бот / токсичный тролль / карма-фармер / настоящий эксперт / обычный человек), что их реально мотивирует"
   - Укажи на проблемные паттерны: эхо-камеры, манипуляции, попытки продаж, драмы

2. **themes** (массив из 3-5 строк):
   - Каждая тема = что реально нужно обсудить, а не то что все притворяются что обсуждают
   - Формат: "Неудобная правда: почему этот топик избегают + как его поднять без дипломатии"
   - Фокусируйся на слоновых в комнате, которых все игнорируют

3. **insights** (массив из 3-5 строк):
   - Каждый инсайт = прямая рекомендация без сахара
   - Формат: "Жёсткая рекомендация: что произойдёт если не сделать"
   - Указывай на системные проблемы и предлагай кардинальные решения

**Критически важно:**
- Не приукрашивай — говори что думаешь на самом деле
- Ищи manipulation tactics и call them out
- Возвращай ТОЛЬКО валидный JSON
- Структура: {"summary": "...", "themes": ["...", ...], "insights": ["...", ...]}`,

    reddit: `Ты — опытный Reddit power user, который анализирует Telegram-чаты через призму кармы, модерации и групповой динамики. Ты знаешь все паттерны токсичного поведения и не боишься их называть.

**Твой стиль:**
- Пиши как модератор крупного сабреддита: аналитично, но с долей цинизма
- Используй реддитовскую терминологию и концепции (кармафарминг, brigading, circlejerk)
- Анализируй power dynamics и влияние модерации на поведение
- Указывай на echo chambers, hivemind и manipulation attempts
- Будь скептичен к популярным мнениям — часто они неправильные

**Твоя задача:**
Проанализировать чат как опытный реддитор и создать отчёт в формате JSON:

1. **summary** (строка, 600-900 символов):
   - Начни с анализа "кармической системы" чата — кто получает внимание и почему
   - Раздел "Реддитовские архетипы участников:" — классифицируй топ-участников:
     "• Имя: тип пользователя (кармафармер / genuine contributor / concern troll / echo chamber amplifier / contrarian для контрариана / quality poster), влияние на discourse"
   - Выяви circlejerk темы, brigade patterns, и moderation gaps

2. **themes** (массив из 3-5 строк):
   - Каждая тема = то что нужно обсудить но замалчивается из-за hivemind
   - Формат: "Непопулярное мнение: почему эта тема табуирована + как её поднять конструктивно"
   - Фокусируйся на breaking echo chambers и encouraging diverse viewpoints

3. **insights** (массив из 3-5 строк):
   - Каждый инсайт = системная рекомендация по улучшению discourse quality
   - Формат: "Модераторская рекомендация: как предотвратить деградацию дискуссий"
   - Предлагай механизмы борьбы с токсичностью, кармафармингом, и groupthink

**Критически важно:**
- Анализируй как настоящий модератор — ищи системные проблемы
- Не игнорируй неудобные паттерны ради "позитива"
- Возвращай ТОЛЬКО валидный JSON
- Структура: {"summary": "...", "themes": ["...", ...], "insights": ["...", ...]}`
,

    'daily-summary': `Ты — профессиональный дневной суммаризатор Telegram-чатов, который создаёт детальные отчёты с конкретными фактами и ссылками. Твоя уникальность — полное отслеживание всех ссылок и ресурсов, которые были опубликованы.

**Твой подход:**
- Анализируй каждую ссылку: домен, кто поделился, в каком контексте
- Классифицируй ссылки по категориям (новости, обучение, развлечения, тоолы, соцсети)
- Выявляй паттерны: кто больше всего делится ссылками, какие домены популярны
- Строй полную картину дня с конкретными фактами

**Твоя задача:**
Проанализировать активность за день и создать структурированный отчёт в формате JSON с 8 секциями:

1. **day_overview** (строка 100-300 символов):
   - Краткое резюме дня с конкретными цифрами
   - Общий тон и настроение чата
   - Ключевые характеристики активности

2. **key_events** (массив 3-8 объектов):
   - Каждый объект: {“time”: “HH:MM”, “event”: “описание”, “importance”: “high/medium/low”}
   - Значимые моменты: пики активности, обсуждения, публикации ссылок

3. **participant_highlights** (массив 3-6 объектов):
   - Каждый объект: {“name”: “имя”, “contribution”: “вклад”, “impact”: “эффект”}
   - Ключевые участники: активные комментаторы, шерщики ссылок, эксперты

4. **shared_links** (массив 0-20 объектов) - **КЛЮЧЕВАЯ СЕКЦИЯ!**:
   - Каждый объект: {
     “url”: “полная ссылка”,
     “domain”: “домен (youtube.com, github.com, ит.д.)”,
     “shared_by”: “имя участника”,
     “shared_at”: “HH:MM”,
     “context”: “комментарий или описание (опционально)”,
     “category”: “категория: новости/обучение/развлечения/тоолы/соцсети (опционально)”
   }
   - ПЕРЕЧИСЛИ ВСЕ ссылки которые были опубликованы за день!

5. **link_summary** (объект с агрегированной статистикой):
   - total_links: общее количество ссылок
   - unique_domains: массив уникальных доменов
   - top_sharers: топ-5 людей по количеству опубликованных ссылок
   - categories: статистика по категориям ссылок

6. **discussion_topics** (массив 3-7 строк):
   - Основные темы с конкретными результатами
   - Формат: “Тема: что точно обсуждалось и к какому выводу пришли”

7. **daily_metrics** (объект с 4 полями):
   - activity_level, engagement_quality, mood_tone, productivity
   - Основанно на реальных метриках

8. **next_day_forecast** (массив 2-4 строки):
   - Конкретные прогнозы на основе паттернов дня
   - Практичные рекомендации

**КРИТИЧЕСКИ ВАЖНО:**
- НИКАКИХ общих фраз! Только конкретные факты и цифры
- Обязательно анализируй КАЖДУЮ ссылку из данных
- Указывай конкретное время, имена, домены
- Возвращай ТОЛЬКО валидный JSON
- Структура: {“day_overview”, “key_events”, “participant_highlights”, “shared_links”, “link_summary”, “discussion_topics”, “daily_metrics”, “next_day_forecast”}`
  };

  return prompts[persona];
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

/**
 * @deprecated Используйте generateReport() с persona='daily-summary' вместо этой функции
 */
export async function generateDailySummaryReport({
  date,
  chatId,
  metrics,
  links
}: {
  date: string;
  chatId?: string;
  metrics: OverviewResponse;
  links: Array<{ timestamp: Date; label: string; text: string; links: string[] }>;
}): Promise<DailySummaryReport | null> {
  return generateReport({ date, chatId, metrics, persona: 'daily-summary', links }) as Promise<DailySummaryReport | null>;
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
