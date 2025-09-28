import { MetricCard } from "@/components/metric-card";
import { TimeSeriesChart } from "@/components/time-series-chart";
import { TopUsers } from "@/components/top-users";
import { AiInsights } from "@/components/ai-insights";
import { fetchOverview } from "@/lib/queries";
import { buildDailyReport } from "@/lib/report";

type PageProps = {
  searchParams?: Record<string, string | string[]>;
};

export default async function DashboardWeek({ searchParams }: PageProps) {
  const chatParam = searchParams?.["chat_id"];
  const chatId = Array.isArray(chatParam) ? chatParam[0] : chatParam;

  const metrics = await fetchOverview({ chatId, window: 7 });
  const today = new Date();
  const isoDate = today.toISOString().slice(0, 10);
  const report = await buildDailyReport({ date: isoDate, chatId });

  return (
    <section className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Сообщения" value={metrics.totalMessages} />
        <MetricCard label="Уникальные участники" value={metrics.uniqueUsers} />
        <MetricCard label="Сообщения со ссылками" value={metrics.linkMessages} />
      </div>

      <TimeSeriesChart series={metrics.series} windowLabel="Активность за 7 дней" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TopUsers topUsers={metrics.topUsers} />
        <AiInsights report={report} />
      </div>
    </section>
  );
}
