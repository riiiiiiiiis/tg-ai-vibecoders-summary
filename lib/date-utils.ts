/**
 * Утилиты для работы с датами
 * Обеспечивает единообразное получение дат во всем приложении
 */

/**
 * Получает текущую дату в формате YYYY-MM-DD в локальном часовом поясе
 * Использует локальное время пользователя, а не UTC
 */
export function getCurrentLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Получает текущую дату в формате YYYY-MM-DD в UTC
 */
export function getCurrentUTCDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Форматирует дату для отображения на русском языке
 */
export function formatDateForDisplay(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`); // Используем полдень, чтобы избежать проблем с часовыми поясами
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Проверяет, является ли строка валидной датой в формате YYYY-MM-DD
 */
export function isValidDateString(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  
  const date = new Date(`${dateStr}T12:00:00`);
  return !isNaN(date.getTime());
}

/**
 * Получает дату N дней назад в локальном часовом поясе
 */
export function getDateDaysAgo(daysAgo: number): string {
  const now = new Date();
  const targetDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
  
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}