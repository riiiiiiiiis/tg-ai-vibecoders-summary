"use client";

import { useState } from "react";
import type { PersonaType } from "@/lib/ai";

type SummaryData = {
  summary: string;
  themes: string[];
  insights: string[];
};

type PersonaReport = {
  persona: PersonaType;
  data: SummaryData | null;
  isLoading: boolean;
  error: string | null;
};

type MultiStyleSummaryGeneratorProps = {
  chatId?: string;
  date: string;
};

const PERSONAS = [
  { 
    key: 'curator' as PersonaType, 
    title: '🎯 Куратор-реалист', 
    description: 'Честный анализ без прикрас',
    color: '#2563eb'
  },
  { 
    key: 'twitter' as PersonaType, 
    title: '🐦 Twitter-скептик', 
    description: 'Циничный взгляд со стороны',
    color: '#1da1f2'
  },
  { 
    key: 'reddit' as PersonaType, 
    title: '👽 Reddit-модератор', 
    description: 'Анализ токсичности и групп-динамики',
    color: '#ff4500'
  },
  { 
    key: 'business' as PersonaType, 
    title: '💼 Бизнес-консультант', 
    description: 'Фокус на монетизации',
    color: '#059669'
  },
  { 
    key: 'psychologist' as PersonaType, 
    title: '🧠 Психолог сообществ', 
    description: 'Групповая динамика',
    color: '#dc2626'
  },
  { 
    key: 'creative' as PersonaType, 
    title: '🚀 Креативный маркетолог', 
    description: 'Вирусный контент',
    color: '#7c3aed'
  },
];

