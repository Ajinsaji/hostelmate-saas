import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useEffect, useState, Suspense, lazy } from 'react';
import ErrorBoundary from './components/ErrorBoundary';

import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import PendingApproval from "./components/PendingApproval";
import OnboardingFlow from "./components/OnboardingFlow";

import AdminLogin from "./components/AdminLogin";
import PublicHostelPage from "./components/PublicHostelPage";
import PublicHostel from "./pages/PublicHostel";
import PublicHostelRegister from "./pages/PublicHostelRegister";

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

// Legacy admin page imports (replaced with Super Admin 3.0 lazy routing)
// import AdminDashboard from "./Superadmin/AdminDashboard";
// import PendingRequests from "./Superadmin/PendingRequests";
// import SubscriptionControl from "./Superadmin/SubscriptionControl";
// import SubscriptionSetup from "./Superadmin/SubscriptionSetup";
// import AddHostel from "./Superadmin/AddHostel";
// import AdminProfile from "./Superadmin/AdminPage";
// import HostelManagement from "./Superadmin/HostelManagement";

import DesktopShell from "./pages/_DesktopShell";


import OwnerProtectedRoute from "./components/OwnerProtectedRoute";
import WardenProtectedRoute from "./components/WardenProtectedRoute";
import CookProtectedRoute from "./components/CookProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import NotificationBell from "./components/NotificationBell";
import ServerLoadingWrapper from "./components/ServerLoadingWrapper";
import Notifications from "./pages/Notifications";

// New Super Admin 3.0 Lazy Imports
const AdminLayout = lazy(() => import("./superadmin/layouts/AdminLayout"));
const DashboardOverview = lazy(() => import("./superadmin/views/DashboardOverview"));
const OnboardingRequests = lazy(() => import("./superadmin/views/OnboardingRequests"));
const HostelsList = lazy(() => import("./superadmin/views/HostelsList"));
const HostelDetailsLayout = lazy(() => import("./superadmin/views/HostelDetailsLayout"));
const CustomerOverview = lazy(() => import("./superadmin/views/customer-360/CustomerOverview"));
const CustomerOwner = lazy(() => import("./superadmin/views/customer-360/CustomerOwner"));
const CustomerRooms = lazy(() => import("./superadmin/views/customer-360/CustomerRooms"));
const CustomerResidents = lazy(() => import("./superadmin/views/customer-360/CustomerResidents"));
const CustomerPayments = lazy(() => import("./superadmin/views/customer-360/CustomerPayments"));
const CustomerSubscription = lazy(() => import("./superadmin/views/customer-360/CustomerSubscription"));
const CustomerRevenue = lazy(() => import("./superadmin/views/customer-360/CustomerRevenue"));
const CustomerStorage = lazy(() => import("./superadmin/views/customer-360/CustomerStorage"));
const CustomerHealth = lazy(() => import("./superadmin/views/customer-360/CustomerHealth"));
const CustomerAudit = lazy(() => import("./superadmin/views/customer-360/CustomerAudit"));
const CustomerSupport = lazy(() => import("./superadmin/views/customer-360/CustomerSupport"));
const OwnersList = lazy(() => import("./superadmin/views/OwnersList"));
const CreateOwnerWizard = lazy(() => import("./superadmin/views/CreateOwnerWizard"));
const ResidentsList = lazy(() => import("./superadmin/views/ResidentsList"));
const SubscriptionCenter = lazy(() => import("./superadmin/views/SubscriptionCenter"));
const RevenueCenter = lazy(() => import("./superadmin/views/RevenueCenter"));
const PlatformFinance = lazy(() => import("./superadmin/views/PlatformFinance"));
const AnalyticsDashboard = lazy(() => import("./superadmin/views/AnalyticsDashboard"));
const CustomerSuccess = lazy(() => import("./superadmin/views/CustomerSuccess"));
const CommunicationConsole = lazy(() => import("./superadmin/views/CommunicationConsole"));
const PlatformReports = lazy(() => import("./superadmin/views/PlatformReports"));
const SupportDesk = lazy(() => import("./superadmin/views/SupportDesk"));
const SystemAuditLogs = lazy(() => import("./superadmin/views/SystemAuditLogs"));
const PlatformMonitoring = lazy(() => import("./superadmin/views/PlatformMonitoring"));
const PlatformSettings = lazy(() => import("./superadmin/views/PlatformSettings"));
const AdminProfile = lazy(() => import("./superadmin/views/AdminProfile"));
const LoadingState = lazy(() => import("./superadmin/components/feedback/LoadingState"));

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

