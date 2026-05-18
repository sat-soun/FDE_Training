import { NavLink, Route, Routes, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import Books from "./pages/Books.jsx";
import Borrowers from "./pages/Borrowers.jsx";
import BorrowReturn from "./pages/BorrowReturn.jsx";
import Search from "./pages/Search.jsx";

export default function App() {
  return (
    <div className="app">
      <aside className="sidebar">
        <h1>Library System</h1>
        <nav>
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/books">Books</NavLink>
          <NavLink to="/borrowers">Borrowers</NavLink>
          <NavLink to="/borrow-return">Borrow / Return</NavLink>
          <NavLink to="/search">Search</NavLink>
        </nav>
      </aside>
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/books" element={<Books />} />
          <Route path="/borrowers" element={<Borrowers />} />
          <Route path="/borrow-return" element={<BorrowReturn />} />
          <Route path="/search" element={<Search />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
