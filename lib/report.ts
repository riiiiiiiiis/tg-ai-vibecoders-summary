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
    console.log("[Report] range", { from: from.toISOString(), to: to.toISOString(), chatId });
    const texts = await fetchMessagesText({ chatId, from, to, limit: 5000 });
    console.log("[Report] fetched messages", { count: texts.length, limit: 5000 });
    const maxChars = Number(process.env.LLM_TEXT_CHAR_BUDGET ?? 20000);
    const raw = texts.join("\n---\n");
    const truncated = raw.length > maxChars;
    const blob = truncated ? raw.slice(0, maxChars) : raw;
    console.log("[Report] text payload", {
      totalChars: raw.length,
      usedChars: blob.length,
      truncated,
      maxChars
    });
    console.log("[Report] strategy", { used: blob ? "text-based" : "metrics-fallback" });

    const fromText = blob
      ? await generateReportFromText({ date, chatId, metrics, text: blob })
      : null;

    const use = fromText ?? (await generateStructuredReport({ date, chatId, metrics }));
    console.log("[Report] result source", { source: fromText ? "text-based" : "metrics-only" });
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


