import { getAuthToken, clearAuth } from "./authToken";

export class ApiError extends Error {
  constructor(message, status = 500, code = "API_ERROR", data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_URL || "https://hostelmate-saas-1.onrender.com";
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

const isPublicRoutePath = (pathname) => {
  if (!pathname) return false;
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/h/") || pathname.startsWith("/hostel/")) return true;
  if (pathname.startsWith("/request-")) return true;
  return false;
};

const redirectToLogin = () => {
  if (isPublicRoutePath(window.location.pathname)) return;
  try {
    if (window.location.pathname.startsWith("/admin")) {
      window.location.assign("/admin/login");
    } else {
      window.location.assign("/login");
    }
  } catch {
    window.location.href = window.location.pathname.startsWith("/admin") ? "/admin/login" : "/login";
  }
};

/**
 * Centralized safe API response parser that guards against HTML / non-JSON responses.
 * @param {Response} response - Browser fetch Response object
 * @returns {Promise<any>} Parsed JSON data
 */
export async function parseApiResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const text = await response.text().catch(() => "");
    throw new ApiError(
      `API returned non-JSON response (${response.status})`,
      response.status,
      "NON_JSON_RESPONSE",
      text
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.message || data.error || `Request failed with status ${response.status}`,
      response.status,
      data.code || "REQUEST_FAILED",
      data
    );
  }

  return data;
}

export const apiFetch = async (url, options = {}) => {
  const baseUrl = getApiBaseUrl();
  const resolvedUrl = url.startsWith("http://") || url.startsWith("https://")
    ? url
    : `${baseUrl.replace(/\/+$/, "")}/${url.replace(/^\/+/, "")}`;

  const isAdminRoute = resolvedUrl.includes("/api/admin") || window.location.pathname.startsWith("/admin");
  const isPublicApi = resolvedUrl.includes("/api/request/") || resolvedUrl.includes("/api/public/");

  const authToken = isAdminRoute
    ? localStorage.getItem("adminToken") || localStorage.getItem("token")
    : getAuthToken();

  const headers = {
    ...(options.headers || {}),
    ...(!isPublicApi && authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };

  const fetchOptions = {
    ...options,
    headers,
  };

  if (fetchOptions.body && typeof fetchOptions.body === "object" && !(fetchOptions.body instanceof FormData)) {
    if (!headers["Content-Type"]) {
      fetchOptions.headers["Content-Type"] = "application/json";
    }
    fetchOptions.body = JSON.stringify(fetchOptions.body);
  }

  let res;
  try {
    res = await fetch(resolvedUrl, fetchOptions);
  } catch (err) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hostelmate:network-error", { detail: { url: resolvedUrl, message: err?.message } }));
    }
    throw new ApiError(err?.message || "Network request failed", 0, "NETWORK_ERROR");
  }

  if (res.status === 401) {
    if (!isPublicApi && !isPublicRoutePath(window.location.pathname)) {
      if (!isAdminRoute) {
        clearAuth();
      } else {
        localStorage.removeItem("adminToken");
      }
      redirectToLogin();
    }
    throw new ApiError("Session expired or unauthorized", 401, "UNAUTHORIZED");
  }

  return parseApiResponse(res);
};

export default apiFetch;
