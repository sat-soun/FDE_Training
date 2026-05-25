import React, { useEffect, useState } from "react";
import { getAnalytics, downloadReport } from "../api";

// ── Colour helpers ─────────────────────────────────────────────────────────────
const PALETTE = [
  "#6366f1","#22c55e","#f59e0b","#ef4444","#3b82f6",
  "#a78bfa","#10b981","#f97316","#ec4899","#14b8a6",
];
const RATING_COLORS = {
  "1": "#ef4444",
  "2": "#f97316",
  "3": "#eab308",
  "4": "#84cc16",
  "5": "#22c55e",
};
const RATING_LABELS = { "1": "Poor","2": "Fair","3": "Good","4": "Very Good","5": "Excellent" };

// ── Bar chart (horizontal) ─────────────────────────────────────────────────────
function HBar({ label, value, max, color, suffix = "" }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
      <span
        style={{
          width: 160,
          fontSize: 12,
          color: "#374151",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
        title={label}
      >
        {label}
      </span>
      <div
        style={{
          flex: 1,
          background: "#f3f4f6",
          borderRadius: 20,
          height: 14,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            borderRadius: 20,
            transition: "width 0.6s ease",
          }}
        />
      </div>
      <span style={{ width: 44, fontSize: 12, color: "#6b7280", textAlign: "right" }}>
        {typeof value === "number" ? value.toFixed(value % 1 === 0 ? 0 : 1) : value}
        {suffix}
      </span>
    </div>
  );
}

// ── Section card ──────────────────────────────────────────────────────────────
function Card({ title, children, action }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 24,
        marginBottom: 24,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: "20px 24px",
        flex: 1,
        minWidth: 150,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ fontSize: 26 }}>{icon}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: color || "#1e1b4b", marginTop: 6 }}>
        {value}
      </div>
      <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{label}</div>
    </div>
  );
}

