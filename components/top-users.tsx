import type { TopUser } from "@/lib/types";

type TopUsersProps = {
  topUsers: TopUser[];
};

export function TopUsers({ topUsers }: TopUsersProps) {
  if (topUsers.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <p className="text-sm text-slate-400">Данных недостаточно.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <h2 className="text-sm font-semibold text-slate-200">Топ участников</h2>
      <ul className="mt-4 space-y-3">
        {topUsers.map((user, index) => (
          <li key={`${user.userId}-${index}`} className="flex items-center justify-between">
            <span className="text-sm text-slate-300">
              <span className="mr-3 text-xs text-slate-500">#{index + 1}</span>
              {user.displayName}
            </span>
            <span className="text-sm text-slate-400">{user.messageCount.toLocaleString("ru-RU")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
