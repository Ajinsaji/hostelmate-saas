import RoleProtectedRoute from "./RoleProtectedRoute";

export default function OwnerProtectedRoute({ children }) {
  return <RoleProtectedRoute allowedRoles={["owner"]}>{children}</RoleProtectedRoute>;
}
