import { generateReport, PersonaType } from "./ai";
import { fetchOverview, fetchMessagesWithAuthors, fetchMessagesWithLinks } from "./queries";
import { getCurrentLocalDate } from "./date-utils";
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
  const dateForAi = date ?? getCurrentLocalDate();
  
  try {
    console.log("[Report] range", { from: from.toISOString(), to: to.toISOString(), chatId, threadId });
    const entries = await fetchMessagesWithAuthors({ 
      chatId, 
      threadId, 
      from, 
      to, 
      limit: 5000,
      preferUsername: persona === 'psychologist' // Use @username for psychologist persona
    });
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

    // Используем универсальную функцию generateReport
    if (persona) {
      const linksData = persona === 'daily-summary' 
        ? await fetchMessagesWithLinks({ chatId, threadId, from, to, limit: 500 }) 
        : undefined;
      
      if (linksData) {
        console.log("[Report] fetched messages with links", { count: linksData.length });
      }
      
      const use = await generateReport({ 
        date: dateForAi, 
        chatId, 
        metrics, 
        persona,
        text: blob,
        links: linksData
      });
      
      console.log("[Report] result source", { 
        source: persona === 'daily-summary' && linksData ? `persona-${persona}-with-links` : `persona-${persona}` 
      });
      
      if (!use) return null;
      
      return {
        date: dateForAi,
        chatId,
        threadId,
        metrics,
        persona,
        data: use
      };
    } else {
      const use = await generateReport({ 
        date: dateForAi, 
        chatId, 
        metrics, 
        text: blob 
      });
      
      console.log("[Report] result source", { 
        source: blob ? "text-based" : "metrics-only" 
      });
      
      if (!use) return null;

      // Type guard: если нет persona, то use это ParsedReport
      const parsedReport = use as { summary: string; themes: string[]; insights: string[] };

      return {
        date: dateForAi,
        chatId,
        threadId,
        metrics,
        summary: parsedReport.summary,
        themes: parsedReport.themes,
        insights: parsedReport.insights
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


