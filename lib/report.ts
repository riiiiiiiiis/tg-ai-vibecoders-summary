import { generateStructuredReport, generateReportFromText } from "./ai";
import { fetchOverview, fetchMessagesText } from "./queries";
import type { OverviewResponse, ReportPayload } from "./types";

type ReportRequest = {
  date: string;
  chatId?: string;
};

export async function buildDailyReport({ date, chatId }: ReportRequest): Promise<ReportPayload> {
  const { from, to } = computeDayRange(date);
  const metrics = await fetchOverview({ chatId, from, to });
  
  try {
    const texts = await fetchMessagesText({ chatId, from, to, limit: 5000 });
    const maxChars = Number(process.env.LLM_TEXT_CHAR_BUDGET ?? 20000);
    const blob = texts.join("\n---\n").slice(0, maxChars);

    const fromText = blob
      ? await generateReportFromText({ date, chatId, metrics, text: blob })
      : null;

    const use = fromText ?? (await generateStructuredReport({ date, chatId, metrics }));
    if (!use) return null;

    return {
      date,
      chatId,
      metrics,
      summary: use.summary,
      themes: use.themes,
      insights: use.insights
    };
  } catch (error) {
    console.error("AI report generation failed:", error);
    return null;
  }
}

function computeDayRange(date: string): { from: Date; to: Date } {
  const from = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(from.getTime())) {
    throw new Error("Invalid date format. Expected YYYY-MM-DD.");
  }
  const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
  return { from, to };
}


