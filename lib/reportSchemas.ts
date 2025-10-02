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

// Психолог: только психотипы и групповая динамика
export const psychologyReportSchema = z.object({
  group_atmosphere: z.string().min(50).max(200),
  psychological_archetypes: z.array(z.object({
    name: z.string(),
    archetype: z.string(),
    influence: z.string()
  })).min(4).max(8),
  emotional_patterns: z.array(z.string()).min(3).max(6),
  group_dynamics: z.array(z.string()).min(3).max(5)
});

// Креативный: только контент-идеи и тренды
export const creativeReportSchema = z.object({
  creative_temperature: z.string().min(50).max(200),
  viral_concepts: z.array(z.string()).min(4).max(7),
  content_formats: z.array(z.string()).min(3).max(6),
  trend_opportunities: z.array(z.string()).min(3).max(5)
});

export type ParsedReport = z.infer<typeof reportSchema>;
export type BusinessReport = z.infer<typeof businessReportSchema>;
export type PsychologyReport = z.infer<typeof psychologyReportSchema>;
export type CreativeReport = z.infer<typeof creativeReportSchema>;

export type AnyReport = ParsedReport | BusinessReport | PsychologyReport | CreativeReport;
