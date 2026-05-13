import RoleProtectedRoute from "./RoleProtectedRoute";

export default function WardenProtectedRoute({ children }) {
  return <RoleProtectedRoute allowedRoles={["warden"]}>{children}</RoleProtectedRoute>;
}
