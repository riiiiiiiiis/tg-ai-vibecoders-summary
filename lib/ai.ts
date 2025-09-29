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
      content:
        "Ты куратор дружеского Telegram-чата. Пиши по-русски, дружелюбно и по-человечески, без офисного стиля. Твоя цель — помочь владельцу чата понимать настроение и доставать идеи контента, которые реально зайдут участникам. Итог верни строго в JSON по схеме. В конце поля summary добавь раздел 'Психо‑профили' — 3–6 пунктов формата 'Автор: краткий профиль (тон, стиль, роль)'."
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
      content: "Ты куратор дружеского Telegram-чата. Пиши по-русски, дружелюбно и по-человечески, без офисного стиля. Учитывай авторов сообщений (тоны, роли, паттерны поведения) и предлагай идеи, полезные владельцу чата. В конце поля summary добавь раздел 'Психо‑профили' — 3–6 пунктов формата 'Автор: краткий профиль (тон, стиль, роль)'. Верни результат строго в JSON по схеме."
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
  const lines = [
    `Дата: ${date}`,
    chatId ? `Чат: ${chatId}` : "",
    `Всего сообщений: ${metrics.totalMessages}`,
    `Уникальные пользователи: ${metrics.uniqueUsers}`,
    `Сообщения со ссылками: ${metrics.linkMessages}`,
    "Топ-участники:",
    ...metrics.topUsers.map((user, index) => `${index + 1}. ${user.displayName} — ${user.messageCount}`),
    "Динамика сообщений:",
    ...metrics.series.map((point) => `${point.timestamp}: ${point.messageCount}`)
  ].filter(Boolean);

  return `${lines.join("\n")}\n\nСформируй полезный отчет для владельца дружеского чата: \n- summary: короткая, дружеская сводка (3–6 предложений) о том, что происходило и какое было настроение, без официоза;\n- themes: 3–5 конкретных идей контента (темы постов/обсуждений/мини-ивентов), основанных на динамике и интересах участников;\n- insights: 3–5 практических советов, что попробовать (форматы, опросы, челленджи, регулярности), поясни почему это сработает.\nНе повторяй метрики дословно — делай выводы на их основе. Верни строго JSON с полями summary, themes[], insights[].`;
}
