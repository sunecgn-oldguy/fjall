/**
 * ProtectedRoute — en "vagt" der beskytter sider der kræver login.
 *
 * Bruges som wrapper i App.tsx routing:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="bolkar" element={<GroupsPage />} />
 *   </Route>
 *
 * Logikken er simpel:
 * - Hvis vi stadig tjekker login-status → vis en loading-spinner
 * - Hvis brugeren IKKE er logget ind → send dem til /login
 * - Hvis brugeren ER logget ind → vis den ønskede side via <Outlet />
 *
 * <Outlet /> er React Routers måde at sige "indsæt den indlejrede rute her".
 */
import { Navigate, Outlet } from "react-router";
import Spinner from "../../components/Spinner";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  // "replace" erstatter /bolkar i browserhistorikken med /login,
  // så "tilbage"-knappen ikke sender brugeren i en loop
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
