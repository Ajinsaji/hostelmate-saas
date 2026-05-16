import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";

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

export default function AdminProtectedRoute({ children }) {
  const token = localStorage.getItem("adminToken");

  if (!token) {
    localStorage.removeItem("adminToken");
    return <Navigate to="/admin/login" replace />;
  }

  const payload = decodeJwtPayload(token);
  const validRole = payload?.role === "admin" || payload?.role === "super_admin";
  const expired = isTokenExpired(token);

  if (!payload || !validRole || expired) {
    localStorage.removeItem("adminToken");
    if (window.location.pathname !== "/admin/login") {
      toast.error("Session expired. Please login again.");
    }
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
