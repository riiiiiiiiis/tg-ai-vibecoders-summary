/**
 * Shared query building utilities for reducing duplication
 */

export interface QueryConditions {
  conditions: string[];
  params: Array<string | Date | number>;
}

/**
 * Build time-based WHERE conditions
 * Supports both date range (from/to) and time window (e.g., "1 day")
 */
export function buildTimeRangeConditions(
  from?: Date,
  to?: Date,
  window?: 1 | 7
): QueryConditions {
  const conditions: string[] = [];
  const params: Array<string | Date | number> = [];

  if (from && to) {
    conditions.push(`sent_at >= $${params.length + 1}`);
    params.push(from);
    conditions.push(`sent_at < $${params.length + 1}`);
    params.push(to);
  } else if (window) {
    conditions.push(`sent_at >= NOW() - $${params.length + 1}::interval`);
    params.push(`${window} days`);
  }

  return { conditions, params };
}

/**
 * Build chat/thread filtering conditions
 * @param existingParams - Pass existing params array to ensure correct $N indexing
 */
export function buildChatConditions(
  chatId?: string,
  threadId?: string,
  existingParams: Array<string | Date | number> = []
): QueryConditions {
  const conditions: string[] = [];
  const params: Array<string | Date | number> = [];
  const offset = existingParams.length;

  if (chatId) {
    conditions.push(`chat_id = $${offset + params.length + 1}`);
    params.push(chatId);
  }

  if (threadId) {
    conditions.push(`message_thread_id = $${offset + params.length + 1}`);
    params.push(threadId);
  }

  return { conditions, params };
}

/**
 * Combine multiple QueryConditions into a single WHERE clause
 * Note: Conditions should already have correctly indexed parameters
 */
export function combineConditions(...conditionSets: QueryConditions[]): QueryConditions {
  const allConditions: string[] = [];
  const allParams: Array<string | Date | number> = [];

  for (const set of conditionSets) {
    allConditions.push(...set.conditions);
    allParams.push(...set.params);
  }

  return { conditions: allConditions, params: allParams };
}

/**
 * Build user display label from name components
 * Consolidated from multiple query files
 */
export function buildUserLabel(
  firstName: string | null,
  lastName: string | null,
  username: string | null
): string {
  const name = [firstName, lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");

  if (name) return name;
  if (username) return `@${username}`;
  return "Неизвестный";
}

/**
 * Build user label for AI analysis - prioritizes username for mentions
 * Used for psychologist persona to enable Telegram mentions
 */
export function buildUserLabelForAI(
  firstName: string | null,
  lastName: string | null,
  username: string | null
): string {
  // Prioritize username for Telegram mentions
  if (username) return `@${username}`;
  
  // Fallback to full name
  const name = [firstName, lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");

  if (name) return name;
  return "Неизвестный";
}
