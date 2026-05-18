import api from "../api";

export const listBorrowers = () => api.get("/borrowers").then((r) => r.data);
export const getBorrower = (id) =>
  api.get(`/borrowers/${id}`).then((r) => r.data);
export const createBorrower = (payload) =>
  api.post("/borrowers", payload).then((r) => r.data);
export const updateBorrower = (id, payload) =>
  api.put(`/borrowers/${id}`, payload).then((r) => r.data);
export const deleteBorrower = (id) =>
  api.delete(`/borrowers/${id}`).then((r) => r.data);
