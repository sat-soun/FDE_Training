import { useEffect, useState } from "react";
import Modal from "../components/Modal.jsx";
import {
  listBorrowers,
  createBorrower,
  updateBorrower,
  deleteBorrower,
} from "../services/borrowers.js";

const EMPTY = { borrower_name: "", email: "", phone: "" };

export default function Borrowers() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      setRows(await listBorrowers());
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
    setForm({ borrower_name: b.borrower_name, email: b.email, phone: b.phone });
    setError("");
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.borrower_name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError("All fields are required");
      return;
    }
    // Light email check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Please enter a valid email address");
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        await updateBorrower(editing.borrower_id, form);
      } else {
        await createBorrower(form);
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
    if (!confirm(`Delete borrower "${b.borrower_name}"?`)) return;
    try {
      await deleteBorrower(b.borrower_id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <>
      <div className="row between" style={{ marginBottom: "1rem" }}>
        <h2 style={{ margin: 0 }}>Borrowers</h2>
        <button onClick={openAdd}>+ Add Borrower</button>
      </div>

      {error && !modal && <div className="error">{error}</div>}

      <div className="panel">
        {rows.length === 0 ? (
          <p className="muted">No borrowers yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th style={{ width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.borrower_id}>
                  <td>#{b.borrower_id}</td>
                  <td>{b.borrower_name}</td>
                  <td>{b.email}</td>
                  <td>{b.phone}</td>
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
        title={editing ? "Edit Borrower" : "Add Borrower"}
        onClose={() => setModal(false)}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div>
              <label>Name</label>
              <input value={form.borrower_name}
                onChange={(e) => setForm({ ...form, borrower_name: e.target.value })}
                required />
            </div>
            <div>
              <label>Email</label>
              <input type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required />
            </div>
            <div>
              <label>Phone</label>
              <input value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required />
            </div>
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
