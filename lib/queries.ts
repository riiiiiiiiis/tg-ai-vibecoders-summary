import { getPool } from "./db";
import type { OverviewResponse, SeriesPoint, TopUser } from "./types";

type OverviewParams = {
  chatId?: string;
  window?: 1 | 7;
  from?: Date;
  to?: Date;
};

export async function fetchOverview({ chatId, window = 1, from, to }: OverviewParams): Promise<OverviewResponse> {
  const pool = getPool();
  const conditions: string[] = [];
  const params: Array<string | Date | number> = [];

  if (from && to) {
    conditions.push(`sent_at >= $${params.length + 1}`);
    params.push(from);
    conditions.push(`sent_at < $${params.length + 1}`);
    params.push(to);
  } else {
    conditions.push(`sent_at >= NOW() - $${params.length + 1}::interval`);
    params.push(`${window} days`);
  }

  if (chatId) {
    conditions.push(`chat_id = $${params.length + 1}`);
    params.push(chatId);
  }

  const whereClause = conditions.join(" AND ");

  const metricsResult = await pool.query<{
    total_messages: string;
    unique_users: string;
    link_messages: string;
  }>(
    `
      SELECT
        COUNT(*) AS total_messages,
        COUNT(DISTINCT user_id) AS unique_users,
        COUNT(*) FILTER (WHERE text ~* 'https?://') AS link_messages
      FROM messages
      WHERE ${whereClause}
    `,
    params
  );

  const topUsersResult = await pool.query<{
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    message_count: string;
  }>(
    `
      SELECT
        m.user_id,
        COALESCE(u.first_name, '') AS first_name,
        COALESCE(u.last_name, '') AS last_name,
        u.username,
        COUNT(*) AS message_count
      FROM messages m
      LEFT JOIN users u ON u.id = m.user_id
      WHERE ${whereClause}
      GROUP BY m.user_id, u.first_name, u.last_name, u.username
      ORDER BY COUNT(*) DESC
      LIMIT 5
    `,
    params
  );

  const bucketUnit = from && to ? inferBucketUnit(from, to) : window === 1 ? "hour" : "day";
  const seriesResult = await pool.query<{
    bucket: Date;
    message_count: string;
  }>(
    `
      SELECT
        date_trunc($${params.length + 1}, sent_at) AS bucket,
        COUNT(*) AS message_count
      FROM messages
      WHERE ${whereClause}
      GROUP BY bucket
      ORDER BY bucket ASC
    `,
    [...params, bucketUnit]
  );

  const metricsRow = metricsResult.rows[0] ?? { total_messages: "0", unique_users: "0", link_messages: "0" };

  const topUsers: TopUser[] = topUsersResult.rows.map((row) => ({
    userId: row.user_id,
    displayName: buildUserLabel(row.first_name, row.last_name, row.username),
    messageCount: Number(row.message_count)
  }));

  const series: SeriesPoint[] = seriesResult.rows.map((row) => ({
    timestamp: row.bucket.toISOString(),
    messageCount: Number(row.message_count)
  }));

  return {
    totalMessages: Number(metricsRow.total_messages),
    uniqueUsers: Number(metricsRow.unique_users),
    linkMessages: Number(metricsRow.link_messages),
    topUsers,
    series
  };
}

export async function fetchMessagesText({
  chatId,
  from,
  to,
  limit = 5000
}: {
  chatId?: string;
  from: Date;
  to: Date;
  limit?: number;
}): Promise<string[]> {
  const pool = getPool();
  console.log("[DB] fetchMessagesText params", {
    chatId,
    from: from.toISOString(),
    to: to.toISOString(),
    limit
  });
  const params: Array<string | Date | number> = [from, to];
  const where: string[] = [
    "m.sent_at >= $1",
    "m.sent_at < $2",
    "COALESCE(m.text, '') <> ''"
  ];

  if (chatId) {
    where.push(`m.chat_id = $${params.length + 1}`);
    params.push(chatId);
  }

  const sql = `
    SELECT m.text
    FROM messages m
    WHERE ${where.join(" AND ")}
    ORDER BY m.sent_at ASC
    LIMIT $${params.length + 1}
  `;
  params.push(limit);

  const { rows } = await pool.query<{ text: string }>(sql, params);
  return rows.map((r) => r.text);
}

export async function fetchMessagesWithAuthors({
  chatId,
  from,
  to,
  limit = 5000
}: {
  chatId?: string;
  from: Date;
  to: Date;
  limit?: number;
}): Promise<Array<{ timestamp: Date; label: string; text: string }>> {
  const pool = getPool();
  console.log("[DB] fetchMessagesWithAuthors params", {
    chatId,
    from: from.toISOString(),
    to: to.toISOString(),
    limit
  });
  const params: Array<string | Date | number> = [from, to];
  const where: string[] = [
    "m.sent_at >= $1",
    "m.sent_at < $2",
    "COALESCE(m.text, '') <> ''"
  ];

  if (chatId) {
    where.push(`m.chat_id = $${params.length + 1}`);
    params.push(chatId);
  }

  const sql = `
    SELECT m.sent_at, m.text,
           COALESCE(u.first_name, '') AS first_name,
           COALESCE(u.last_name, '')  AS last_name,
           u.username
    FROM messages m
    LEFT JOIN users u ON u.id = m.user_id
    WHERE ${where.join(" AND ")}
    ORDER BY m.sent_at ASC
    LIMIT $${params.length + 1}
  `;
  params.push(limit);

  const { rows } = await pool.query<{
    sent_at: Date;
    text: string;
    first_name: string | null;
    last_name: string | null;
    username: string | null;
  }>(sql, params);

  return rows.map((r) => ({
    timestamp: r.sent_at,
    label: buildUserLabel(r.first_name, r.last_name, r.username),
    text: r.text
  }));
}

function inferBucketUnit(from: Date, to: Date): "hour" | "day" {
  const diffMs = to.getTime() - from.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > 2 ? "day" : "hour";
}

function buildUserLabel(firstName: string | null, lastName: string | null, username: string | null): string {
  const name = [firstName, lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");

  if (name) return name;
  if (username) return `@${username}`;
  return "Неизвестный";
}
