import api from "../api";

export const listBooks = () => api.get("/books").then((r) => r.data);
export const getBook = (id) => api.get(`/books/${id}`).then((r) => r.data);
export const createBook = (payload) =>
  api.post("/books", payload).then((r) => r.data);
export const updateBook = (id, payload) =>
  api.put(`/books/${id}`, payload).then((r) => r.data);
export const deleteBook = (id) => api.delete(`/books/${id}`).then((r) => r.data);

export const searchBooks = (params) =>
  api.get("/search", { params }).then((r) => r.data);
