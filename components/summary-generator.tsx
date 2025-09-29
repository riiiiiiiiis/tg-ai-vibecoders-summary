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
      
      params.set('t', String(Date.now()));
      const response = await fetch(`/api/report/generate?${params}` , { cache: 'no-store', method: 'GET' });
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
    <div className="content-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Генерация краткого изложения</h2>
        <button onClick={generateSummary} disabled={isLoading}>
          {isLoading ? 'Генерирую...' : 'Генерировать'}
        </button>
      </div>

      {error && (
        <div className="error">
          <p>{error}</p>
        </div>
      )}

      {generatedSummary && (
        <div>
          <div>
            <h3>Сводка</h3>
            <p>{generatedSummary.summary}</p>
          </div>

          <div>
            <h3>Темы дня</h3>
            <ul>
              {generatedSummary.themes.map((theme, index) => (
                <li key={`theme-${index}`}>• {theme}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3>Инсайты</h3>
            <ul>
              {generatedSummary.insights.map((insight, index) => (
                <li key={`insight-${index}`}>• {insight}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {!generatedSummary && !error && !isLoading && (
        <p>Нажмите кнопку выше, чтобы сгенерировать новое краткое изложение с помощью ИИ</p>
      )}
    </div>
  );
}
