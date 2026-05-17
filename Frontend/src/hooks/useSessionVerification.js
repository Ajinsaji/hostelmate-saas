import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const verifyBase = `${import.meta.env.VITE_API_URL}/api/auth/verify-session`;

export default function useSessionVerification() {
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem("token") || localStorage.getItem("adminToken");

    if (!token) {
      if (mounted) setVerifying(false);
      return;
    }

    const run = async () => {
      try {
        const { api } = await import("../services/api");
        
        // The api interceptor already checks token existence and handles redirects.
        await api.get('/api/auth/verify-session');
        
        if (mounted) setVerifying(false);
      } catch (e) {
        // Interceptor handles 401 redirects, we just gracefully stop verifying here
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

