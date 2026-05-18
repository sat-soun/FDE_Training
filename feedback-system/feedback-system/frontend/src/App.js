import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import FeedbackList from "./pages/FeedbackList";
import FeedbackDetail from "./pages/FeedbackDetail";
import FeedbackForm from "./pages/FeedbackForm";

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', system-ui, sans-serif" }}>
        <Navbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/feedback" element={<FeedbackList />} />
          <Route path="/feedback/:id" element={<FeedbackDetail />} />
          <Route path="/feedback/:id/edit" element={<FeedbackForm mode="edit" />} />
          <Route path="/submit" element={<FeedbackForm mode="create" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
