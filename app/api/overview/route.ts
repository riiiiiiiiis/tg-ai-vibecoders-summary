import { NextResponse } from "next/server";
import { fetchOverview } from "@/lib/queries";
import { parseReportParams, buildErrorResponse, buildSuccessResponse } from "@/lib/api/utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { chatId, threadId, days } = parseReportParams(searchParams);

    const metrics = await fetchOverview({ chatId, threadId, window: days });
    return buildSuccessResponse(metrics);
  } catch (error) {
    return buildErrorResponse(error, '/api/overview');
  }
}
