'use client';

type MetricCardProps = {
  label: string;
  value: number;
  accent?: string;
};

export function MetricCard({ label, value, accent }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 shadow-sm">
      <span className="text-xs uppercase tracking-wide text-slate-500">{label}</span>
      <p className="mt-2 text-3xl font-semibold text-slate-50">{value.toLocaleString("ru-RU")}</p>
      {accent ? <p className="mt-1 text-xs text-slate-400">{accent}</p> : null}
    </div>
  );
}
