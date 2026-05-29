import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function useSessionVerification() {
  const navigate = useNavigate();
  const location = useLocation();

  const isPublicRoute = useMemo(() => {
    const path = location.pathname;

    // Public pages that must never be forced to /login.
    if (
      path === "/" ||
      path === "/login" ||
      path === "/register" ||
      path === "/admin/login" ||
      path === "/admin-login"
    ) {
      return true;
    }

    // Public hostel pages: /h/:hostelCode
    if (path.startsWith("/h/")) return true;

    return false;
  }, [location.pathname]);

  const [verifying, setVerifying] = useState(() => !isPublicRoute);

  useEffect(() => {
    let mounted = true;

    // Prevent startup verification from triggering global redirects.
    if (isPublicRoute) {
      setVerifying(false);
      return;
    }

    const path = location.pathname;
    const isAdminRoute = path.startsWith("/admin");

    // On admin routes, verify ONLY admin session and never owner session.
    // This prevents owner verify-session / interceptors from redirecting admins to /login.
    const token = isAdminRoute
      ? localStorage.getItem("adminToken")
      : localStorage.getItem("ownerToken") || localStorage.getItem("token");

    if (!token) {
      if (mounted) setVerifying(false);
      return;
    }

    const run = async () => {
      // Admin routes must NOT call the owner verification endpoint.
      // Admin validation is handled by <AdminProtectedRoute />.
      if (isAdminRoute) {
        if (mounted) setVerifying(false);
        return;
      }

      try {
        const { api } = await import("../services/api");
        // Interceptor may handle redirects on 401/expired.
        await api.get("/api/auth/verify-session");
        if (mounted) {
          setVerifying(false);
        }
      } catch (err) {
        if (mounted) {
          setVerifying(false);
        }
      }

    };

    run();


    return () => {
      mounted = false;
    };
  }, [navigate, isPublicRoute, location.pathname]);

  return { verifying };
}

