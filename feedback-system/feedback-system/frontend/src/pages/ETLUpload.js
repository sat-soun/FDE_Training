import React, { useCallback, useEffect, useRef, useState } from "react";
import { uploadFeedbackFile, listETLRuns } from "../api";

// ── Status badge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = {
    success: { bg: "#dcfce7", color: "#166534", label: "Success" },
    failed:  { bg: "#fee2e2", color: "#991b1b", label: "Failed"  },
    pending: { bg: "#fef3c7", color: "#92400e", label: "Pending" },
  };
  const { bg, color, label } = cfg[status] || cfg.pending;
  return (
    <span
      style={{
        background: bg,
        color,
        fontSize: 12,
        fontWeight: 700,
        padding: "2px 10px",
        borderRadius: 20,
      }}
    >
      {label}
    </span>
  );
}

// ── Stat mini card ─────────────────────────────────────────────────────────────
function MiniStat({ label, value, color }) {
  return (
    <div
      style={{
        textAlign: "center",
        flex: 1,
        padding: "12px 8px",
        background: "#f9fafb",
        borderRadius: 10,
        minWidth: 90,
      }}
    >
      <div style={{ fontSize: 24, fontWeight: 800, color: color || "#6366f1" }}>{value}</div>
      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{label}</div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ETLUpload() {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [runs, setRuns] = useState([]);
  const [loadingRuns, setLoadingRuns] = useState(true);
  const fileInputRef = useRef();

  const loadRuns = useCallback(() => {
    listETLRuns()
      .then((d) => setRuns(d.runs || []))
      .catch(() => {})
      .finally(() => setLoadingRuns(false));
  }, []);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);
    setError(null);
    try {
      const res = await uploadFeedbackFile(file);
      setResult(res);
      setFile(null);
      loadRuns();
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "Upload failed. Please try again.";
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const dropZoneStyle = {
    border: `2px dashed ${dragging ? "#6366f1" : "#d1d5db"}`,
    borderRadius: 14,
    background: dragging ? "#eef2ff" : "#fafafa",
    padding: "40px 24px",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.2s",
  };

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 16px" }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1e1b4b", marginBottom: 6 }}>
        ETL Import
      </h1>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 28 }}>
        Upload a CSV or Excel file to import feedback records. The pipeline will
        validate, clean, and load the data automatically.
      </p>

      {/* Drop Zone */}
      <div
        style={dropZoneStyle}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
        {file ? (
          <>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1e1b4b" }}>
              {file.name}
            </div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
              {(file.size / 1024).toFixed(1)} KB — click or drag to replace
            </div>
          </>
        ) : (
          <>
            <div style={{ fontWeight: 600, fontSize: 15, color: "#374151" }}>
              Drag & drop a CSV or Excel file here
            </div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 6 }}>
              or click to browse · supports .csv, .xlsx, .xls
            </div>
          </>
        )}
      </div>

      {/* Column hint */}
      <div
        style={{
          marginTop: 12,
          padding: "10px 16px",
          background: "#eff6ff",
          borderRadius: 8,
          fontSize: 13,
          color: "#1d4ed8",
        }}
      >
        <strong>Expected columns:</strong> participant_name, program_name, rating (1–5),
        comments (optional), submitted_date (optional)
      </div>

      {/* Upload button */}
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        style={{
          marginTop: 18,
          padding: "10px 28px",
          background: !file || uploading ? "#a5b4fc" : "#6366f1",
          color: "#fff",
          border: "none",
          borderRadius: 10,
          cursor: !file || uploading ? "not-allowed" : "pointer",
          fontWeight: 700,
          fontSize: 15,
          transition: "background 0.2s",
        }}
      >
        {uploading ? "Running ETL…" : "Upload & Run ETL"}
      </button>

      {/* Result banner */}
      {result && (
        <div
          style={{
            marginTop: 20,
            padding: 20,
            background: result.status === "success" ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${result.status === "success" ? "#bbf7d0" : "#fecaca"}`,
            borderRadius: 12,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: 15,
              color: result.status === "success" ? "#166534" : "#991b1b",
              marginBottom: 12,
            }}
          >
            {result.status === "success"
              ? "✅ ETL pipeline completed successfully"
              : "❌ ETL pipeline failed"}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <MiniStat label="Total Rows" value={result.total_records} color="#6366f1" />
            <MiniStat label="Imported" value={result.imported_records} color="#22c55e" />
            <MiniStat label="Skipped (invalid)" value={result.skipped_invalid} color="#f97316" />
            <MiniStat label="Skipped (dup)" value={result.skipped_duplicates} color="#a78bfa" />
          </div>
          {result.error_message && (
            <div
              style={{
                marginTop: 12,
                fontSize: 13,
                color: "#991b1b",
                background: "#fee2e2",
                borderRadius: 8,
                padding: "8px 12px",
              }}
            >
              {result.error_message}
            </div>
          )}
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div
          style={{
            marginTop: 16,
            padding: "12px 16px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 10,
            color: "#991b1b",
            fontSize: 14,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Run History */}
      <div style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: "#111827", marginBottom: 14 }}>
          Import History
        </h2>

        {loadingRuns ? (
          <div style={{ color: "#9ca3af", fontSize: 14 }}>Loading…</div>
        ) : runs.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 40,
              background: "#f9fafb",
              borderRadius: 12,
              color: "#9ca3af",
            }}
          >
            <div style={{ fontSize: 36 }}>📭</div>
            <div style={{ marginTop: 8 }}>No imports yet. Upload a file to get started.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {runs.map((run) => (
              <div
                key={run.id}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: "14px 18px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>
                    {run.filename}
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                    {new Date(run.created_at).toLocaleString()}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>
                    {run.imported_records}/{run.total_records} imported
                  </span>
                  {run.skipped_invalid > 0 && (
                    <span style={{ fontSize: 12, color: "#f97316" }}>
                      {run.skipped_invalid} invalid
                    </span>
                  )}
                  {run.skipped_duplicates > 0 && (
                    <span style={{ fontSize: 12, color: "#a78bfa" }}>
                      {run.skipped_duplicates} duplicates
                    </span>
                  )}
                  <StatusBadge status={run.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
