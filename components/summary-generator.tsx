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
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const generateSummary = async () => {
    setIsLoading(true);
    setError(null);
    setSendSuccess(null);
    setSendError(null);

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

  const sendToTelegram = async () => {
    if (!generatedSummary) {
      setSendError('Сначала сгенерируйте саммари');
      return;
    }

    setIsSending(true);
    setSendSuccess(null);
    setSendError(null);

    try {
      const params = new URLSearchParams({ date });
      params.set('days', '1');
      if (chatId) {
        params.set('chat_id', chatId);
      }

      const response = await fetch(`/api/send-to-telegram?${params}`, {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          summary: generatedSummary.summary,
          themes: generatedSummary.themes,
          insights: generatedSummary.insights,
        }),
      });
      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || 'Не удалось отправить в Telegram');
      }

      setSendSuccess(result.message || 'Саммари успешно отправлено в Telegram!');
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Произошла ошибка при отправке');
    } finally {
      setIsSending(false);
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Результат</h3>
            <button
              onClick={sendToTelegram}
              disabled={isSending}
              style={{
                backgroundColor: '#0088cc',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: isSending ? 'not-allowed' : 'pointer',
                opacity: isSending ? 0.6 : 1
              }}
            >
              {isSending ? '📤 Отправляю...' : '📤 Отправить в Telegram'}
            </button>
          </div>

          {sendSuccess && (
            <div style={{
              padding: '0.75rem',
              marginBottom: '1rem',
              backgroundColor: '#d4edda',
              color: '#155724',
              borderRadius: '4px',
              border: '1px solid #c3e6cb'
            }}>
              ✅ {sendSuccess}
            </div>
          )}

          {sendError && (
            <div style={{
              padding: '0.75rem',
              marginBottom: '1rem',
              backgroundColor: '#f8d7da',
              color: '#721c24',
              borderRadius: '4px',
              border: '1px solid #f5c6cb'
            }}>
              ❌ {sendError}
            </div>
          )}

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
