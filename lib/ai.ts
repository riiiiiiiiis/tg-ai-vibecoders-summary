import { reportSchema, type ParsedReport } from "./reportSchemas";
import type { OverviewResponse } from "./types";

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
    return null;
  }

  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You are an analyst producing concise Telegram community summaries. Respond in Russian."
    },
    {
      role: "user",
      content: buildPrompt({ date, chatId, metrics })
    }
  ];

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
              themes: { type: "array", items: { type: "string" }, maxItems: 5 },
              insights: { type: "array", items: { type: "string" }, maxItems: 5 }
            },
            required: ["summary", "themes", "insights"],
            additionalProperties: false
          }
        }
      }
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

async function callOpenRouter(
  messages: ChatMessage[],
  options?: {
    temperature?: number;
    responseFormat?: Record<string, unknown>;
  }
): Promise<string | null> {
  const controller = new AbortController();
  const timeoutMs = Number(process.env.OPENROUTER_TIMEOUT_MS ?? 20000);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(OPENROUTER_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://telegram-dashboard.local",
        "X-Title": "Telegram Dashboard"
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL,
        temperature: options?.temperature ?? 0.3,
        response_format: options?.responseFormat,
        messages
      }),
      signal: controller.signal
    });

    if (!res.ok) {
      console.error("OpenRouter error", await res.text());
      return null;
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    return content ?? null;
  } finally {
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

  return `${lines.join("\n")}\n\nСформируй краткое резюме дня, выдели основные темы и инсайты.`;
}
