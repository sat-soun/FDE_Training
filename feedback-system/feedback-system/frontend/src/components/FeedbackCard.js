import React from "react";
import { useNavigate } from "react-router-dom";
import { RatingBadge } from "./StarRating";
import { deleteFeedback } from "../api";

export default function FeedbackCard({ feedback, onDeleted }) {
  const navigate = useNavigate();
  const [deleting, setDeleting] = React.useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this feedback entry?")) return;
    setDeleting(true);
    try {
      await deleteFeedback(feedback.feedback_id);
      onDeleted && onDeleted(feedback.feedback_id);
    } catch {
      alert("Failed to delete feedback.");
    } finally {
      setDeleting(false);
    }
  };

  const ts = new Date(feedback.submitted_at).toLocaleString();

  return (
    <div
      onClick={() => navigate(`/feedback/${feedback.feedback_id}`)}
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: "18px 20px",
        cursor: "pointer",
        transition: "box-shadow 0.15s, transform 0.15s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(99,102,241,0.12)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>
            {feedback.participant_name}
          </div>
          <div style={{ fontSize: 13, color: "#6366f1", fontWeight: 500, marginTop: 2 }}>
            {feedback.program_name}
          </div>
        </div>
        <RatingBadge rating={feedback.rating} />
      </div>

      {feedback.comments && (
        <p
          style={{
            fontSize: 14,
            color: "#374151",
            margin: "8px 0",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {feedback.comments}
        </p>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
        <span style={{ fontSize: 12, color: "#9ca3af" }}>{ts}</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/feedback/${feedback.feedback_id}/edit`);
            }}
            style={{
              fontSize: 12,
              padding: "4px 12px",
              borderRadius: 6,
              border: "1px solid #6366f1",
              background: "#eef2ff",
              color: "#6366f1",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              fontSize: 12,
              padding: "4px 12px",
              borderRadius: 6,
              border: "1px solid #ef4444",
              background: "#fef2f2",
              color: "#ef4444",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            {deleting ? "…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
