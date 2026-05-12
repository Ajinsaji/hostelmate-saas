import axios from "axios";

const apiBaseURL = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: apiBaseURL,
});

// Allow browser to upload files correctly
api.defaults.withCredentials = false;

// Attach token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Centralized 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      localStorage.removeItem("token");
      // Avoid importing react-router; keep API layer framework-agnostic
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

