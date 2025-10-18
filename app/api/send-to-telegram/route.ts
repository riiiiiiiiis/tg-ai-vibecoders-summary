import { NextResponse } from "next/server";
import { buildDailyReport } from "@/lib/report";
import { validateTelegramConfig, formatSummaryForTelegram, sendMessageToChat } from "@/lib/telegram";
import { getCurrentLocalDate } from "@/lib/date-utils";
import { parseReportParams, buildErrorResponse } from "@/lib/api/utils";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const preview = searchParams.get("preview") === "true";
  
  try {
    const { date, chatId, threadId, days, persona } = parseReportParams(searchParams);
    
    console.log(`[API] /api/send-to-telegram`, { date, chatId: chatId ? "***" : undefined, days, preview, persona });

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

    let report;

    // Check if report is provided in request body
    const body = await request.json().catch(() => null);

    if (body && (body.summary || body.data)) {
      console.log("[Telegram] Using pre-generated report from request body");
      
      // Проверяем формат отчета: стандартный или персона-отчет
      if (body.data && persona) {
        report = {
          date: body.date || date || getCurrentLocalDate(),
          chatId,
          threadId,
          persona,
          data: body.data,
          metrics: { totalMessages: 0, uniqueUsers: 0, linkMessages: 0, topUsers: [], series: [] }
        };
      } else if (body.summary && body.themes && body.insights) {
        report = {
          date: body.date || date || getCurrentLocalDate(),
          chatId,
          metrics: { totalMessages: 0, uniqueUsers: 0, linkMessages: 0, topUsers: [], series: [] },
          summary: body.summary,
          themes: body.themes,
          insights: body.insights
        };
      } else {
        // Если формат не распознан, генерируем заново
        console.log("[Telegram] Starting report generation...");
        report = await buildDailyReport({ date, days, chatId, threadId, persona });
        console.log("[Telegram] Report generated successfully");
      }
    } else {
      // Generate report
      console.log("[Telegram] Starting report generation...");
      report = await buildDailyReport({ date, days, chatId, threadId, persona });
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

    // Если запрошен preview, возвращаем текст без отправки
    if (preview) {
      console.log("[Telegram] Returning preview only");
      return NextResponse.json({
        ok: true,
        preview: formattedMessage,
        message: "Предпросмотр создан"
      });
    }

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
    return buildErrorResponse(error, '/api/send-to-telegram');
  }
}


