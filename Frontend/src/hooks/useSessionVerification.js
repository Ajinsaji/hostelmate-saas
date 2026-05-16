import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const verifyBase = `${import.meta.env.VITE_API_URL}/api/auth/verify-session`;

export default function useSessionVerification() {
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        const token = localStorage.getItem("token");
        const adminToken = localStorage.getItem("adminToken");

        // If no token exists, immediately stop verifying.
        if (!token && !adminToken) {
          if (!mounted) return;
          setVerifying(false);
          return;
        }

        // Backend verify-session currently validates the same JWT secret.
        // For admin/staff, frontend should still send Authorization: Bearer <token>.
        const authToken = token || adminToken;

        const res = await fetch(verifyBase, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!res.ok) {
          let data = null;
          try {
            data = await res.json();
          } catch {
            // ignore
          }

          if (data?.message) {
            toast.error(data.message);
          } else {
            toast.error("Session expired. Please login again.");
          }

          localStorage.removeItem("token");
          localStorage.removeItem("adminToken");
          localStorage.removeItem("user");

          if (!mounted) return;
          navigate("/login", { replace: true });
          return;
        }

        if (mounted) setVerifying(false);
      } catch (e) {
        // Network/server error: do not log out aggressively.
        if (mounted) {
          setVerifying(false);
        }
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  return { verifying };
}

