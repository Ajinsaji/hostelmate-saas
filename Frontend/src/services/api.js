import axios from "axios";
import toast from "react-hot-toast";

const apiBaseURL = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: apiBaseURL,
});

// Allow browser to upload files correctly
api.defaults.withCredentials = false;

const decodeJwtPayload = (token) => {
  try {
    const base64Payload = token.split(".")[1];
    if (!base64Payload) return null;
    const payload = atob(base64Payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(
      decodeURIComponent(
        Array.from(payload)
          .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
          .join("")
      )
    );
  } catch (error) {
    return null;
  }
};

const isTokenExpired = (token) => {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return true;
  return Math.floor(Date.now() / 1000) >= payload.exp;
};

const redirectToLogin = (path) => {
  if (window.location.pathname === path) return;
  toast.error("Session expired. Please login again.");
  window.location.href = path;
};

api.interceptors.request.use(
  (config) => {
    config.headers = config.headers || {};
    if (config.headers.Authorization) {
      return config;
    }

    const requestUrl = config.url || "";
    const isAdminRequest = requestUrl.includes("/api/admin");
    const token = isAdminRequest
      ? localStorage.getItem("adminToken")
      : localStorage.getItem("token");

    if (token) {
      if (isTokenExpired(token)) {
        if (isAdminRequest) {
          localStorage.removeItem("adminToken");
          redirectToLogin("/admin/login");
        } else {
          localStorage.removeItem("token");
          redirectToLogin("/login");
        }
        return Promise.reject(new Error("Expired token"));
      }
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = error?.config?.url || "";
    const isAdminRequest = requestUrl.includes("/api/admin");

    if (status === 401) {
      if (isAdminRequest) {
        localStorage.removeItem("adminToken");
        redirectToLogin("/admin/login");
      } else {
        localStorage.removeItem("token");
        redirectToLogin("/login");
      }
    }

    return Promise.reject(error);
  }
);

