import type { ReportPayload } from "@/lib/types";

type AiInsightsProps = {
  report: ReportPayload;
};

export function AiInsights({ report }: AiInsightsProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <h2 className="text-sm font-semibold text-slate-200">AI дайджест</h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-300">{report.summary}</p>

      <div className="mt-4">
        <h3 className="text-xs uppercase tracking-wide text-slate-500">Темы дня</h3>
        <ul className="mt-2 space-y-2">
          {report.themes.map((theme, index) => (
            <li key={`theme-${index}`} className="text-sm text-slate-300">
              • {theme}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <h3 className="text-xs uppercase tracking-wide text-slate-500">Инсайты</h3>
        <ul className="mt-2 space-y-2">
          {report.insights.map((insight, index) => (
            <li key={`insight-${index}`} className="text-sm text-slate-300">
              • {insight}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
