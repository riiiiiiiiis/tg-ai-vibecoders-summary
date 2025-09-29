import { MetricCard } from "@/components/metric-card";
import { TopUsers } from "@/components/top-users";
import { AiInsights } from "@/components/ai-insights";
import { fetchOverview } from "@/lib/queries";

type PageProps = {
  searchParams?: Record<string, string | string[]>;
};

export default async function DashboardWeek({ searchParams }: PageProps) {
  const chatParam = searchParams?.["chat_id"];
  const chatId = Array.isArray(chatParam) ? chatParam[0] : chatParam;

  const metrics = await fetchOverview({ chatId, window: 7 });

  return (
    <div>
      <div className="metrics-grid">
        <MetricCard label="Сообщения" value={metrics.totalMessages} />
        <MetricCard label="Уникальные участники" value={metrics.uniqueUsers} />
        <MetricCard label="Сообщения со ссылками" value={metrics.linkMessages} />
      </div>

      <div className="content-grid">
        <TopUsers topUsers={metrics.topUsers} />
        <AiInsights />
      </div>
    </div>
  );
}
