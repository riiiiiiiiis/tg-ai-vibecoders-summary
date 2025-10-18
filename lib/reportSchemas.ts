import { z } from "zod";

// Универсальная схема (для curator, twitter, reddit)
export const reportSchema = z.object({
  summary: z.string().min(10),
  themes: z.array(z.string()).max(8),
  insights: z.array(z.string()).max(8)
});

// Бизнес-консультант: только идеи и стратегии
export const businessReportSchema = z.object({
  monetization_ideas: z.array(z.string()).min(3).max(6),
  revenue_strategies: z.array(z.string()).min(3).max(6),
  roi_insights: z.array(z.string()).min(3).max(5)
});

// Психолог: шуточный AI-детектив угадывающий модели
export const psychologyReportSchema = z.object({
  intro: z.string().min(50).max(500),
  participants: z.array(z.object({
    name: z.string(),
    model: z.enum([
      // OpenAI
      'GPT-5 Pro',
      'GPT-5-codex',
      'o3',
      'o3-mini',
      'o4-mini',
      'GPT-4o',
      // Anthropic
      'Claude Sonnet 4',
      'Claude Sonnet 4.5',
      'Claude Opus 4',
      'Claude Haiku 4.5',
      // Google
      'Gemini 2.5 Pro',
      'Gemini 2.5 Flash',
      'Gemini 2.5 Flash-Lite',
      // Meta
      'Llama 4 Scout',
      'Llama 4 Maverick',
      'Llama 3.3 70B',
      // DeepSeek
      'DeepSeek V3',
      'DeepSeek V3.2-Exp',
      'DeepSeek R1',
      // Qwen
      'Qwen3',
      'Qwen3 Max',
      'Qwen3 235B-A22B',
      // Mistral
      'Mistral Large 2',
      'Mistral Medium 3',
      'Codestral 25',
      // Others
      'GLM-4.5',
      'GLM-4.6',
      'Grok 3',
      'Kimi K2'
    ]),
    confidence: z.enum(['low', 'medium', 'high']),
    reasoning: z.string().min(50).max(800)
  })).min(5).max(10),
  summary: z.string().min(100).max(600).optional()
});

// Креативный: только контент-идеи и тренды
export const creativeReportSchema = z.object({
  creative_temperature: z.string().min(50).max(800),
  viral_concepts: z.array(z.string()).min(4).max(7),
  content_formats: z.array(z.string()).min(3).max(6),
  trend_opportunities: z.array(z.string()).min(3).max(5)
});

// AI-Психолог: психологический анализ + сопоставление с AI-моделями
export const aiPsychologistReportSchema = z.object({
  group_atmosphere: z.string().min(50).max(400),
  psychological_archetypes: z.array(z.object({
    name: z.string(),
    archetype: z.string(),
    influence: z.string()
  })).min(4).max(8),
  ai_model_personalities: z.array(z.object({
    name: z.string(),
    ai_model: z.enum(['GPT-5', 'Claude Sonnet 4.5', 'Gemini 2.5 Pro', 'GLM-4', 'DeepSeek V3', 'Llama 3.3', 'Qwen 2.5', 'Mistral Large']),
    confidence: z.enum(['high', 'medium', 'low']),
    reasoning: z.string().min(20).max(1000),
    traditional_archetype: z.string()
  })).min(4).max(8),
  emotional_patterns: z.array(z.string()).min(3).max(6),
  group_dynamics: z.array(z.string()).min(3).max(5),
  ai_model_distribution: z.object({
    dominant_model: z.string(),
    model_counts: z.record(z.string(), z.number()),
    diversity_score: z.enum(['high', 'medium', 'low']),
    interaction_chemistry: z.string().min(50).max(800)
  })
});
export const dailySummaryReportSchema = z.object({
  day_overview: z.string().min(100).max(300),
  key_events: z.array(z.object({
    time: z.string(),
    event: z.string(),
    importance: z.enum(['high', 'medium', 'low'])
  })).min(3).max(8),
  participant_highlights: z.array(z.object({
    name: z.string(),
    contribution: z.string(),
    impact: z.string()
  })).min(3).max(6),
  shared_links: z.array(z.object({
    url: z.string(),
    domain: z.string(),
    shared_by: z.string(),
    shared_at: z.string(),
    context: z.string().optional(),
    category: z.string().optional()
  })).min(0).max(20),
  link_summary: z.object({
    total_links: z.number(),
    unique_domains: z.array(z.string()),
    top_sharers: z.array(z.object({
      name: z.string(),
      count: z.number()
    })),
    categories: z.array(z.object({
      name: z.string(),
      count: z.number(),
      examples: z.array(z.string())
    }))
  }),
  discussion_topics: z.array(z.string()).min(3).max(7),
  daily_metrics: z.object({
    activity_level: z.enum(['низкий', 'средний', 'высокий', 'очень высокий']),
    engagement_quality: z.enum(['поверхностное', 'среднее', 'глубокое', 'интенсивное']),
    mood_tone: z.enum(['позитивное', 'нейтральное', 'смешанное', 'напряженное']),
    productivity: z.enum(['низкая', 'средняя', 'высокая', 'очень высокая'])
  }),
  next_day_forecast: z.array(z.string()).min(2).max(4)
});

export type ParsedReport = z.infer<typeof reportSchema>;
export type BusinessReport = z.infer<typeof businessReportSchema>;
export type PsychologyReport = z.infer<typeof psychologyReportSchema>;
export type CreativeReport = z.infer<typeof creativeReportSchema>;
export type DailySummaryReport = z.infer<typeof dailySummaryReportSchema>;
export type AiPsychologistReport = z.infer<typeof aiPsychologistReportSchema>;

export type AnyReport = ParsedReport | BusinessReport | PsychologyReport | CreativeReport | DailySummaryReport | AiPsychologistReport;

export type PersonaType = 'curator' | 'business' | 'psychologist' | 'ai-psychologist' | 'creative' | 'twitter' | 'reddit' | 'daily-summary';
