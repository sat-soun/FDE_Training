import { useEffect, useState } from "react";
import BarChart from "../components/BarChart.jsx";
import {
  popularBooks,
  categoryBorrowing,
  monthlyTrends,
  overdueReport,
  runEtl,
} from "../services/analytics.js";

export default function Analytics() {
  const [popular, setPopular] = useState([]);
  const [categories, setCategories] = useState([]);
  const [months, setMonths] = useState([]);
  const [overdue, setOverdue] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [etlReport, setEtlReport] = useState(null);

  const loadAll = async () => {
    setError("");
    try {
      const [p, c, m, o] = await Promise.all([
        popularBooks(10),
        categoryBorrowing(),
        monthlyTrends(12),
        overdueReport(50),
      ]);
      setPopular(p);
      setCategories(c);
      setMonths(m);
      setOverdue(o);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleRunEtl = async () => {
    if (!confirm(
      "Run the ETL pipeline?\n\n" +
      "This will read CSVs from /data, upsert books/borrowers/transactions, " +
      "and rebuild the analytics aggregates. Safe to run repeatedly."
    )) return;
    setBusy(true);
    setError("");
    setEtlReport(null);
    try {
      const report = await runEtl();
      setEtlReport(report);
      await loadAll();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const noData =
    popular.length === 0 && categories.length === 0 && months.length === 0;

  return (
    <>
      <div className="row between" style={{ marginBottom: "1rem" }}>
        <h2 style={{ margin: 0 }}>Analytics</h2>
        <button onClick={handleRunEtl} disabled={busy}>
          {busy ? "Running ETL…" : "Run ETL pipeline"}
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {noData && !error && (
        <div className="panel">
          <p className="muted" style={{ margin: 0 }}>
            No analytics data yet. Click <b>Run ETL pipeline</b> to ingest the
            sample dataset under <code>/data</code> and populate the aggregates.
          </p>
        </div>
      )}

      {/* Overdue summary tiles */}
      {overdue && (
        <div className="stats-grid">
          <Tile label={`Open overdue (>${overdue.loan_days}d)`} value={overdue.open_overdue} />
          <Tile label="Returned late" value={overdue.returned_late} />
          <Tile label="Total open transactions" value={overdue.open_total} />
        </div>
      )}

      {/* Most borrowed books */}
      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Most Borrowed Books (Top 10)</h3>
        {popular.length === 0 ? (
          <p className="muted">No data.</p>
        ) : (
          <BarChart
            data={popular.map((b) => ({
              label: `${b.title} — ${b.author}`,
              value: b.borrow_count,
            }))}
          />
        )}
      </div>

      {/* Category-wise borrowing */}
      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Borrowing by Category</h3>
        {categories.length === 0 ? (
          <p className="muted">No data.</p>
        ) : (
          <BarChart
            data={categories.map((c) => ({
              label: c.category,
              value: c.borrow_count,
            }))}
          />
        )}
      </div>

      {/* Monthly trends */}
      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Monthly Borrowing Trends</h3>
        {months.length === 0 ? (
          <p className="muted">No data.</p>
        ) : (
          <BarChart
            data={months.map((m) => ({ label: m.month, value: m.borrow_count }))}
          />
        )}
      </div>

      {/* Overdue items table */}
      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Overdue Transactions</h3>
        {!overdue || overdue.items.length === 0 ? (
          <p className="muted">No transactions are currently overdue.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Txn</th>
                <th>Book</th>
                <th>Borrower</th>
                <th>Borrowed</th>
                <th>Days overdue</th>
              </tr>
            </thead>
            <tbody>
              {overdue.items.map((t) => (
                <tr key={t.transaction_id}>
                  <td>#{t.transaction_id}</td>
                  <td>{t.book_title}</td>
                  <td>{t.borrower_name}<br /><span className="muted">{t.borrower_email}</span></td>
                  <td>{new Date(t.borrow_date).toLocaleDateString()}</td>
                  <td><span className="badge borrowed">{t.days_overdue}d</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ETL run report — collapsed by default */}
      {etlReport && (
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Last ETL Run</h3>
          <pre style={{
            background: "#0f172a", color: "#e2e8f0",
            padding: "1rem", borderRadius: 6, overflow: "auto",
            fontSize: "0.82rem", maxHeight: 360,
          }}>
            {JSON.stringify(etlReport, null, 2)}
          </pre>
        </div>
      )}
    </>
  );
}

function Tile({ label, value }) {
  return (
    <div className="stat-card">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}
