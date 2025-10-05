import type { ReportPayload, PersonaReportPayload } from './types';

// Telegram API types
export type TelegramMessage = {
  chat_id: string;
  text: string;
  parse_mode: 'Markdown' | 'MarkdownV2';
  message_thread_id?: number;
};

export type TelegramResponse = {
  ok: boolean;
  result?: any;
  error_code?: number;
  description?: string;
};

const TELEGRAM_API_URL = process.env.TELEGRAM_API_URL || 'https://api.telegram.org';
const SAFE_MESSAGE_LENGTH = 4000;

/**
 * Validate Telegram configuration from environment variables
 */
export function validateTelegramConfig(): { valid: boolean; error?: string } {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token) {
    return { valid: false, error: 'TELEGRAM_BOT_TOKEN не установлен в переменных окружения' };
  }

  if (!chatId) {
    return { valid: false, error: 'TELEGRAM_CHAT_ID не установлен в переменных окружения' };
  }

  return { valid: true };
}

/**
 * Format report payload into Telegram Markdown message
 * Handles both standard and persona reports
 */
export function formatSummaryForTelegram(report: ReportPayload | PersonaReportPayload): string {
  if (!report) {
    return '🤖 *AI Дайджест*\n\nОтчет недоступен';
  }

  // Check if it's a persona report
  if ('persona' in report && 'data' in report) {
    return formatPersonaReport(report);
  }

  // Standard report format - must have summary, themes, insights
  if ('summary' in report && 'themes' in report && 'insights' in report) {
    const { date, summary, themes, insights } = report;

    let message = `🤖 *AI Дайджест за ${date}*\n\n`;

    // Summary section
    if (summary) {
      message += `📊 *Сводка*\n${summary}\n\n`;
    }

    // Themes section
    if (themes && themes.length > 0) {
      message += `🎯 *Темы дня*\n`;
      themes.forEach((theme: string) => {
        message += `• ${theme}\n`;
      });
      message += '\n';
    }

    // Insights section
    if (insights && insights.length > 0) {
      message += `💡 *Инсайты*\n`;
      insights.forEach((insight: string) => {
        message += `• ${insight}\n`;
      });
      message += '\n';
    }

    message += '---\n_Сгенерировано AI-аналитиком_';

    return message;
  }

  return '🤖 *AI Дайджест*\n\nНеизвестный формат отчета';
}

/**
 * Format persona report for Telegram
 */
function formatPersonaReport(report: { date: string; persona?: string; data: any }): string {
  const lines: string[] = [];
  const { date, persona, data } = report;

  lines.push(`🤖 *AI Дайджест за ${date}*`);
  lines.push(`🔮 *Эксперт: ${getPersonaEmoji(persona)}*`);
  lines.push('');

  if (persona === 'business') {
    if (data.monetization_ideas?.length > 0) {
      lines.push('💰 *Идеи монетизации:*');
      data.monetization_ideas.forEach((idea: string, idx: number) => {
        lines.push(`${idx + 1}\\. ${idea}`);
      });
      lines.push('');
    }

    if (data.revenue_strategies?.length > 0) {
      lines.push('📈 *Стратегии дохода:*');
      data.revenue_strategies.forEach((strategy: string, idx: number) => {
        lines.push(`${idx + 1}\\. ${strategy}`);
      });
      lines.push('');
    }

    if (data.roi_insights?.length > 0) {
      lines.push('🔥 *ROI\\-инсайты:*');
      data.roi_insights.forEach((insight: string, idx: number) => {
        lines.push(`${idx + 1}\\. ${insight}`);
      });
    }
  } else if (persona === 'psychologist') {
    if (data.group_atmosphere) {
      lines.push('🌡️ *Атмосфера группы:*');
      lines.push(data.group_atmosphere);
      lines.push('');
    }

    if (data.psychological_archetypes?.length > 0) {
      lines.push('🎭 *Психологические архетипы:*');
      data.psychological_archetypes.forEach((archetype: any, idx: number) => {
        lines.push(`${idx + 1}\\. *${archetype.name}* \\(${archetype.archetype}\\) \\- ${archetype.influence}`);
      });
      lines.push('');
    }

    if (data.emotional_patterns?.length > 0) {
      lines.push('💡 *Эмоциональные паттерны:*');
      data.emotional_patterns.forEach((pattern: string, idx: number) => {
        lines.push(`${idx + 1}\\. ${pattern}`);
      });
      lines.push('');
    }

    if (data.group_dynamics?.length > 0) {
      lines.push('⚙️ *Групповая динамика:*');
      data.group_dynamics.forEach((dynamic: string, idx: number) => {
        lines.push(`${idx + 1}\\. ${dynamic}`);
      });
    }
  } else if (persona === 'creative') {
    if (data.creative_temperature) {
      lines.push('🌡️ *Креативная температура:*');
      lines.push(data.creative_temperature);
      lines.push('');
    }

    if (data.viral_concepts?.length > 0) {
      lines.push('🚀 *Вирусные концепции:*');
      data.viral_concepts.forEach((concept: string, idx: number) => {
        lines.push(`${idx + 1}\\. ${concept}`);
      });
      lines.push('');
    }

    if (data.content_formats?.length > 0) {
      lines.push('🎨 *Контент\\-форматы:*');
      data.content_formats.forEach((format: string, idx: number) => {
        lines.push(`${idx + 1}\\. ${format}`);
      });
      lines.push('');
    }

    if (data.trend_opportunities?.length > 0) {
      lines.push('🔥 *Трендовые возможности:*');
      data.trend_opportunities.forEach((opportunity: string, idx: number) => {
        lines.push(`${idx + 1}\\. ${opportunity}`);
      });
    }
  } else {
    // Generic personas (twitter, reddit, curator)
    if (data.summary) {
      lines.push(data.summary);
      lines.push('');
    }

    if (data.themes?.length > 0) {
      lines.push('🎯 *Темы:*');
      data.themes.forEach((theme: string, idx: number) => {
        lines.push(`${idx + 1}\\. ${theme}`);
      });
      lines.push('');
    }

    if (data.insights?.length > 0) {
      lines.push('💡 *Инсайты:*');
      data.insights.forEach((insight: string, idx: number) => {
        lines.push(`${idx + 1}\\. ${insight}`);
      });
    }
  }

  lines.push('');
  lines.push('---');
  lines.push('_Сгенерировано AI\\-аналитиком_');

  return lines.join('\n');
}

