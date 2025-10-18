import type { ReportPayload, PersonaReportPayload } from './types';

// Telegram API types
export type TelegramMessage = {
  chat_id: string;
  text: string;
  parse_mode: 'HTML' | 'Markdown' | 'MarkdownV2';
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

// ========================================
// FORMATTING HELPERS (DRY)
// ========================================

/**
 * Build header for report
 */
function _buildHeader(title: string, date: string, subtitle?: string): string[] {
  const lines: string[] = [];
  lines.push(`🤖 <b>${title}</b>`);
  lines.push(`📅 <i>${formatDateForDisplay(date)}</i>`);
  if (subtitle) {
    lines.push(`🔮 <b>${subtitle}</b>`);
  }
  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━━━━━━');
  lines.push('');
  return lines;
}

/**
 * Build section divider
 */
function _buildDivider(): string[] {
  return ['• • • • • • • • • • • • • • • •', ''];
}

/**
 * Build footer for report
 */
function _buildFooter(): string[] {
  const lines: string[] = [];
  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━━━━━━');
  lines.push('🔮 <i>Создано AI-аналитиком</i>');
  lines.push(`⚡️ <i>${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</i>`);
  return lines;
}

/**
 * Build numbered list section
 */
function _buildNumberedList(emoji: string, title: string, items: string[]): string[] {
  if (!items || items.length === 0) return [];
  
  const lines: string[] = [];
  lines.push(`${emoji} <b>${title}</b>`);
  lines.push('');
  items.forEach((item, idx) => {
    if (item && item.trim()) {
      lines.push(`${idx + 1}️⃣ ${escapeHTML(item.trim())}`);
    }
  });
  lines.push('');
  lines.push(..._buildDivider());
  return lines;
}

/**
 * Build bulleted list section
 */
function _buildBulletedList(emoji: string, title: string, items: string[]): string[] {
  if (!items || items.length === 0) return [];
  
  const lines: string[] = [];
  lines.push(`${emoji} <b>${title}</b>`);
  lines.push('');
  items.forEach((item) => {
    if (item && item.trim()) {
      lines.push(`▶️ ${escapeHTML(item.trim())}`);
      lines.push('');
    }
  });
  lines.push(..._buildDivider());
  return lines;
}

/**
 * Build text section
 */
function _buildTextSection(emoji: string, title: string, text: string): string[] {
  if (!text || !text.trim()) return [];
  
  const lines: string[] = [];
  lines.push(`${emoji} <b>${title}</b>`);
  lines.push('');
  lines.push(escapeHTML(text.trim()));
  lines.push('');
  lines.push(..._buildDivider());
  return lines;
}

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
 * Escape special characters for Telegram HTML
 */
function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Format date for display
 */
function formatDateForDisplay(date: string): string {
  try {
    const d = new Date(date);
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    };
    return d.toLocaleDateString('ru-RU', options);
  } catch {
    return date;
  }
}

/**
 * Format report payload into Telegram Markdown message
 * Handles both standard and persona reports
 */
export function formatSummaryForTelegram(report: ReportPayload | PersonaReportPayload): string {
  if (!report) {
    return '🤖 <b>AI Дайджест</b>\n\n❌ Отчет недоступен';
  }

  // Check if it's a persona report
  if ('persona' in report && 'data' in report) {
    return formatPersonaReport(report);
  }

  // Check if it's a daily summary report
  if ('data' in report && report.data && typeof report.data === 'object') {
    if ('day_overview' in report.data) {
      return formatDailySummaryReport(report);
    }
  }

  // Standard report format - must have summary, themes, insights
  if ('summary' in report && 'themes' in report && 'insights' in report) {
    const { date, summary, themes, insights } = report;

    const lines: string[] = [
      ..._buildHeader('AI Дайджест', date),
      ..._buildTextSection('📊', 'Краткая сводка', summary),
      ..._buildNumberedList('🎯', 'Главные темы дня', themes),
      ..._buildBulletedList('💡', 'Ключевые инсайты', insights),
      ..._buildFooter()
    ];

    return lines.join('\n');
  }

  return '🤖 <b>AI Дайджест</b>\n\n❓ Неизвестный формат отчета';
}

/**
 * Format persona report for Telegram HTML
 */
function formatPersonaReport(report: { date: string; persona?: string; data: any }): string {
  const { date, persona, data } = report;
  const lines: string[] = [
    ..._buildHeader('AI Дайджест', date, `Эксперт: ${getPersonaEmoji(persona)}`)
  ];

  if (persona === 'business') {
    lines.push(..._buildNumberedList('💰', 'Идеи монетизации', data.monetization_ideas));
    lines.push(..._buildNumberedList('📈', 'Стратегии дохода', data.revenue_strategies));
    lines.push(..._buildBulletedList('🔥', 'ROI-инсайты', data.roi_insights));
  } else if (persona === 'psychologist') {
    // NEW FORMAT: Шуточный AI-детектив
    lines.push(..._buildTextSection('🤖', 'Введение', data.intro));
    
    // Participants with model detection
    if (data.participants?.length > 0) {
      lines.push('🎭 <b>Модельные диагнозы</b>');
      lines.push('');
      
      data.participants.forEach((participant: any, idx: number) => {
        const confidenceEmoji = participant.confidence === 'high' ? '🎯' :
                               participant.confidence === 'medium' ? '🤔' : '❓';
        
        // Format name - use bold for all names (Telegram will auto-link @username)
        const nameFormatted = `<b>${escapeHTML(participant.name)}</b>`;
        
        lines.push(`${idx + 1}️⃣ ${nameFormatted}`);
        lines.push(`   <code>${escapeHTML(participant.model)}</code> ${confidenceEmoji}`);
        lines.push(`   <i>${escapeHTML(participant.reasoning)}</i>`);
        lines.push('');
      });
      
      lines.push(..._buildDivider());
    }
    
    // Summary is optional, only add if present
    if (data.summary) {
      lines.push(..._buildTextSection('📊', 'Общий вывод', data.summary));
    }
  } else if (persona === 'creative') {
    lines.push(..._buildTextSection('🌡️', 'Креативная температура', data.creative_temperature));
    lines.push(..._buildNumberedList('🚀', 'Вирусные концепции', data.viral_concepts));
    lines.push(..._buildNumberedList('🎨', 'Контент-форматы', data.content_formats));
    lines.push(..._buildBulletedList('🔥', 'Трендовые возможности', data.trend_opportunities));
  } else {
    // Generic personas (twitter, reddit, curator)
    lines.push(..._buildTextSection('📊', 'Обзор', data.summary));
    lines.push(..._buildNumberedList('🎯', 'Темы', data.themes));
    lines.push(..._buildBulletedList('💡', 'Инсайты', data.insights));
  }

  lines.push(..._buildFooter());
  return lines.join('\n');
}

