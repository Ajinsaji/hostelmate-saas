import RoleProtectedRoute from "./RoleProtectedRoute";

export default function CookProtectedRoute({ children }) {
  return <RoleProtectedRoute allowedRoles={["cook", "Cook", "owner", "Owner"]}>{children}</RoleProtectedRoute>;
}
