import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Surface a clean error message.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const detail =
      error?.response?.data?.detail ||
      error?.message ||
      "Unexpected error";
    return Promise.reject(new Error(Array.isArray(detail) ? JSON.stringify(detail) : detail));
  }
);

export default api;
