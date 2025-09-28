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
  const ai = await generateStructuredReport({ date, chatId, metrics });

  return {
    date,
    chatId,
    metrics,
    summary: ai?.summary ?? fallbackSummary(metrics, date),
    themes: ai?.themes ?? fallbackThemes(metrics),
    insights: ai?.insights ?? fallbackInsights(metrics)
  };
}

function computeDayRange(date: string): { from: Date; to: Date } {
  const from = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(from.getTime())) {
    throw new Error("Invalid date format. Expected YYYY-MM-DD.");
  }
  const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
  return { from, to };
}

function fallbackSummary(metrics: OverviewResponse, date: string): string {
  return `За ${date} отправлено ${metrics.totalMessages} сообщений от ${metrics.uniqueUsers} участников. Ссылок: ${metrics.linkMessages}.`;
}

function fallbackThemes(metrics: OverviewResponse): string[] {
  return metrics.topUsers.slice(0, 3).map((user) => `Активность ${user.displayName}`);
}

function fallbackInsights(metrics: OverviewResponse): string[] {
  const trend = metrics.series.at(-1)?.messageCount ?? 0;
  return [`Последний интервал: ${trend} сообщений.`];
}
