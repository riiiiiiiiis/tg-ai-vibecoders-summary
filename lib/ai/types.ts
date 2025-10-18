export type { PersonaType } from '../reportSchemas';
export type { 
  ParsedReport, 
  BusinessReport, 
  PsychologyReport, 
  CreativeReport, 
  DailySummaryReport, 
  AiPsychologistReport, 
  AnyReport 
} from '../reportSchemas';
export type { OverviewResponse } from '../types';

export interface PersonaPromptConfig {
  systemRole: string;
  taskDescription: string;
  outputFormat: string;
  constraints: string[];
}

export type ChatMessage = {
  role: "system" | "user";
  content: string;
};

export type GenerateReportParams = {
  date: string;
  chatId?: string;
  metrics: import('../types').OverviewResponse;
  persona?: import('../reportSchemas').PersonaType;
  text?: string;
  links?: Array<{ timestamp: Date; label: string; text: string; links: string[] }>;
};