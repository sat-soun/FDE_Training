import { useEffect, useState } from "react";
import Modal from "../components/Modal.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import {
  listBooks,
  createBook,
  updateBook,
  deleteBook,
} from "../services/books.js";

const EMPTY = { title: "", author: "", category: "", isbn: "" };

export default function Books() {
  const [books, setBooks] = useState([]);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null); // book object or null
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      setBooks(await listBooks());
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setError("");
    setModal(true);
  };

  const openEdit = (b) => {
    setEditing(b);
    setForm({
      title: b.title,
      author: b.author,
      category: b.category,
      isbn: b.isbn,
    });
    setError("");
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    // Basic validation
    for (const k of ["title", "author", "category", "isbn"]) {
      if (!form[k]?.trim()) {
        setError(`Field "${k}" is required`);
        return;
      }
    }
    setSubmitting(true);
    try {
      if (editing) {
        await updateBook(editing.book_id, form);
      } else {
        await createBook(form);
      }
      setModal(false);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (b) => {
    if (!confirm(`Delete "${b.title}"? This cannot be undone.`)) return;
    try {
      await deleteBook(b.book_id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <>
      <div className="row between" style={{ marginBottom: "1rem" }}>
        <h2 style={{ margin: 0 }}>Books</h2>
        <button onClick={openAdd}>+ Add Book</button>
      </div>

      {error && !modal && <div className="error">{error}</div>}

      <div className="panel">
        {books.length === 0 ? (
          <p className="muted">No books yet. Click "Add Book" to get started.</p>
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
                <th style={{ width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((b) => (
                <tr key={b.book_id}>
                  <td>#{b.book_id}</td>
                  <td>{b.title}</td>
                  <td>{b.author}</td>
                  <td>{b.category}</td>
                  <td>{b.isbn}</td>
                  <td><StatusBadge status={b.availability_status} /></td>
                  <td>
                    <div className="row">
                      <button className="secondary small" onClick={() => openEdit(b)}>Edit</button>
                      <button className="danger small" onClick={() => handleDelete(b)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={modal}
        title={editing ? "Edit Book" : "Add Book"}
        onClose={() => setModal(false)}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <Field name="title" label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
            <Field name="author" label="Author" value={form.author} onChange={(v) => setForm({ ...form, author: v })} />
            <Field name="category" label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
            <Field name="isbn" label="ISBN" value={form.isbn} onChange={(v) => setForm({ ...form, isbn: v })} />
          </div>
          {error && <div className="error">{error}</div>}
          <div className="row" style={{ justifyContent: "flex-end", marginTop: "1.25rem" }}>
            <button type="button" className="secondary" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : editing ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function Field({ name, label, value, onChange }) {
  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      />
    </div>
  );
}
