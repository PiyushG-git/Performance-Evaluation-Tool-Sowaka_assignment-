import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps a route so only authenticated users can access it.
 * Optionally restricts to specific roles via the `roles` prop.
 *
 * Usage:
 *   <ProtectedRoute>           — any logged-in user
 *   <ProtectedRoute roles={['hr']}>  — HR only
 */
export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // Redirect to login, preserving intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    // Logged in but wrong role — redirect to their default page
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
