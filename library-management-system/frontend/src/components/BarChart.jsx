/**
 * Tiny dependency-free horizontal bar chart. Renders a list of
 * { label, value } pairs as flex rows with bars scaled to the max.
 */
export default function BarChart({ data, valueFormatter }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  const fmt = valueFormatter || ((v) => v);
  return (
    <div className="barchart">
      {data.map((d) => {
        const pct = Math.max(2, (d.value / max) * 100);
        return (
          <div className="barchart-row" key={d.label}>
            <div className="barchart-label" title={d.label}>{d.label}</div>
            <div className="barchart-track">
              <div className="barchart-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="barchart-value">{fmt(d.value)}</div>
          </div>
        );
      })}
    </div>
  );
}
