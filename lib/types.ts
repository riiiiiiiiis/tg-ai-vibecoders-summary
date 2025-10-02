export type TopUser = {
  userId: string;
  displayName: string;
  messageCount: number;
};

export type SeriesPoint = {
  timestamp: string;
  messageCount: number;
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
  metrics: OverviewResponse;
  summary: string;
  themes: string[];
  insights: string[];
} | null;

export type PersonaReportPayload = {
  date: string;
  chatId?: string;
  metrics: OverviewResponse;
  persona?: string;
  data: any; // Это может быть ParsedReport, BusinessReport, PsychologyReport, или CreativeReport
} | null;
