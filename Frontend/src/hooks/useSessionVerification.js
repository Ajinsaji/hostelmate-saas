import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function useSessionVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const [verifying, setVerifying] = useState(true);

  const isPublicRoute = useMemo(() => {
    const path = location.pathname;

    // Public pages that must never be forced to /login.
    if (
      path === "/" ||
      path === "/login" ||
      path === "/admin-login" ||
      path === "/register"
    ) {
      return true;
    }

    // Public hostel pages: /h/:hostelCode
    if (path.startsWith("/h/")) return true;

    return false;
  }, [location.pathname]);

  useEffect(() => {
    let mounted = true;

    // Prevent startup verification from triggering global redirects.
    if (isPublicRoute) {
      setVerifying(false);
      return;
    }

    const token =
      localStorage.getItem("ownerToken") ||
      localStorage.getItem("token") ||
      localStorage.getItem("adminToken");

    if (!token) {
      if (mounted) setVerifying(false);
      return;
    }

    const run = async () => {
      try {
        const { api } = await import("../services/api");
        // Interceptor may handle redirects on 401/expired.
        await api.get("/api/auth/verify-session");
        if (mounted) setVerifying(false);
      } catch {
        if (mounted) setVerifying(false);
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [navigate, isPublicRoute]);

  return { verifying };
}


