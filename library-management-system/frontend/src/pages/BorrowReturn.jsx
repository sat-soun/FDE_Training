import { useEffect, useMemo, useState } from "react";
import { listBooks } from "../services/books.js";
import { listBorrowers } from "../services/borrowers.js";
import {
  borrowBook,
  returnBook,
  listTransactions,
} from "../services/transactions.js";

export default function BorrowReturn() {
  const [books, setBooks] = useState([]);
  const [borrowers, setBorrowers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [bookId, setBookId] = useState("");
  const [borrowerId, setBorrowerId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const [b, br, t] = await Promise.all([
        listBooks(),
        listBorrowers(),
        listTransactions(),
      ]);
      setBooks(b);
      setBorrowers(br);
      setTransactions(t);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const availableBooks = useMemo(
    () => books.filter((b) => b.availability_status === "available"),
    [books]
  );
  const openTransactions = useMemo(
    () => transactions.filter((t) => !t.return_date),
    [transactions]
  );

  const handleBorrow = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!bookId || !borrowerId) {
      setError("Please pick a book and a borrower");
      return;
    }
    setBusy(true);
    try {
      const txn = await borrowBook(Number(bookId), Number(borrowerId));
      setSuccess(`Borrowed successfully (transaction #${txn.transaction_id})`);
      setBookId("");
      setBorrowerId("");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleReturn = async (txn) => {
    setError("");
    setSuccess("");
    if (!confirm(`Return book "${txn.book_title}"?`)) return;
    try {
      await returnBook(txn.transaction_id);
      setSuccess(`Returned (transaction #${txn.transaction_id})`);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <>
      <h2>Borrow / Return</h2>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Borrow a Book</h3>
        <form onSubmit={handleBorrow}>
          <div className="form-grid">
            <div>
              <label>Book</label>
              <select value={bookId} onChange={(e) => setBookId(e.target.value)} required>
                <option value="">-- Select an available book --</option>
                {availableBooks.map((b) => (
                  <option key={b.book_id} value={b.book_id}>
                    {b.title} — {b.author} ({b.isbn})
                  </option>
                ))}
              </select>
              {availableBooks.length === 0 && (
                <div className="muted" style={{ marginTop: "0.25rem" }}>
                  No books currently available.
                </div>
              )}
            </div>
            <div>
              <label>Borrower</label>
              <select value={borrowerId} onChange={(e) => setBorrowerId(e.target.value)} required>
                <option value="">-- Select a borrower --</option>
                {borrowers.map((b) => (
                  <option key={b.borrower_id} value={b.borrower_id}>
                    {b.borrower_name} ({b.email})
                  </option>
                ))}
              </select>
            </div>
          </div>
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
          <div className="spacer" />
          <button type="submit" disabled={busy}>
            {busy ? "Working…" : "Borrow Book"}
          </button>
        </form>
      </div>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Open Transactions</h3>
        {openTransactions.length === 0 ? (
          <p className="muted">No active borrows.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Txn</th>
                <th>Book</th>
                <th>Borrower</th>
                <th>Borrowed</th>
                <th style={{ width: 110 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {openTransactions.map((t) => (
                <tr key={t.transaction_id}>
                  <td>#{t.transaction_id}</td>
                  <td>{t.book_title}</td>
                  <td>{t.borrower_name}</td>
                  <td>{new Date(t.borrow_date).toLocaleString()}</td>
                  <td>
                    <button className="small" onClick={() => handleReturn(t)}>Return</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>All Transactions</h3>
        {transactions.length === 0 ? (
          <p className="muted">No transactions yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Txn</th>
                <th>Book</th>
                <th>Borrower</th>
                <th>Borrowed</th>
                <th>Returned</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.transaction_id}>
                  <td>#{t.transaction_id}</td>
                  <td>{t.book_title}</td>
                  <td>{t.borrower_name}</td>
                  <td>{new Date(t.borrow_date).toLocaleString()}</td>
                  <td>
                    {t.return_date
                      ? new Date(t.return_date).toLocaleString()
                      : <span className="badge borrowed">open</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
