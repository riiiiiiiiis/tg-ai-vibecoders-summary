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
  isSending?: boolean;
  sendSuccess?: string | null;
  sendError?: string | null;
  showPreview?: boolean;
  previewText?: string | null;
};

type MultiStyleSummaryGeneratorProps = {
  chatId?: string;
  threadId?: string;
  date: string;
};

const PERSONAS = [
  { 
    key: 'daily-summary' as PersonaType, 
    title: '📊 Дневной суммаризатор', 
    description: 'Структурированный отчет дня',
    color: '#0d9488'
  },
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
    key: 'ai-psychologist' as PersonaType, 
    title: '🤖 AI-Психолог', 
    description: 'Психоанализ + AI модели личности',
    color: '#8b5cf6'
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
  if (persona === 'daily-summary') {
    return (
      <>
        {data.day_overview && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ 
              margin: '0 0 0.75rem 0', 
              color: color,
              fontSize: '1rem',
              fontWeight: '600'
            }}>
              🌅 Обзор дня
            </h4>
            <p style={{ 
              lineHeight: '1.6', 
              margin: 0,
              color: '#374151',
              fontStyle: 'italic'
            }}>
              {data.day_overview}
            </p>
          </div>
        )}
        
        {data.key_events && data.key_events.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ 
              margin: '0 0 0.75rem 0', 
              color: color,
              fontSize: '1rem',
              fontWeight: '600'
            }}>
              ✈️ Ключевые события
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1rem', lineHeight: '1.5' }}>
              {data.key_events.map((event: {time: string, event: string, importance: string}, index: number) => (
                <li key={`event-${index}`} style={{ marginBottom: '0.75rem', color: '#374151' }}>
                  <strong style={{ color: color }}>{event.time}</strong>
                  {event.importance === 'high' && <span style={{color: '#dc2626', fontSize: '0.8rem'}}> 🔴</span>}
                  {event.importance === 'medium' && <span style={{color: '#d97706', fontSize: '0.8rem'}}> 🟡</span>}
                  {event.importance === 'low' && <span style={{color: '#059669', fontSize: '0.8rem'}}> 🟢</span>}
                  <br />
                  <span style={{ fontSize: '0.9rem' }}>{event.event}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {data.participant_highlights && data.participant_highlights.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ 
              margin: '0 0 0.75rem 0', 
              color: color,
              fontSize: '1rem',
              fontWeight: '600'
            }}>
              🎆 Ключевые участники
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1rem', lineHeight: '1.5' }}>
              {data.participant_highlights.map((participant: {name: string, contribution: string, impact: string}, index: number) => (
                <li key={`participant-${index}`} style={{ marginBottom: '0.75rem', color: '#374151' }}>
                  <strong style={{ color: color }}>{participant.name}</strong>
                  <br />
                  <span style={{ fontSize: '0.85rem' }}><em>{participant.contribution}</em></span>
                  <br />
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Влияние: {participant.impact}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {data.shared_links && data.shared_links.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ 
              margin: '0 0 0.75rem 0', 
              color: color,
              fontSize: '1rem',
              fontWeight: '600'
            }}>
              🔗 Опубликованные ссылки ({data.shared_links.length})
            </h4>
            <div style={{ 
              maxHeight: '300px', 
              overflowY: 'auto', 
              border: '1px solid #e2e8f0', 
              borderRadius: '6px',
              padding: '0.5rem'
            }}>
              {data.shared_links.map((link: {url: string, domain: string, shared_by: string, shared_at: string, context?: string, category?: string}, index: number) => (
                <div key={`link-${index}`} style={{ 
                  marginBottom: '0.75rem', 
                  padding: '0.5rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '4px',
                  borderLeft: `3px solid ${color}`
                }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>
                    {link.shared_at} • <strong style={{ color: color }}>{link.shared_by}</strong>
                    {link.category && <span style={{ marginLeft: '0.5rem', padding: '0.1rem 0.4rem', backgroundColor: color, color: 'white', borderRadius: '3px', fontSize: '0.7rem' }}>{link.category}</span>}
                  </div>
                  <div style={{ marginBottom: '0.25rem' }}>
                    <strong style={{ color: '#1f2937' }}>{link.domain}</strong>
                  </div>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ 
                    color: '#2563eb', 
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    wordBreak: 'break-all'
                  }}>
                    {link.url.length > 60 ? `${link.url.substring(0, 60)}...` : link.url}
                  </a>
                  {link.context && (
                    <div style={{ fontSize: '0.8rem', color: '#4b5563', marginTop: '0.25rem', fontStyle: 'italic' }}>
                      {link.context}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {data.link_summary && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ 
              margin: '0 0 0.75rem 0', 
              color: color,
              fontSize: '1rem',
              fontWeight: '600'
            }}>
              📊 Статистика ссылок
            </h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '1rem',
              backgroundColor: '#f8fafc',
              padding: '1rem',
              borderRadius: '6px',
              fontSize: '0.85rem'
            }}>
              <div>
                <strong>Всего ссылок:</strong> {data.link_summary.total_links}
                <br />
                <strong>Уникальных доменов:</strong> {data.link_summary.unique_domains.length}
              </div>
              <div>
                <strong>Топ домены:</strong><br />
                {data.link_summary.unique_domains.slice(0, 3).map((domain: string, idx: number) => (
                  <span key={`domain-${idx}`} style={{ display: 'block', color: '#4b5563' }}>• {domain}</span>
                ))}
              </div>
            </div>
            
            {data.link_summary.top_sharers && data.link_summary.top_sharers.length > 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                <strong style={{ color: color }}>Топ шерщики ссылок:</strong>
                <div style={{ marginTop: '0.5rem' }}>
                  {data.link_summary.top_sharers.map((sharer: {name: string, count: number}, idx: number) => (
                    <span key={`sharer-${idx}`} style={{ 
                      display: 'inline-block', 
                      margin: '0.2rem 0.5rem 0.2rem 0',
                      padding: '0.25rem 0.5rem',
                      backgroundColor: '#e0f2fe',
                      color: '#0277bd',
                      borderRadius: '12px',
                      fontSize: '0.8rem'
                    }}>
                      {sharer.name} ({sharer.count})
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {data.link_summary.categories && data.link_summary.categories.length > 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                <strong style={{ color: color }}>По категориям:</strong>
                <div style={{ marginTop: '0.5rem' }}>
                  {data.link_summary.categories.map((cat: {name: string, count: number, examples: string[]}, idx: number) => (
                    <div key={`category-${idx}`} style={{ marginBottom: '0.5rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.5rem',
                        backgroundColor: color,
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        marginRight: '0.5rem'
                      }}>
                        {cat.name} ({cat.count})
                      </span>
                      {cat.examples && cat.examples.length > 0 && (
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {cat.examples.slice(0, 2).join(', ')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {data.discussion_topics && data.discussion_topics.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ 
              margin: '0 0 0.75rem 0', 
              color: color,
              fontSize: '1rem',
              fontWeight: '600'
            }}>
              💬 Обсуждения
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1rem', lineHeight: '1.5' }}>
              {data.discussion_topics.map((topic: string, index: number) => (
                <li key={`topic-${index}`} style={{ marginBottom: '0.5rem', color: '#374151' }}>
                  {topic}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {data.daily_metrics && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ 
              margin: '0 0 0.75rem 0', 
              color: color,
              fontSize: '1rem',
              fontWeight: '600'
            }}>
              📊 Метрики дня
            </h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '0.5rem', 
              backgroundColor: '#f8fafc',
              padding: '0.75rem',
              borderRadius: '6px',
              fontSize: '0.85rem'
            }}>
              <div><strong>Активность:</strong> {data.daily_metrics.activity_level}</div>
              <div><strong>Качество:</strong> {data.daily_metrics.engagement_quality}</div>
              <div><strong>Настроение:</strong> {data.daily_metrics.mood_tone}</div>
              <div><strong>Продуктивность:</strong> {data.daily_metrics.productivity}</div>
            </div>
          </div>
        )}
        
        {data.next_day_forecast && data.next_day_forecast.length > 0 && (
          <div>
            <h4 style={{ 
              margin: '0 0 0.75rem 0', 
              color: color,
              fontSize: '1rem',
              fontWeight: '600'
            }}>
              🔮 Прогноз на завтра
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1rem', lineHeight: '1.5' }}>
              {data.next_day_forecast.map((forecast: string, index: number) => (
                <li key={`forecast-${index}`} style={{ marginBottom: '0.5rem', color: '#374151' }}>
                  {forecast}
                </li>
              ))}
            </ul>
          </div>
        )}
      </>
    );
  }
  
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
  
  if (persona === 'ai-psychologist') {
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
              🌊 Групповая атмосфера
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
        
        {data.ai_model_personalities && data.ai_model_personalities.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ 
              margin: '0 0 0.75rem 0', 
              color: color,
              fontSize: '1rem',
              fontWeight: '600'
            }}>
              🤖 AI-модели личности
            </h4>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {data.ai_model_personalities.map((personality: {name: string, ai_model: string, confidence: string, reasoning: string, traditional_archetype: string}, index: number) => (
                <div key={`ai-personality-${index}`} style={{ 
                  padding: '0.75rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${color}`
                }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong style={{ color: color, fontSize: '0.95rem' }}>{personality.name}</strong>
                    <span style={{ 
                      marginLeft: '0.5rem',
                      padding: '0.2rem 0.5rem',
                      backgroundColor: personality.ai_model === 'GPT-5' ? '#10b981' :
                                      personality.ai_model === 'Claude Sonnet 4.5' ? '#f59e0b' :
                                      personality.ai_model === 'Gemini 2.5 Pro' ? '#3b82f6' :
                                      personality.ai_model === 'GLM-4' ? '#ef4444' :
                                      personality.ai_model === 'DeepSeek V3' ? '#6366f1' :
                                      personality.ai_model === 'Llama 3.3' ? '#8b5cf6' :
                                      personality.ai_model === 'Qwen 2.5' ? '#06b6d4' :
                                      personality.ai_model === 'Mistral Large' ? '#84cc16' : '#64748b',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {personality.ai_model}
                    </span>
                    <span style={{ 
                      marginLeft: '0.5rem',
                      padding: '0.2rem 0.5rem',
                      backgroundColor: personality.confidence === 'high' ? '#10b981' :
                                      personality.confidence === 'medium' ? '#f59e0b' : '#ef4444',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: '500'
                    }}>
                      {personality.confidence === 'high' ? '🎯 высокая' : 
                       personality.confidence === 'medium' ? '🤔 средняя' : '❓ низкая'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>
                    Психотип: <em>{personality.traditional_archetype}</em>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#374151', lineHeight: '1.4' }}>
                    {personality.reasoning}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {data.ai_model_distribution && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ 
              margin: '0 0 0.75rem 0', 
              color: color,
              fontSize: '1rem',
              fontWeight: '600'
            }}>
              📊 Распределение AI-моделей
            </h4>
            <div style={{ 
              padding: '1rem',
              backgroundColor: '#f1f5f9',
              borderRadius: '8px',
              border: `2px solid ${color}20`
            }}>
              <div style={{ marginBottom: '0.75rem' }}>
                <strong style={{ color: color }}>Доминирующая модель:</strong> {data.ai_model_distribution.dominant_model}
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <strong style={{ color: color }}>Разнообразие:</strong> 
                <span style={{ 
                  marginLeft: '0.5rem',
                  padding: '0.2rem 0.5rem',
                  backgroundColor: data.ai_model_distribution.diversity_score === 'high' ? '#10b981' :
                                  data.ai_model_distribution.diversity_score === 'medium' ? '#f59e0b' : '#ef4444',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: '500'
                }}>
                  {data.ai_model_distribution.diversity_score === 'high' ? '🌈 высокое' : 
                   data.ai_model_distribution.diversity_score === 'medium' ? '🔄 среднее' : '📍 низкое'}
                </span>
              </div>
              {data.ai_model_distribution.model_counts && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <strong style={{ color: color }}>Распределение:</strong>
                  <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {Object.entries(data.ai_model_distribution.model_counts).map(([model, count]) => (
                      <span key={model} style={{ 
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#ffffff',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        color: '#374151'
                      }}>
                        {model}: {String(count)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <strong style={{ color: color }}>Химия взаимодействий:</strong>
                <div style={{ 
                  marginTop: '0.5rem',
                  fontSize: '0.9rem',
                  color: '#374151',
                  lineHeight: '1.5',
                  fontStyle: 'italic'
                }}>
                  {data.ai_model_distribution.interaction_chemistry}
                </div>
              </div>
            </div>
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
            color: '#374151',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word'
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

export function MultiStyleSummaryGenerator({ chatId, threadId, date }: MultiStyleSummaryGeneratorProps) {
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
      if (threadId) {
        params.set('thread_id', threadId);
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
        if (threadId) {
          params.set('thread_id', threadId);
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

  const showTelegramPreview = async (persona: PersonaType, reportData: any) => {
    setReports(prev => prev.map(r => 
      r.persona === persona 
        ? { ...r, isSending: true, sendSuccess: null, sendError: null, showPreview: false, previewText: null }
        : r
    ));

    try {
      const params = new URLSearchParams({ date });
      params.set('days', '1');
      if (chatId) {
        params.set('chat_id', chatId);
      }
      if (threadId) {
        params.set('thread_id', threadId);
      }
      params.set('persona', persona);
      params.set('preview', 'true'); // Добавляем параметр для предпросмотра

      const response = await fetch(`/api/send-to-telegram?${params}`, {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          persona,
          ...reportData
        }),
      });
      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || 'Не удалось получить предпросмотр');
      }

      setReports(prev => prev.map(r => 
        r.persona === persona 
          ? { ...r, isSending: false, showPreview: true, previewText: result.preview || result.message }
          : r
      ));
    } catch (err) {
      setReports(prev => prev.map(r => 
        r.persona === persona 
          ? { ...r, isSending: false, sendError: err instanceof Error ? err.message : 'Произошла ошибка при получении предпросмотра' }
          : r
      ));
    }
  };

  const closePreview = (persona: PersonaType) => {
    setReports(prev => prev.map(r => 
      r.persona === persona 
        ? { ...r, showPreview: false, previewText: null }
        : r
    ));
  };

  const confirmSendToTelegram = async (persona: PersonaType, reportData: any) => {
    setReports(prev => prev.map(r => 
      r.persona === persona 
        ? { ...r, isSending: true, sendSuccess: null, sendError: null, showPreview: false }
        : r
    ));

    try {
      const params = new URLSearchParams({ date });
      params.set('days', '1');
      if (chatId) {
        params.set('chat_id', chatId);
      }
      if (threadId) {
        params.set('thread_id', threadId);
      }
      params.set('persona', persona);

      const response = await fetch(`/api/send-to-telegram?${params}`, {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          persona,
          ...reportData
        }),
      });
      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || 'Не удалось отправить в Telegram');
      }

      setReports(prev => prev.map(r => 
        r.persona === persona 
          ? { ...r, isSending: false, sendSuccess: result.message || 'Отчет успешно отправлен в Telegram!' }
          : r
      ));

      // Clear success message after 5 seconds
      setTimeout(() => {
        setReports(prev => prev.map(r => 
          r.persona === persona 
            ? { ...r, sendSuccess: null }
            : r
        ));
      }, 5000);
    } catch (err) {
      setReports(prev => prev.map(r => 
        r.persona === persona 
          ? { ...r, isSending: false, sendError: err instanceof Error ? err.message : 'Произошла ошибка при отправке' }
          : r
      ));
    }
  };

  return (
    <div className="content-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2>Анализ в разных стилях</h2>
          <p style={{ color: '#666', fontSize: '0.9rem', margin: '0.5rem 0 0 0' }}>
            Получите 7 вариантов отчета от разных экспертов — от структурированного до циничного
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

      <div className="persona-grid">
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
                <>
                  <div style={{ fontSize: '0.9rem' }}>
                    {renderReportContent(report.data, report.persona, config.color)}
                  </div>
                  
                  {/* Telegram send button */}
                  <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                    <button
                      onClick={() => showTelegramPreview(report.persona, report.data)}
                      disabled={report.isSending}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: report.isSending ? '#94a3b8' : '#0088cc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: report.isSending ? 'not-allowed' : 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      {report.isSending ? '🔎 Загрузка...' : '👁️ Предпросмотр и отправить'}
                    </button>
                    
                    {report.sendSuccess && (
                      <div style={{
                        marginTop: '0.75rem',
                        padding: '0.75rem',
                        backgroundColor: '#d4edda',
                        color: '#155724',
                        borderRadius: '6px',
                        border: '1px solid #c3e6cb',
                        fontSize: '0.85rem'
                      }}>
                        ✅ {report.sendSuccess}
                      </div>
                    )}
                    
                    {report.sendError && (
                      <div style={{
                        marginTop: '0.75rem',
                        padding: '0.75rem',
                        backgroundColor: '#f8d7da',
                        color: '#721c24',
                        borderRadius: '6px',
                        border: '1px solid #f5c6cb',
                        fontSize: '0.85rem'
                      }}>
                        ❌ {report.sendError}
                      </div>
                    )}
                    
                    {/* Preview Modal */}
                    {report.showPreview && report.previewText && (
                      <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                      }}>
                        <div style={{
                          backgroundColor: 'white',
                          borderRadius: '12px',
                          padding: '2rem',
                          maxWidth: '600px',
                          width: '90%',
                          maxHeight: '80vh',
                          overflow: 'auto',
                          boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
                        }}>
                          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, color: config.color }}>👁️ Предпросмотр сообщения</h3>
                            <button
                              onClick={() => closePreview(report.persona)}
                              style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '1.5rem',
                                cursor: 'pointer',
                                color: '#64748b'
                              }}
                            >
                              ×
                            </button>
                          </div>
                          
                          <div style={{
                            padding: '1rem',
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            marginBottom: '1.5rem',
                            maxHeight: '50vh',
                            overflow: 'auto',
                            whiteSpace: 'pre-wrap',
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                            lineHeight: '1.5',
                            border: '1px solid #e2e8f0'
                          }}>
                            {report.previewText}
                          </div>
                          
                          <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                              onClick={() => closePreview(report.persona)}
                              style={{
                                flex: 1,
                                padding: '0.75rem',
                                backgroundColor: '#e2e8f0',
                                color: '#334155',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: '600'
                              }}
                            >
                              ❌ Отмена
                            </button>
                            <button
                              onClick={() => confirmSendToTelegram(report.persona, report.data)}
                              style={{
                                flex: 1,
                                padding: '0.75rem',
                                backgroundColor: config.color,
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: '600'
                              }}
                            >
                              ✅ Отправить
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
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