/**
 * Get emoji for persona type
 */
function getPersonaEmoji(persona?: string): string {
  switch (persona) {
    case 'business': return '💼 Бизнес\\-консультант';
    case 'psychologist': return '🧠 Психолог сообществ';
    case 'creative': return '🚀 Креативный маркетолог';
    case 'twitter': return '🐦 Twitter\\-скептик';
    case 'reddit': return '👽 Reddit\\-модератор';
    case 'curator': return '🎯 Куратор\\-реалист';
    default: return '🔮 Аналитик';
  }
}

/**
 * Split long message into multiple parts
 */
function splitMessage(message: string): string[] {
  if (message.length <= SAFE_MESSAGE_LENGTH) {
    return [message];
  }

  const parts: string[] = [];
  const lines = message.split('\n');
  let currentPart = '';

  for (const line of lines) {
    // If adding this line would exceed the limit, save current part and start new one
    if (currentPart.length + line.length + 1 > SAFE_MESSAGE_LENGTH) {
      if (currentPart) {
        parts.push(currentPart.trim());
        currentPart = '';
      }
      
      // If single line is too long, truncate it
      if (line.length > SAFE_MESSAGE_LENGTH) {
        parts.push(line.substring(0, SAFE_MESSAGE_LENGTH - 3) + '...');
        continue;
      }
    }

    currentPart += line + '\n';
  }

  if (currentPart.trim()) {
    parts.push(currentPart.trim());
  }

  return parts.length > 0 ? parts : [message.substring(0, SAFE_MESSAGE_LENGTH)];
}

/**
 * Send message to Telegram chat via Bot API
 */
export async function sendMessageToChat(
  chatId: string,
  message: string,
  threadId?: string
): Promise<{ success: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!token) {
    return { success: false, error: 'Telegram bot token не настроен' };
  }

  const url = `${TELEGRAM_API_URL}/bot${token}/sendMessage`;
  const messageParts = splitMessage(message);

  try {
    // Send all message parts
    for (let i = 0; i < messageParts.length; i++) {
      const payload: TelegramMessage = {
        chat_id: chatId,
        text: messageParts[i],
        parse_mode: 'Markdown',
      };

      // Add thread_id if provided
      if (threadId) {
        payload.message_thread_id = parseInt(threadId, 10);
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      const data: TelegramResponse = await response.json();

      if (!data.ok) {
        // Handle specific Telegram API errors
        if (data.error_code === 400) {
          return { success: false, error: 'Неверный chat_id или формат сообщения' };
        } else if (data.error_code === 401) {
          return { success: false, error: 'Неверный токен бота' };
        } else if (data.error_code === 403) {
          return { success: false, error: 'Бот не добавлен в чат или не имеет прав на отправку сообщений' };
        } else {
          return { success: false, error: data.description || 'Ошибка Telegram API' };
        }
      }

      // Small delay between messages to avoid rate limiting
      if (i < messageParts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { success: false, error: 'Превышено время ожидания ответа от Telegram' };
      }
      return { success: false, error: `Ошибка сети: ${error.message}` };
    }
    return { success: false, error: 'Неизвестная ошибка при отправке сообщения' };
  }
}
