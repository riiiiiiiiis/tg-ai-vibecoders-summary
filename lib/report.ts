import { generateStructuredReport } from "./ai";
import { fetchOverview } from "./queries";
import type { OverviewResponse, ReportPayload } from "./types";

type ReportRequest = {
  date: string;
  chatId?: string;
};

export async function buildDailyReport({ date, chatId }: ReportRequest): Promise<ReportPayload> {
  const { from, to } = computeDayRange(date);
  const metrics = await fetchOverview({ chatId, from, to });
  
  try {
    const ai = await generateStructuredReport({ date, chatId, metrics });
    
    if (!ai) {
      return null;
    }

    return {
      date,
      chatId,
      metrics,
      summary: ai.summary,
      themes: ai.themes,
      insights: ai.insights
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


