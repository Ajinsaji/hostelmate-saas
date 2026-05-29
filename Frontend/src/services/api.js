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

const PUBLIC_PATHS = new Set(["/", "/login", "/admin-login", "/register"]);

const isPublicPath = (pathname) => {
  if (!pathname) return false;
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/h/")) return true; // public hostel pages
  return false;
};

const redirectToLogin = (path) => {
  // If user is already on a public route, do not force any navigation.
  // Prevents redirect loops on app startup/back.
  if (isPublicPath(window.location.pathname)) return;
  if (window.location.pathname === path) return;

  // Never override admin routes with owner redirects.
  // If current path is /admin/*, force redirect only to /admin/login.
  if (window.location.pathname.startsWith("/admin") && path === "/login") {
    path = "/admin/login";
  }

  toast.error("Session expired. Please login again.");
  window.location.href = path;
};

// Detect admin context for redirect decisions.
const isAdminContext = () => {
  return window.location.pathname.startsWith("/admin");
};



api.interceptors.request.use(

  (config) => {
    config.headers = config.headers || {};

    const requestUrl = config.url || "";
    const isAdminRequest = requestUrl.includes("/api/admin");
    // Admin and owner tokens must not cross-redirect each other.
    // Admin requests should only ever read adminToken.
    const token = isAdminRequest
      ? localStorage.getItem("adminToken")
      : localStorage.getItem("ownerToken") || localStorage.getItem("token");


    if (token) {
      if (isTokenExpired(token)) {
        if (isAdminRequest) {
          localStorage.removeItem("adminToken");
          redirectToLogin("/admin/login");
        } else {
          localStorage.removeItem("ownerToken");
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
        localStorage.removeItem("ownerToken");
        localStorage.removeItem("token");
        redirectToLogin("/login");
      }
    }

    return Promise.reject(error);
  }
);

