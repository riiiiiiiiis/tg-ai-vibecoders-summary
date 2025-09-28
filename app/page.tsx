import { MetricCard } from "@/components/metric-card";
import { TimeSeriesChart } from "@/components/time-series-chart";
import { TopUsers } from "@/components/top-users";
import { AiInsights } from "@/components/ai-insights";
import { SummaryGenerator } from "@/components/summary-generator";
import { fetchOverview } from "@/lib/queries";

type PageProps = {
  searchParams?: Record<string, string | string[]>;
};

export default async function Dashboard24h({ searchParams }: PageProps) {
  const chatParam = searchParams?.["chat_id"];
  const chatId = Array.isArray(chatParam) ? chatParam[0] : chatParam;

  const metrics = await fetchOverview({ chatId, window: 1 });
  const date = new Date();
  const isoDate = date.toISOString().slice(0, 10);

  return (
    <section className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Сообщения" value={metrics.totalMessages} />
        <MetricCard label="Уникальные участники" value={metrics.uniqueUsers} />
        <MetricCard label="Сообщения со ссылками" value={metrics.linkMessages} />
      </div>

      <TimeSeriesChart series={metrics.series} windowLabel="Активность за 24 часа" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TopUsers topUsers={metrics.topUsers} />
        <AiInsights />
      </div>
      
      <SummaryGenerator chatId={chatId} date={isoDate} />
    </section>
  );
}
