import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStats, getAllFeedback } from "../api";
import { RatingBadge } from "../components/StarRating";

function StatCard({ label, value, icon, color }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: "20px 24px",
        flex: 1,
        minWidth: 160,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ fontSize: 28 }}>{icon}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color: color || "#1e1b4b", marginTop: 6 }}>
        {value}
      </div>
      <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getStats(), getAllFeedback(0, 5)])
      .then(([s, f]) => {
        setStats(s);
        setRecent(f.feedbacks);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Loading…</div>;

  const ratingColors = {
    Poor: "#ef4444",
    Fair: "#f97316",
    Good: "#eab308",
    "Very Good": "#84cc16",
    Excellent: "#22c55e",
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 16px" }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1e1b4b", marginBottom: 6 }}>
        Dashboard
      </h1>
      <p style={{ color: "#6b7280", marginBottom: 28, fontSize: 14 }}>
        Overview of all feedback collected in the system.
      </p>

      {/* Stats */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 36 }}>
        <StatCard
          icon="📋"
          label="Total Feedback"
          value={stats.total_feedback}
          color="#6366f1"
        />
        <StatCard
          icon="⭐"
          label="Average Rating"
          value={stats.average_rating.toFixed(1)}
          color="#f59e0b"
        />
        <StatCard
          icon="🏆"
          label="Excellent Ratings"
          value={stats.rating_distribution["Excellent"] || 0}
          color="#22c55e"
        />
      </div>

      {/* Rating Distribution */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          padding: 24,
          marginBottom: 32,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#111827" }}>
          Rating Distribution
        </h2>
        {Object.entries(stats.rating_distribution).map(([label, count]) => {
          const pct = stats.total_feedback ? Math.round((count / stats.total_feedback) * 100) : 0;
          return (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <span style={{ width: 80, fontSize: 13, color: "#374151", fontWeight: 500 }}>{label}</span>
              <div style={{ flex: 1, background: "#f3f4f6", borderRadius: 20, height: 14, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: ratingColors[label] || "#6366f1",
                    borderRadius: 20,
                    transition: "width 0.5s",
                  }}
                />
              </div>
              <span style={{ width: 38, fontSize: 13, color: "#6b7280", textAlign: "right" }}>
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Recent Feedback */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>Recent Feedback</h2>
          <button
            onClick={() => navigate("/feedback")}
            style={{
              fontSize: 13,
              color: "#6366f1",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            View all →
          </button>
        </div>

        {recent.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 48,
              background: "#f9fafb",
              borderRadius: 12,
              color: "#9ca3af",
            }}
          >
            <div style={{ fontSize: 40 }}>💬</div>
            <div style={{ marginTop: 8 }}>No feedback submitted yet.</div>
            <button
              onClick={() => navigate("/submit")}
              style={{
                marginTop: 14,
                padding: "8px 20px",
                background: "#6366f1",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Submit First Feedback
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {recent.map((fb) => (
              <div
                key={fb.feedback_id}
                onClick={() => navigate(`/feedback/${fb.feedback_id}`)}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: "14px 18px",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>
                    {fb.participant_name}
                  </div>
                  <div style={{ fontSize: 13, color: "#6366f1" }}>{fb.program_name}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <RatingBadge rating={fb.rating} />
                  <span style={{ fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap" }}>
                    {new Date(fb.submitted_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
