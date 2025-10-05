import { MetricCard } from "@/components/metric-card";
import { TopUsers } from "@/components/top-users";
import { AiInsights } from "@/components/ai-insights";
import { MultiStyleSummaryGenerator } from "@/components/multi-style-summary-generator";
import { ForumTopics } from "@/components/forum-topics";
import { fetchOverview } from "@/lib/queries";

type PageProps = {
  searchParams?: Record<string, string | string[]>;
};

export default async function DashboardWeek({ searchParams }: PageProps) {
  const chatParam = searchParams?.["chat_id"];
  const chatId = Array.isArray(chatParam) ? chatParam[0] : chatParam;

  const threadParam = searchParams?.["thread_id"];
  const threadId = Array.isArray(threadParam) ? threadParam[0] : threadParam;

  const metrics = await fetchOverview({ chatId, threadId, window: 7 });
  const date = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <ForumTopics chatId={chatId} currentThreadId={threadId} days={7} />
      
      <div className="metrics-grid">
        <MetricCard label="Сообщения" value={metrics.totalMessages} />
        <MetricCard label="Уникальные участники" value={metrics.uniqueUsers} />
        <MetricCard label="Сообщения со ссылками" value={metrics.linkMessages} />
      </div>

      <div className="content-grid">
        <TopUsers topUsers={metrics.topUsers} />
        <AiInsights />
      </div>
      
      <MultiStyleSummaryGenerator chatId={chatId} threadId={threadId} date={date} />
    </div>
  );
}
