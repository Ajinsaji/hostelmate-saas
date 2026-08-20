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
import { HostelProvider } from "./contexts/HostelContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { ConnectionProvider } from "./contexts/ConnectionContext";
import ConnectionDiagnosticModal from "./components/ConnectionDiagnosticModal";

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
import ResidentProfile from "./owner/ResidentProfile";

import Payments from "./owner/Payments";
import RentDashboard from "./owner/RentDashboard";
import ExpenseDashboard from "./owner/ExpenseDashboard";
import KitchenDashboard from "./owner/KitchenDashboard";



import Reports from "./owner/Reports";
import Profile from "./owner/Profile";
import PendingAdmissions from "./owner/PendingAdmissions";
import HostelSettings from "./owner/HostelSettings";
import OwnerProfileEdit from "./owner/OwnerProfileEdit";
import UpdatePassword from "./owner/UpdatePassword";
import SecurityDevices from "./owner/SecurityDevices";
import SubscriptionExpired from "./pages/SubscriptionExpired";
import SubscriptionBilling from "./owner/SubscriptionBilling";
import OwnerBillingDashboard from "./owner/OwnerBillingDashboard";
import RequestStatus from "./pages/RequestStatus";
import ResetPasswordPage from "./pages/ResetPasswordPage";


import StaffManagement from "./owner/StaffManagement";
import AttendanceShiftManagement from "./owner/AttendanceShiftManagement";
import PayrollManagement from "./owner/PayrollManagement";
import BusinessIntelligence from "./owner/BusinessIntelligence";
import BusinessAnalytics from "./owner/BusinessAnalytics";
import StorageCenter from "./owner/StorageCenter";
import BrandingSettings from "./owner/BrandingSettings";
import DeveloperConsole from "./owner/DeveloperConsole";
import Marketplace from "./owner/Marketplace";
import AuditCenter from "./owner/AuditCenter";
import BackupCenter from "./owner/BackupCenter";
import EnterpriseConsole from "./owner/EnterpriseConsole";
import ReleaseNotes from "./pages/ReleaseNotes";
import ReleaseNotesAdmin from "./admin/ReleaseNotesAdmin";
import UpdateModal from "./components/UpdateModal";
import { useVersionChecker } from "./hooks/useVersionChecker";
import GlobalSearchModal from "./components/GlobalSearchModal";
import OfflineBanner from "./components/OfflineBanner";
import AIInsights from "./owner/AIInsights";
import MyPayroll from "./pages/MyPayroll";

import WardenDashboard from "./warden/Dashboard";
import CookDashboard from "./cook/Dashboard";
import AccountantDashboard from "./accountant/Dashboard";

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
import AccountantProtectedRoute from "./components/AccountantProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import NotificationBell from "./components/NotificationBell";
import ServerLoadingWrapper from "./components/ServerLoadingWrapper";
import Notifications from "./pages/Notifications";

// New Super Admin 3.0 Lazy Imports
const AdminLayout = lazy(() => import("./superadmin/layouts/AdminLayout"));
const DashboardOverview = lazy(() => import("./superadmin/views/DashboardOverview"));
const FinanceDashboard = lazy(() => import("./superadmin/views/FinanceDashboard"));
const OnboardingRequests = lazy(() => import("./superadmin/views/OnboardingRequests"));
const HostelsList = lazy(() => import("./superadmin/views/HostelsList"));
const HostelsTrash = lazy(() => import("./superadmin/views/HostelsTrash"));
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
const WhatsAppConsole = lazy(() => import("./owner/WhatsAppConsole"));
const AdminWhatsAppConsole = lazy(() => import("./admin/AdminWhatsAppConsole"));
const AdminTasksPage = lazy(() => import("./superadmin/views/AdminTasksPage"));