import PwaUpdateModal from "./components/feedback/PwaUpdateModal";

function App() {
  // Service worker navigation handler must run inside a Router.
  // We'll mount a small inner component that uses `useNavigate()` below inside <BrowserRouter/>.

  function SwMessageHandler() {
    const navigate = useNavigate();

    useEffect(() => {
      if (!("serviceWorker" in navigator)) return undefined;

      const handleSwMessage = (event) => {
        const route = event?.data?.route;
        const type = event?.data?.type;
        if (type === "FCM_NAVIGATE" && route) {
          try {
            navigate(route);
          } catch {
            // fallback:
            window.location.href = route;
          }
        }
      };

      navigator.serviceWorker.addEventListener("message", handleSwMessage);
      return () => {
        navigator.serviceWorker.removeEventListener("message", handleSwMessage);
      };
    }, [navigate]);

    return null;
  }

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
      <PwaUpdateModal />
      <ErrorBoundary>
      <BrowserRouter>
        <SessionGateWrapper />
        {/* Router-bound service worker navigation handler */}
        {/** Mounted here so it can call useNavigate() safely. */}
        <SwMessageHandler />
        <NotificationBellHost />

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
                backTo="/owner/dashboard"
              >
                <PendingAdmissions />
              </DesktopShell>
            </OwnerProtectedRoute>
          }
        />
        <Route
          path="/pending-residents"
          element={
            <OwnerProtectedRoute>
              <DesktopShell
                variant="owner"
                title="Pending Residents"
                breadcrumbs={[{ label: "Pending Residents" }]}
                backTo="/owner/dashboard"
              >
                <PendingAdmissions />
              </DesktopShell>
            </OwnerProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <OwnerProtectedRoute>
              <DesktopShell
                variant="owner"
                title="Notifications"
                breadcrumbs={[{ label: "Notifications" }]}
                backTo="/owner/dashboard"
              >
                <Notifications />
              </DesktopShell>
            </OwnerProtectedRoute>
          }
        />

        <Route
          path="/warden/notifications"
          element={
            <WardenProtectedRoute>
              <Notifications />
            </WardenProtectedRoute>
          }
        />

        <Route
          path="/cook/notifications"
          element={
            <CookProtectedRoute>
              <Notifications />
            </CookProtectedRoute>
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
        <Route path="/hostel/:slug" element={<PublicHostel />} />
        <Route path="/hostel/:slug/register" element={<PublicHostelRegister />} />
        <Route path="/hostel/:slug/apply" element={<PublicHostelRegister />} />

        <Route path="/admin/login" element={<AdminLogin />} />
        
        {/* Super Admin 3.0 Lazy Loaded Nested Routes */}
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <Suspense fallback={<LoadingState />}>
                <AdminLayout />
              </Suspense>
            </AdminProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardOverview />} />
          <Route path="requests" element={<OnboardingRequests />} />
          <Route path="hostels" element={<HostelsList />} />
          
          <Route path="hostels/:id" element={<HostelDetailsLayout />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<CustomerOverview />} />
            <Route path="owner" element={<CustomerOwner />} />
            <Route path="rooms" element={<CustomerRooms />} />
            <Route path="residents" element={<CustomerResidents />} />
            <Route path="payments" element={<CustomerPayments />} />
            <Route path="subscription" element={<CustomerSubscription />} />
            <Route path="revenue" element={<CustomerRevenue />} />
            <Route path="storage" element={<CustomerStorage />} />
            <Route path="health" element={<CustomerHealth />} />
            <Route path="audit" element={<CustomerAudit />} />
            <Route path="support" element={<CustomerSupport />} />
          </Route>
          
          <Route path="owners" element={<OwnersList />} />
          <Route path="owners/new" element={<CreateOwnerWizard />} />
          <Route path="residents" element={<ResidentsList />} />
          <Route path="subscriptions" element={<SubscriptionCenter />} />
          <Route path="revenue" element={<RevenueCenter />} />
          <Route path="finance" element={<PlatformFinance />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="customer-success" element={<CustomerSuccess />} />
          <Route path="communication" element={<CommunicationConsole />} />
          <Route path="reports" element={<PlatformReports />} />
          <Route path="support" element={<SupportDesk />} />
          <Route path="audit" element={<SystemAuditLogs />} />
          <Route path="monitoring" element={<PlatformMonitoring />} />
          <Route path="settings" element={<PlatformSettings />} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
    </ServerLoadingWrapper>
  );
}

export default App;
