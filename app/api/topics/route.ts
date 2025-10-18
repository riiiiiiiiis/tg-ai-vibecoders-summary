import { NextRequest } from "next/server";
import { fetchForumTopics } from "@/lib/queries";
import { parseReportParams, buildErrorResponse, buildSuccessResponse } from "@/lib/api/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { chatId, days } = parseReportParams(searchParams);

    const topics = await fetchForumTopics({ chatId, window: days });
    
    return buildSuccessResponse(topics);
  } catch (error) {
    return buildErrorResponse(error, '/api/topics');
  }
}
