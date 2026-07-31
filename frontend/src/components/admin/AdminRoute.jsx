import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

export default function AdminRoute({ children }) {
  const user = useAuthStore((s) => s.user);

  if (!user) return <Navigate to="/login" replace />;
  if (!user.isAdmin) return <Navigate to="/players" replace />;

  return children;
}
