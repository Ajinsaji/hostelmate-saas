import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useEffect, useState } from "react";

import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import PendingApproval from "./components/PendingApproval";
import OnboardingFlow from "./components/OnboardingFlow";

import AdminLogin from "./components/AdminLogin";
import PublicHostelPage from "./components/PublicHostelPage";

import Dashboard from "./owner/Dashboard";
import Rooms from "./owner/Rooms";
import Residents from "./owner/Residents";
import Payments from "./owner/Payments";
import Reports from "./owner/Reports";
import Profile from "./owner/Profile";
import PendingAdmissions from "./owner/PendingAdmissions";
import HostelSettings from "./owner/HostelSettings";
import OwnerProfileEdit from "./owner/OwnerProfileEdit";
import UpdatePassword from "./owner/UpdatePassword";
import SubscriptionExpired from "./pages/SubscriptionExpired";
import RequestStatus from "./pages/RequestStatus";


import StaffManagement from "./owner/StaffManagement";

import WardenDashboard from "./warden/Dashboard";
import CookDashboard from "./cook/Dashboard";

import AdminDashboard from "./Superadmin/AdminDashboard";
import PendingRequests from "./Superadmin/PendingRequests";
import SubscriptionControl from "./Superadmin/SubscriptionControl";
import SubscriptionSetup from "./Superadmin/SubscriptionSetup";
import AddHostel from "./Superadmin/AddHostel";
import AdminProfile from "./Superadmin/AdminPage";
import HostelManagement from "./Superadmin/HostelManagement";

import DesktopShell from "./pages/_DesktopShell";


import OwnerProtectedRoute from "./components/OwnerProtectedRoute";
import WardenProtectedRoute from "./components/WardenProtectedRoute";
import CookProtectedRoute from "./components/CookProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import NotificationBell from "./components/NotificationBell";
import ServerLoadingWrapper from "./components/ServerLoadingWrapper";

function NotificationBellHost() {
  const location = useLocation();
  const ownerToken = localStorage.getItem("ownerToken");
  const adminToken = localStorage.getItem("adminToken");

  let user = null;
  try {
    if (adminToken) {
      user = JSON.parse(localStorage.getItem("adminUser") || "null");
    } else {
      user = JSON.parse(localStorage.getItem("ownerUser") || localStorage.getItem("user") || "null");
    }
  } catch {
    user = null;
  }

  const role = user?.role;

  // Only show bell inside authenticated app areas.
  // DO NOT show on public/login/register/admission/landing.
  const publicLikePaths = [
    "/",
    "/login",
    "/register",
    "/admissions",
  ];

  const isPublicLike = publicLikePaths.includes(location.pathname);

  const shouldShowBell =
    (!!ownerToken || !!adminToken) &&
    !!user &&
    !isPublicLike &&
    ((role === "owner" && location.pathname.startsWith("/")) ||
      (role === "admin" && location.pathname.startsWith("/admin")) ||
      (role === "superadmin" && location.pathname.startsWith("/admin")) ||
      (role === "warden" && location.pathname.startsWith("/warden")));

  if (!shouldShowBell) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 14,
        right: 14,
        zIndex: 3000,
        pointerEvents: "auto",
      }}
    >
      <NotificationBell />
    </div>
  );
}


import useSessionVerification from "./hooks/useSessionVerification";

function SessionGateWrapper() {
  const { verifying } = useSessionVerification();
  return verifying ? <div style={{ minHeight: "100vh" }} /> : null;
}

