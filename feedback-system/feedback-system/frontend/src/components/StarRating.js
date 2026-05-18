import React from "react";

const LABELS = { 1: "Poor", 2: "Fair", 3: "Good", 4: "Very Good", 5: "Excellent" };

const COLORS = {
  1: "#ef4444",
  2: "#f97316",
  3: "#eab308",
  4: "#84cc16",
  5: "#22c55e",
};

export function StarRating({ value, onChange, readonly = false, size = 24 }) {
  const [hovered, setHovered] = React.useState(0);
  const display = hovered || value;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => !readonly && onChange && onChange(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          style={{
            fontSize: size,
            cursor: readonly ? "default" : "pointer",
            color: star <= display ? COLORS[display] || "#eab308" : "#d1d5db",
            transition: "color 0.15s",
            userSelect: "none",
          }}
        >
          ★
        </span>
      ))}
      {display > 0 && (
        <span style={{ fontSize: 13, color: "#6b7280", marginLeft: 4 }}>
          {LABELS[display]}
        </span>
      )}
    </div>
  );
}

export function RatingBadge({ rating }) {
  const color = COLORS[rating] || "#6b7280";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        background: color + "22",
        color,
        border: `1px solid ${color}55`,
        borderRadius: 20,
        padding: "2px 10px",
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      ★ {rating} — {LABELS[rating]}
    </span>
  );
}
