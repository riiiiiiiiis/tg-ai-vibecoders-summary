import { NextResponse } from "next/server";
import { fetchOverview } from "@/lib/queries";

export const dynamic = "force-dynamic";

const ALLOWED_WINDOWS = new Set([1, 7]);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chat_id") ?? undefined;
    const daysParam = Number(searchParams.get("days") ?? "1");
    const days = ALLOWED_WINDOWS.has(daysParam as 1 | 7) ? (daysParam as 1 | 7) : 1;

    const metrics = await fetchOverview({ chatId, window: days });
    return NextResponse.json({ ok: true, data: metrics });
  } catch (error) {
    console.error("/api/overview error", error);
    return NextResponse.json({ ok: false, error: "Failed to fetch overview" }, { status: 500 });
  }
}