function RequestAutoRedirect() {
  const [booting, setBooting] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const phone = localStorage.getItem("hostelRequestPhone");
        if (!phone) {
          if (mounted) setShouldRedirect(false);
          return;
        }

        const apiBase = import.meta.env?.VITE_API_URL || "";
        const res = await fetch(
          `${apiBase}/api/hostel-request/status/${encodeURIComponent(phone)}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const status = data?.request?.status || data?.status;
        const allowed = ["pending", "approved", "activation_pending"];

        if (mounted) setShouldRedirect(allowed.includes(status));
      } catch {
        // ignore auto-redirect failures
      } finally {
        if (mounted) setBooting(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (booting) return null;
  return shouldRedirect ? <Navigate to="/request-status" replace /> : null;
}

function App() {
  // Pending approval UX: if user is not authenticated yet but has a pending request,
  // always open /pending-approval (except when user is already on that route).
  const token = localStorage.getItem("ownerToken") || localStorage.getItem("adminToken");

  const pending = (() => {
    try {
      return JSON.parse(localStorage.getItem("pendingApproval") || "null");
    } catch {
      return null;
    }
  })();

  const shouldRedirectPending = !!pending && !token;

  return (
    <ServerLoadingWrapper>
      <BrowserRouter>
        <SessionGateWrapper />

        <Routes>

          {/* Pending approval enforcement (no login/register) */}
          <Route
            path="/pending-approval"
            element={<PendingApproval />}
          />

          {/* Subscription expiry page (owner only, but must not override mustChangePassword redirect) */}
          <Route path="/subscription-expired" element={<SubscriptionExpired />} />


        {shouldRedirectPending ? (
          <Route path="*" element={<Navigate to="/pending-approval" replace />} />
        ) : (
          <>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
          <Route path="/request-status" element={<RequestStatus />} />
          <Route path="/back" element={<Navigate to="/login" replace />} />
          </>
        )}



        {/* Owner Onboarding */}
        <Route path="/ownerAction" element={<OnboardingFlow />} />
        {/* Alias to satisfy OwnerProtectedRoute redirect destination */}
        <Route path="/onboarding" element={<OnboardingFlow />} />


        <Route
          path="/owner/dashboard"
          element={
            <OwnerProtectedRoute>
              <DesktopShell
                variant="owner"
                title="Dashboard"
                breadcrumbs={[{ label: "Dashboard" }]}
                backTo={"/owner/dashboard"}
              >
                <Dashboard />
              </DesktopShell>
            </OwnerProtectedRoute>
          }
        />
        <Route
          path="/rooms"
          element={
            <OwnerProtectedRoute>
              <DesktopShell
                variant="owner"
                title="Rooms"
                breadcrumbs={[{ label: "Rooms" }]}
                backTo={"/owner/dashboard"}
              >
                <Rooms />
              </DesktopShell>
            </OwnerProtectedRoute>
          }
        />
        <Route
          path="/residents"
          element={
            <OwnerProtectedRoute>
              <DesktopShell
                variant="owner"
                title="Residents"
                breadcrumbs={[{ label: "Residents" }]}
                backTo={"/owner/dashboard"}
              >
                <Residents />
              </DesktopShell>
            </OwnerProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <OwnerProtectedRoute>
              <DesktopShell
                variant="owner"
                title="Payments"
                breadcrumbs={[{ label: "Payments" }]}
                backTo={"/owner/dashboard"}
              >
                <Payments />
              </DesktopShell>
            </OwnerProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <OwnerProtectedRoute>
              <DesktopShell
                variant="owner"
                title="Reports"
                breadcrumbs={[{ label: "Reports" }]}
                backTo={"/owner/dashboard"}
              >
                <Reports />
              </DesktopShell>
            </OwnerProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <OwnerProtectedRoute>
              <DesktopShell
                variant="owner"
                title="Profile"
                breadcrumbs={[{ label: "Profile" }]}
                backTo={"/owner/dashboard"}
              >
                <Profile />
              </DesktopShell>
            </OwnerProtectedRoute>
          }
        />
        <Route
          path="/owner/settings"
          element={
            <OwnerProtectedRoute>
              <DesktopShell
                variant="owner"
                title="Settings"
                breadcrumbs={[{ label: "Settings" }]}
                backTo={"/owner/dashboard"}
              >
                <HostelSettings />
              </DesktopShell>
            </OwnerProtectedRoute>
          }
        />
        <Route
          path="/owner/profile"
          element={
            <OwnerProtectedRoute>
              <DesktopShell
                variant="owner"
                title="Owner Profile"
                breadcrumbs={[{ label: "Owner Profile" }]}
                backTo={"/owner/dashboard"}
              >
                <OwnerProfileEdit />
              </DesktopShell>
            </OwnerProtectedRoute>
          }
        />
        <Route
          path="/owner/update-password"
          element={
            <OwnerProtectedRoute>
              <DesktopShell
                variant="owner"
                title="Update Password"
                breadcrumbs={[{ label: "Update Password" }]}
                backTo={"/owner/dashboard"}
              >
                <UpdatePassword />
              </DesktopShell>
            </OwnerProtectedRoute>
          }
        />

        <Route
          path="/staff"
          element={
            <OwnerProtectedRoute>
              <DesktopShell
                variant="owner"
                title="Staff Management"
                breadcrumbs={[{ label: "Staff Management" }]}
                backTo={"/owner/dashboard"}
              >
                <StaffManagement />
              </DesktopShell>
            </OwnerProtectedRoute>
          }
        />
        <Route
          path="/admissions"
          element={
            <OwnerProtectedRoute>
              <DesktopShell
                variant="owner"
                title="Pending Admissions"
                breadcrumbs={[{ label: "Pending Admissions" }]}
                backTo={"/owner/dashboard"}
              >
                <PendingAdmissions />
              </DesktopShell>
            </OwnerProtectedRoute>
          }
        />


        <Route
          path="/warden"
          element={
            <WardenProtectedRoute>
              <WardenDashboard />
            </WardenProtectedRoute>
          }
        />
        <Route
          path="/cook"
          element={
            <CookProtectedRoute>
              <CookDashboard />
            </CookProtectedRoute>
          }
        />

        <Route path="/h/:hostelCode" element={<PublicHostelPage />} />

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <DesktopShell
                variant="admin"
                title="Admin"
                breadcrumbs={[{ label: "Admin" }]}
                backTo={"/admin"}
              >
                <AdminDashboard />
              </DesktopShell>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/pending-requests"
          element={
            <AdminProtectedRoute>
              <DesktopShell
                variant="admin"
                title="Pending Requests"
                breadcrumbs={[{ label: "Pending Requests" }]}
                backTo={"/admin"}
              >
                <PendingRequests />
              </DesktopShell>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/subscription-setup/:hostelId"
          element={
            <AdminProtectedRoute>
              <DesktopShell
                variant="admin"
                title="Subscription Setup"
                breadcrumbs={[{ label: "Subscription Setup" }]}
                backTo={"/admin"}
              >
                <SubscriptionSetup />
              </DesktopShell>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/subscriptions"
          element={
            <AdminProtectedRoute>
              <DesktopShell
                variant="admin"
                title="Subscriptions"
                breadcrumbs={[{ label: "Subscriptions" }]}
                backTo={"/admin"}
              >
                <SubscriptionControl />
              </DesktopShell>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/add-hostel"
          element={
            <AdminProtectedRoute>
              <DesktopShell
                variant="admin"
                title="Add Hostel"
                breadcrumbs={[{ label: "Add Hostel" }]}
                backTo={"/admin"}
              >
                <AddHostel />
              </DesktopShell>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/hostels"
          element={
            <AdminProtectedRoute>
              <DesktopShell
                variant="admin"
                title="Hostel Management"
                breadcrumbs={[{ label: "Hostel Management" }]}
                backTo={"/admin"}
              >
                <HostelManagement />
              </DesktopShell>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <AdminProtectedRoute>
              <DesktopShell
                variant="admin"
                title="Profile"
                breadcrumbs={[{ label: "Profile" }]}
                backTo={"/admin"}
              >
                <AdminProfile />
              </DesktopShell>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <AdminProtectedRoute>
              <DesktopShell
                variant="admin"
                title="Reports"
                breadcrumbs={[{ label: "Reports" }]}
                backTo={"/admin"}
              >
                <Reports />
              </DesktopShell>
            </AdminProtectedRoute>
          }
        />


        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
    </ServerLoadingWrapper>
  );
}

export default App;

