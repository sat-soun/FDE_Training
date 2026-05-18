import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createFeedback, updateFeedback, getFeedbackById } from "../api";
import { StarRating } from "../components/StarRating";

const INITIAL = { participant_name: "", program_name: "", rating: 0, comments: "" };

export default function FeedbackForm({ mode = "create" }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(mode === "edit");
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    if (mode === "edit" && id) {
      getFeedbackById(id)
        .then((data) =>
          setForm({
            participant_name: data.participant_name,
            program_name: data.program_name,
            rating: data.rating,
            comments: data.comments || "",
          })
        )
        .catch(() => setApiError("Failed to load feedback."))
        .finally(() => setLoading(false));
    }
  }, [mode, id]);

  const validate = () => {
    const e = {};
    if (!form.participant_name.trim()) e.participant_name = "Participant name is required.";
    if (!form.program_name.trim()) e.program_name = "Program / Event name is required.";
    if (!form.rating) e.rating = "Please select a rating.";
    return e;
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setSubmitting(true);
    setApiError("");
    try {
      const payload = { ...form, comments: form.comments || null };
      if (mode === "edit") {
        await updateFeedback(id, payload);
        navigate(`/feedback/${id}`);
      } else {
        const created = await createFeedback(payload);
        navigate(`/feedback/${created.feedback_id}`);
      }
    } catch (err) {
      setApiError(err.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Loading…</div>;

  const inputStyle = (field) => ({
    width: "100%",
    padding: "10px 14px",
    borderRadius: 8,
    border: `1.5px solid ${errors[field] ? "#ef4444" : "#d1d5db"}`,
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  });

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 16px" }}>
      <button
        onClick={() => navigate(-1)}
        style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: 14, marginBottom: 16 }}
      >
        ← Back
      </button>

      <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1e1b4b", marginBottom: 4 }}>
        {mode === "edit" ? "Edit Feedback" : "Submit Feedback"}
      </h1>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 28 }}>
        {mode === "edit" ? "Update the feedback details below." : "Share your experience to help us improve."}
      </p>

      {apiError && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", color: "#dc2626", fontSize: 14, marginBottom: 16 }}>
          {apiError}
        </div>
      )}

      {/* Participant Name */}
      <div style={{ marginBottom: 18 }}>
        <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 6, color: "#374151" }}>
          Participant Name *
        </label>
        <input
          type="text"
          placeholder="e.g. Priya Sharma"
          value={form.participant_name}
          onChange={handleChange("participant_name")}
          style={inputStyle("participant_name")}
        />
        {errors.participant_name && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{errors.participant_name}</div>}
      </div>

      {/* Program Name */}
      <div style={{ marginBottom: 18 }}>
        <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 6, color: "#374151" }}>
          Training / Event / Product *
        </label>
        <input
          type="text"
          placeholder="e.g. Data Engineering Bootcamp"
          value={form.program_name}
          onChange={handleChange("program_name")}
          style={inputStyle("program_name")}
        />
        {errors.program_name && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{errors.program_name}</div>}
      </div>

      {/* Rating */}
      <div style={{ marginBottom: 18 }}>
        <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 8, color: "#374151" }}>
          Rating *
        </label>
        <StarRating
          value={form.rating}
          onChange={(v) => {
            setForm((prev) => ({ ...prev, rating: v }));
            setErrors((prev) => ({ ...prev, rating: undefined }));
          }}
          size={32}
        />
        {errors.rating && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{errors.rating}</div>}
      </div>

      {/* Comments */}
      <div style={{ marginBottom: 28 }}>
        <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 6, color: "#374151" }}>
          Comments
        </label>
        <textarea
          placeholder="Share your thoughts, suggestions, or experience…"
          value={form.comments}
          onChange={handleChange("comments")}
          rows={4}
          style={{ ...inputStyle("comments"), resize: "vertical", fontFamily: "inherit" }}
        />
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            flex: 1,
            padding: "12px 0",
            background: submitting ? "#a5b4fc" : "#6366f1",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 700,
            cursor: submitting ? "not-allowed" : "pointer",
            transition: "background 0.15s",
          }}
        >
          {submitting ? "Saving…" : mode === "edit" ? "Update Feedback" : "Submit Feedback"}
        </button>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: "12px 20px",
            background: "#f3f4f6",
            color: "#374151",
            border: "none",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
