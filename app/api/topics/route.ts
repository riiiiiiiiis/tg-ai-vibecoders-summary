import { NextRequest } from "next/server";
import { fetchForumTopics } from "@/lib/queries";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chat_id") ?? undefined;
    const daysParam = searchParams.get("days");
    const days = daysParam === "7" ? 7 : 1;

    const topics = await fetchForumTopics({ chatId, window: days });
    
    return Response.json({ ok: true, data: topics });
  } catch (error) {
    console.error("[API] /api/topics error:", error);
    return Response.json(
      { ok: false, error: "Не удалось загрузить темы форума" },
      { status: 500 }
    );
  }
}