// Функция для рендера разных типов контента в зависимости от персоны
function renderReportContent(data: any, persona: PersonaType, color: string) {
  if (persona === 'business') {
    return (
      <>
        {data.monetization_ideas && data.monetization_ideas.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ 
              margin: '0 0 0.75rem 0', 
              color: color,
              fontSize: '1rem',
              fontWeight: '600'
            }}>
              💰 Идеи монетизации
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1rem', lineHeight: '1.5' }}>
              {data.monetization_ideas.map((idea: string, index: number) => (
                <li key={`idea-${index}`} style={{ marginBottom: '0.5rem', color: '#374151' }}>
                  {idea}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {data.revenue_strategies && data.revenue_strategies.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ 
              margin: '0 0 0.75rem 0', 
              color: color,
              fontSize: '1rem',
              fontWeight: '600'
            }}>
              📈 Стратегии дохода
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1rem', lineHeight: '1.5' }}>
              {data.revenue_strategies.map((strategy: string, index: number) => (
                <li key={`strategy-${index}`} style={{ marginBottom: '0.5rem', color: '#374151' }}>
                  {strategy}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {data.roi_insights && data.roi_insights.length > 0 && (
          <div>
            <h4 style={{ 
              margin: '0 0 0.75rem 0', 
              color: color,
              fontSize: '1rem',
              fontWeight: '600'
            }}>
              🔥 ROI-инсайты
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1rem', lineHeight: '1.5' }}>
              {data.roi_insights.map((insight: string, index: number) => (
                <li key={`roi-${index}`} style={{ marginBottom: '0.5rem', color: '#374151' }}>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}
      </>
    );
  }
  
  if (persona === 'psychologist') {
    return (
      <>
        {data.group_atmosphere && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ 
              margin: '0 0 0.75rem 0', 
              color: color,
              fontSize: '1rem',
              fontWeight: '600'
            }}>
              🌡️ Атмосфера группы
            </h4>
            <p style={{ 
              lineHeight: '1.6', 
              margin: 0,
              color: '#374151',
              fontStyle: 'italic'
            }}>
              {data.group_atmosphere}
            </p>
          </div>
        )}
        
        {data.psychological_archetypes && data.psychological_archetypes.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ 
              margin: '0 0 0.75rem 0', 
              color: color,
              fontSize: '1rem',
              fontWeight: '600'
            }}>
              🎭 Психологические архетипы
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1rem', lineHeight: '1.5' }}>
              {data.psychological_archetypes.map((archetype: {name: string, archetype: string, influence: string}, index: number) => (
                <li key={`archetype-${index}`} style={{ marginBottom: '0.75rem', color: '#374151' }}>
                  <strong style={{ color: color }}>{archetype.name}</strong> 
                  <em style={{ color: '#64748b' }}>({archetype.archetype})</em>
                  <br />
                  <span style={{ fontSize: '0.85rem' }}>{archetype.influence}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {data.emotional_patterns && data.emotional_patterns.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ 
              margin: '0 0 0.75rem 0', 
              color: color,
              fontSize: '1rem',
              fontWeight: '600'
            }}>
              💡 Эмоциональные паттерны
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1rem', lineHeight: '1.5' }}>
              {data.emotional_patterns.map((pattern: string, index: number) => (
                <li key={`pattern-${index}`} style={{ marginBottom: '0.5rem', color: '#374151' }}>
                  {pattern}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {data.group_dynamics && data.group_dynamics.length > 0 && (
          <div>
            <h4 style={{ 
              margin: '0 0 0.75rem 0', 
              color: color,
              fontSize: '1rem',
              fontWeight: '600'
            }}>
              ⚙️ Групповая динамика
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1rem', lineHeight: '1.5' }}>
              {data.group_dynamics.map((dynamic: string, index: number) => (
                <li key={`dynamic-${index}`} style={{ marginBottom: '0.5rem', color: '#374151' }}>
                  {dynamic}
                </li>
              ))}
            </ul>
          </div>
        )}
      </>
    );
  }
  
  if (persona === 'creative') {
    return (
      <>
        {data.creative_temperature && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ 
              margin: '0 0 0.75rem 0', 
              color: color,
              fontSize: '1rem',
              fontWeight: '600'
            }}>
              🌡️ Креативная температура
            </h4>
            <p style={{ 
              lineHeight: '1.6', 
              margin: 0,
              color: '#374151',
              fontStyle: 'italic'
            }}>
              {data.creative_temperature}
            </p>
          </div>
        )}
        
        {data.viral_concepts && data.viral_concepts.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ 
              margin: '0 0 0.75rem 0', 
              color: color,
              fontSize: '1rem',
              fontWeight: '600'
            }}>
              🚀 Вирусные концепции
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1rem', lineHeight: '1.5' }}>
              {data.viral_concepts.map((concept: string, index: number) => (
                <li key={`concept-${index}`} style={{ marginBottom: '0.5rem', color: '#374151' }}>
                  {concept}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {data.content_formats && data.content_formats.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ 
              margin: '0 0 0.75rem 0', 
              color: color,
              fontSize: '1rem',
              fontWeight: '600'
            }}>
              🎨 Контент-форматы
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1rem', lineHeight: '1.5' }}>
              {data.content_formats.map((format: string, index: number) => (
                <li key={`format-${index}`} style={{ marginBottom: '0.5rem', color: '#374151' }}>
                  {format}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {data.trend_opportunities && data.trend_opportunities.length > 0 && (
          <div>
            <h4 style={{ 
              margin: '0 0 0.75rem 0', 
              color: color,
              fontSize: '1rem',
              fontWeight: '600'
            }}>
              🔥 Трендовые возможности
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1rem', lineHeight: '1.5' }}>
              {data.trend_opportunities.map((opportunity: string, index: number) => (
                <li key={`opportunity-${index}`} style={{ marginBottom: '0.5rem', color: '#374151' }}>
                  {opportunity}
                </li>
              ))}
            </ul>
          </div>
        )}
      </>
    );
  }
  
  // Стандартный формат для curator, twitter, reddit
  return (
    <>
      {data.summary && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ 
            margin: '0 0 0.75rem 0', 
            color: color,
            fontSize: '1rem',
            fontWeight: '600'
          }}>
            📋 Сводка
          </h4>
          <p style={{ 
            lineHeight: '1.6', 
            margin: 0,
            color: '#374151'
          }}>
            {data.summary}
          </p>
        </div>
      )}

      {data.themes && data.themes.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ 
            margin: '0 0 0.75rem 0', 
            color: color,
            fontSize: '1rem',
            fontWeight: '600'
          }}>
            🎯 Темы
          </h4>
          <ul style={{ margin: 0, paddingLeft: '1rem', lineHeight: '1.5' }}>
            {data.themes.map((theme: string, index: number) => (
              <li key={`theme-${index}`} style={{ marginBottom: '0.5rem', color: '#374151' }}>
                {theme}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.insights && data.insights.length > 0 && (
        <div>
          <h4 style={{ 
            margin: '0 0 0.75rem 0', 
            color: color,
            fontSize: '1rem',
            fontWeight: '600'
          }}>
            💡 Инсайты
          </h4>
          <ul style={{ margin: 0, paddingLeft: '1rem', lineHeight: '1.5' }}>
            {data.insights.map((insight: string, index: number) => (
              <li key={`insight-${index}`} style={{ marginBottom: '0.5rem', color: '#374151' }}>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

export function MultiStyleSummaryGenerator({ chatId, date }: MultiStyleSummaryGeneratorProps) {
  const [reports, setReports] = useState<PersonaReport[]>(
    PERSONAS.map(persona => ({
      persona: persona.key,
      data: null,
      isLoading: false,
      error: null
    }))
  );
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

  const generateSingleReport = async (persona: PersonaType) => {
    setReports(prev => prev.map(r => 
      r.persona === persona 
        ? { ...r, isLoading: true, error: null }
        : r
    ));

    try {
      const params = new URLSearchParams({ date });
      params.set('days', '1');
      if (chatId) {
        params.set('chat_id', chatId);
      }
      params.set('persona', persona);
      params.set('t', String(Date.now()));

      const response = await fetch(`/api/report/generate?${params}`, { 
        cache: 'no-store', 
        method: 'GET' 
      });
      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || 'Не удалось сгенерировать отчет');
      }

      setReports(prev => prev.map(r => 
        r.persona === persona 
          ? { ...r, data: result.data, isLoading: false }
          : r
      ));
    } catch (err) {
      setReports(prev => prev.map(r => 
        r.persona === persona 
          ? { ...r, error: err instanceof Error ? err.message : 'Произошла ошибка', isLoading: false }
          : r
      ));
    }
  };

  const generateAllReports = async () => {
    setIsGeneratingAll(true);
    setReports(prev => prev.map(r => ({ ...r, isLoading: true, error: null })));
    
    const promises = PERSONAS.map(async (personaConfig) => {
      try {
        const params = new URLSearchParams({ date });
        params.set('days', '1');
        if (chatId) {
          params.set('chat_id', chatId);
        }
        params.set('persona', personaConfig.key);
        params.set('t', String(Date.now()));

        const response = await fetch(`/api/report/generate?${params}`, { 
          cache: 'no-store', 
          method: 'GET' 
        });
        const result = await response.json();

        if (!result.ok) {
          throw new Error(result.error || 'Не удалось сгенерировать отчет');
        }

        return { persona: personaConfig.key, data: result.data, error: null };
      } catch (err) {
        return { 
          persona: personaConfig.key, 
          data: null, 
          error: err instanceof Error ? err.message : 'Произошла ошибка' 
        };
      }
    });

    const results = await Promise.all(promises);
    
    setReports(prev => prev.map(r => {
      const result = results.find(res => res.persona === r.persona);
      return {
        ...r,
        data: result?.data || null,
        error: result?.error || null,
        isLoading: false
      };
    }));

    setIsGeneratingAll(false);
  };

  const getPersonaConfig = (persona: PersonaType) => 
    PERSONAS.find(p => p.key === persona) || PERSONAS[0];

  return (
    <div className="content-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2>Анализ в разных стилях</h2>
          <p style={{ color: '#666', fontSize: '0.9rem', margin: '0.5rem 0 0 0' }}>
            Получите 6 вариантов отчета от разных экспертов — от честного до циничного
          </p>
        </div>
        <button 
          onClick={generateAllReports} 
          disabled={isGeneratingAll}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            fontWeight: '600',
            backgroundColor: isGeneratingAll ? '#94a3b8' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isGeneratingAll ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          {isGeneratingAll ? '⚡ Генерирую все...' : '⚡ Генерировать все'}
        </button>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', 
        gap: '1.5rem' 
      }}>
        {reports.map(report => {
          const config = getPersonaConfig(report.persona);
          return (
            <div 
              key={report.persona} 
              style={{ 
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1.5rem',
                backgroundColor: '#fff',
                position: 'relative',
                minHeight: '400px'
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '1rem',
                borderBottom: `3px solid ${config.color}`,
                paddingBottom: '0.75rem'
              }}>
                <div>
                  <h3 style={{ 
                    margin: 0, 
                    color: config.color, 
                    fontSize: '1.1rem',
                    fontWeight: '700'
                  }}>
                    {config.title}
                  </h3>
                  <p style={{ 
                    margin: '0.25rem 0 0 0', 
                    color: '#64748b', 
                    fontSize: '0.85rem' 
                  }}>
                    {config.description}
                  </p>
                </div>
                <button
                  onClick={() => generateSingleReport(report.persona)}
                  disabled={report.isLoading}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.85rem',
                    backgroundColor: config.color,
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: report.isLoading ? 'not-allowed' : 'pointer',
                    opacity: report.isLoading ? 0.7 : 1,
                    transition: 'opacity 0.2s'
                  }}
                >
                  {report.isLoading ? '⏳' : '🔄'}
                </button>
              </div>

              {report.isLoading && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '200px',
                  color: '#64748b'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🤖</div>
                    <div>Генерирую отчет...</div>
                  </div>
                </div>
              )}

              {report.error && (
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  borderRadius: '6px',
                  border: '1px solid #fecaca',
                  textAlign: 'center'
                }}>
                  ❌ {report.error}
                </div>
              )}

              {report.data && (
                <div style={{ fontSize: '0.9rem' }}>
                  {renderReportContent(report.data, report.persona, config.color)}
                </div>
              )}

              {!report.data && !report.isLoading && !report.error && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '200px',
                  color: '#94a3b8',
                  textAlign: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📝</div>
                    <div>Нажмите кнопку для генерации</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}