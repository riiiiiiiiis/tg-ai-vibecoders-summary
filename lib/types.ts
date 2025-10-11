export type TopUser = {
  userId: string;
  displayName: string;
  messageCount: number;
};

export type SeriesPoint = {
  timestamp: string;
  messageCount: number;
};

export type ForumTopic = {
  threadId: string;
  topicName: string;
  messageCount: number;
  lastMessageAt: string;
};

export type OverviewResponse = {
  totalMessages: number;
  uniqueUsers: number;
  linkMessages: number;
  topUsers: TopUser[];
  series: SeriesPoint[];
};

export type ReportKind = "generate" | "insights" | "preview";

export type ReportPayload = {
  date: string;
  chatId?: string;
  threadId?: string;
  metrics: OverviewResponse;
  summary: string;
  themes: string[];
  insights: string[];
} | null;

export type PersonaReportPayload = {
  date: string;
  chatId?: string;
  threadId?: string;
  metrics: OverviewResponse;
  persona?: string;
  data: any; // Это может быть ParsedReport, BusinessReport, PsychologyReport, CreativeReport, или AiPsychologistReport
} | null;

// AI Model Personality Analysis Types
export type AiModelPersonality = {
  name: string;
  ai_model: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  traditional_archetype: string;
};

export type AiModelDistribution = {
  dominant_model: string;
  model_counts: Record<string, number>;
  diversity_score: 'high' | 'medium' | 'low';
  interaction_chemistry: string;
};

export type AiPsychologistReport = {
  group_atmosphere: string;
  psychological_archetypes: Array<{
    name: string;
    archetype: string;
    influence: string;
  }>;
  ai_model_personalities: AiModelPersonality[];
  emotional_patterns: string[];
  group_dynamics: string[];
  ai_model_distribution: AiModelDistribution;
};
