import { getPool } from "./db";
import type { OverviewResponse, SeriesPoint, TopUser, ForumTopic } from "./types";
import { buildTimeRangeConditions, buildChatConditions, combineConditions, buildUserLabel } from "./db/builders";

type OverviewParams = {
  chatId?: string;
  threadId?: string;
  window?: 1 | 7;
  from?: Date;
  to?: Date;
};

export async function fetchOverview({ chatId, threadId, window = 1, from, to }: OverviewParams): Promise<OverviewResponse> {
  const pool = getPool();
  
  // Use shared query builders
  const timeConditions = buildTimeRangeConditions(from, to, window);
  const chatConditions = buildChatConditions(chatId, threadId, timeConditions.params);
  const combined = combineConditions(timeConditions, chatConditions);
  
  const whereClause = combined.conditions.join(" AND ");
  const params = combined.params;

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



export async function fetchMessagesWithAuthors({
  chatId,
  threadId,
  from,
  to,
  limit = 5000,
  preferUsername = false
}: {
  chatId?: string;
  threadId?: string;
  from: Date;
  to: Date;
  limit?: number;
  preferUsername?: boolean;
}): Promise<Array<{ timestamp: Date; label: string; text: string }>> {
  const pool = getPool();
  console.log("[DB] fetchMessagesWithAuthors params", {
    chatId,
    preferUsername,
    from: from.toISOString(),
    to: to.toISOString(),
    limit
  });
  
  // Use shared query builders
  const timeConditions = buildTimeRangeConditions(from, to);
  const chatConditions = buildChatConditions(chatId, threadId, timeConditions.params);
  const combined = combineConditions(timeConditions, chatConditions);
  
  // Add non-empty text condition
  combined.conditions.push("COALESCE(m.text, '') <> ''");
  
  const sql = `
    SELECT m.sent_at, m.text,
           COALESCE(u.first_name, '') AS first_name,
           COALESCE(u.last_name, '')  AS last_name,
           u.username
    FROM messages m
    LEFT JOIN users u ON u.id = m.user_id
    WHERE ${combined.conditions.join(" AND ")}
    ORDER BY m.sent_at ASC
    LIMIT $${combined.params.length + 1}
  `;
  combined.params.push(limit);

  const { rows } = await pool.query<{
    sent_at: Date;
    text: string;
    first_name: string | null;
    last_name: string | null;
    username: string | null;
  }>(sql, combined.params);

  // Import buildUserLabelForAI to use when preferUsername is true
  const { buildUserLabelForAI } = await import("./db/builders");

  return rows.map((r) => ({
    timestamp: r.sent_at,
    label: preferUsername 
      ? buildUserLabelForAI(r.first_name, r.last_name, r.username)
      : buildUserLabel(r.first_name, r.last_name, r.username),
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
    // Use shared query builders
    const timeConditions = buildTimeRangeConditions(undefined, undefined, window);
    const chatConditions = buildChatConditions(chatId, undefined, timeConditions.params);
    const combined = combineConditions(timeConditions, chatConditions);
    
    // Add thread ID condition
    combined.conditions.push("message_thread_id IS NOT NULL");

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
      WHERE ${combined.conditions.join(" AND ")}
      GROUP BY message_thread_id, chat_id
      ORDER BY message_count DESC
      LIMIT 50
    `;

    const { rows } = await pool.query<{
      message_thread_id: string;
      message_count: string;
      last_message_at: Date;
      topic_name: string | null;
    }>(sql, combined.params);

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

export async function fetchMessagesWithLinks({
  chatId,
  threadId,
  from,
  to,
  limit = 500
}: {
  chatId?: string;
  threadId?: string;
  from: Date;
  to: Date;
  limit?: number;
}): Promise<Array<{ timestamp: Date; label: string; text: string; links: string[] }>> {
  const pool = getPool();
  console.log("[DB] fetchMessagesWithLinks params", {
    chatId,
    from: from.toISOString(),
    to: to.toISOString(),
    limit
  });
  
  // Use shared query builders
  const timeConditions = buildTimeRangeConditions(from, to);
  const chatConditions = buildChatConditions(chatId, threadId, timeConditions.params);
  const combined = combineConditions(timeConditions, chatConditions);
  
  // Add non-empty text and link conditions
  combined.conditions.push("COALESCE(m.text, '') <> ''");
  combined.conditions.push("m.text ~* 'https?://'");

  const sql = `
    SELECT m.sent_at, m.text,
           COALESCE(u.first_name, '') AS first_name,
           COALESCE(u.last_name, '')  AS last_name,
           u.username
    FROM messages m
    LEFT JOIN users u ON u.id = m.user_id
    WHERE ${combined.conditions.join(" AND ")}
    ORDER BY m.sent_at ASC
    LIMIT $${combined.params.length + 1}
  `;
  combined.params.push(limit);

  const { rows } = await pool.query<{
    sent_at: Date;
    text: string;
    first_name: string | null;
    last_name: string | null;
    username: string | null;
  }>(sql, combined.params);

  return rows.map((r) => {
    // Извлекаем все ссылки из текста сообщения
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
    const links = r.text.match(urlRegex) || [];
    
    return {
      timestamp: r.sent_at,
      label: buildUserLabel(r.first_name, r.last_name, r.username),
      text: r.text,
      links
    };
  });
}


