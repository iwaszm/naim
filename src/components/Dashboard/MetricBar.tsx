type MetricBarProps = {
  label: string;
  value: number;
  accent?: 'yellow' | 'cyan' | 'rose' | 'green';
};

export function MetricBar({ label, value, accent = 'yellow' }: MetricBarProps) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className={`metric-bar metric-${accent}`}>
      <div className="metric-meta">
        <span>{label}</span>
        <strong>{pct}%</strong>
      </div>
      <div className="metric-track">
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
