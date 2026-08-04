import { Navigate } from "react-router-dom";
import useSessionVerification from "../hooks/useSessionVerification";
import PageLoader from "./PageLoader";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("ownerToken") || localStorage.getItem("token");
  const { verifying } = useSessionVerification();

  if (verifying) {
    return <PageLoader />;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

