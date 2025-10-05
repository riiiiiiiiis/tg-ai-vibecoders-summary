import { NextResponse } from "next/server";
import { buildDailyReport } from "@/lib/report";
import { validateTelegramConfig, formatSummaryForTelegram, sendMessageToChat } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const chatId = searchParams.get("chat_id") ?? undefined;
  const daysParam = Number(searchParams.get("days") ?? "");
  const days = daysParam === 1 || daysParam === 7 ? (daysParam as 1 | 7) : 1;

  console.log(`[API] /api/send-to-telegram`, { date, chatId: chatId ? "***" : undefined, days });

  // Validate Telegram credentials
  const configValidation = validateTelegramConfig();
  if (!configValidation.valid) {
    console.error("[Telegram] Configuration error:", configValidation.error);
    return NextResponse.json(
      {
        ok: false,
        error: configValidation.error
      },
      { status: 500 }
    );
  }

  const telegramChatId = process.env.TELEGRAM_CHAT_ID!;
  const telegramThreadId = process.env.TELEGRAM_THREAD_ID;

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

    // Format message for Telegram using new service
    console.log("[Telegram] Formatting report for Telegram...");
    const formattedMessage = formatSummaryForTelegram(report);
    console.log("[Telegram] Message formatted:", {
      length: formattedMessage.length
    });

    // Send to Telegram using new service
    console.log("[Telegram] Sending message to chat...");
    const result = await sendMessageToChat(telegramChatId, formattedMessage, telegramThreadId);

    if (!result.success) {
      console.error("[Telegram] Send failed:", result.error);
      return NextResponse.json({
        ok: false,
        error: result.error || "Не удалось отправить сообщение в Telegram"
      }, { status: 500 });
    }

    console.log("[Telegram] Message sent successfully");
    return NextResponse.json({
      ok: true,
      message: "Саммари успешно отправлено в Telegram"
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


