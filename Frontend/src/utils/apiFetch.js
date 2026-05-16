import { getAuthToken, clearAuth } from "./authToken";

const redirectToLogin = () => {
  try {
    window.location.assign("/login");
  } catch {
    window.location.href = "/login";
  }
};

export const apiFetch = async (url, options = {}) => {
  const authToken = getAuthToken();

  const headers = {
    ...(options.headers || {}),
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };

  const fetchOptions = {
    ...options,
    headers,
  };

  // If body is plain object and caller forgot JSON header, handle JSON serialization.
  if (fetchOptions.body && typeof fetchOptions.body === "object" && !(fetchOptions.body instanceof FormData)) {
    if (!headers["Content-Type"]) {
      fetchOptions.headers["Content-Type"] = "application/json";
    }
    fetchOptions.body = JSON.stringify(fetchOptions.body);
  }

  const res = await fetch(url, fetchOptions);

  if (res.status === 401) {
    clearAuth();
    redirectToLogin();
    const err = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  return res.text();
};

