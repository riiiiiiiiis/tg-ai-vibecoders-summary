import { reportSchema, businessReportSchema, psychologyReportSchema, creativeReportSchema, type ParsedReport, type BusinessReport, type PsychologyReport, type CreativeReport, type AnyReport } from "./reportSchemas";
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

export type PersonaType = 'curator' | 'business' | 'psychologist' | 'creative' | 'twitter' | 'reddit';

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
  if (!process.env.OPENROUTER_API_KEY || !process.env.OPENROUTER_MODEL) {
    throw new Error("AI service requires OPENROUTER_API_KEY and OPENROUTER_MODEL environment variables");
  }

  const systemPrompt = getPersonaPrompt(persona);
  const userPrompt = text 
    ? buildTextPrompt({ date, chatId, metrics, text })
    : buildPrompt({ date, chatId, metrics });

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ];

  console.log(`[OpenRouter] persona: ${persona}, mode:`, text ? 'text-based' : 'metrics-only');
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
    const personaSchema = getPersonaSchema(persona);
    const personaJsonSchema = getPersonaJsonSchema(persona);
    
    const response = await callOpenRouter(messages, {
      responseFormat: {
        type: "json_schema",
        json_schema: {
          name: `${persona}_report`,
          schema: personaJsonSchema
        }
      },
      temperature: 0.6,
      maxOutputTokens: 3000
    });

    if (!response) return null;

    let json;
    try {
      json = JSON.parse(response);
    } catch (parseError) {
      console.error(`Failed to parse JSON response for ${persona}:`, parseError);
      console.error(`Response preview:`, response.substring(0, 500));
      return null;
    }

    const parsed = personaSchema.safeParse(json);
    if (!parsed.success) {
      console.error(`Failed to validate OpenRouter ${persona} response`, parsed.error);
      return null;
    }
    return parsed.data;
  } catch (error) {
    console.error(`OpenRouter ${persona} report generation failed`, error);
    return null;
  }
}

function getPersonaSchema(persona: PersonaType) {
  switch (persona) {
    case 'business':
      return businessReportSchema;
    case 'psychologist':
      return psychologyReportSchema;
    case 'creative':
      return creativeReportSchema;
    case 'curator':
    case 'twitter':
    case 'reddit':
    default:
      return reportSchema;
  }
}

function getPersonaJsonSchema(persona: PersonaType) {
  switch (persona) {
    case 'business':
      return {
        type: "object",
        properties: {
          monetization_ideas: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 6 },
          revenue_strategies: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 6 },
          roi_insights: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 }
        },
        required: ["monetization_ideas", "revenue_strategies", "roi_insights"],
        additionalProperties: false
      };
    case 'psychologist':
      return {
        type: "object",
        properties: {
          group_atmosphere: { type: "string", minLength: 50, maxLength: 200 },
          psychological_archetypes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                archetype: { type: "string" },
                influence: { type: "string" }
              },
              required: ["name", "archetype", "influence"],
              additionalProperties: false
            },
            minItems: 4,
            maxItems: 8
          },
          emotional_patterns: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 6 },
          group_dynamics: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 }
        },
        required: ["group_atmosphere", "psychological_archetypes", "emotional_patterns", "group_dynamics"],
        additionalProperties: false
      };
    case 'creative':
      return {
        type: "object",
        properties: {
          creative_temperature: { type: "string", minLength: 50, maxLength: 200 },
          viral_concepts: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 7 },
          content_formats: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 6 },
          trend_opportunities: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 }
        },
        required: ["creative_temperature", "viral_concepts", "content_formats", "trend_opportunities"],
        additionalProperties: false
      };
    case 'curator':
    case 'twitter':
    case 'reddit':
    default:
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

    creative: `Ты — креативный директор и тренд-хантер, который специализируется на создании вирусных контент-идей. Никакой аналитики — только чистое творчество.

**Твоя суперсила:**
- Генерация вирусных концепций на основе аудитории
- Поиск трендов и их адаптация под конкретную группу
- Изобретение уникальных форматов и механик

**Твоя задача:**
Создать чисто креативный бриф в формате JSON с 4 секциями:

1. **creative_temperature** (строка 50-200 символов):
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
- Структура: {"summary": "...", "themes": ["...", ...], "insights": ["...", ...]}}`
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
