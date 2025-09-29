"use client";

import { useState } from "react";

type SummaryData = {
  summary: string;
  themes: string[];
  insights: string[];
};

type SummaryGeneratorProps = {
  chatId?: string;
  date: string;
};

export function SummaryGenerator({ chatId, date }: SummaryGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedSummary, setGeneratedSummary] = useState<SummaryData | null>(null);

  const generateSummary = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({ date });
      params.set('days', '1');
      if (chatId) {
        params.set('chat_id', chatId);
      }
      
      const response = await fetch(`/api/report/generate?${params}`);
      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.error || 'Не удалось сгенерировать краткое изложение');
      }
      
      setGeneratedSummary(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при генерации');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200">Генерация краткого изложения</h2>
        <button
          onClick={generateSummary}
          disabled={isLoading}
          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <svg className="mr-2 h-3 w-3 animate-spin" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Генерирую...
            </>
          ) : (
            'Генерировать'
          )}
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-md bg-red-900/30 border border-red-800 p-3">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {generatedSummary && (
        <div className="mt-4 space-y-4">
          <div>
            <h3 className="text-xs uppercase tracking-wide text-slate-500 mb-2">Сводка</h3>
            <p className="text-sm leading-relaxed text-slate-300">{generatedSummary.summary}</p>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-wide text-slate-500 mb-2">Темы дня</h3>
            <ul className="space-y-1">
              {generatedSummary.themes.map((theme, index) => (
                <li key={`theme-${index}`} className="text-sm text-slate-300">
                  • {theme}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-wide text-slate-500 mb-2">Инсайты</h3>
            <ul className="space-y-1">
              {generatedSummary.insights.map((insight, index) => (
                <li key={`insight-${index}`} className="text-sm text-slate-300">
                  • {insight}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {!generatedSummary && !error && !isLoading && (
        <p className="mt-3 text-sm text-slate-400">
          Нажмите кнопку выше, чтобы сгенерировать новое краткое изложение с помощью ИИ
        </p>
      )}
    </div>
  );
}
