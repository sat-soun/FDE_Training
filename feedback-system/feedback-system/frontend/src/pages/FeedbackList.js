import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getAllFeedback, searchFeedback } from "../api";
import FeedbackCard from "../components/FeedbackCard";

const RATING_OPTIONS = [
  { value: "", label: "All Ratings" },
  { value: 5, label: "⭐⭐⭐⭐⭐ Excellent" },
  { value: 4, label: "⭐⭐⭐⭐ Very Good" },
  { value: 3, label: "⭐⭐⭐ Good" },
  { value: 2, label: "⭐⭐ Fair" },
  { value: 1, label: "⭐ Poor" },
];

export default function FeedbackList() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [rating, setRating] = useState("");
  const [program, setProgram] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const navigate = useNavigate();

  // Debounce keyword
  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword), 350);
    return () => clearTimeout(t);
  }, [keyword]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const isFiltered = debouncedKeyword || rating || program;
      const result = isFiltered
        ? await searchFeedback({ keyword: debouncedKeyword, rating: rating || undefined, program_name: program })
        : await getAllFeedback();
      setFeedbacks(result.feedbacks);
      setTotal(result.total);
    } catch {
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedKeyword, rating, program]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDeleted = (id) => {
    setFeedbacks((prev) => prev.filter((f) => f.feedback_id !== id));
    setTotal((t) => t - 1);
  };

  const clearFilters = () => {
    setKeyword("");
    setRating("");
    setProgram("");
  };

  const hasFilters = keyword || rating || program;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1e1b4b", marginBottom: 4 }}>
            All Feedback
          </h1>
          <p style={{ color: "#6b7280", fontSize: 14 }}>
            {loading ? "Loading…" : `${total} entr${total === 1 ? "y" : "ies"} found`}
          </p>
        </div>
        <button
          onClick={() => navigate("/submit")}
          style={{
            padding: "10px 18px",
            background: "#6366f1",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          + Submit Feedback
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "16px 20px",
          marginBottom: 24,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <input
          type="text"
          placeholder="🔍 Search by name, program, comments…"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{
            flex: 2,
            minWidth: 200,
            padding: "8px 12px",
            borderRadius: 8,
            border: "1.5px solid #d1d5db",
            fontSize: 14,
            outline: "none",
          }}
        />
        <select
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          style={{
            flex: 1,
            minWidth: 150,
            padding: "8px 12px",
            borderRadius: 8,
            border: "1.5px solid #d1d5db",
            fontSize: 14,
            background: "#fff",
          }}
        >
          {RATING_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Filter by program…"
          value={program}
          onChange={(e) => setProgram(e.target.value)}
          style={{
            flex: 1,
            minWidth: 160,
            padding: "8px 12px",
            borderRadius: 8,
            border: "1.5px solid #d1d5db",
            fontSize: 14,
            outline: "none",
          }}
        />
        {hasFilters && (
          <button
            onClick={clearFilters}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              background: "#f9fafb",
              fontSize: 13,
              cursor: "pointer",
              color: "#6b7280",
            }}
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Feedback Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Loading feedback…</div>
      ) : feedbacks.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            background: "#f9fafb",
            borderRadius: 12,
            color: "#9ca3af",
          }}
        >
          <div style={{ fontSize: 40 }}>🔍</div>
          <div style={{ marginTop: 8, fontWeight: 500 }}>
            {hasFilters ? "No feedback matches your filters." : "No feedback submitted yet."}
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              style={{
                marginTop: 12,
                padding: "8px 18px",
                background: "#6366f1",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
            gap: 16,
          }}
        >
          {feedbacks.map((fb) => (
            <FeedbackCard key={fb.feedback_id} feedback={fb} onDeleted={handleDeleted} />
          ))}
        </div>
      )}
    </div>
  );
}
