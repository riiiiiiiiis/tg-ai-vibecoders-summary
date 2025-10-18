import { NextResponse } from "next/server";
import { buildDailyReport } from "@/lib/report";
import type { ReportKind, ReportPayload, PersonaReportPayload } from "@/lib/types";
import type { PersonaType } from "@/lib/ai";
import { parseReportParams, buildErrorResponse, buildSuccessResponse } from "@/lib/api/utils";

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
  
  try {
    const { date, chatId, threadId, days, persona } = parseReportParams(searchParams);
    const kind = params.kind as ReportKind;
    
    console.log(`[API] /api/report/${kind}`, { date, chatId, threadId, days, persona: persona ?? 'default' });

    if (!ALLOWED.includes(kind)) {
      return NextResponse.json({ ok: false, error: "Unsupported report kind" }, { status: 404 });
    }

    const report = await buildDailyReport({ date, days, chatId, threadId, persona });

    if (!report) {
      return NextResponse.json({ 
        ok: false, 
        error: "AI service temporarily unavailable. Please check your API configuration." 
      }, { status: 503 });
    }

    if (kind === "insights") {
      if (isPersonaReport(report)) {
        return buildSuccessResponse(report.data);
      }
      if (isTraditionalReport(report)) {
        return buildSuccessResponse(report.insights);
      }
      return NextResponse.json({ ok: false, error: "Invalid report format" }, { status: 500 });
    }

    if (kind === "generate") {
      if (isPersonaReport(report)) {
        return buildSuccessResponse(report.data);
      }
      if (isTraditionalReport(report)) {
        return buildSuccessResponse({
          summary: report.summary,
          themes: report.themes,
          insights: report.insights
        });
      }
      return NextResponse.json({ ok: false, error: "Invalid report format" }, { status: 500 });
    }

    return buildSuccessResponse(isPersonaReport(report) ? report.data : report);
  } catch (error) {
    return buildErrorResponse(error, `/api/report/${params.kind}`);
  }
}
