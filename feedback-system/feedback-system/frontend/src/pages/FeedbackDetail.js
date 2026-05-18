import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFeedbackById, deleteFeedback } from "../api";
import { StarRating, RatingBadge } from "../components/StarRating";

export default function FeedbackDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getFeedbackById(id)
      .then(setFeedback)
      .catch(() => setError("Feedback not found."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this feedback?")) return;
    setDeleting(true);
    try {
      await deleteFeedback(id);
      navigate("/feedback");
    } catch {
      alert("Failed to delete feedback.");
      setDeleting(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Loading…</div>;
  if (error) return (
    <div style={{ maxWidth: 600, margin: "60px auto", textAlign: "center" }}>
      <div style={{ fontSize: 48 }}>❌</div>
      <div style={{ marginTop: 12, color: "#ef4444", fontWeight: 600 }}>{error}</div>
      <button onClick={() => navigate("/feedback")} style={{ marginTop: 16, padding: "8px 20px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
        Back to list
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 16px" }}>
      <button
        onClick={() => navigate("/feedback")}
        style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: 14, marginBottom: 16 }}
      >
        ← Back to list
      </button>

      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: 28,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1e1b4b", marginBottom: 4 }}>
              {feedback.participant_name}
            </h1>
            <div style={{ fontSize: 14, color: "#6366f1", fontWeight: 600 }}>
              {feedback.program_name}
            </div>
          </div>
          <RatingBadge rating={feedback.rating} />
        </div>

        {/* Stars */}
        <div style={{ marginBottom: 20 }}>
          <StarRating value={feedback.rating} readonly size={28} />
        </div>

        {/* Comments */}
        <div
          style={{
            background: "#f9fafb",
            borderRadius: 10,
            padding: "14px 16px",
            marginBottom: 20,
            minHeight: 60,
          }}
        >
          <div style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Comments
          </div>
          <p style={{ color: "#374151", fontSize: 15, margin: 0, lineHeight: 1.6 }}>
            {feedback.comments || <em style={{ color: "#9ca3af" }}>No comments provided.</em>}
          </p>
        </div>

        {/* Meta */}
        <div style={{ display: "flex", gap: 20, fontSize: 13, color: "#6b7280", marginBottom: 24 }}>
          <span>🗓 {new Date(feedback.submitted_at).toLocaleString()}</span>
          <span style={{ color: "#d1d5db" }}>|</span>
          <span>ID: #{feedback.feedback_id}</span>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => navigate(`/feedback/${id}/edit`)}
            style={{
              flex: 1,
              padding: "10px 0",
              background: "#eef2ff",
              color: "#6366f1",
              border: "1px solid #c7d2fe",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            ✏️ Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              flex: 1,
              padding: "10px 0",
              background: "#fef2f2",
              color: "#ef4444",
              border: "1px solid #fca5a5",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 14,
              cursor: deleting ? "not-allowed" : "pointer",
            }}
          >
            {deleting ? "Deleting…" : "🗑 Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
