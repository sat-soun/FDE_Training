import { useEffect, useState } from "react";
import { getDashboard, listTransactions } from "../services/transactions.js";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [s, t] = await Promise.all([getDashboard(), listTransactions()]);
        setStats(s);
        setRecent(t.slice(0, 8));
      } catch (e) {
        setError(e.message);
      }
    })();
  }, []);

  return (
    <>
      <h2>Dashboard</h2>
      {error && <div className="error">{error}</div>}

      <div className="stats-grid">
        <StatCard label="Total Books" value={stats?.total_books ?? "—"} />
        <StatCard label="Available" value={stats?.available_books ?? "—"} />
        <StatCard label="Borrowed" value={stats?.borrowed_books ?? "—"} />
        <StatCard label="Borrowers" value={stats?.total_borrowers ?? "—"} />
        <StatCard label="Open Transactions" value={stats?.open_transactions ?? "—"} />
      </div>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Recent Transactions</h3>
        {recent.length === 0 ? (
          <p className="muted">No transactions yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Book</th>
                <th>Borrower</th>
                <th>Borrowed</th>
                <th>Returned</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((t) => (
                <tr key={t.transaction_id}>
                  <td>#{t.transaction_id}</td>
                  <td>{t.book_title || `Book ${t.book_id}`}</td>
                  <td>{t.borrower_name || `Borrower ${t.borrower_id}`}</td>
                  <td>{fmt(t.borrow_date)}</td>
                  <td>{t.return_date ? fmt(t.return_date) : <span className="badge borrowed">open</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}

function fmt(s) {
  if (!s) return "";
  const d = new Date(s);
  return d.toLocaleString();
}
