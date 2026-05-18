import { useState } from "react";
import { searchBooks } from "../services/books.js";
import StatusBadge from "../components/StatusBadge.jsx";

export default function Search() {
  const [filters, setFilters] = useState({ q: "", title: "", author: "", category: "" });
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      // Only send non-empty params
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v && v.trim())
      );
      const rows = await searchBooks(params);
      setResults(rows);
      setSearched(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleReset = () => {
    setFilters({ q: "", title: "", author: "", category: "" });
    setResults([]);
    setSearched(false);
  };

  return (
    <>
      <h2>Search Books</h2>

      <div className="panel">
        <form onSubmit={handleSearch}>
          <div className="form-grid">
            <div>
              <label>Keyword (any field)</label>
              <input
                placeholder="e.g. python, hugo, fiction"
                value={filters.q}
                onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              />
            </div>
            <div>
              <label>Title</label>
              <input value={filters.title}
                onChange={(e) => setFilters({ ...filters, title: e.target.value })} />
            </div>
            <div>
              <label>Author</label>
              <input value={filters.author}
                onChange={(e) => setFilters({ ...filters, author: e.target.value })} />
            </div>
            <div>
              <label>Category</label>
              <input value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })} />
            </div>
          </div>
          {error && <div className="error">{error}</div>}
          <div className="row" style={{ marginTop: "1rem" }}>
            <button type="submit" disabled={busy}>{busy ? "Searching…" : "Search"}</button>
            <button type="button" className="secondary" onClick={handleReset}>Reset</button>
          </div>
        </form>
      </div>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>
          Results {searched && <span className="muted">({results.length})</span>}
        </h3>
        {!searched ? (
          <p className="muted">Enter a keyword or filter and click Search.</p>
        ) : results.length === 0 ? (
          <p className="muted">No books match your search.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Author</th>
                <th>Category</th>
                <th>ISBN</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((b) => (
                <tr key={b.book_id}>
                  <td>#{b.book_id}</td>
                  <td>{b.title}</td>
                  <td>{b.author}</td>
                  <td>{b.category}</td>
                  <td>{b.isbn}</td>
                  <td><StatusBadge status={b.availability_status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
