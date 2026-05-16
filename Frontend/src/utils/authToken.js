export const getAuthToken = () => {
  try {
    return localStorage.getItem("token") || localStorage.getItem("adminToken");
  } catch {
    return null;
  }
};

export const setAuthToken = (token, { type = "token" } = {}) => {
  try {
    if (!token) return;
    localStorage.setItem(type, token);
  } catch {
    // ignore
  }
};

export const clearAuth = () => {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("user");
  } catch {
    // ignore
  }
};

