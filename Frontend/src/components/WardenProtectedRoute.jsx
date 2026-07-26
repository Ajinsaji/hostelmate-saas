import RoleProtectedRoute from "./RoleProtectedRoute";

export default function WardenProtectedRoute({ children }) {
  return <RoleProtectedRoute allowedRoles={["warden", "Warden", "owner", "Owner"]}>{children}</RoleProtectedRoute>;
}