function NotificationBellHost() {
  return null;
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
  const versionCheck = useVersionChecker() || {};
  const showUpdateModal = Boolean(versionCheck.showUpdateModal || versionCheck.showModal);
  const latestRelease = versionCheck.latestRelease;
  const handleUpdateNow = versionCheck.handleUpdateNow || (() => window.location.reload());
  const handleLater = versionCheck.handleLater || (() => {});

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

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleOpenSearch = () => setIsSearchOpen(true);
    window.addEventListener("open-global-search", handleOpenSearch);
    return () => window.removeEventListener("open-global-search", handleOpenSearch);
  }, []);

  return (
    <ConnectionProvider>
      <ServerLoadingWrapper>
        <OfflineBanner />
        <ConnectionDiagnosticModal />
        <ErrorBoundary>
        <BrowserRouter>
        <HostelProvider>
          <NotificationProvider>
            <SessionGateWrapper />
            {/* Router-bound service worker navigation handler */}
            {/** Mounted here so it can call useNavigate() safely. */}
            <SwMessageHandler />
            <NotificationBellHost />
            <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
            {showUpdateModal && (
              <UpdateModal
                release={latestRelease}
                onUpdateNow={handleUpdateNow}
                onLater={handleLater}
                onClose={handleLater}
              />
            )}
 
            <Routes>

          {/* Public Request Tracking & Status Pages (Direct Public Access, Never Auth-Guarded) */}
          <Route path="/request-status" element={<RequestStatus />} />
          <Route path="/request-tracking" element={<RequestStatus />} />
          <Route path="/track-request" element={<RequestStatus />} />
          <Route path="/application-status" element={<RequestStatus />} />

          {/* Pending approval page */}
          <Route
            path="/pending-approval"
            element={<PendingApproval />}
          />

          {/* Subscription expiry page (owner only, but must not override mustChangePassword redirect) */}
          <Route path="/subscription-expired" element={<SubscriptionExpired />} />

          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/owner/login" element={<LoginPage />} />
          <Route path="/owner/reset-password" element={<ResetPasswordPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/back" element={<Navigate to="/owner/login" replace />} />



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
          path="/residents/:id"
          element={
            <OwnerProtectedRoute>
              <DesktopShell
                variant="owner"
                title="Resident Profile"
                breadcrumbs={[{ label: "Residents", to: "/residents" }, { label: "Profile" }]}
                backTo={"/residents"}
              >
                <ResidentProfile />
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
          path="/owner/rent-dashboard"
          element={
            <OwnerProtectedRoute>
              <DesktopShell
                variant="owner"
                title="Rent Collection & Financial Operations"
                breadcrumbs={[{ label: "Rent Dashboard" }]}
                backTo={"/owner/dashboard"}
              >
                <RentDashboard />
              </DesktopShell>
            </OwnerProtectedRoute>
          }
        />

        <Route
          path="/owner/expense-dashboard"
          element={
            <OwnerProtectedRoute>
              <DesktopShell
                variant="owner"
                title="Enterprise Expense Management"
                breadcrumbs={[{ label: "Expense Dashboard" }]}
                backTo={"/owner/dashboard"}
              >
                <ExpenseDashboard />
              </DesktopShell>
            </OwnerProtectedRoute>
          }
        />

        <Route
          path="/owner/kitchen-dashboard"
          element={
            <OwnerProtectedRoute>
              <DesktopShell
                variant="owner"
                title="Enterprise Food & Mess Management"
                breadcrumbs={[{ label: "Kitchen Dashboard" }]}
                backTo={"/owner/dashboard"}
              >
                <KitchenDashboard />
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
          path="/owner/whatsapp"
          element={
            <OwnerProtectedRoute>
              <DesktopShell
                variant="owner"
                title="WhatsApp Console"
                breadcrumbs={[{ label: "WhatsApp Console" }]}
                backTo={"/owner/dashboard"}
              >
                <WhatsAppConsole />
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
          path="/owner/security/devices"
          element={
            <OwnerProtectedRoute>
              <DesktopShell
                variant="owner"
                title="Your Devices"
                breadcrumbs={[{ label: "Profile", to: "/profile" }, { label: "Security & Devices" }]}
                backTo={"/profile"}
              >
                <SecurityDevices />
              </DesktopShell>
            </OwnerProtectedRoute>
          }
        />
        <Route
          path="/security/devices"
          element={
            <OwnerProtectedRoute>
              <DesktopShell
                variant="owner"
                title="Your Devices"
                breadcrumbs={[{ label: "Profile", to: "/profile" }, { label: "Security & Devices" }]}
                backTo={"/profile"}
              >
                <SecurityDevices />
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
          path="/attendance-shifts"
          element={
            <OwnerProtectedRoute>
              <DesktopShell
                variant="owner"
                title="Attendance & Shift Control"
                breadcrumbs={[{ label: "Attendance & Shifts" }]}
                backTo={"/owner/dashboard"}
              >
                <AttendanceShiftManagement />
              </DesktopShell>
            </OwnerProtectedRoute>
          }
        />
        <Route
          path="/payroll"
          element={
            <OwnerProtectedRoute>
              <DesktopShell
                variant="owner"
                title="Enterprise Payroll Engine"
                breadcrumbs={[{ label: "Payroll Engine" }]}
                backTo={"/owner/dashboard"}
              >
                <PayrollManagement />
              </DesktopShell>
            </OwnerProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <OwnerProtectedRoute>
              <DesktopShell
                variant="owner"
                title="Business Intelligence & Analytics"
                breadcrumbs={[{ label: "BI Analytics" }]}
                backTo={"/owner/dashboard"}
              >
                <BusinessIntelligence />
              </DesktopShell>
            </OwnerProtectedRoute>
          }
        />
        <Route
          path="/owner/business-analytics"
          element={
            <OwnerProtectedRoute>
              <DesktopShell
                variant="owner"
                title="Business Analytics Engine"
                breadcrumbs={[{ label: "Analytics Engine" }]}
                backTo={"/owner/dashboard"}
              >
                <BusinessAnalytics />
              </DesktopShell>
            </OwnerProtectedRoute>
          }
        />
        <Route
          path="/owner/storage-center"
          element={
            <OwnerProtectedRoute>
              <DesktopShell
                variant="owner"
                title="Enterprise Storage Center"
                breadcrumbs={[{ label: "Storage Center" }]}
                backTo={"/owner/dashboard"}
              >
                <StorageCenter />
              </DesktopShell>
            </OwnerProtectedRoute>
          }
        />
        <Route
          path="/owner/branding-settings"
          element={
            <OwnerProtectedRoute>
              <DesktopShell
                variant="owner"
                title="White-Label & Branding Settings"
                breadcrumbs={[{ label: "Branding Settings" }]}
                backTo={"/owner/dashboard"}
              >
                <BrandingSettings />
              </DesktopShell>
            </OwnerProtectedRoute>
          }
        />
        <Route
          path="/owner/developer-console"
          element={
            <OwnerProtectedRoute>
              <DesktopShell
                variant="owner"
                title="Developer & API Console"
                breadcrumbs={[{ label: "Developer Console" }]}
                backTo={"/owner/dashboard"}
              >
                <DeveloperConsole />
              </DesktopShell>
            </OwnerProtectedRoute>
          }
        />
        <Route
          path="/owner/marketplace"
          element={
            <OwnerProtectedRoute>
              <DesktopShell
                variant="owner"
                title="Enterprise Plugin Marketplace"
                breadcrumbs={[{ label: "Plugin Marketplace" }]}
                backTo={"/owner/dashboard"}
              >
                <Marketplace />
              </DesktopShell>
            </OwnerProtectedRoute>
          }
        />
        <Route
          path="/owner/audit-center"
          element={
            <OwnerProtectedRoute>
              <DesktopShell
                variant="owner"
                title="Enterprise Audit Vault"
                breadcrumbs={[{ label: "Audit Center" }]}
                backTo={"/owner/dashboard"}
              >
                <AuditCenter />
              </DesktopShell>
            </OwnerProtectedRoute>
          }
        />
        <Route
          path="/owner/backup-center"
          element={
            <OwnerProtectedRoute>
              <DesktopShell
                variant="owner"
                title="Enterprise Backup & Disaster Recovery"
                breadcrumbs={[{ label: "Backup Manager" }]}
                backTo={"/owner/dashboard"}
              >
                <BackupCenter />
              </DesktopShell>
            </OwnerProtectedRoute>
          }
        />
        <Route
          path="/owner/enterprise-console"
          element={
            <OwnerProtectedRoute>
              <DesktopShell
                variant="owner"
                title="Enterprise Console"
                breadcrumbs={[{ label: "Enterprise Console" }]}
                backTo={"/owner/dashboard"}
              >
                <EnterpriseConsole />
              </DesktopShell>
            </OwnerProtectedRoute>
          }
        />
        <Route
          path="/release-notes"
          element={
            <OwnerProtectedRoute>
              <DesktopShell
                variant="owner"
                title="Release Notes & Product Updates"
                breadcrumbs={[{ label: "Release Notes" }]}
                backTo={"/owner/dashboard"}
              >
                <ReleaseNotes />
              </DesktopShell>
            </OwnerProtectedRoute>
          }
        />
        <Route
          path="/admin/release-notes"
          element={
            <OwnerProtectedRoute>
              <DesktopShell
                variant="owner"
                title="Release Notes Admin Console"
                breadcrumbs={[{ label: "Release Admin" }]}
                backTo={"/owner/dashboard"}
              >
                <ReleaseNotesAdmin />
              </DesktopShell>
            </OwnerProtectedRoute>
          }
        />
        <Route
          path="/ai-insights"
          element={
            <OwnerProtectedRoute>
              <DesktopShell
                variant="owner"
                title="AI Insights & Automation"
                breadcrumbs={[{ label: "AI Insights" }]}
                backTo={"/owner/dashboard"}
              >
                <AIInsights />
              </DesktopShell>
            </OwnerProtectedRoute>
          }
        />
        <Route
          path="/my-payroll"
          element={
            <DesktopShell
              variant="staff"
              title="My Payroll & Payslips"
              breadcrumbs={[{ label: "My Payroll" }]}
            >
              <MyPayroll />
            </DesktopShell>
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
          path="/owner/subscription"
          element={
            <OwnerProtectedRoute>
              <DesktopShell
                variant="owner"
                title="Subscription & Billing"
                breadcrumbs={[{ label: "Subscription" }]}
                backTo="/owner/dashboard"
              >
                <SubscriptionBilling />
              </DesktopShell>
            </OwnerProtectedRoute>
          }
        />

        <Route
          path="/settings/subscription"
          element={
            <OwnerProtectedRoute>
              <DesktopShell
                variant="owner"
                title="Subscription & Billing"
                breadcrumbs={[{ label: "Subscription" }]}
                backTo="/owner/dashboard"
              >
                <SubscriptionBilling />
              </DesktopShell>
            </OwnerProtectedRoute>
          }
        />

        <Route
          path="/owner/billing-portal"
          element={
            <OwnerProtectedRoute>
              <DesktopShell
                variant="owner"
                title="Commercial Billing Portal"
                breadcrumbs={[{ label: "Billing Portal" }]}
                backTo="/owner/dashboard"
              >
                <OwnerBillingDashboard />
              </DesktopShell>
            </OwnerProtectedRoute>
          }
        />


        <Route
          path="/warden/notifications"
          element={
            <WardenProtectedRoute>
              <DesktopShell
                variant="warden"
                title="Warden Notifications"
                breadcrumbs={[{ label: "Notifications" }]}
                backTo="/warden/dashboard"
              >
                <Notifications />
              </DesktopShell>
            </WardenProtectedRoute>
          }
        />
 
        <Route
          path="/cook/notifications"
          element={
            <CookProtectedRoute>
              <DesktopShell
                variant="cook"
                title="Cook Notifications"
                breadcrumbs={[{ label: "Notifications" }]}
                backTo="/cook/dashboard"
              >
                <Notifications />
              </DesktopShell>
            </CookProtectedRoute>
          }
        />
 
        <Route
          path="/warden"
          element={
            <WardenProtectedRoute>
              <DesktopShell
                variant="warden"
                title="Warden Dashboard"
                breadcrumbs={[{ label: "Dashboard" }]}
              >
                <WardenDashboard />
              </DesktopShell>
            </WardenProtectedRoute>
          }
        />
        <Route
          path="/warden/dashboard"
          element={
            <WardenProtectedRoute>
              <DesktopShell
                variant="warden"
                title="Warden Dashboard"
                breadcrumbs={[{ label: "Dashboard" }]}
              >
                <WardenDashboard />
              </DesktopShell>
            </WardenProtectedRoute>
          }
        />
        <Route
          path="/cook"
          element={
            <CookProtectedRoute>
              <DesktopShell
                variant="cook"
                title="Cook Dashboard"
                breadcrumbs={[{ label: "Dashboard" }]}
              >
                <CookDashboard />
              </DesktopShell>
            </CookProtectedRoute>
          }
        />
        <Route
          path="/cook/dashboard"
          element={
            <CookProtectedRoute>
              <DesktopShell
                variant="cook"
                title="Cook Dashboard"
                breadcrumbs={[{ label: "Dashboard" }]}
              >
                <CookDashboard />
              </DesktopShell>
            </CookProtectedRoute>
          }
        />
        <Route
          path="/accountant"
          element={
            <AccountantProtectedRoute>
              <DesktopShell
                variant="accountant"
                title="Accountant Dashboard"
                breadcrumbs={[{ label: "Dashboard" }]}
              >
                <AccountantDashboard />
              </DesktopShell>
            </AccountantProtectedRoute>
          }
        />
        <Route
          path="/accountant/dashboard"
          element={
            <AccountantProtectedRoute>
              <DesktopShell
                variant="accountant"
                title="Accountant Dashboard"
                breadcrumbs={[{ label: "Dashboard" }]}
              >
                <AccountantDashboard />
              </DesktopShell>
            </AccountantProtectedRoute>
          }
        />
        <Route
          path="/accountant/notifications"
          element={
            <AccountantProtectedRoute>
              <DesktopShell
                variant="accountant"
                title="Accountant Notifications"
                breadcrumbs={[{ label: "Notifications" }]}
                backTo="/accountant/dashboard"
              >
                <Notifications />
              </DesktopShell>
            </AccountantProtectedRoute>
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
          <Route path="trash" element={<HostelsTrash />} />
          
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
          <Route path="register-owner" element={<CreateOwnerWizard />} />
          <Route path="residents" element={<ResidentsList />} />
          <Route path="subscriptions" element={<SubscriptionCenter />} />
          <Route path="finance-dashboard" element={<FinanceDashboard />} />
          <Route path="revenue" element={<RevenueCenter />} />

          <Route path="finance" element={<PlatformFinance />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="customer-success" element={<CustomerSuccess />} />
          <Route path="communication" element={<CommunicationConsole />} />
          <Route path="communications/whatsapp" element={<AdminWhatsAppConsole />} />
          <Route path="tasks" element={<AdminTasksPage />} />
          <Route path="reports" element={<PlatformReports />} />
          <Route path="support" element={<SupportDesk />} />
          <Route path="audit" element={<SystemAuditLogs />} />
          <Route path="monitoring" element={<PlatformMonitoring />} />
          <Route path="settings" element={<PlatformSettings />} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
          </NotificationProvider>
        </HostelProvider>
      </BrowserRouter>
    </ErrorBoundary>
    </ServerLoadingWrapper>
    </ConnectionProvider>
  );
}

export default App;
