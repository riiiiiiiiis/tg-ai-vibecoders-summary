import { generateStructuredReport, generateReportFromText, generateReportWithPersona, PersonaType } from "./ai";
import { fetchOverview, fetchMessagesWithAuthors } from "./queries";
import type { ReportPayload, PersonaReportPayload } from "./types";

type ReportRequest = {
  date?: string;
  chatId?: string;
  threadId?: string;
  days?: 1 | 7;
  persona?: PersonaType;
};

export async function buildDailyReport({ date, chatId, threadId, days, persona }: ReportRequest): Promise<ReportPayload | PersonaReportPayload> {
  const { from, to } = computeRange({ date, days });
  const metrics = await fetchOverview({ chatId, threadId, from, to });
  const dateForAi = date ?? new Date().toISOString().slice(0, 10);
  
  try {
    console.log("[Report] range", { from: from.toISOString(), to: to.toISOString(), chatId, threadId });
    const entries = await fetchMessagesWithAuthors({ chatId, threadId, from, to, limit: 5000 });
    console.log("[Report] fetched messages", { count: entries.length, limit: 5000 });
    const maxChars = Number(process.env.LLM_TEXT_CHAR_BUDGET ?? 80000);
    const raw = entries
      .map((e) => {
        const time = e.timestamp.toISOString().slice(11, 16);
        return `[${time}] ${e.label}: ${e.text}`;
      })
      .join("\n");
    const truncated = raw.length > maxChars;
    const blob = truncated ? raw.slice(0, maxChars) : raw;
    console.log("[Report] text payload", {
      totalChars: raw.length,
      usedChars: blob.length,
      truncated,
      maxChars
    });
    console.log("[Report] strategy", { used: blob ? "text-based" : "metrics-fallback" });

    if (persona) {
      const use = await generateReportWithPersona({ date: dateForAi, chatId, metrics, text: blob, persona });
      console.log("[Report] result source", { source: `persona-${persona}` });
      if (!use) return null;
      
      return {
        date: dateForAi,
        chatId,
        metrics,
        persona,
        data: use
      };
    } else {
      const use = blob
        ? await generateReportFromText({ date: dateForAi, chatId, metrics, text: blob })
        : await generateStructuredReport({ date: dateForAi, chatId, metrics });
      console.log("[Report] result source", { 
        source: blob ? "text-based" : "metrics-only" 
      });
      if (!use) return null;

      return {
        date: dateForAi,
        chatId,
        metrics,
        summary: use.summary,
        themes: use.themes,
        insights: use.insights
      };
    }
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

function computeRange({ date, days }: { date?: string; days?: 1 | 7 }): { from: Date; to: Date } {
  const now = new Date();
  if (typeof days === "number") {
    const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return { from, to: now };
  }
  if (date) return computeDayRange(date);
  // Default to last 24 hours if nothing provided
  const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return { from, to: now };
}


