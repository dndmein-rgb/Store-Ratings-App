import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

// allowedRoles: array of roles permitted to view this route. If omitted, any logged-in user can view it.
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="page-loading">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