/**
 * Format daily summary report for Telegram HTML
 */
function formatDailySummaryReport(report: { date: string; data: any }): string {
  const { date, data } = report;
  const lines: string[] = [
    ..._buildHeader('AI Дневной Отчет', date),
    ..._buildTextSection('🌅', 'Обзор дня', data.day_overview)
  ];

  // Key events
  if (data.key_events?.length > 0) {
    lines.push('✨ <b>Ключевые события</b>');
    lines.push('');
    
    const sortedEvents = data.key_events.sort((a: any, b: any) => {
      const importance = { high: 3, medium: 2, low: 1 };
      return importance[b.importance as keyof typeof importance] - importance[a.importance as keyof typeof importance];
    });
    
    sortedEvents.forEach((event: any, idx: number) => {
      const importanceMap: Record<string, string> = {
        high: '🔥',
        medium: '🔶',
        low: '🟡'
      };
      const importanceEmoji = importanceMap[event.importance as string] || '🔶';
      
      lines.push(`${importanceEmoji} <b>${escapeHTML(event.time)}</b>`);
      lines.push(`   ${escapeHTML(event.event)}`);
      lines.push('');
    });
    
    lines.push('• • • • • • • • • • • • • • • •');
    lines.push('');
  }

  // Participant highlights
  if (data.participant_highlights?.length > 0) {
    lines.push('🏆 <b>Яркие участники</b>');
    lines.push('');
    
    data.participant_highlights.forEach((participant: any, idx: number) => {
      lines.push(`${idx + 1}️⃣ <b>${escapeHTML(participant.name)}</b>`);
      lines.push(`   🎤 ${escapeHTML(participant.contribution)}`);
      lines.push(`   💫 ${escapeHTML(participant.impact)}`);
      lines.push('');
    });
    
    lines.push('• • • • • • • • • • • • • • • •');
    lines.push('');
  }

  // Links summary
  if (data.link_summary && data.link_summary.total_links > 0) {
    lines.push(`🔗 <b>Поделились ссылками</b> <i>(${data.link_summary.total_links})</i>`);
    lines.push('');
    
    if (data.link_summary.top_sharers?.length > 0) {
      lines.push('👑 <i>Активные командиры:</i>');
      data.link_summary.top_sharers.slice(0, 3).forEach((sharer: any) => {
        lines.push(`   • ${escapeHTML(sharer.name)} (${sharer.count})`);
      });
      lines.push('');
    }
    
    if (data.link_summary.categories?.length > 0) {
      lines.push('📊 <i>Категории:</i>');
      data.link_summary.categories.slice(0, 3).forEach((cat: any) => {
        lines.push(`   🔹 ${escapeHTML(cat.name)} (${cat.count})`);
      });
      lines.push('');
    }
    
    lines.push('• • • • • • • • • • • • • • • •');
    lines.push('');
  }

  // Discussion topics - use helper
  lines.push(..._buildBulletedList('💬', 'Обсуждаемые темы', data.discussion_topics));

  // Daily metrics
  if (data.daily_metrics) {
    lines.push('📈 <b>Метрики дня</b>');
    lines.push('');
    lines.push(`🟢 <i>Активность:</i> ${data.daily_metrics.activity_level}`);
    lines.push(`🔵 <i>Вовлеченность:</i> ${data.daily_metrics.engagement_quality}`);
    lines.push(`🟡 <i>Настроение:</i> ${data.daily_metrics.mood_tone}`);
    lines.push(`🟠 <i>Продуктивность:</i> ${data.daily_metrics.productivity}`);
    lines.push('');
    lines.push('• • • • • • • • • • • • • • • •');
    lines.push('');
  }

  // Next day forecast - custom emoji
  if (data.next_day_forecast?.length > 0) {
    lines.push('🔮 <b>Прогноз на завтра</b>');
    lines.push('');
    data.next_day_forecast.forEach((forecast: string) => {
      lines.push(`✨ ${escapeHTML(forecast)}`);
    });
    lines.push('');
  }

  lines.push(..._buildFooter());
  return lines.join('\n');
}

/**
 * Get emoji for persona type
 */
function getPersonaEmoji(persona?: string): string {
  switch (persona) {
    case 'daily-summary': return '📊 Дневной суммаризатор';
    case 'business': return '💼 Бизнес-консультант';
    case 'psychologist': return '🧠 Психолог сообществ';
    case 'creative': return '🚀 Креативный маркетолог';
    case 'twitter': return '🐦 Twitter-скептик';
    case 'reddit': return '👽 Reddit-модератор';
    case 'curator': return '🎯 Куратор-реалист';
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
        parse_mode: 'HTML',
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
