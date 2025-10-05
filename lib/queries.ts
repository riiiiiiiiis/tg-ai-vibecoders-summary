import { getPool } from "./db";
import type { OverviewResponse, SeriesPoint, TopUser, ForumTopic } from "./types";

type OverviewParams = {
  chatId?: string;
  threadId?: string;
  window?: 1 | 7;
  from?: Date;
  to?: Date;
};

export async function fetchOverview({ chatId, threadId, window = 1, from, to }: OverviewParams): Promise<OverviewResponse> {
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

  if (threadId) {
    conditions.push(`message_thread_id = $${params.length + 1}`);
    params.push(threadId);
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
      LIMIT 10
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
  threadId,
  from,
  to,
  limit = 5000
}: {
  chatId?: string;
  threadId?: string;
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

  if (threadId) {
    where.push(`m.message_thread_id = $${params.length + 1}`);
    params.push(threadId);
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
  threadId,
  from,
  to,
  limit = 5000
}: {
  chatId?: string;
  threadId?: string;
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

  if (threadId) {
    where.push(`m.message_thread_id = $${params.length + 1}`);
    params.push(threadId);
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

export async function fetchForumTopics({
  chatId,
  window = 1
}: {
  chatId?: string;
  window?: 1 | 7;
}): Promise<ForumTopic[]> {
  const pool = getPool();
  
  try {
    const params: Array<string | number> = [`${window} days`];
    const where: string[] = [
      "sent_at >= NOW() - $1::interval",
      "message_thread_id IS NOT NULL"
    ];

    if (chatId) {
      where.push(`chat_id = $${params.length + 1}`);
      params.push(chatId);
    }

    const sql = `
      SELECT 
        message_thread_id,
        COUNT(*) as message_count,
        MAX(sent_at) as last_message_at,
        (SELECT text FROM messages m2 
         WHERE m2.message_thread_id = m.message_thread_id 
         AND m2.chat_id = m.chat_id
         ORDER BY sent_at ASC LIMIT 1) as topic_name
      FROM messages m
      WHERE ${where.join(" AND ")}
      GROUP BY message_thread_id, chat_id
      ORDER BY message_count DESC
      LIMIT 50
    `;

    const { rows } = await pool.query<{
      message_thread_id: string;
      message_count: string;
      last_message_at: Date;
      topic_name: string | null;
    }>(sql, params);

    return rows.map((row) => ({
      threadId: row.message_thread_id,
      topicName: row.topic_name || `Тема ${row.message_thread_id}`,
      messageCount: Number(row.message_count),
      lastMessageAt: row.last_message_at.toISOString()
    }));
  } catch (error: any) {
    if (error?.message?.includes("column") && error?.message?.includes("message_thread_id")) {
      console.warn("[DB] Forum topics not available (message_thread_id column missing)");
      return [];
    }
    console.error("[DB] fetchForumTopics error:", error);
    return [];
  }
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
