import { useEffect } from "react";
import { clearAuth } from "../utils/authToken";

export const useAuthGuards = () => {
  useEffect(() => {
    const handle = () => {
      // Safety net: if no tokens exist, clear auth.
      const token = localStorage.getItem("token");
      const adminToken = localStorage.getItem("adminToken");
      const hasAny = !!token || !!adminToken;

      if (!hasAny) {
        // route-aware cleanup (don’t force logout on public pages)
        if (
          window.location.pathname.startsWith("/admin") ||
          window.location.pathname.startsWith("/dashboard") ||
          window.location.pathname.startsWith("/owner") ||
          window.location.pathname.startsWith("/warden") ||
          window.location.pathname.startsWith("/cook")
        ) {
          clearAuth();
        }
      }
    };

    window.addEventListener("focus", handle);
    return () => window.removeEventListener("focus", handle);
  }, []);
};

