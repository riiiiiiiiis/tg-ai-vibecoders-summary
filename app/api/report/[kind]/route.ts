import { NextResponse } from "next/server";
import { buildDailyReport } from "@/lib/report";
import type { ReportKind } from "@/lib/types";

export const dynamic = "force-dynamic";

const ALLOWED: ReportKind[] = ["generate", "insights", "preview"];

export async function GET(request: Request, { params }: { params: { kind: string } }) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const chatId = searchParams.get("chat_id") ?? undefined;
  const daysParam = Number(searchParams.get("days") ?? "");
  const days = daysParam === 1 || daysParam === 7 ? (daysParam as 1 | 7) : undefined;
  const kind = params.kind as ReportKind;
  console.log(`[API] /api/report/${kind}`, { date, chatId, days: days ?? 1 });
  // If neither date nor days provided, default to last 24 hours

  if (!ALLOWED.includes(kind)) {
    return NextResponse.json({ ok: false, error: "Unsupported report kind" }, { status: 404 });
  }

  try {
    const report = await buildDailyReport({ date: date ?? undefined, days: days ?? 1, chatId });

    if (!report) {
      return NextResponse.json({ 
        ok: false, 
        error: "AI service temporarily unavailable. Please check your API configuration." 
      }, { status: 503 });
    }

    if (kind === "insights") {
      return NextResponse.json({ ok: true, data: report.insights });
    }

    if (kind === "generate") {
      return NextResponse.json({
        ok: true,
        data: {
          summary: report.summary,
          themes: report.themes,
          insights: report.insights
        }
      });
    }

    return NextResponse.json({ ok: true, data: report });
  } catch (error) {
    console.error(`/api/report/${kind} error`, error);
    const errorMessage = error instanceof Error ? error.message : "Failed to build report";
    const statusCode = errorMessage.includes("AI service requires") ? 503 : 500;
    return NextResponse.json({ ok: false, error: errorMessage }, { status: statusCode });
  }
}
