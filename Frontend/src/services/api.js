import axios from "axios";
import toast from "react-hot-toast";

const apiBaseURL = import.meta.env.VITE_API_URL || "https://hostelmate-saas-1.onrender.com";

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
  } catch {
    return null;
  }
};

const isTokenExpired = (token) => {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return true;
  return Math.floor(Date.now() / 1000) >= payload.exp;
};

const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/owner/login",
  "/admin-login",
  "/admin/login",
  "/register",
  "/request-status",
  "/request-tracking",
  "/track-request",
  "/application-status",
  "/pending-approval",
]);

export const isPublicPath = (pathname) => {
  if (!pathname) return false;
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/h/")) return true; // public hostel pages
  if (pathname.startsWith("/hostel/")) return true; // public hostel pages
  if (pathname.startsWith("/request-status")) return true;
  if (pathname.startsWith("/request-tracking")) return true;
  if (pathname.startsWith("/track-request")) return true;
  if (pathname.startsWith("/application-status")) return true;
  return false;
};

// ─── Public API URL patterns ─────────────────────────────────────────────────
// These API endpoints do not require authentication.
// A 401 from these must NOT trigger auth redirect or log auth-redirect noise.
const PUBLIC_API_PATTERNS = [
  "/api/request/register",
  "/api/request/pincode/",
  "/api/request/status/",
  "/api/hostel-request/status/",
  "/api/request/",
  "/api/public/",
];

/**
 * Returns true if the request URL is a known public (no-auth) API endpoint.
 * Used to suppress spurious "AUTH REDIRECT TRIGGERED" noise and prevent
 * redirect-to-login when a public endpoint responds with 401.
 */
export const isPublicApiUrl = (url) => {
  if (!url) return false;
  return PUBLIC_API_PATTERNS.some((pattern) => url.includes(pattern));
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
const isAdminContext = () => window.location.pathname.startsWith("/admin");

import { getDeviceId } from "../utils/authToken";

api.interceptors.request.use(
  (config) => {
    config.headers = config.headers || {};

    const deviceId = getDeviceId();
    if (deviceId) {
      config.headers["x-device-id"] = deviceId;
    }

    const requestUrl = config.url || "";

    // Public API routes do not need or receive an auth token.
    // Skip token injection entirely for these endpoints.
    if (isPublicApiUrl(requestUrl)) {
      return config;
    }

    const isAdminRequest =
      requestUrl.includes("/api/admin") || isAdminContext();

    // Admin and owner tokens must not cross-redirect each other.
    const token = isAdminRequest
      ? localStorage.getItem("adminToken") || localStorage.getItem("token")
      : localStorage.getItem("ownerToken") || localStorage.getItem("token");

    const authorizationHeaderExists = !!config.headers?.Authorization;
    const method = (config.method || "").toUpperCase();

    if (import.meta.env.DEV) {
      console.log("[API REQUEST]", {
        Method: method,
        URL: requestUrl,
        Authorization: authorizationHeaderExists || !!token ? "Present" : "Missing",
        "Token Prefix": token ? String(token).slice(0, 20) + "..." : "(none)",
        "Is Admin Request": isAdminRequest,
      });
    }

    if (token) {
      if (isTokenExpired(token)) {
        // If current API endpoint is public or current route is public, do NOT trigger token expiry redirect
        if (isPublicApiUrl(requestUrl) || isPublicPath(window.location.pathname)) {
          return config;
        }
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

    const activeHostelId = localStorage.getItem("activeHostelId");
    if (activeHostelId) {
      config.headers["x-active-hostel-id"] = activeHostelId;
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
      const method = (error?.config?.method || "").toUpperCase();
      const responseBody = error?.response?.data;
      const code = responseBody?.code;
      const message = responseBody?.message || "";

      // If subscription is expired, do not clear tokens or redirect to login.
      if (code === "SUBSCRIPTION_EXPIRED" || message === "Subscription expired") {
        return Promise.reject(error);
      }

      // ── Public API endpoints and public routes never force auth redirects ───
      // A 401 from a public API or on a public route must NOT trigger auth redirect
      // or flood the console with misleading auth-redirect logs.
      if (isPublicApiUrl(requestUrl) || isPublicPath(window.location.pathname)) {
        if (import.meta.env.DEV) {
          console.warn("[API] 401 on public endpoint or route (no auth required):", requestUrl);
        }
        return Promise.reject(error);
      }

      // [API RESPONSE ERROR]
      if (import.meta.env.DEV) {
        console.log("[API RESPONSE ERROR]", {
          Method: method,
          URL: requestUrl,
          Status: status,
          ResponseBody: responseBody,
          "Is Admin Request": isAdminRequest,
        });
      }

      const reason =
        responseBody?.message ||
        error?.message ||
        "(no message)";

      // ***** AUTH REDIRECT TRIGGERED *****
      // Only logged for genuinely authenticated endpoints on protected routes that returned 401.
      console.log("***** AUTH REDIRECT TRIGGERED *****", {
        Request: {
          Method: method,
          URL: requestUrl,
        },
        Status: status,
        Reason: reason,
        "Current Route": window.location.pathname,
        "Token Exists": !!localStorage.getItem("ownerToken"),
        "Owner Exists": !!localStorage.getItem("ownerUser"),
      });

      if (isAdminRequest) {
        localStorage.removeItem("adminToken");
        redirectToLogin("/admin/login");
      } else {
        localStorage.removeItem("ownerToken");
        localStorage.removeItem("token");
        redirectToLogin("/login");
      }
    } else if (!status || error?.code === "ERR_NETWORK" || error?.message === "Network Error") {
      // Network failure (device offline, server down, connection reset)
      // DO NOT clear auth tokens or redirect! Dispatch event to ConnectionContext.
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("hostelmate:network-error", { detail: { url: requestUrl, message: error?.message } }));
      }
    }

    return Promise.reject(error);
  }
);

