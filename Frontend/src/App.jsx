import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
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

import AdminDashboard from "./Superadmin/AdminDashboard";
import PendingRequests from "./Superadmin/PendingRequests";
import SubscriptionControl from "./Superadmin/SubscriptionControl";
import AddHostel from "./Superadmin/AddHostel";
import AdminProfile from "./Superadmin/AdminPage";
import HostelManagement from "./Superadmin/HostelManagement";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <Routes>
        <Route
          path="/"
          element={<LandingPage />}
        />

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/register"
          element={<RegisterPage />}
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rooms"
          element={
            <ProtectedRoute>
              <Rooms />
            </ProtectedRoute>
          }
        />

        <Route
          path="/residents"
          element={
            <ProtectedRoute>
              <Residents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <Payments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admissions"
          element={
            <ProtectedRoute>
              <PendingAdmissions />
            </ProtectedRoute>
          }
        />

        <Route
          path="/h/:hostelCode"
          element={<PublicHostelPage />}
        />


        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />

        <Route
          path="/admin"
          element={<AdminDashboard />}
        />


        <Route
          path="/admin/profile"
          element={<AdminProfile />}
        />

        <Route
          path="/admin/reports"
          element={<Reports />}
        />

        <Route
          path="/admin/pending-requests"
          element={<PendingRequests />}
        />

        <Route
          path="/admin/subscriptions"
          element={<SubscriptionControl />}
        />

        <Route
          path="/admin/add-hostel"
          element={<AddHostel />}
        />

        <Route
          path="/admin/hostels"
          element={<HostelManagement />}
        />

        <Route
          path="*"
          element={<Navigate to="/" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
