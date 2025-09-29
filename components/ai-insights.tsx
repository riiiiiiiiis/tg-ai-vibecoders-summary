import type { ReportPayload } from "@/lib/types";

type AiInsightsProps = {
  report?: ReportPayload | null;
};

export function AiInsights({ report }: AiInsightsProps) {
  if (!report) {
    return (
      <div className="content-section">
        <h2>AI дайджест</h2>
        <p>Нажмите «Генерировать» ниже, чтобы получить AI-анализ активности.</p>
      </div>
    );
  }

  return (
    <div className="content-section">
      <h2>AI дайджест</h2>
      <p>{report.summary}</p>

      <div>
        <h3>Темы дня</h3>
        <ul>
          {report.themes.map((theme, index) => (
            <li key={`theme-${index}`}>• {theme}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3>Инсайты</h3>
        <ul>
          {report.insights.map((insight, index) => (
            <li key={`insight-${index}`}>• {insight}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
