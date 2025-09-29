import type { TopUser } from "@/lib/types";

type TopUsersProps = {
  topUsers: TopUser[];
};

export function TopUsers({ topUsers }: TopUsersProps) {
  if (topUsers.length === 0) {
    return (
      <div className="content-section">
        <p>Данных недостаточно.</p>
      </div>
    );
  }

  return (
    <div className="content-section">
      <h2>Топ участников</h2>
      <ul className="user-list">
        {topUsers.map((user, index) => (
          <li key={`${user.userId}-${index}`}>
            <span>#{index + 1} {user.displayName}</span>
            <span style={{ float: 'right' }}>{user.messageCount.toLocaleString("ru-RU")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
