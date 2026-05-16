import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
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

import StaffManagement from "./owner/StaffManagement";

import WardenDashboard from "./warden/Dashboard";
import CookDashboard from "./cook/Dashboard";

import AdminDashboard from "./Superadmin/AdminDashboard";
import PendingRequests from "./Superadmin/PendingRequests";
import SubscriptionControl from "./Superadmin/SubscriptionControl";
import AddHostel from "./Superadmin/AddHostel";
import AdminProfile from "./Superadmin/AdminPage";
import HostelManagement from "./Superadmin/HostelManagement";

import OwnerProtectedRoute from "./components/OwnerProtectedRoute";
import WardenProtectedRoute from "./components/WardenProtectedRoute";
import CookProtectedRoute from "./components/CookProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import NotificationBell from "./components/NotificationBell";
import ServerLoadingWrapper from "./components/ServerLoadingWrapper";

function NotificationBellHost() {
  const location = useLocation();
  const token = localStorage.getItem("token");

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
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
    !!token &&
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


function App() {
  return (
    <ServerLoadingWrapper>
      <BrowserRouter>
        <NotificationBellHost />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/dashboard"
          element={
            <OwnerProtectedRoute>
              <Dashboard />
            </OwnerProtectedRoute>
          }
        />
        <Route
          path="/rooms"
          element={
            <OwnerProtectedRoute>
              <Rooms />
            </OwnerProtectedRoute>
          }
        />
        <Route
          path="/residents"
          element={
            <OwnerProtectedRoute>
              <Residents />
            </OwnerProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <OwnerProtectedRoute>
              <Payments />
            </OwnerProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <OwnerProtectedRoute>
              <Reports />
            </OwnerProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <OwnerProtectedRoute>
              <Profile />
            </OwnerProtectedRoute>
          }
        />
        <Route
          path="/owner/settings"
          element={
            <OwnerProtectedRoute>
              <HostelSettings />
            </OwnerProtectedRoute>
          }
        />
        <Route
          path="/owner/profile"
          element={
            <OwnerProtectedRoute>
              <OwnerProfileEdit />
            </OwnerProtectedRoute>
          }
        />
        <Route
          path="/owner/update-password"
          element={
            <OwnerProtectedRoute>
              <UpdatePassword />
            </OwnerProtectedRoute>
          }
        />

        <Route
          path="/staff"
          element={
            <OwnerProtectedRoute>
              <StaffManagement />
            </OwnerProtectedRoute>
          }
        />
        <Route
          path="/admissions"
          element={
            <OwnerProtectedRoute>
              <PendingAdmissions />
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
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <AdminProtectedRoute>
              <AdminProfile />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <AdminProtectedRoute>
              <Reports />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/pending-requests"
          element={
            <AdminProtectedRoute>
              <PendingRequests />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/subscriptions"
          element={
            <AdminProtectedRoute>
              <SubscriptionControl />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/add-hostel"
          element={
            <AdminProtectedRoute>
              <AddHostel />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/hostels"
          element={
            <AdminProtectedRoute>
              <HostelManagement />
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

