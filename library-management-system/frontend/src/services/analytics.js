import api from "../api";

export const popularBooks = (limit = 10) =>
  api.get("/analytics/popular-books", { params: { limit } }).then((r) => r.data);

export const categoryBorrowing = () =>
  api.get("/analytics/category-borrowing").then((r) => r.data);

export const monthlyTrends = (months = 12) =>
  api.get("/analytics/monthly-trends", { params: { months } }).then((r) => r.data);

export const overdueReport = (limit = 50) =>
  api.get("/analytics/overdue", { params: { limit } }).then((r) => r.data);

export const runEtl = () => api.post("/etl/run").then((r) => r.data);
