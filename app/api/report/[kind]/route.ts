import { NextResponse } from "next/server";
import { buildDailyReport } from "@/lib/report";
import type { ReportKind, ReportPayload, PersonaReportPayload } from "@/lib/types";
import type { PersonaType } from "@/lib/ai";

// Type guards
function isPersonaReport(report: ReportPayload | PersonaReportPayload): report is PersonaReportPayload {
  return report !== null && 'persona' in report && 'data' in report;
}

function isTraditionalReport(report: ReportPayload | PersonaReportPayload): report is NonNullable<ReportPayload> {
  return report !== null && 'summary' in report && 'themes' in report && 'insights' in report;
}

export const dynamic = "force-dynamic";

const ALLOWED: ReportKind[] = ["generate", "insights", "preview"];

export async function GET(request: Request, { params }: { params: { kind: string } }) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const chatId = searchParams.get("chat_id") ?? undefined;
  const daysParam = Number(searchParams.get("days") ?? "");
  const days = daysParam === 1 || daysParam === 7 ? (daysParam as 1 | 7) : undefined;
  const persona = searchParams.get("persona") as PersonaType | null;
  const kind = params.kind as ReportKind;
  console.log(`[API] /api/report/${kind}`, { date, chatId, days: days ?? 1, persona: persona ?? 'default' });
  // If neither date nor days provided, default to last 24 hours

  if (!ALLOWED.includes(kind)) {
    return NextResponse.json({ ok: false, error: "Unsupported report kind" }, { status: 404 });
  }

  try {
    const report = await buildDailyReport({ date: date ?? undefined, days: days ?? 1, chatId, persona: persona ?? undefined });

    if (!report) {
      return NextResponse.json({ 
        ok: false, 
        error: "AI service temporarily unavailable. Please check your API configuration." 
      }, { status: 503 });
    }

    if (kind === "insights") {
      if (isPersonaReport(report)) {
        // Для персонализированных отчётов отдаём всё данные
        return NextResponse.json({ ok: true, data: report.data });
      }
      if (isTraditionalReport(report)) {
        return NextResponse.json({ ok: true, data: report.insights });
      }
      return NextResponse.json({ ok: false, error: "Invalid report format" }, { status: 500 });
    }

    if (kind === "generate") {
      if (isPersonaReport(report)) {
        return NextResponse.json({
          ok: true,
          data: report.data
        });
      }
      if (isTraditionalReport(report)) {
        return NextResponse.json({
          ok: true,
          data: {
            summary: report.summary,
            themes: report.themes,
            insights: report.insights
          }
        });
      }
      return NextResponse.json({ ok: false, error: "Invalid report format" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data: isPersonaReport(report) ? report.data : report });
  } catch (error) {
    console.error(`/api/report/${kind} error`, error);
    const errorMessage = error instanceof Error ? error.message : "Failed to build report";
    const statusCode = errorMessage.includes("AI service requires") ? 503 : 500;
    return NextResponse.json({ ok: false, error: errorMessage }, { status: statusCode });
  }
}
