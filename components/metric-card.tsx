type MetricCardProps = {
  label: string;
  value: number;
  accent?: string;
};

export function MetricCard({ label, value, accent }: MetricCardProps) {
  return (
    <div className="metric-card">
      <h3>{label}</h3>
      <p>{value.toLocaleString("ru-RU")}</p>
      {accent ? <small>{accent}</small> : null}
    </div>
  );
}
