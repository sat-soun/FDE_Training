import api from "../api";

export const borrowBook = (book_id, borrower_id) =>
  api.post("/borrow", { book_id, borrower_id }).then((r) => r.data);

export const returnBook = (transaction_id) =>
  api.post("/return", { transaction_id }).then((r) => r.data);

export const listTransactions = () =>
  api.get("/transactions").then((r) => r.data);

export const getDashboard = () => api.get("/dashboard").then((r) => r.data);
