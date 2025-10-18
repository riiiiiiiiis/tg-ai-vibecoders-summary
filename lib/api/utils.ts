import { NextResponse } from 'next/server';
import type { PersonaType } from '../reportSchemas';

/**
 * Parsed report parameters from API request
 */
export interface ReportParams {
  date?: string;
  chatId?: string;
  threadId?: string;
  days: 1 | 7;
  persona?: PersonaType;
}

/**
 * Parse and validate common report parameters from search params
 */
export function parseReportParams(searchParams: URLSearchParams): ReportParams {
  const date = searchParams.get('date') || undefined;
  const chatId = searchParams.get('chat_id') || undefined;
  const threadId = searchParams.get('thread_id') || undefined;
  const daysParam = searchParams.get('days');
  const personaParam = searchParams.get('persona');
  
  // Validate days parameter
  const days = daysParam === '7' ? 7 : 1;
  
  // Validate persona parameter
  const validPersonas: PersonaType[] = ['curator', 'business', 'psychologist', 'ai-psychologist', 'creative', 'twitter', 'reddit', 'daily-summary'];
  const persona = personaParam && validPersonas.includes(personaParam as PersonaType) 
    ? (personaParam as PersonaType) 
    : undefined;
  
  // Validate date format if provided (YYYY-MM-DD)
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD`);
  }
  
  return {
    date,
    chatId,
    threadId,
    days,
    persona
  };
}

/**
 * Build standardized error response
 */
export function buildErrorResponse(error: unknown, context?: string): NextResponse {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  const logPrefix = context ? `[${context}]` : '[API Error]';
  
  console.error(`${logPrefix}`, error);
  
  // Determine status code based on error type
  let status = 500;
  if (errorMessage.includes('Invalid') || errorMessage.includes('required')) {
    status = 400; // Bad Request
  } else if (errorMessage.includes('not found')) {
    status = 404; // Not Found
  } else if (errorMessage.includes('AI service') || errorMessage.includes('OpenRouter')) {
    status = 503; // Service Unavailable
  }
  
  return NextResponse.json(
    { ok: false, error: errorMessage },
    { status }
  );
}

/**
 * Build standardized success response
 */
export function buildSuccessResponse<T>(data: T): NextResponse {
  return NextResponse.json({ ok: true, data });
}

/**
 * Validate required environment variables
 */
export function validateRequiredEnv(vars: string[]): void {
  const missing = vars.filter(varName => !process.env[varName]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}