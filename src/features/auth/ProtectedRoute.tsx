import { Navigate, Outlet } from "react-router";
import { useAuth } from "./AuthContext";

/**
 * Wrapper-rute der kræver at brugeren er logget ind.
 * Viser en loading-indikator mens auth-status hentes,
 * og omdirigerer til /login hvis brugeren ikke er autentificeret.
 */
export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-stone-500">Innlesur...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
