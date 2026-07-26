import RoleProtectedRoute from "./RoleProtectedRoute";

export default function AccountantProtectedRoute({ children }) {
  return <RoleProtectedRoute allowedRoles={["accountant", "Accountant", "owner", "Owner"]}>{children}</RoleProtectedRoute>;
}
