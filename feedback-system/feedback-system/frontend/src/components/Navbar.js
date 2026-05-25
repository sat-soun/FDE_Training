import React from "react";
import { NavLink } from "react-router-dom";

export default function Navbar() {
  const linkStyle = ({ isActive }) => ({
    textDecoration: "none",
    color: isActive ? "#6366f1" : "#374151",
    fontWeight: isActive ? 700 : 500,
    padding: "6px 14px",
    borderRadius: 8,
    background: isActive ? "#eef2ff" : "transparent",
    fontSize: 15,
  });

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 32px",
        background: "#fff",
        borderBottom: "1px solid #e5e7eb",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 22 }}>💬</span>
        <span style={{ fontWeight: 800, fontSize: 18, color: "#1e1b4b" }}>
          FeedbackHub
        </span>
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        <NavLink to="/" style={linkStyle} end>
          Dashboard
        </NavLink>
        <NavLink to="/feedback" style={linkStyle}>
          All Feedback
        </NavLink>
        <NavLink to="/analytics" style={linkStyle}>
          Analytics
        </NavLink>
        <NavLink to="/etl" style={linkStyle}>
          ETL Import
        </NavLink>
        <NavLink to="/submit" style={linkStyle}>
          + Submit
        </NavLink>
      </div>
    </nav>
  );
}