// ── Mini line chart (SVG) ──────────────────────────────────────────────────────
function Sparkline({ points, color = "#6366f1", width = 400, height = 90 }) {
  if (!points || points.length < 2) return null;
  const maxY = Math.max(...points.map((p) => p.y));
  const minY = Math.min(...points.map((p) => p.y));
  const rangeY = maxY - minY || 1;
  const stepX = width / (points.length - 1);

  const coords = points.map((p, i) => ({
    x: i * stepX,
    y: height - ((p.y - minY) / rangeY) * (height - 20) - 10,
  }));

  const path = coords
    .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(" ");

  const areaPath =
    path +
    ` L${coords[coords.length - 1].x},${height} L0,${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#grad)" />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r="3.5" fill={color} />
      ))}
    </svg>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAnalytics()
      .then(setData)
      .catch(() => setError("Failed to load analytics."))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadReport();
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: "#6b7280" }}>
        Loading analytics…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 40, color: "#ef4444", textAlign: "center" }}>{error}</div>
    );
  }

  const noData = !data || data.overall_total === 0;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 16px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 28,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1e1b4b", marginBottom: 6 }}>
            Analytics
          </h1>
          <p style={{ color: "#6b7280", fontSize: 14 }}>
            Summary insights computed from all imported feedback records.
          </p>
        </div>
        <button
          onClick={handleDownload}
          disabled={downloading || noData}
          style={{
            padding: "10px 20px",
            background: downloading || noData ? "#e5e7eb" : "#6366f1",
            color: downloading || noData ? "#9ca3af" : "#fff",
            border: "none",
            borderRadius: 10,
            cursor: downloading || noData ? "not-allowed" : "pointer",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {downloading ? "Preparing…" : "⬇ Download Report"}
        </button>
      </div>

      {noData ? (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            background: "#f9fafb",
            borderRadius: 14,
            color: "#9ca3af",
          }}
        >
          <div style={{ fontSize: 44 }}>📊</div>
          <div style={{ marginTop: 10, fontSize: 15 }}>
            No feedback data yet. Import a dataset via the ETL page.
          </div>
        </div>
      ) : (
        <>
          {/* Overview stats */}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
            <StatCard
              icon="📋"
              label="Total Records"
              value={data.overall_total.toLocaleString()}
              color="#6366f1"
            />
            <StatCard
              icon="⭐"
              label="Overall Avg Rating"
              value={data.overall_average_rating.toFixed(2)}
              color="#f59e0b"
            />
            <StatCard
              icon="🏆"
              label="Top Program"
              value={
                data.top_program && data.top_program.length > 18
                  ? data.top_program.slice(0, 18) + "…"
                  : data.top_program || "—"
              }
              color="#22c55e"
            />
            <StatCard
              icon="📉"
              label="Needs Improvement"
              value={
                data.bottom_program && data.bottom_program.length > 18
                  ? data.bottom_program.slice(0, 18) + "…"
                  : data.bottom_program || "—"
              }
              color="#ef4444"
            />
          </div>

          {/* Avg rating by program */}
          <Card title="Average Rating by Program">
            {data.by_program.map((p, i) => (
              <HBar
                key={p.program_name}
                label={p.program_name}
                value={p.average_rating}
                max={5}
                color={PALETTE[i % PALETTE.length]}
                suffix="/5"
              />
            ))}
          </Card>

          {/* Feedback volume by program */}
          <Card title="Feedback Volume by Program">
            {(() => {
              const maxVol = Math.max(...data.by_program.map((p) => p.total_feedback));
              return data.by_program
                .slice()
                .sort((a, b) => b.total_feedback - a.total_feedback)
                .map((p, i) => (
                  <HBar
                    key={p.program_name}
                    label={p.program_name}
                    value={p.total_feedback}
                    max={maxVol}
                    color={PALETTE[i % PALETTE.length]}
                  />
                ));
            })()}
          </Card>

          {/* Overall rating distribution */}
          <Card title="Overall Rating Distribution">
            {(() => {
              // Aggregate rating distribution across all programs
              const aggDist = {};
              data.by_program.forEach((p) => {
                Object.entries(p.rating_distribution).forEach(([k, v]) => {
                  aggDist[k] = (aggDist[k] || 0) + v;
                });
              });
              const maxCount = Math.max(...Object.values(aggDist));
              return ["5", "4", "3", "2", "1"].map((r) => (
                <HBar
                  key={r}
                  label={`${r} ⭐  ${RATING_LABELS[r]}`}
                  value={aggDist[r] || 0}
                  max={maxCount}
                  color={RATING_COLORS[r]}
                />
              ));
            })()}
          </Card>

          {/* Monthly trend */}
          {data.monthly_trend && data.monthly_trend.length >= 2 && (
            <Card title="Monthly Submission Trend">
              <div style={{ marginBottom: 8 }}>
                <Sparkline
                  points={data.monthly_trend.map((t) => ({ y: t.total_feedback }))}
                  color="#6366f1"
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 11,
                  color: "#9ca3af",
                  paddingTop: 4,
                }}
              >
                {data.monthly_trend.map((t) => (
                  <span key={t.month}>{t.month}</span>
                ))}
              </div>

              {/* Avg rating trend */}
              <div style={{ marginTop: 20, marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                  Monthly Average Rating
                </div>
                <Sparkline
                  points={data.monthly_trend.map((t) => ({ y: t.average_rating }))}
                  color="#f59e0b"
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 11,
                  color: "#9ca3af",
                  paddingTop: 4,
                }}
              >
                {data.monthly_trend.map((t) => (
                  <span key={t.month}>{t.month}</span>
                ))}
              </div>
            </Card>
          )}

          {/* Per-program rating distribution table */}
          <Card title="Program Breakdown">
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    {["Program", "Responses", "Avg Rating", "⭐1", "⭐2", "⭐3", "⭐4", "⭐5"].map(
                      (h) => (
                        <th
                          key={h}
                          style={{
                            padding: "10px 12px",
                            textAlign: h === "Program" ? "left" : "center",
                            color: "#6b7280",
                            fontWeight: 600,
                            borderBottom: "1px solid #e5e7eb",
                          }}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.by_program.map((p, i) => (
                    <tr
                      key={p.program_name}
                      style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}
                    >
                      <td
                        style={{
                          padding: "10px 12px",
                          color: "#111827",
                          fontWeight: 500,
                          borderBottom: "1px solid #f3f4f6",
                        }}
                      >
                        {p.program_name}
                      </td>
                      <td
                        style={{
                          padding: "10px 12px",
                          textAlign: "center",
                          color: "#374151",
                          borderBottom: "1px solid #f3f4f6",
                        }}
                      >
                        {p.total_feedback}
                      </td>
                      <td
                        style={{
                          padding: "10px 12px",
                          textAlign: "center",
                          fontWeight: 700,
                          color:
                            p.average_rating >= 4
                              ? "#22c55e"
                              : p.average_rating >= 3
                              ? "#f59e0b"
                              : "#ef4444",
                          borderBottom: "1px solid #f3f4f6",
                        }}
                      >
                        {p.average_rating.toFixed(2)}
                      </td>
                      {["1", "2", "3", "4", "5"].map((r) => (
                        <td
                          key={r}
                          style={{
                            padding: "10px 12px",
                            textAlign: "center",
                            color: "#6b7280",
                            borderBottom: "1px solid #f3f4f6",
                          }}
                        >
                          {p.rating_distribution[r] || 0}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
