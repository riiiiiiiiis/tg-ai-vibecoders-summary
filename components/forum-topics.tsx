"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ForumTopic } from "@/lib/types";

type ForumTopicsProps = {
  chatId?: string;
  currentThreadId?: string;
  days?: 1 | 7;
};

export function ForumTopics({ chatId, currentThreadId, days = 1 }: ForumTopicsProps) {
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadTopics() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (chatId) params.set("chat_id", chatId);
        params.set("days", String(days));

        const url = `/api/topics?${params.toString()}`;
        const response = await fetch(url);
        const result = await response.json();

        if (!result.ok) {
          setError(result.error || "Ошибка загрузки");
          return;
        }

        setTopics(result.data || []);
      } catch (err) {
        setError("Не удалось загрузить темы");
        console.error("[ForumTopics] Error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadTopics();
  }, [chatId, days]);

  const handleTopicClick = (threadId: string | null) => {
    const params = new URLSearchParams();
    if (chatId) params.set("chat_id", chatId);
    if (threadId) params.set("thread_id", threadId);

    const path = days === 7 ? "/week" : "/";
    const url = params.toString() ? `${path}?${params.toString()}` : path;
    router.push(url);
  };

  if (loading) {
    return (
      <div className="forum-topics">
        <p>Загрузка тем...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="forum-topics">
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  if (topics.length === 0) {
    return null;
  }

  return (
    <div className="forum-topics">
      <h3>Темы форума:</h3>
      <div className="topics-list">
        <button
          className={`topic-button ${!currentThreadId ? "active" : ""}`}
          onClick={() => handleTopicClick(null)}
        >
          Все темы
        </button>
        {topics.map((topic) => (
          <button
            key={topic.threadId}
            className={`topic-button ${currentThreadId === topic.threadId ? "active" : ""}`}
            onClick={() => handleTopicClick(topic.threadId)}
          >
            {topic.topicName} ({topic.messageCount})
          </button>
        ))}
      </div>
    </div>
  );
}
