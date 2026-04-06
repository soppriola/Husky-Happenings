import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) return <p>Loading...</p>;

  if (!isAuthenticated) {
    return (<Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />);
  }
  return children
}