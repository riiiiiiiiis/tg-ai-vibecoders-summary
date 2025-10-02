import { NextResponse } from "next/server";
import { buildDailyReport } from "@/lib/report";

export const dynamic = "force-dynamic";

const TELEGRAM_MAX_MESSAGE_LENGTH = 4096;

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const chatId = searchParams.get("chat_id") ?? undefined;
  const daysParam = Number(searchParams.get("days") ?? "");
  const days = daysParam === 1 || daysParam === 7 ? (daysParam as 1 | 7) : 1;

  console.log(`[API] /api/send-to-telegram`, { date, chatId: chatId ? "***" : undefined, days });

  // Validate Telegram credentials
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !telegramChatId) {
    console.error("[Telegram] Missing credentials:", {
      hasBotToken: !!botToken,
      hasChatId: !!telegramChatId
    });
    return NextResponse.json(
      {
        ok: false,
        error: "Telegram bot not configured. Please set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env"
      },
      { status: 500 }
    );
  }

  console.log("[Telegram] Credentials validated");

  try {
    let report;

    // Check if report is provided in request body
    const body = await request.json().catch(() => null);

    if (body && body.summary && body.themes && body.insights) {
      console.log("[Telegram] Using pre-generated report from request body");
      report = {
        date: body.date || date || new Date().toISOString().split("T")[0],
        chatId,
        metrics: { totalMessages: 0, uniqueUsers: 0, linkMessages: 0, topUsers: [], series: [] }, // Dummy metrics for pre-generated report
        summary: body.summary,
        themes: body.themes,
        insights: body.insights
      };
    } else {
      // Generate report
      console.log("[Telegram] Starting report generation...");
      report = await buildDailyReport({ date: date ?? undefined, days, chatId });
      console.log("[Telegram] Report generated successfully");
    }

    if (!report) {
      console.error("[Telegram] Report generation returned null");
      return NextResponse.json(
        { ok: false, error: "Failed to generate report. AI service may be unavailable." },
        { status: 503 }
      );
    }

    // Format message for Telegram
    console.log("[Telegram] Formatting report for Telegram...");
    const formattedMessage = formatReportForTelegram(report);
    console.log("[Telegram] Message formatted:", {
      length: formattedMessage.length,
      needsSplitting: formattedMessage.length > TELEGRAM_MAX_MESSAGE_LENGTH
    });

    // Send to Telegram
    const messages = splitMessage(formattedMessage, TELEGRAM_MAX_MESSAGE_LENGTH);
    console.log(`[Telegram] Message split into ${messages.length} part(s)`);

    for (let i = 0; i < messages.length; i++) {
      console.log(`[Telegram] Sending message ${i + 1}/${messages.length}...`);
      await sendTelegramMessage(botToken, telegramChatId, messages[i]);
      console.log(`[Telegram] Message ${i + 1}/${messages.length} sent successfully`);
    }

    return NextResponse.json({
      ok: true,
      message: "Summary sent to Telegram successfully",
      sentMessages: messages.length
    });

  } catch (error) {
    console.error(`[Telegram] ERROR:`, {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    let userFriendlyMessage = "Неизвестная ошибка при отправке в Telegram";

    if (error instanceof Error) {
      if (error.message.includes("Telegram API error")) {
        userFriendlyMessage = `Ошибка Telegram API: ${error.message}`;
      } else if (error.message.includes("fetch")) {
        userFriendlyMessage = "Не удалось подключиться к Telegram API. Проверьте интернет-соединение.";
      } else if (error.message.includes("timeout")) {
        userFriendlyMessage = "Превышено время ожидания ответа от Telegram API.";
      } else {
        userFriendlyMessage = error.message;
      }
    }

    return NextResponse.json({
      ok: false,
      error: userFriendlyMessage,
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

function formatReportForTelegram(report: NonNullable<Awaited<ReturnType<typeof buildDailyReport>>>): string {
  const lines: string[] = [];

  lines.push(`📊 *Отчёт за ${report.date}*`);
  lines.push("");

  // Проверяем тип отчёта
  if ('persona' in report && 'data' in report) {
    // Персонализированный отчёт
    const persona = report.persona;
    const data = report.data;
    
    lines.push(`🔮 *Эксперт: ${getPersonaEmoji(persona)}*`);
    lines.push("");
    
    if (persona === 'business') {
      if (data.monetization_ideas?.length > 0) {
        lines.push("💰 *Идеи монетизации:*");
        data.monetization_ideas.forEach((idea: string, idx: number) => {
          lines.push(`${idx + 1}. ${idea}`);
        });
        lines.push("");
      }
      
      if (data.revenue_strategies?.length > 0) {
        lines.push("📈 *Стратегии дохода:*");
        data.revenue_strategies.forEach((strategy: string, idx: number) => {
          lines.push(`${idx + 1}. ${strategy}`);
        });
        lines.push("");
      }
      
      if (data.roi_insights?.length > 0) {
        lines.push("🔥 *ROI-инсайты:*");
        data.roi_insights.forEach((insight: string, idx: number) => {
          lines.push(`${idx + 1}. ${insight}`);
        });
      }
    } else if (persona === 'psychologist') {
      if (data.group_atmosphere) {
        lines.push("🌡️ *Атмосфера группы:*");
        lines.push(data.group_atmosphere);
        lines.push("");
      }
      
      if (data.psychological_archetypes?.length > 0) {
        lines.push("🎭 *Психологические архетипы:*");
        data.psychological_archetypes.forEach((archetype: {name: string, archetype: string, influence: string}, idx: number) => {
          lines.push(`${idx + 1}. **${archetype.name}** (Архетип: ${archetype.archetype}) - ${archetype.influence}`);
        });
        lines.push("");
      }
      
      if (data.emotional_patterns?.length > 0) {
        lines.push("💡 *Эмоциональные паттерны:*");
        data.emotional_patterns.forEach((pattern: string, idx: number) => {
          lines.push(`${idx + 1}. ${pattern}`);
        });
        lines.push("");
      }
      
      if (data.group_dynamics?.length > 0) {
        lines.push("⚙️ *Групповая динамика:*");
        data.group_dynamics.forEach((dynamic: string, idx: number) => {
          lines.push(`${idx + 1}. ${dynamic}`);
        });
      }
    } else if (persona === 'creative') {
      if (data.creative_temperature) {
        lines.push("🌡️ *Креативная температура:*");
        lines.push(data.creative_temperature);
        lines.push("");
      }
      
      if (data.viral_concepts?.length > 0) {
        lines.push("🚀 *Вирусные концепции:*");
        data.viral_concepts.forEach((concept: string, idx: number) => {
          lines.push(`${idx + 1}. ${concept}`);
        });
        lines.push("");
      }
      
      if (data.content_formats?.length > 0) {
        lines.push("🎨 *Контент-форматы:*");
        data.content_formats.forEach((format: string, idx: number) => {
          lines.push(`${idx + 1}. ${format}`);
        });
        lines.push("");
      }
      
      if (data.trend_opportunities?.length > 0) {
        lines.push("🔥 *Трендовые возможности:*");
        data.trend_opportunities.forEach((opportunity: string, idx: number) => {
          lines.push(`${idx + 1}. ${opportunity}`);
        });
      }
    } else {
      // Общие персоны (twitter, reddit, curator) - стандартный формат
      if (data.summary) {
        lines.push(data.summary);
        lines.push("");
      }
      
      if (data.themes?.length > 0) {
        lines.push("🎯 *Темы:*");
        data.themes.forEach((theme: string, idx: number) => {
          lines.push(`${idx + 1}. ${theme}`);
        });
        lines.push("");
      }
      
      if (data.insights?.length > 0) {
        lines.push("💡 *Инсайты:*");
        data.insights.forEach((insight: string, idx: number) => {
          lines.push(`${idx + 1}. ${insight}`);
        });
      }
    }
  } else if ('summary' in report && 'themes' in report && 'insights' in report) {
    // Стандартный отчёт
    lines.push(report.summary);
    lines.push("");

    if (report.themes.length > 0) {
      lines.push("🎯 *Темы для обсуждения:*");
      report.themes.forEach((theme, idx) => {
        lines.push(`${idx + 1}. ${theme}`);
      });
      lines.push("");
    }

    if (report.insights.length > 0) {
      lines.push("💡 *Рекомендации:*");
      report.insights.forEach((insight, idx) => {
        lines.push(`${idx + 1}. ${insight}`);
      });
    }
  }

  return lines.join("\n");
}

function getPersonaEmoji(persona?: string): string {
  switch (persona) {
    case 'business': return '💼 Бизнес-консультант';
    case 'psychologist': return '🧠 Психолог сообществ';
    case 'creative': return '🚀 Креативный маркетолог';
    case 'twitter': return '🐦 Twitter-скептик';
    case 'reddit': return '👽 Reddit-модератор';
    case 'curator': return '🎯 Куратор-реалист';
    default: return '🔮 Аналитик';
  }
}

function splitMessage(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) {
    return [text];
  }

  const messages: string[] = [];
  let currentMessage = "";

  const lines = text.split("\n");

  for (const line of lines) {
    if ((currentMessage + "\n" + line).length > maxLength) {
      if (currentMessage) {
        messages.push(currentMessage.trim());
        currentMessage = line;
      } else {
        // Single line is too long, split it by words
        const words = line.split(" ");
        for (const word of words) {
          if ((currentMessage + " " + word).length > maxLength) {
            messages.push(currentMessage.trim());
            currentMessage = word;
          } else {
            currentMessage += (currentMessage ? " " : "") + word;
          }
        }
      }
    } else {
      currentMessage += (currentMessage ? "\n" : "") + line;
    }
  }

  if (currentMessage) {
    messages.push(currentMessage.trim());
  }

  return messages;
}

async function sendTelegramMessage(botToken: string, chatId: string, text: string): Promise<void> {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  console.log("[Telegram] Preparing to send message:", {
    url: url.replace(botToken, "***TOKEN***"),
    chatId: "***CHAT_ID***",
    textLength: text.length
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: "Markdown",
    }),
  });

  console.log("[Telegram] Response received:", {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ description: "Не удалось распарсить ответ от Telegram" }));
    console.error("[Telegram] API error response:", {
      status: response.status,
      statusText: response.statusText,
      errorData
    });

    let errorMessage = `Telegram API вернул ошибку (${response.status})`;

    if (errorData.description) {
      errorMessage += `: ${errorData.description}`;
    }

    if (errorData.error_code) {
      errorMessage += ` [код: ${errorData.error_code}]`;
    }

    // Добавим подсказки для частых ошибок
    if (errorData.description?.includes("bot was blocked")) {
      errorMessage += " - Бот заблокирован в чате. Разблокируйте бота.";
    } else if (errorData.description?.includes("chat not found")) {
      errorMessage += " - Чат не найден. Проверьте TELEGRAM_CHAT_ID.";
    } else if (errorData.description?.includes("Unauthorized")) {
      errorMessage += " - Неверный токен бота. Проверьте TELEGRAM_BOT_TOKEN.";
    }

    throw new Error(errorMessage);
  }

  const responseData = await response.json();
  console.log("[Telegram] Message sent successfully:", {
    ok: responseData.ok,
    message_id: responseData.result?.message_id
  });
}
