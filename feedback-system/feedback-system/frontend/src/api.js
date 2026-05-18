import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ── Feedback CRUD ──────────────────────────────────────────────────────────

export const getAllFeedback = (skip = 0, limit = 100) =>
  api.get("/feedback", { params: { skip, limit } }).then((r) => r.data);

export const getFeedbackById = (id) =>
  api.get(`/feedback/${id}`).then((r) => r.data);

export const createFeedback = (data) =>
  api.post("/feedback", data).then((r) => r.data);

export const updateFeedback = (id, data) =>
  api.put(`/feedback/${id}`, data).then((r) => r.data);

export const deleteFeedback = (id) =>
  api.delete(`/feedback/${id}`).then((r) => r.data);

// ── Search & Filter ────────────────────────────────────────────────────────

export const searchFeedback = ({ keyword, rating, program_name, skip = 0, limit = 100 } = {}) => {
  const params = {};
  if (keyword) params.keyword = keyword;
  if (rating) params.rating = rating;
  if (program_name) params.program_name = program_name;
  params.skip = skip;
  params.limit = limit;
  return api.get("/feedback/search", { params }).then((r) => r.data);
};

// ── Stats ──────────────────────────────────────────────────────────────────

export const getStats = () =>
  api.get("/feedback/stats").then((r) => r.data);

export default api;
