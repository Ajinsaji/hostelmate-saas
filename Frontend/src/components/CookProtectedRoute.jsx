import RoleProtectedRoute from "./RoleProtectedRoute";

export default function CookProtectedRoute({ children }) {
  return <RoleProtectedRoute allowedRoles={["cook"]}>{children}</RoleProtectedRoute>;
}
