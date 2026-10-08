import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return null; // evita il flash della pagina di login
  if (!session) return <Navigate to="/login" replace />;
  if (!session.user.user_metadata?.display_name) {
    return <Navigate to="/complete-profile" replace />;
  }
  return <>{children}</>;
}
